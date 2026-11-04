import '../static/tracking.js';

// Event fields are short application identifiers, never free text or URLs.
export function track(event, options = {}) {
  try { return typeof window !== 'undefined' && window.AINPETrack ? window.AINPETrack.track(event, options) : false; }
  catch { return false; }
}
