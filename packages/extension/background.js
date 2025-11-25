// background.js
import "./supabase.js";

const { createClient } = self.supabase;

// NEVER expose keys in content.js
const SUPABASE_URL = "https://gogrykraivlrmafeqicc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZ3J5a3JhaXZscm1hZmVxaWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNjkyODMsImV4cCI6MjA3ODk0NTI4M30.Y-9xNDjrOn-S5TNvnVQVlSi2XFmiSdz745MkQicVniw";

// Secure Supabase Client in Background
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Content script requests user sign-in
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    // ---------- LOGIN ----------
    if (msg.action === "signIn") {
      const { email, password } = msg;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      sendResponse({ data, error });
    }

    // ---------- CHECK SESSION ----------
    else if (msg.action === "getSession") {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      sendResponse({ session });
    }

    // ---------- LOGOUT ----------
    else if (msg.action === "logout") {
      await supabase.auth.signOut();
      sendResponse({ success: true });
    }

    // ---------- FETCH QUOTA ----------
    else if (msg.action === "getQuota") {
      const userId = msg.userId;
      const { data } = await supabase
        .from("users")
        .select("prompts_left")
        .eq("id", userId)
        .single();

      sendResponse({ data });
    }

    // ---------- GOOGLE OAUTH ----------
    else if (msg.action === "startGoogleOAuth") {
      try {
        // Get the OAuth URL from Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            skipBrowserRedirect: true,
            redirectTo: `${chrome.runtime.getURL('redirect.html')}`
          }
        });

        if (error) throw error;

        if (!data?.url) {
          throw new Error("No OAuth URL returned from Supabase");
        }

        // Open the OAuth URL in a new tab
        chrome.tabs.create({ url: data.url, active: true }, (tab) => {
          const tabId = tab.id;

          // Listen for the redirect
          const listener = (updatedTabId, changeInfo, updatedTab) => {
            if (updatedTabId === tabId && changeInfo.url) {
              const url = changeInfo.url;

              // Check if this is the callback URL with tokens
              if (url.includes('#access_token=') || url.includes('?access_token=')) {
                try {
                  // Parse the tokens from the URL
                  const hashParams = new URLSearchParams(url.split('#')[1] || '');
                  const queryParams = new URLSearchParams(url.split('?')[1] || '');

                  const access_token = hashParams.get('access_token') || queryParams.get('access_token');
                  const refresh_token = hashParams.get('refresh_token') || queryParams.get('refresh_token');

                  if (access_token && refresh_token) {
                    // Close the OAuth tab
                    chrome.tabs.remove(tabId);
                    chrome.tabs.onUpdated.removeListener(listener);

                    // Set the session in Supabase
                    supabase.auth.setSession({
                      access_token,
                      refresh_token
                    }).then(({ data: sessionData, error: sessionError }) => {
                      if (sessionError) {
                        sendResponse({ error: sessionError.message });
                      } else {
                        sendResponse({ success: true, session: sessionData.session });
                      }
                    });
                  }
                } catch (err) {
                  chrome.tabs.remove(tabId);
                  chrome.tabs.onUpdated.removeListener(listener);
                  sendResponse({ error: err.message });
                }
              }
              // Check for errors
              else if (url.includes('error=')) {
                const errorParams = new URLSearchParams(url.split('?')[1] || '');
                const errorMsg = errorParams.get('error_description') || errorParams.get('error') || 'OAuth failed';
                chrome.tabs.remove(tabId);
                chrome.tabs.onUpdated.removeListener(listener);
                sendResponse({ error: errorMsg });
              }
            }
          };

          chrome.tabs.onUpdated.addListener(listener);

          // Timeout after 5 minutes
          setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.tabs.get(tabId, (tab) => {
              if (chrome.runtime.lastError) return;
              if (tab) chrome.tabs.remove(tabId);
            });
            sendResponse({ error: 'OAuth timeout' });
          }, 300000);
        });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    }

    // ---------- SEND TEXT TO EDGE FUNCTION ----------
    else if (msg.action === "enhanceText") {
      const { userId, token, text } = msg;

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

  return true; // Required for async sendResponse
});
