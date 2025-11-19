console.log("CONTENT SCRIPT LOADED");

let card = null;
let isVisible = false;
let currentView = 'locked'; // locked, signin, email-step, password-step, main
let userEmail = '';
let isAuthenticated = false;

// Prevent multiple injections
if (window.promptifyInjected) {
  console.log("Promptify already injected");
} else {
  window.promptifyInjected = true;

  // Listen for toggle from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleCard') {
      toggleCard();
      sendResponse({ success: true });
    }
    return true;
  });

  function toggleCard() {
    if (isVisible) {
      hideCard();
    } else {
      showCard();
    }
  }

  function showCard() {
    if (card) return;

    card = document.createElement('div');
    card.id = 'promptify-card';
    card.innerHTML = getCardHTML();

    document.body.appendChild(card);
    setupEventListeners();
    document.addEventListener('keydown', escapeHandler);

    isVisible = true;
    setTimeout(() => card.classList.add('visible'), 10);
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
    return `
      <div class="card-header">
        <div class="header-left">
          <span class="logo-icon">P</span>
          <span class="logo-text">Promptify</span>
        </div>
        <div class="header-right">
          ${isAuthenticated ? `
            <button class="user-menu-btn" id="userMenuBtn">
              <div class="user-avatar-small">👤</div>
            </button>
          ` : `
            <button class="header-action-btn" id="headerActionBtn">
              ${currentView === 'locked' ? '<span>Sign in</span>' : '<span>✕</span>'}
            </button>
          `}
          <button class="close-btn" id="closeBtn">✕</button>
        </div>
      </div>
    `;
  }

  function getBodyHTML() {
    switch(currentView) {
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
        <div class="locked-icon">🔒</div>
        <h2 class="locked-title">Welcome to Promptify</h2>
        <p class="locked-subtitle">Sign in to start enhancing your AI prompts with clarity and precision</p>
        <button class="primary-btn" id="unlockBtn">
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
        <button class="back-btn" id="backBtn">← Back</button>
        
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
          <span>📧</span>
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
        <button class="back-btn" id="backBtn">← Back</button>
        
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
        <button class="back-btn" id="backBtn">← Back</button>
        
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
            <button class="toggle-password" id="togglePasswordBtn">👁️</button>
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
        <div class="user-info-bar">
          <div class="user-avatar">👤</div>
          <div class="user-details">
            <span class="user-name">John Doe</span>
            <span class="user-plan">Pro Plan</span>
          </div>
          <button class="logout-btn" id="logoutBtn">Logout</button>
        </div>
        
        <div class="input-section">
          <label class="section-label">Your prompt</label>
          <textarea 
            id="userPrompt" 
            placeholder="Type or paste what you want to ask the AI. Add details like tone, format, or context..."
            rows="5"
          ></textarea>
          <div class="char-count">
            <span id="charCount">0</span> / 2000 characters
          </div>
        </div>
        
        <button class="enhance-btn" id="enhanceBtn">
          <span>✨</span>
          <span>Make it Clear</span>
        </button>
        
        <div class="output-section" id="outputSection" style="display: none;">
          <label class="section-label">Enhanced Prompt</label>
          <div class="output-box" id="outputBox"></div>
          <button class="copy-btn" id="copyBtn">
            <span>📋</span>
            <span>Copy to Clipboard</span>
          </button>
        </div>
        
        <div class="usage-bar">
          <div class="usage-info">
            <span class="usage-icon">⚡</span>
            <span class="usage-text">15 enhancements left today</span>
          </div>
          <button class="upgrade-link" id="upgradeBtn">Upgrade</button>
        </div>
      </div>
    `;
  }

  function setupEventListeners() {
    // Close button
    const closeBtn = card.querySelector('#closeBtn');
    if (closeBtn) closeBtn.addEventListener('click', hideCard);

    // Header action button
    const headerActionBtn = card.querySelector('#headerActionBtn');
    if (headerActionBtn) {
      headerActionBtn.addEventListener('click', () => {
        if (currentView === 'locked') {
          switchView('signin');
        } else {
          switchView('locked');
        }
      });
    }

    // Locked view
    const unlockBtn = card.querySelector('#unlockBtn');
    if (unlockBtn) unlockBtn.addEventListener('click', () => switchView('signin'));

    // Sign in view
    const googleAuthBtn = card.querySelector('#googleAuthBtn');
    if (googleAuthBtn) googleAuthBtn.addEventListener('click', handleGoogleAuth);

    const emailSignInBtn = card.querySelector('#emailSignInBtn');
    if (emailSignInBtn) emailSignInBtn.addEventListener('click', () => switchView('email-step'));

    // Email step
    const continueEmailBtn = card.querySelector('#continueEmailBtn');
    if (continueEmailBtn) continueEmailBtn.addEventListener('click', handleEmailContinue);

    const emailInput = card.querySelector('#emailInput');
    if (emailInput) {
      emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleEmailContinue();
      });
    }

    // Password step
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

    // Main view
    const logoutBtn = card.querySelector('#logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const enhanceBtn = card.querySelector('#enhanceBtn');
    if (enhanceBtn) enhanceBtn.addEventListener('click', handleEnhance);

    const copyBtn = card.querySelector('#copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', handleCopy);

    const userPrompt = card.querySelector('#userPrompt');
    if (userPrompt) {
      userPrompt.addEventListener('input', updateCharCount);
    }

    // Back buttons
    const backBtns = card.querySelectorAll('.back-btn');
    backBtns.forEach(btn => {
      btn.addEventListener('click', handleBack);
    });

    // External links
    const signUpLinks = card.querySelectorAll('[id^="signUpLink"]');
    signUpLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://yourwebsite.com/signup', '_blank');
      });
    });
  }

  function switchView(newView) {
    currentView = newView;
    updateCardContent();
  }

  function updateCardContent() {
    const cardContent = card.querySelector('.card-content');
    cardContent.innerHTML = getHeaderHTML() + getBodyHTML();
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

  function handleGoogleAuth() {
    const btn = card.querySelector('#googleAuthBtn');
    btn.innerHTML = '<span>Signing in...</span>';
    btn.disabled = true;

    // Simulate Google OAuth
    setTimeout(() => {
      // TODO: Implement actual Supabase Google OAuth
      // supabase.auth.signInWithOAuth({ provider: 'google' })
      
      showToast('✓ Signed in with Google!', 'success');
      isAuthenticated = true;
      switchView('main');
    }, 2000);
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

    // Simulate API call to check if email exists
    setTimeout(() => {
      // TODO: Check if email exists in Supabase
      // const { data } = await supabase.from('users').select('email').eq('email', email)
      
      userEmail = email;
      switchView('password-step');
    }, 1500);
  }

  function handlePasswordSignIn() {
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

    // Simulate sign in
    setTimeout(() => {
      // TODO: Implement actual Supabase auth
      // const { data, error } = await supabase.auth.signInWithPassword({ email: userEmail, password })
      
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        showToast('✓ Welcome back!', 'success');
        isAuthenticated = true;
        switchView('main');
      } else {
        passwordError.textContent = 'Invalid password. Please try again.';
        btn.innerHTML = '<span>Sign in</span>';
        btn.disabled = false;
      }
    }, 1500);
  }

  function togglePasswordVisibility() {
    const passwordInput = card.querySelector('#passwordInput');
    const btn = card.querySelector('#togglePasswordBtn');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      btn.textContent = '🙈';
    } else {
      passwordInput.type = 'password';
      btn.textContent = '👁️';
    }
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    
    // TODO: Implement password reset
    // await supabase.auth.resetPasswordForEmail(userEmail)
    
    showToast('Password reset link sent to ' + userEmail, 'info');
  }

  function handleLogout() {
    isAuthenticated = false;
    userEmail = '';
    switchView('locked');
    showToast('Logged out successfully', 'info');
  }

  function handleEnhance() {
    const promptInput = card.querySelector('#userPrompt');
    const prompt = promptInput.value.trim();

    if (!prompt) {
      showToast('Please enter some text to enhance', 'error');
      return;
    }

    const btn = card.querySelector('#enhanceBtn');
    btn.innerHTML = '<span>✨</span><span>Enhancing...</span>';
    btn.disabled = true;

    setTimeout(() => {
      const enhanced = `[ENHANCED PROMPT]\n\n${prompt}\n\n[Additional context and structure added for optimal AI interaction with clear instructions, desired format, and expected output specifications.]`;
      
      const outputBox = card.querySelector('#outputBox');
      const outputSection = card.querySelector('#outputSection');
      
      outputBox.textContent = enhanced;
      outputSection.style.display = 'flex';
      
      btn.innerHTML = '<span>✨</span><span>Make it Clear</span>';
      btn.disabled = false;
      
      showToast('✓ Prompt enhanced!', 'success');
    }, 2500);
  }

  function handleCopy() {
    const outputBox = card.querySelector('#outputBox');
    const text = outputBox.textContent;

    navigator.clipboard.writeText(text).then(() => {
      const btn = card.querySelector('#copyBtn');
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<span>✓</span><span>Copied!</span>';
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

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `promptify-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
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

  // Clean up
  const existingCard = document.getElementById('promptify-card');
  if (existingCard) existingCard.remove();
}