// supabase.js
// Load Supabase library from CDN for service worker


try {
  // Load the library
  importScripts('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');

  // Check if it loaded
  if (typeof supabase !== 'undefined') {
    console.log('[Supabase] ✅ Library loaded via global "supabase"');
  } else if (typeof self.supabase !== 'undefined') {
    // Make it available as global
    self.supabase = self.supabase;
  } else {
    console.error('[Supabase] Available globals:', Object.keys(self).filter(k => k.toLowerCase().includes('sup')));
  }
} catch (error) {
  console.error('[Supabase] ❌ Failed to load:', error);
}