const PARENT_PASSWORD = '1234'; // Change this to your desired password

document.addEventListener('DOMContentLoaded', function() {
  const passwordInput = document.getElementById('passwordInput');
  const passwordButton = document.getElementById('passwordButton');
  const errorMsg = document.getElementById('errorMsg');

  passwordButton.addEventListener('click', async () => {
    const entered = passwordInput.value;
    if (entered === PARENT_PASSWORD) {
      // Hide password prompt
      document.getElementById('passwordPrompt').style.display = 'none';
      
      // Show main content container
      document.getElementById('contentContainer').style.display = 'flex';

      // Show stats and chart
      document.querySelector('.stats-container').style.display = 'block';
      document.getElementById('chartContainer').style.display = 'block';
      document.getElementById('blockedList').style.display = 'block';

      // Load and display data
      await loadAnalysisData();
    } else {
      errorMsg.textContent = 'Incorrect password!';
    }
  });
});

async function loadAnalysisData() {
  const result = await chrome.storage.local.get(['filterStats', 'blockedMessages']);
  const stats = result.filterStats || { totalChecked: 0, blocked: 0 };
  const blockedMessages = result.blockedMessages || [];

  const totalChecked = stats.totalChecked;
  const blockedCount = blockedMessages.length;
  const allowedCount = Math.max(totalChecked - blockedCount, 0);

  // Update stats
  document.getElementById('totalChecked').textContent = totalChecked;
  document.getElementById('blockedCount').textContent = blockedCount;
  const blockRate = totalChecked > 0 ? Math.round((blockedCount / totalChecked) * 100) : 0;
  document.getElementById('blockRate').textContent = `${blockRate}%`;

  // Display blocked messages
  const blockedList = document.getElementById('blockedList');
  blockedList.innerHTML = '';
  if (blockedMessages.length === 0) {
    blockedList.innerHTML = '<div class="blocked-item">No blocked content yet.</div>';
  } else {
    blockedMessages.slice().reverse().forEach(item => {
      const div = document.createElement('div');
      div.className = 'blocked-item';
      div.innerHTML = `
        <div>${truncateText(item.text, 100)}</div>
        <div class="timestamp">${new Date(item.timestamp).toLocaleString()}</div>
      `;
      blockedList.appendChild(div);
    });
  }

  // Draw pie chart
  const ctx = document.getElementById('blockChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Allowed', 'Blocked'],
      datasets: [{
        data: [allowedCount, blockedCount],
        backgroundColor: ['#1a73e8', '#e81a1a']
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const percent = totalChecked > 0 ? ((value / totalChecked) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

function truncateText(text, maxLength) {
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
}
