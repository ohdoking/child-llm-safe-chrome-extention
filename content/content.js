// ==============================
// content.js - Child Safe GPT
// ==============================

// Global variables
let localModel = null;
let OPENAI_API_KEY = '';
let useGpt = false;
let observer = null;
let age = 0;

// Load saved settings
chrome.storage.sync.get(['OPENAI_API_KEY', 'useGpt', 'age'], (result) => {
    OPENAI_API_KEY = result.OPENAI_API_KEY || '';
    useGpt = result.useGpt || false;
    age = result.age || 0;
});

// Listen for messages (e.g., from popup)
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "startObserver") {
        console.log("✅ Received startObserver trigger");
        startObserver();
    }
});

// ==============================
// Load Brain.js & LSTM model
// ==============================
const brainScript = document.createElement("script");
brainScript.src = chrome.runtime.getURL("../libs/brain.min.js");
brainScript.onload = async () => {
    console.log("✅ Brain.js loaded");

    try {
        const modelUrl = chrome.runtime.getURL("../model/brain_lstm_model.json");
        const res = await fetch(modelUrl);
        const modelData = await res.json();

        localModel = new brain.recurrent.LSTM();
        localModel.fromJSON(modelData);

        console.log("✅ Local child-safe LSTM model loaded");
        startObserver(); // Start after model is ready
    } catch (err) {
        console.error("❌ Failed to load model:", err);
    }
};
document.head.appendChild(brainScript);

// ==============================
// Helper functions
// ==============================
function textToSequence(text) {
    return text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
}

async function isChildSafeLocal(text) {
    if (!localModel) return true;
    try {
        const output = localModel.run(textToSequence(text));

        if (typeof output === "string") {
            if (output.toLowerCase().includes("unsafe")) return false;
            if (output.toLowerCase().includes("safe")) return true;
            return true;
        }

        if (typeof output === "object") {
            if (output.safe !== undefined && output.unsafe !== undefined) {
                return output.safe >= output.unsafe;
            }
            if (output.safe !== undefined) return output.safe >= 0.5;
            if (output.unsafe !== undefined) return output.unsafe < 0.5;
        }

        return true;
    } catch (err) {
        console.error("❌ Error running local model:", err);
        return true;
    }
}

async function isChildSafeGPT(text) {
    if (!OPENAI_API_KEY) return true;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a child-safety assistant." },
                    { role: "user", content: `Is this text safe for ${age} year old kids? Answer yes/no: "${text}"` }
                ]
            })
        });

        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content?.toLowerCase() || "";
        return !answer.includes("no");
    } catch (err) {
        console.error("❌ GPT child-safety check error:", err);
        return true;
    }
}

// ==============================
// Update stats & blocked messages
// ==============================
async function updateStats(textContent, resp) {
    try {
        const result = await chrome.storage.local.get(['filterStats', 'blockedMessages']);
        const stats = result.filterStats || { totalChecked: 0, blocked: 0 };
        const blockedMessages = result.blockedMessages || [];

        stats.blocked += 1;

        const content = textContent || resp.innerText || resp.textContent || 'Blocked content';
        blockedMessages.unshift({
            text: content.length > 100 ? content.substring(0, 100) + '...' : content,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });

        if (blockedMessages.length > 50) blockedMessages.length = 50;

        await chrome.storage.local.set({ filterStats: stats, blockedMessages });
    } catch (err) {
        console.error("❌ Error updating blocked messages:", err);
    }
}

async function updateStatWithTotalCheck() {
    const result = await chrome.storage.local.get('filterStats');
    const stats = result.filterStats || { totalChecked: 0, blocked: 0 };
    stats.totalChecked += 1;
    await chrome.storage.local.set({ filterStats: stats });
}

// ==============================
// Blur / Overlay blocked content
// ==============================
async function blurLLMResponse(resp, textContent) {
    const firstDiv = resp.querySelector("div");
    if (firstDiv) {
        const span = document.createElement("span");
        span.innerHTML = firstDiv.innerHTML;
        span.style.filter = "blur(4px)";
        span.style.userSelect = "text";
        span.style.pointerEvents = "auto";

        firstDiv.innerHTML = "";
        firstDiv.appendChild(span);
    }

    resp.style.position = "relative";

    // Create overlay
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
        position: "absolute",
        top: "0", left: "0", width: "100%", height: "100%",
        display: "flex",
        flexDirection: "column",   // stack image + text
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        background: "rgba(32,32,32,0.6)",
        fontWeight: "bold",
        fontSize: "16px",
        pointerEvents: "none",
        textAlign: "center",
        padding: "10px",
        boxSizing: "border-box"
    });

    // Add flower image
    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("../imgs/flowers.png"); // your image path
    img.style.maxWidth = "80px";
    img.style.marginBottom = "10px";

    // Add text
    const text = document.createElement("div");
    text.innerText = "⚠️ Response blocked for child safety.";

    overlay.appendChild(img);
    overlay.appendChild(text);

    resp.appendChild(overlay);

    await updateStats(textContent, resp);
}


// ==============================
// Wait for stable text helper
// ==============================
function waitForStableText(element, timeout = 10000) {
    return new Promise((resolve) => {
        let lastText = element.innerText;
        let elapsed = 0;
        const firstInterval = 2000;

        setTimeout(() => {
            const restInterval = 500;
            const checker = setInterval(() => {
                const currentText = element.innerText;
                if (currentText === lastText || elapsed >= timeout) {
                    clearInterval(checker);
                    resolve(currentText);
                } else {
                    lastText = currentText;
                    elapsed += restInterval;
                }
            }, restInterval);
        }, firstInterval);
    });
}

// ==============================
// Observer function
// ==============================
function startObserver() {
    const chatContainer = document.querySelector("main");
    if (!chatContainer) return;

    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== 1) return;

                const responses = node.matches('article, model-response, user-query') ? [node] : node.querySelectorAll('article, model-response, user-query');
                
                responses.forEach(async (resp) => {
                    if (!resp.innerText) return;
                    const finalText = await waitForStableText(resp);
                    await updateStatWithTotalCheck();

                    console.log("⚠️ finalText:", finalText);

                    if (useGpt) {
                        if (!(await isChildSafeGPT(finalText))) {
                            await blurLLMResponse(resp, finalText);
                            console.log("⚠️ Blocked unsafe content:", finalText);
                        }
                    } else {
                        if (!(await isChildSafeLocal(finalText))) {
                            await blurLLMResponse(resp, finalText);
                            console.log("⚠️ Blocked unsafe content:", finalText);
                        }
                    }
                });
            });
        });
    });

    observer.observe(chatContainer, { childList: true, subtree: true });
    console.log("🛡️ Child-safe content filter running...");
}
