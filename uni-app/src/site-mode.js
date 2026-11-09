// The same switch is loaded by the static tutorial and simulation pages.
import './static/site-mode.js';
export const tutorialFirst = typeof globalThis !== 'undefined' && globalThis.AINPE_SITE_MODE?.tutorialFirst === true;
