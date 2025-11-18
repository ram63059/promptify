
let card = null;
let isVisible = false;

// Prevent multiple injections
if (window.promptifyInjected) {
  console.log("Promptify already injected");
} else {
  window.promptifyInjected = true;

  // Listen for toggle from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleCard') {
      toggleCard();
      sendResponse({ success: true }); // Acknowledge receipt
    }
    return true; // Keep message channel open
  });

  function toggleCard() {
    if (isVisible) {
      hideCard();
    } else {
      showCard();
    }
  }

  function showCard() {
    if (card) return; // Already exists

    card = document.createElement('div');
    card.id = 'promptify-card';
     card.innerHTML = `
      <div class="card-content">
        <div class="card-header">
          <div class="header-left">
            <span class="logo-icon">P</span>
            <span class="logo-text">Promptify</span>
          </div>
          <div class="header-right">
            <button class="sign-in-btn">
              <span class="user-icon">👤</span>
              <span>Sign in</span>
            </button>
            <button class="edit-btn">✏️</button>
          </div>
        </div>
        
        <div class="card-body">
          <div class="input-section">
            <label class="section-label">Your text</label>
            <textarea 
              id="userPrompt" 
              placeholder="Paste or type what you want to ask the AI. Add any details like tone or format."
              rows="6"
            ></textarea>
          </div>
          
          <button class="enhance-btn">
            <span class="enhance-icon">⚡</span>
            <span>Make it clear</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(card);

    // Event listeners
    const closeBtn = card.querySelector('#closeBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideCard);
    }

    // Click outside to close
    card.addEventListener('click', (e) => {
      if (e.target === card) hideCard();
    });

    // Escape key to close
    document.addEventListener('keydown', escapeHandler);

    isVisible = true;
    setTimeout(() => card.classList.add('visible'), 10);
  }

  function escapeHandler(e) {
    if (e.key === 'Escape' && isVisible) {
      hideCard();
    }
  }

  function hideCard() {
    if (card) {
      card.classList.remove('visible');
      setTimeout(() => {
        if (card && card.parentNode) {
          document.body.removeChild(card);
          card = null;
        }
      }, 300);
    }
    document.removeEventListener('keydown', escapeHandler);
    isVisible = false;
  }

  // Clean up any existing card on load
  const existingCard = document.getElementById('promptify-card');
  if (existingCard) {
    existingCard.remove();
  }
}