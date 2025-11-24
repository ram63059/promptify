// background.js
import "./supabase.js";

const { createClient } = self.supabase;

// NEVER expose keys in content.js
const SUPABASE_URL = "https://gogrykraivlrmafeqicc.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZ3J5a3JhaXZscm1hZmVxaWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNjkyODMsImV4cCI6MjA3ODk0NTI4M30.Y-9xNDjrOn-S5TNvnVQVlSi2XFmiSdz745MkQicVniw";

// Secure Supabase Client in Background
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: chrome.identity.getRedirectURL(),
            skipBrowserRedirect: true
          }
        });

        if (error) throw error;

        const redirectUrl = await chrome.identity.launchWebAuthFlow({
          url: data.url,
          interactive: true
        });

        if (redirectUrl) {
          const url = new URL(redirectUrl);
          const params = new URLSearchParams(url.hash.substring(1)); // Supabase returns tokens in hash
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });
            if (sessionError) throw sessionError;
            sendResponse({ success: true, session: sessionData.session });
          } else {
            throw new Error("No tokens found in redirect URL");
          }
        } else {
          throw new Error("Auth flow cancelled");
        }
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
