// content.js
console.log("CONTENT SCRIPT LOADED");

let card = null;
let floatingBtn = null;
let isVisible = false;
let currentView = 'locked';
let userEmail = '';
let isAuthenticated = false;
let showUserDropdown = false;
let session = null; // will hold session returned from background
let isDragging = false;

// Helper to call background and await response
function bgRequest(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (res) => resolve(res));
    } catch (err) {
      resolve(null);
    }
  });
}

// Check if on AI site
const AI_SITES = [
  'chat.openai.com',
  'chatgpt.com',
  'claude.ai',
  'grok.x.com',
  'bard.google.com',
  'gemini.google.com',
  'bing.com/chat',
  'perplexity.ai'
];

const isAISite = AI_SITES.some(site => window.location.hostname.includes(site));

if (window.promptifyInjected) {
  console.log("Promptify already injected");
} else {
  window.promptifyInjected = true;

  if (isAISite) {
    createFloatingButton();
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleCard') {
      toggleCard();
      sendResponse({ success: true });
    }
    return true;
  });

  function createFloatingButton() {
    if (floatingBtn) return;

    floatingBtn = document.createElement('div');
    floatingBtn.id = 'promptify-floating-btn';

    // Load saved position or use default (50%)
    chrome.storage.local.get(['floatingBtnPosition'], (result) => {
      const savedPosition = result.floatingBtnPosition || 50; // Default 50% from top
      // if numeric percent -> convert to CSS top
      if (typeof savedPosition === 'number') {
        floatingBtn.style.top = `${savedPosition}%`;
      } else {
        floatingBtn.style.top = '50%';
      }
    });

    floatingBtn.innerHTML = `
      <button class="float-btn" id="openPromptifyBtn" title="Open Promptify (Drag to move)">
        <div class="drag-handle">⋮⋮</div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
    `;
    Object.assign(floatingBtn.style, {
      position: 'fixed',
      right: '20px',
      zIndex: 999999,
      transform: 'translateY(-50%)',
      cursor: 'grab'
    });
    document.body.appendChild(floatingBtn);

    const btn = floatingBtn.querySelector('#openPromptifyBtn');

    // Click to open panel
    btn.addEventListener('click', (e) => {
      // ignore clicks triggered by drag
      if (!isDragging && !isVisible) {
        showCard();
      }
    });

    // Make it draggable
    makeDraggable(floatingBtn);
  }

  let startY = 0;
  let startTop = 0;

  function makeDraggable(element) {
    const btn = element.querySelector('.float-btn');

    btn.addEventListener('mousedown', startDrag);
    btn.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
      isDragging = false;

      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      startY = clientY;

      // Get current top position in pixels
      const rect = element.getBoundingClientRect();
      startTop = rect.top;

      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchmove', onDrag, { passive: false });
      document.addEventListener('touchend', stopDrag);

      btn.style.cursor = 'grabbing';
      e.preventDefault();
    }

    function onDrag(e) {
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      const deltaY = clientY - startY;

      // If moved more than 5px, it's a drag (not a click)
      if (Math.abs(deltaY) > 5) {
        isDragging = true;
      }

      if (isDragging) {
        const newTop = startTop + deltaY;
        const windowHeight = window.innerHeight;
        const btnHeight = element.offsetHeight;

        // Keep button within viewport bounds (with some padding)
        const minTop = 80; // Top padding
        const maxTop = windowHeight - btnHeight - 20; // Bottom padding

        const constrainedTop = Math.max(minTop, Math.min(newTop, maxTop));

        // Update position
        element.style.top = `${constrainedTop}px`;
        element.style.transform = 'translateY(0)'; // Remove transform while dragging

        e.preventDefault();
      }
    }

    function stopDrag(e) {
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('touchend', stopDrag);

      btn.style.cursor = 'grab';

      if (isDragging) {
        // Save position as percentage
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const topPercent = (rect.top / windowHeight) * 100;

        // Save to chrome storage
        chrome.storage.local.set({ floatingBtnPosition: topPercent });

        // Reset transform
        element.style.transform = 'translateY(0)';

        e.preventDefault();
      }

      // Reset dragging flag immediately to avoid blocking clicks
      setTimeout(() => {
        isDragging = false;
      }, 50);
    }
  }

  function toggleCard() {
    if (isVisible) {
      hideCard();
    } else {
      showCard();
    }
  }

  async function showCard() {
    if (card) return;

    card = document.createElement('div');
    card.id = 'promptify-card';
    card.className = 'promptify-card';
    card.innerHTML = getCardHTML();

    document.body.appendChild(card);
    setupEventListeners();
    document.addEventListener('keydown', escapeHandler);

    isVisible = true;
    // small delay to allow CSS transitions if any
    setTimeout(() => card.classList.add('visible'), 10);

    // On open, check session and update view/quota
    const res = await bgRequest({ action: 'getSession' });
    if (res && res.session) {
      session = res.session;
      isAuthenticated = true;
      // optionally set userEmail from session metadata:
      userEmail = session.user?.email || userEmail;
      // load quota
      await loadUserQuota();
      // switch to main if was locked
      if (currentView === 'locked') currentView = 'main';
      updateCardContent();
    } else {
      isAuthenticated = false;
      session = null;
      currentView = 'locked';
      updateCardContent();
    }
  }

  function getCardHTML() {
    return `
      <div class="card-content">
        ${getHeaderHTML()}
        ${getBodyHTML()}
      </div>
    `;
  }

  function getHeaderHTML() {
    if (isAuthenticated) {
      return `
        <div class="card-header">
          <div class="header-left">
            <span class="logo-icon">P</span>
            <span class="logo-text">Promptify</span>
          </div>
          <div class="header-right">
            <button class="user-menu-btn" id="userMenuBtn">
              <div class="user-avatar-small">👤</div>
            </button>
            <button class="close-btn-icon" id="closeBtn">✕</button>
          </div>
          ${showUserDropdown ? `
            <div class="user-dropdown" id="userDropdown">
              <div class="dropdown-header">
                <div class="dropdown-avatar">👤</div>
                <div class="dropdown-info">
                  <div class="dropdown-name">${session?.user?.email || 'User'}</div>
                  <div class="dropdown-plan">Plan: N/A</div>
                </div>
              </div>
              <button class="dropdown-logout" id="dropdownLogout">Log out</button>
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="card-header">
        <div class="header-left">
          <span class="logo-icon">P</span>
          <span class="logo-text">Promptify</span>
        </div>
        <div class="header-right">
          <button class="close-btn-icon" id="closeBtn">✕</button>
        </div>
      </div>
    `;
  }

  function getBodyHTML() {
    switch (currentView) {
      case 'locked':
        return getLockedViewHTML();
      case 'signin':
        return getSignInViewHTML();
      case 'email-step':
        return getEmailStepHTML();
      case 'password-step':
        return getPasswordStepHTML();
      case 'main':
        return getMainViewHTML();
      default:
        return getLockedViewHTML();
    }
  }

  function getLockedViewHTML() {
    return `
      <div class="card-body locked-view">
        <div class="locked-icon-wrapper">
          <svg class="locked-icon-svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </div>
        <h2 class="locked-title">Welcome to Promptify</h2>
        <p class="locked-subtitle">Sign in to start turning rough ideas into clear, ready-to-use AI prompts in seconds.</p>
        <button class="primary-btn" id="unlockBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </svg>
          <span>Sign in to Continue</span>
        </button>
        <div class="locked-footer">
          <span>Don't have an account? <a href="#" id="signUpLink">Sign up on website</a></span>
        </div>
      </div>
    `;
  }

  function getSignInViewHTML() {
    return `
      <div class="card-body signin-view">
        <button class="back-btn" id="backBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>
        
        <div class="signin-header">
          <h2>Sign in to Promptify</h2>
          <p>Choose your sign-in method</p>
        </div>
        
        <button class="google-auth-btn" id="googleAuthBtn">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
            <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"/>
            <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 0 0 0 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"/>
            <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
        
        <div class="divider">
          <span>or</span>
        </div>
        
        <button class="email-signin-btn" id="emailSignInBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <span>Sign in with Email</span>
        </button>
        
        <div class="signin-footer">
          <p>New to Promptify? <a href="#" id="signUpLink2">Create account on website</a></p>
        </div>
      </div>
    `;
  }

  function getEmailStepHTML() {
    return `
      <div class="card-body email-step-view">
        <button class="back-btn" id="backBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>
        
        <div class="step-header">
          <h2>Enter your email</h2>
          <p>We'll check if you have an account</p>
        </div>
        
        <div class="form-group">
          <label>Email address</label>
          <input 
            type="email" 
            id="emailInput" 
            placeholder="you@example.com"
            value="${userEmail}"
            autocomplete="email"
            autofocus
          />
          <span class="input-error" id="emailError"></span>
        </div>
        
        <button class="primary-btn" id="continueEmailBtn">
          <span>Continue</span>
        </button>
        
        <div class="step-footer">
          <p>Protected by Supabase Auth</p>
        </div>
      </div>
    `;
  }

  function getPasswordStepHTML() {
    return `
      <div class="card-body password-step-view">
        <button class="back-btn" id="backBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>
        
        <div class="step-header">
          <h2>Enter your password</h2>
          <p class="email-display">Signing in as <strong>${userEmail}</strong></p>
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <div class="password-input-wrapper">
            <input 
              type="password" 
              id="passwordInput" 
              placeholder="Enter your password"
              autocomplete="current-password"
              autofocus
            />
            <button class="toggle-password" id="togglePasswordBtn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <span class="input-error" id="passwordError"></span>
        </div>
        
        <button class="primary-btn" id="signInBtn">
          <span>Sign in</span>
        </button>
        
        <div class="forgot-password">
          <a href="#" id="forgotPasswordLink">Forgot password?</a>
        </div>
      </div>
    `;
  }

  function getMainViewHTML() {
    return `
      <div class="card-body main-view">
        <div class="input-section">
          <label class="section-label">Your text</label>
          <textarea 
            id="userPrompt" 
            placeholder="Rewrite the below email to sound concise, keep it under 120 words, and end with a call to action asking for a meeting next week."
            rows="5"
          ></textarea>
          <div class="char-count">
            <span id="charCount">0</span> / 2000
          </div>
        </div>
        
        <button class="enhance-btn" id="enhanceBtn">
          <span>Make it clear</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
        
        <div class="output-section" id="outputSection" style="display: none;">
          <div class="output-header">
            <label class="section-label">Refined prompt</label>
            <div class="output-badges">
              <span class="badge badge-blue">Ready to use</span>
              <span class="badge badge-gray">Polished for your AI assistant</span>
            </div>
          </div>
          <div class="output-box" id="outputBox"></div>
          <button class="copy-btn" id="copyBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy </span>
          </button>
        </div>
      </div>
    `;
  }

  function setupEventListeners() {
    const closeBtn = card.querySelector('#closeBtn');
    if (closeBtn) closeBtn.addEventListener('click', hideCard);

    const userMenuBtn = card.querySelector('#userMenuBtn');
    if (userMenuBtn) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showUserDropdown = !showUserDropdown;
        updateCardContent();
      });
    }

    const dropdownLogout = card.querySelector('#dropdownLogout');
    if (dropdownLogout) {
      dropdownLogout.addEventListener('click', handleLogout);
    }

    if (showUserDropdown) {
      setTimeout(() => {
        document.addEventListener('click', closeDropdownOnClickOutside);
      }, 0);
    }

    const unlockBtn = card.querySelector('#unlockBtn');
    if (unlockBtn) unlockBtn.addEventListener('click', () => switchView('signin'));

    const googleAuthBtn = card.querySelector('#googleAuthBtn');
    if (googleAuthBtn) googleAuthBtn.addEventListener('click', handleGoogleAuth);

    const emailSignInBtn = card.querySelector('#emailSignInBtn');
    if (emailSignInBtn) emailSignInBtn.addEventListener('click', () => switchView('email-step'));

    const continueEmailBtn = card.querySelector('#continueEmailBtn');
    if (continueEmailBtn) continueEmailBtn.addEventListener('click', handleEmailContinue);

    const emailInput = card.querySelector('#emailInput');
    if (emailInput) {
      emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleEmailContinue();
      });
    }

    const signInBtn = card.querySelector('#signInBtn');
    if (signInBtn) signInBtn.addEventListener('click', handlePasswordSignIn);

    const passwordInput = card.querySelector('#passwordInput');
    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handlePasswordSignIn();
      });
    }

    const togglePasswordBtn = card.querySelector('#togglePasswordBtn');
    if (togglePasswordBtn) togglePasswordBtn.addEventListener('click', togglePasswordVisibility);

    const forgotPasswordLink = card.querySelector('#forgotPasswordLink');
    if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', handleForgotPassword);

    const enhanceBtn = card.querySelector('#enhanceBtn');
    if (enhanceBtn) enhanceBtn.addEventListener('click', handleEnhance);

    const copyBtn = card.querySelector('#copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', handleCopy);

    const userPrompt = card.querySelector('#userPrompt');
    if (userPrompt) {
      userPrompt.addEventListener('input', updateCharCount);
    }

    const backBtns = card.querySelectorAll('.back-btn');
    backBtns.forEach(btn => {
      btn.addEventListener('click', handleBack);
    });

    const signUpLinks = card.querySelectorAll('[id^="signUpLink"]');
    signUpLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://yourwebsite.com/signup', '_blank');
      });
    });
  }

  function closeDropdownOnClickOutside(e) {
    if (!e.target.closest('.user-dropdown') && !e.target.closest('.user-menu-btn')) {
      showUserDropdown = false;
      updateCardContent();
      document.removeEventListener('click', closeDropdownOnClickOutside);
    }
  }

  function switchView(newView) {
    currentView = newView;
    updateCardContent();
  }

  async function updateCardContent() {
    const cardContent = card.querySelector('.card-content');
    // If cardContent not found (first render), set innerHTML of card
    if (!cardContent) {
      card.innerHTML = getCardHTML();
    } else {
      cardContent.innerHTML = getHeaderHTML() + getBodyHTML();
    }
    setupEventListeners();
  }

  function handleBack() {
    const viewStack = {
      'email-step': 'signin',
      'password-step': 'email-step',
      'signin': 'locked'
    };
    switchView(viewStack[currentView] || 'locked');
  }

  async function handleGoogleAuth() {
    const btn = card.querySelector('#googleAuthBtn');
    if (btn) { btn.innerHTML = '<span>Signing in...</span>'; btn.disabled = true; }

    // Delegate to background / Supabase for real Google flow if implemented
    const res = await bgRequest({ action: 'startGoogleOAuth' });
    // startGoogleOAuth should open a new tab for OAuth and background handles flow.
    // For now show success only if background returns success
    if (res && res.url) {
      // open the auth url in a new tab
      window.open(res.url, '_blank');
      showToast('Opened Google sign-in in a new tab', 'info');
    } else {
      showToast('Could not start Google sign-in', 'error');
      if (btn) { btn.innerHTML = 'Continue with Google'; btn.disabled = false; }
    }
  }

  function handleEmailContinue() {
    const emailInput = card.querySelector('#emailInput');
    const emailError = card.querySelector('#emailError');
    const email = emailInput.value.trim();

    emailError.textContent = '';

    if (!email) {
      emailError.textContent = 'Please enter your email';
      return;
    }

    if (!isValidEmail(email)) {
      emailError.textContent = 'Please enter a valid email address';
      return;
    }

    const btn = card.querySelector('#continueEmailBtn');
    btn.innerHTML = '<span>Checking...</span>';
    btn.disabled = true;

    // For UX: keep existing flow of showing password step
    setTimeout(() => {
      userEmail = email;
      switchView('password-step');
    }, 400);
  }

  async function handlePasswordSignIn() {
    const passwordInput = card.querySelector('#passwordInput');
    const passwordError = card.querySelector('#passwordError');
    const password = passwordInput.value;

    passwordError.textContent = '';

    if (!password) {
      passwordError.textContent = 'Please enter your password';
      return;
    }

    const btn = card.querySelector('#signInBtn');
    btn.innerHTML = '<span>Signing in...</span>';
    btn.disabled = true;

    // Call background to perform supabase sign in
    const res = await bgRequest({ action: 'signIn', email: userEmail, password });

    if (!res) {
      passwordError.textContent = 'Network error. Try again.';
      btn.innerHTML = '<span>Sign in</span>';
      btn.disabled = false;
      return;
    }

    if (res.error) {
      passwordError.textContent = res.error.message || 'Invalid credentials';
      btn.innerHTML = '<span>Sign in</span>';
      btn.disabled = false;
      return;
    }

    // Success: store session locally and load quota
    session = res.data?.session || null;
    isAuthenticated = !!session;
    showToast('✓ Welcome back!', 'success');
    currentView = 'main';
    await loadUserQuota();
    updateCardContent();
  }

  async function loadUserQuota() {
    if (!session || !session.user) {
      return;
    }
    const res = await bgRequest({ action: 'getQuota', userId: session.user.id });
    if (res && res.data) {
      // update UI: this project didn't have a dedicated element, so we'll show in dropdown via session or keep silent
      // we can store prompts in session meta if desired
      // minimal: attach to card as data attribute or show toast
      // But we update the UI by re-rendering (dropdown shows session email)
      // If you have a quota element, update it here
      // Example: document.querySelector('#quotaCount').innerText = res.data.prompts_left;
      // We'll add a small hidden element if needed
      card.dataset.promptsLeft = res.data.prompts_left ?? 0;
    }
  }

  async function handleEnhance() {
    const promptInput = card.querySelector('#userPrompt');
    const prompt = promptInput.value.trim();

    if (!prompt) {
      showToast('Please enter some text to enhance', 'error');
      return;
    }

    const btn = card.querySelector('#enhanceBtn');
    btn.innerHTML = '<span>Enhancing...</span>';
    btn.disabled = true;

    // If not authenticated, prompt sign in
    if (!session || !session.user) {
      showToast('Please sign in first', 'error');
      btn.innerHTML = `
        <span>Make it clear</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>`;
      btn.disabled = false;
      return;
    }

    // Call background, which will call the Supabase Edge function
    const res = await bgRequest({
      action: 'enhanceText',
      text: prompt,
      userId: session.user.id,
      token: session.access_token
    });

    // handle server response
    const outputBox = card.querySelector('#outputBox');
    const outputSection = card.querySelector('#outputSection');

    if (!res) {
      showToast('Server error. Try again.', 'error');
    } else if (res.error) {
      showToast(res.error || 'Enhance failed', 'error');
    } else {
      const polished = res.polished ?? res.polished_text ?? res.text ?? '';
      outputBox.textContent = polished;
      outputSection.style.display = 'flex';
      // If backend returned updated quota
      if (res.quota_left !== undefined) {
        card.dataset.promptsLeft = res.quota_left;
      }
      showToast('✓ Prompt enhanced!', 'success');
    }

    // restore button
    btn.innerHTML = `
      <span>Make it clear</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    `;
    btn.disabled = false;
  }
  function handleCopy() {
    const outputBox = card.querySelector('#outputBox');
    const text = outputBox.textContent || '';

    navigator.clipboard.writeText(text).then(() => {
      const btn = card.querySelector('#copyBtn');
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Copied!</span>
      `;
      btn.classList.add('copied');

      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('copied');
      }, 2000);
    });
  }

  function updateCharCount() {
    const textarea = card.querySelector('#userPrompt');
    const charCount = card.querySelector('#charCount');
    if (textarea && charCount) {
      charCount.textContent = textarea.value.length;
    }
  }

  function togglePasswordVisibility() {
    const passwordInput = card.querySelector('#passwordInput');
    const toggleBtn = card.querySelector('#togglePasswordBtn');

    if (!passwordInput || !toggleBtn) return;

    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    } else {
      passwordInput.type = 'password';
      toggleBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    }
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    window.open('https://yourwebsite.com/reset-password', '_blank');
    showToast('Password reset opened in new tab', 'info');
  }

  async function handleLogout() {
    showUserDropdown = false;

    const res = await bgRequest({ action: 'logout' });

    if (res && res.success) {
      isAuthenticated = false;
      session = null;
      userEmail = '';
      currentView = 'locked';
      updateCardContent();
      showToast('✓ Logged out successfully', 'success');
    } else {
      showToast('Logout failed', 'error');
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `promptify-toast ${type}`;
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000000,
      padding: '10px 14px',
      borderRadius: '8px',
      background: type === 'error' ? '#ffdddd' : (type === 'success' ? '#ddffdf' : '#fff'),
      color: '#111',
      boxShadow: '0 6px 18px rgba(0,0,0,0.12)'
    });
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2600);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function escapeHandler(e) {
    if (e.key === 'Escape' && isVisible) {
      hideCard();
    }
  }

  function hideCard() {
    if (card) {
      showUserDropdown = false;
      card.classList.remove('visible');
      setTimeout(() => {
        if (card && card.parentNode) {
          document.body.removeChild(card);
          card = null;
        }
      }, 300);
    }
    document.removeEventListener('keydown', escapeHandler);
    document.removeEventListener('click', closeDropdownOnClickOutside);
    isVisible = false;
  }

  // Ensure we remove any stray existing card
  const existingCard = document.getElementById('promptify-card');
  if (existingCard) existingCard.remove();
}