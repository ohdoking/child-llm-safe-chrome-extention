document.addEventListener("DOMContentLoaded", () => {
    const apiKeyContainer = document.getElementById("apiKeyContainer");
    const useGptCheckbox = document.getElementById("useGptCheckbox");
    const apiKeyInput = document.getElementById("apiKey");
    const saveBtn = document.getElementById("saveBtn");
    const ageInput = document.getElementById("age");

    // Toggle API key input
    useGptCheckbox.addEventListener("change", () => {
        console.log("Checkbox state:", useGptCheckbox.checked);
        apiKeyContainer.style.display = useGptCheckbox.checked ? "block" : "none";
        chrome.storage.sync.set({ useGpt: useGptCheckbox.checked });
        // i want to trigger to startObserver again
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "startObserver" });
        });
        
    });

    chrome.storage.sync.get(['useGpt', 'age'], (result) => {
        useGptCheckbox.checked = result.useGpt;
        apiKeyContainer.style.display = useGptCheckbox.checked ? "block" : "none";
        ageInput.value = result.age;
    });

    chrome.storage.sync.get(['OPENAI_API_KEY'], (result) => {
        apiKeyInput.value = result.OPENAI_API_KEY;
    });
    // Save key
    saveBtn.addEventListener("click", () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
        alert('Please enter a valid API key');
        return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        chrome.storage.sync.set({ OPENAI_API_KEY: key, age: ageInput.value }, () => {
            saveBtn.textContent = 'Saved!';
            setTimeout(() => {
                saveBtn.textContent = 'Save';
                saveBtn.disabled = false;
            }, 1500);
        });
    });

    // Example: How to check which model to use
    function getModelType() {
        return useGptCheckbox.checked ? 'GPT' : 'LocalLLM';
    }

    // Example usage
    // console.log("Selected model:", getModelType());
});