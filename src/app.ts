/**
 * app.ts - ZKPaste client-side application (Refactored)
 * 
 * This is the main entry point for the ZKPaste web client.
 * It orchestrates the various modules and initializes the application.
 * 
 * Security model:
 * - All encryption happens in the browser
 * - The encryption key never leaves the client (stored in URL fragment)
 * - The server only stores encrypted content (zero-knowledge)
 * - Privacy-preserving validation without content analysis
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { 
  onDomReady,
  setupCharCounter,
  setupViewCopyButton,
  setupUrlInputSelection,
  setupPasswordToggle,
  setupSingleViewToggle
} from './ui/dom-helpers.js';

import { initializeWindowUI } from './ui/ui-manager.js';
import { setupPasteCreation } from './features/paste-creator.js';
import { setupPasteViewing } from './features/paste-viewer.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_CONTENT_CHARACTERS = 1048576;

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

/**
 * Initialize the application
 */
function initializeApp(): void {
  // Initialize window UI functions
  initializeWindowUI();
  
  // Setup DOM event handlers when ready
  onDomReady(() => {
    setupCharCounter(MAX_CONTENT_CHARACTERS);
    setupViewCopyButton();
    setupUrlInputSelection();
    setupPasswordToggle();
    setupSingleViewToggle();
  });
  
  // Setup paste creation (for index.html)
  setupPasteCreation();
  
  // Setup paste viewing (for view.html)
  setupPasteViewing();
}

// ============================================================================
// START APPLICATION
// ============================================================================

// Initialize when script loads
if (typeof window !== 'undefined') {
  initializeApp();
}
