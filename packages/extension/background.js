// background.js
// Import Supabase library (local bundle)
try {
  importScripts('./supabase-lib.js');
  console.log('[BG] ✅ Supabase library loaded');
} catch (e) {
  console.error('[BG] ❌ Failed to load supabase-lib.js:', e);
}

// Wait for supabase to be available
let supabaseClient = null;
let supabaseReady = false;

// Initialize Supabase
function initSupabase() {
  try {
    // Check if global supabase object exists (created by UMD script)
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      const { createClient } = supabase;

      const SUPABASE_URL = "https://gogrykraivlrmafeqicc.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZ3J5a3JhaXZscm1hZmVxaWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNjkyODMsImV4cCI6MjA3ODk0NTI4M30.Y-9xNDjrOn-S5TNvnVQVlSi2XFmiSdz745MkQicVniw";

      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      supabaseReady = true;
      console.log('[BG] ✅ Supabase client initialized');
      return true;
    } else {
      console.log('[BG] ⏳ Supabase global not found yet...');
    }
    return false;
  } catch (err) {
    console.error('[BG] ❌ Init error:', err);
    return false;
  }
}

// Try init immediately
if (!initSupabase()) {
  // If failed, try again after delay (sometimes script loading takes a tick)
  setTimeout(() => {
    if (!initSupabase()) {
      console.error('[BG] ❌ Supabase still not loaded after delay');
    }
  }, 500);
}

// Content script requests
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    // Wait for Supabase
    let attempts = 0;
    while (!supabaseReady && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!supabaseReady) {
      console.error('[BG] ❌ Supabase not ready after waiting');
      // Try one last init
      if (initSupabase()) {
        // proceed
      } else {
        sendResponse({ error: 'Supabase initialization failed - Library not loaded' });
        return;
      }
    }

    // ---------- LOGIN ----------
    if (msg.action === "signIn") {
      const { email, password } = msg;
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      sendResponse({ data, error });
    }

    // ---------- CHECK SESSION ----------
    else if (msg.action === "getSession") {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      sendResponse({ session });
    }

    // ---------- LOGOUT ----------
    else if (msg.action === "logout") {
      await supabaseClient.auth.signOut();
      sendResponse({ success: true });
    }

    // ---------- FETCH QUOTA ----------
    else if (msg.action === "getQuota") {
      const userId = msg.userId;
      const { data } = await supabaseClient
        .from("users")
        .select("prompts_left")
        .eq("id", userId)
        .single();

      sendResponse({ data });
    }

    // ---------- GOOGLE OAUTH (POPUP) ----------
    else if (msg.action === "startGoogleOAuth") {
      try {
        console.log('[OAuth] 🔐 Starting...');

        const redirectUrl = chrome.identity.getRedirectURL();
        console.log('[OAuth] 📍 Redirect URL:', redirectUrl);

        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: 'google',
          options: {
            skipBrowserRedirect: true,
            redirectTo: redirectUrl
          }
        });

        if (error) {
          console.error('[OAuth] ❌ URL error:', error);
          sendResponse({ error: error.message });
          return;
        }

        if (!data?.url) {
          console.error('[OAuth] ❌ No URL returned');
          sendResponse({ error: "No OAuth URL from Supabase" });
          return;
        }

        console.log('[OAuth] 🚀 Opening popup...');

        chrome.identity.launchWebAuthFlow(
          {
            url: data.url,
            interactive: true
          },
          async (callbackUrl) => {
            if (chrome.runtime.lastError) {
              console.error('[OAuth] ❌ Error:', chrome.runtime.lastError.message);
              sendResponse({ error: chrome.runtime.lastError.message });
              return;
            }

            if (!callbackUrl) {
              console.log('[OAuth] ⚠️  Cancelled');
              sendResponse({ error: 'Sign-in cancelled' });
              return;
            }

            console.log('[OAuth] ✅ Callback received');

            try {
              const url = new URL(callbackUrl);
              const hashParams = new URLSearchParams(url.hash.substring(1));

              const access_token = hashParams.get('access_token');
              const refresh_token = hashParams.get('refresh_token');
              const error_param = hashParams.get('error');

              if (error_param) {
                const error_description = hashParams.get('error_description');
                console.error('[OAuth] ❌ Error:', error_param, error_description);
                sendResponse({ error: error_description || error_param });
                return;
              }

              if (!access_token || !refresh_token) {
                console.error('[OAuth] ❌ No tokens');
                sendResponse({ error: 'No authentication tokens received' });
                return;
              }

              console.log('[OAuth] 🔑 Setting session...');

              const { data: sessionData, error: sessionError } = await supabaseClient.auth.setSession({
                access_token,
                refresh_token
              });

              if (sessionError) {
                console.error('[OAuth] ❌ Session error:', sessionError);
                sendResponse({ error: sessionError.message });
                return;
              }

              console.log('[OAuth] ✅ Success!');
              sendResponse({ success: true, session: sessionData.session });

            } catch (err) {
              console.error('[OAuth] ❌ Parse error:', err);
              sendResponse({ error: err.message });
            }
          }
        );

        return true;

      } catch (err) {
        console.error('[OAuth] ❌ Error:', err);
        sendResponse({ error: err.message });
      }
    }

    // ---------- ENHANCE TEXT ----------
    else if (msg.action === "enhanceText") {
      const { userId, token, text } = msg;

      const SUPABASE_URL = "https://gogrykraivlrmafeqicc.supabase.co";

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/improve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, userId }),
        }
      );

      const json = await response.json();
      sendResponse(json);
    }
  })();

  return true;
});
