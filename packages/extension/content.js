let card = null;
let isVisible = false;

// Listen for toggle from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleCard') {
    toggleCard();
  }
});

function toggleCard() {
  if (isVisible) {
    hideCard();
  } else {
    showCard();
  }
}

function showCard() {
  if (card) return;  // Already exists

  card = document.createElement('div');
  card.id = 'promptify-card';
  card.innerHTML = `
    <div class="card-content" role="dialog" aria-modal="true" aria-labelledby="cardTitle">
      <header class="card-header">
        <h1 class="logo" id="cardTitle" aria-label="Promptify">⟨P</h1>
        <button id="signInBtn" class="sign-in" aria-label="Sign in" title="Sign in to enhance prompts">👤</button>
        <button id="closeBtn" class="close-btn" aria-label="Close">&times;</button>
      </header>
      <div id="authSection" class="auth-section">
        <p class="auth-prompt">Quick Sign Up to Start</p>
        <form id="authForm">
          <input type="email" id="emailInput" placeholder="Enter your email" required aria-required="true">
          <button type="submit">Send Magic Link</button>
        </form>
      </div>
      <main class="main-content hidden" aria-hidden="true">
        <p class="instruction">Paste or type what you want to ask the AI. Add any details like tone or format.</p>
        <textarea id="inputText" placeholder="E.g., 'Summarize this article in bullet points...'" rows="6" maxlength="2000" aria-describedby="inputDesc"></textarea>
        <small id="inputDesc">Max 2000 chars for best results.</small>
        <div class="output-section hidden">
          <label for="outputText">Enhanced Prompt:</label>
          <textarea id="outputText" readonly rows="6"></textarea>
          <button id="copyBtn" class="copy-btn">Copy to Clipboard</button>
        </div>
        <div class="quota-badge">
          <span id="quotaText">Prompts left: <span id="quotaCount">0</span>/20</span>
          <a href="https://promptify-site.vercel.app/pricing" target="_blank" class="upgrade-link">Upgrade</a>
        </div>
        <button id="enhanceBtn" class="enhance-btn" disabled aria-disabled="true">Make it Clear</button>
      </main>
    </div>
  `;
  document.body.appendChild(card);

  // Event listeners (delegated)
  card.addEventListener('click', (e) => {
    if (e.target === card) hideCard();  // Click outside close
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isVisible) hideCard();
  });

  // Delegate events (for dynamic elements)
  card.querySelector('#closeBtn').addEventListener('click', hideCard);
  // Auth, enhance, etc. added in next sub-step

  isVisible = true;
  card.classList.add('visible');
}

function hideCard() {
  if (card) {
    card.classList.remove('visible');
    setTimeout(() => {
      if (card) {
        document.body.removeChild(card);
        card = null;
      }
    }, 300);  // Fade out
  }
  isVisible = false;
}

// Init: Hide if open on page load (rare)
if (document.getElementById('promptify-card')) hideCard();