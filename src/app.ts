/**
 * app.ts - ZKPaste client-side application
 * 
 * This is the main TypeScript file for the ZKPaste web client.
 * It handles:
 * - Client-side AES-GCM encryption/decryption
 * - Proof-of-work computation
 * - Paste creation and retrieval
 * - Base64url encoding/decoding
 * - Privacy-preserving security validation
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
  validateContentSize, 
  validateExpiration, 
  validateViewCount,
  validatePassword,
  isValidUTF8
} from './core/validators/index.js';

import {
  secureClear,
  safeDisplayContent,
  getSafeErrorMessage,
  encryptWithPassword,
  decryptWithPassword
} from './security.js';

import {
  EncryptedData,
  PowSolution
} from './core/models/paste.js';

import { HttpApiClient } from './infrastructure/api/http-client.js';
import { InlinePowSolver } from './infrastructure/pow/inline-solver.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Extended Window interface for UI helper functions
 */
interface WindowWithUI extends Window {
  updateStatus?: (success: boolean, message: string) => void;
  showInfo?: (viewsLeft: number, expireTs: number) => void;
  showDestroyButton?: (id: string, token: string) => void;
  setButtonLoading?: (show: boolean, message?: string) => void;
  showOutput?: (success: boolean, title: string, message: string, url?: string | null) => void;
}

// ============================================================================
// INITIALIZE DEPENDENCIES
// ============================================================================

const apiClient = new HttpApiClient();
const powSolver = new InlinePowSolver();

// ============================================================================
// ENCODING UTILITIES
// ============================================================================

/**
 * Encode bytes to base64url format
 * Base64url is URL-safe (uses - and _ instead of + and /)
 * 
 * @param bytes Binary data to encode
 * @returns Base64url-encoded string without padding
 */
export function b64u(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

/**
 * Decode base64url format to bytes
 * 
 * @param s Base64url-encoded string
 * @returns Decoded binary data as ArrayBuffer
 */
export function ub64u(s: string): ArrayBuffer {
  s = s.replace(/-/g,'+').replace(/_/g,'/'); 
  while (s.length % 4) s+='=';
  const bin = atob(s); 
  const out = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

// ============================================================================
// CRYPTOGRAPHY FUNCTIONS
// ============================================================================

/**
 * Generate a new AES-GCM 256-bit encryption key
 * 
 * @returns Promise resolving to a CryptoKey for encryption/decryption
 */
export async function genKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name:"AES-GCM", length:256 }, true, ["encrypt","decrypt"]);
}

/**
 * Generate a random initialization vector (IV) for AES-GCM
 * AES-GCM uses 12-byte (96-bit) IVs
 * 
 * @returns Random 12-byte IV
 */
export function genIV(): Uint8Array { 
  const iv = new Uint8Array(12); 
  crypto.getRandomValues(iv); 
  return iv; 
}

/**
 * Encrypt a plaintext string using AES-GCM
 * 
 * Generates a new random key and IV for each encryption.
 * Uses AES-GCM which provides both confidentiality and authenticity.
 * 
 * @param plaintext String to encrypt
 * @returns Promise resolving to encrypted data (key, IV, ciphertext)
 */
export async function encryptString(plaintext: string): Promise<EncryptedData> {
  const key = await genKey();
  const iv = genIV();
  // @ts-expect-error - Web Crypto API types are incomplete for ArrayBuffer
  const ct = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  const raw = await crypto.subtle.exportKey("raw", key);
  // @ts-expect-error - ArrayBuffer needs explicit conversion for base64 encoding
  return { keyB64: b64u(raw), ivB64: b64u(iv), ctB64: b64u(ct) };
}

/**
 * Decrypt ciphertext using AES-GCM
 * 
 * @param keyB64 Base64url-encoded encryption key
 * @param ivB64 Base64url-encoded IV
 * @param ctB64 Base64url-encoded ciphertext
 * @returns Promise resolving to decrypted plaintext string
 * @throws Error if decryption fails (wrong key, corrupted data, etc.)
 */
export async function decryptParts(keyB64: string, ivB64: string, ctB64: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", ub64u(keyB64), { name:"AES-GCM" }, false, ["decrypt"]);
  const iv = new Uint8Array(ub64u(ivB64));
  const ct = new Uint8Array(ub64u(ctB64));
  const pt = await crypto.subtle.decrypt({ name:"AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

// ============================================================================
// PROOF-OF-WORK FUNCTIONS
// ============================================================================

// PowChallenge is now imported from core/models/paste.js


// ============================================================================
// PASTE CREATION FLOW
// ============================================================================

/**
 * Setup password field toggle
 */
if (typeof document !== 'undefined') {
  const usePasswordCheckbox = document.getElementById('usePassword') as HTMLInputElement;
  const passwordGroup = document.getElementById('passwordGroup') as HTMLElement;
  const passwordField = document.getElementById('password') as HTMLInputElement;
  
  if (usePasswordCheckbox && passwordGroup && passwordField) {
    usePasswordCheckbox.addEventListener('change', function() {
      if (this.checked) {
        passwordGroup.style.display = 'block';
        passwordField.required = true;
      } else {
        passwordGroup.style.display = 'none';
        passwordField.required = false;
        passwordField.value = '';
      }
    });
  }
}

/**
 * Setup single-view toggle to disable max views input
 */
if (typeof document !== 'undefined') {
  const singleViewCheckbox = document.getElementById('single') as HTMLInputElement;
  const viewsInput = document.getElementById('views') as HTMLInputElement;
  
  if (singleViewCheckbox && viewsInput) {
    singleViewCheckbox.addEventListener('change', function() {
      if (this.checked) {
        viewsInput.disabled = true;
        viewsInput.style.opacity = '0.5';
        viewsInput.title = 'Disabled when single-view is selected';
      } else {
        viewsInput.disabled = false;
        viewsInput.style.opacity = '1';
        viewsInput.title = '';
      }
    });
  }
}

/**
 * Event handler for the "Save" button
 * 
 * Workflow:
 * 1. Read paste content and settings from form
 * 2. Encrypt the content client-side with a new random key
 * 3. Fetch and solve proof-of-work challenge (if enabled)
 * 4. Send encrypted content to server
 * 5. Display shareable URL (with key in fragment) and deletion link
 */
if (typeof document !== 'undefined') {
  const saveButton = document.getElementById("save");
  if (saveButton) {
    saveButton.addEventListener("click", async () => {
      console.log('Save button clicked');
      // Get form values
      const text = (document.getElementById("paste") as HTMLTextAreaElement).value;
      const mins = parseInt((document.getElementById("mins") as HTMLInputElement).value || "60", 10);
      const views = parseInt((document.getElementById("views") as HTMLInputElement).value || "10", 10);
      const singleView = (document.getElementById("single") as HTMLInputElement).checked;
      const password = (document.getElementById("password") as HTMLInputElement).value;
      const usePassword = (document.getElementById("usePassword") as HTMLInputElement).checked;
  
      // Privacy-preserving validation (without reading content)
      const contentValidation = validateContentSize(text);
      const expirationValidation = validateExpiration(mins);
      const viewValidation = validateViewCount(views);
      const passwordValidation = usePassword ? validatePassword(password) : { isValid: true, errors: [] };
  
      // Check for validation errors
      const allErrors = [
        ...contentValidation.errors,
        ...expirationValidation.errors,
        ...viewValidation.errors,
        ...passwordValidation.errors
      ];
  
      if (allErrors.length > 0) {
        showError(allErrors.join('. '));
        return;
      }
  
      // Check UTF-8 validity without reading content
      if (!isValidUTF8(text)) {
        showError("Invalid character encoding. Please use standard text characters.");
        return;
      }
  
      // Show loading state
      showLoading(true, 'Preparing...');
  
      try {
        const expireTs = Math.floor(Date.now()/1000) + mins * 60;
        
        let keyB64: string, ivB64: string, ctB64: string;
        
        if (usePassword) {
          // Password-based encryption
          showLoading(true, 'Encrypting with password...');
          const { encryptedData, salt, iv } = await encryptWithPassword(text, password);
          keyB64 = b64u(salt); // Use salt as the "key" in the URL
          ivB64 = b64u(iv);
          ctB64 = b64u(encryptedData);
        } else {
          // Regular encryption
          showLoading(true, 'Encrypting content...');
          const encrypted = await encryptString(text);
          keyB64 = encrypted.keyB64;
          ivB64 = encrypted.ivB64;
          ctB64 = encrypted.ctB64;
        }

        // Solve proof-of-work challenge if enabled
        let pow: PowSolution | null = null;
        try {
          showLoading(true, 'Fetching proof-of-work challenge...');
          const challenge = await apiClient.getPowChallenge();
          if (challenge) {
            showLoading(true, 'Solving proof-of-work...');
            pow = await powSolver.solve(challenge);
          }
        } catch (error) {
          // PoW is optional, continue without it
          console.warn('PoW challenge failed:', error);
        }

        // Create paste using API client
        showLoading(true, 'Uploading paste...');
        console.log('Calling apiClient.createPaste');
        const data = await apiClient.createPaste({
          ct: ctB64,
          iv: ivB64,
          meta: {
            expireTs,
            singleView,
            viewsAllowed: singleView ? 1 : views,
            mime: "text/plain"
          },
          pow
        });
        const url = `${location.origin}/view.html?p=${encodeURIComponent(data.id)}#${keyB64}:${ivB64}`;
        const deleteUrl = `${location.origin}/delete.html?p=${encodeURIComponent(data.id)}&token=${encodeURIComponent(data.deleteToken)}`;
        
        // Store delete token for later use on view page
        localStorage.setItem(`deleteToken_${data.id}`, data.deleteToken);
        
        // Show success result
        showSuccess(url, deleteUrl, usePassword);
        
        // Securely clear sensitive data from memory
        secureClear(text);
        secureClear(keyB64);
        secureClear(ivB64);
        secureClear(ctB64);
        if (usePassword) {
          secureClear(password);
        }
        
      } catch (error) {
        showError(getSafeErrorMessage(error, 'paste creation'));
      } finally {
        showLoading(false);
      }
  
      // Clear the textarea after successful paste creation
      (document.getElementById("paste") as HTMLTextAreaElement).value = "";
    });
  }
}

// ============================================================================
// PASTE VIEWING FLOW
// ============================================================================

/**
 * Auto-executed function for viewing a paste
 * 
 * Runs on view.html pages. Workflow:
 * 1. Extract paste ID from query string (?p=...)
 * 2. Extract decryption key from URL fragment (#key:iv)
 * 3. Fetch encrypted content from server
 * 4. Decrypt and display the content
 * 
 * The decryption key in the fragment never reaches the server (fragments
 * are not sent in HTTP requests), ensuring zero-knowledge security.
 */
if (typeof document !== 'undefined' && typeof location !== 'undefined') {
  (async function (): Promise<void> {
    if (!location.pathname.endsWith("view.html")) return;
    const q = new URLSearchParams(location.search);
    const id = q.get("p");
    const frag = location.hash.startsWith("#") ? location.hash.slice(1) : "";
    const content = document.getElementById("content");
    
    // Update status if new UI is available
    const updateStatus = (window as WindowWithUI).updateStatus;
    const showInfo = (window as WindowWithUI).showInfo;
    
    if (!id || !frag) { 
      if (content) {
        content.textContent = "Missing paste ID or key.";
        content.classList.remove('loading');
        content.classList.add('error');
      }
      if (updateStatus) updateStatus(false, 'Missing information');
      return; 
    }
    const [keyB64, ivB64] = frag.split(":");
    try {
      if (updateStatus) updateStatus(true, 'Fetching paste...');
      const response = await apiClient.retrievePaste(id);
      const { ct, iv, meta, viewsLeft } = response;

      // Check if this is password-protected (by checking if we can decrypt with regular method)
      let text: string;
      try {
        // Try regular decryption first
        if (updateStatus) updateStatus(true, 'Decrypting content...');
        text = await decryptParts(keyB64, ivB64 || iv, ct);
      } catch {
        // If regular decryption fails, it might be password-protected
        // Allow up to 5 password attempts without invalidating the paste
        const MAX_PASSWORD_ATTEMPTS = 5;
        let attempts = 0;
        let decryptionSuccess = false;
        
        while (attempts < MAX_PASSWORD_ATTEMPTS && !decryptionSuccess) {
          attempts++;
          const attemptsRemaining = MAX_PASSWORD_ATTEMPTS - attempts;
          const promptMessage = attempts === 1 
            ? "This paste is password-protected. Enter the password:"
            : `Incorrect password. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining:`;
          
          const password = prompt(promptMessage);
          if (!password) {
            throw new Error("Password required to decrypt this content.");
          }
          
          try {
            // Try password-based decryption
            if (updateStatus) updateStatus(true, 'Verifying password...');
            const salt = ub64u(keyB64);
            const ivBuffer = ub64u(ivB64 || iv);
            const ctBuffer = ub64u(ct);
            
            text = await decryptWithPassword(ctBuffer, password, salt, ivBuffer);
            secureClear(password);
            decryptionSuccess = true;
          } catch {
            secureClear(password);
            if (attempts >= MAX_PASSWORD_ATTEMPTS) {
              throw new Error("Maximum password attempts exceeded. Incorrect password.");
            }
            // Continue loop for another attempt
          }
        }
        
        if (!decryptionSuccess) {
          throw new Error("Failed to decrypt content with provided password.");
        }
      }
      
      // Safely display content without XSS risk
      if (content) {
        content.classList.remove('loading');
        content.classList.remove('error');
        safeDisplayContent(content, text);
      }
      
      // Update status and info
      if (updateStatus) updateStatus(true, 'Decrypted successfully');
      if (showInfo && meta) showInfo(viewsLeft, meta.expireTs);
      
      // Check if delete token exists for this paste
      const deleteToken = localStorage.getItem(`deleteToken_${id}`);
      if (deleteToken && typeof (window as WindowWithUI).showDestroyButton === 'function') {
        (window as WindowWithUI).showDestroyButton?.(id, deleteToken);
      }
      
      // Securely clear decryption data from memory
      secureClear(keyB64);
      secureClear(ivB64 || iv);
      secureClear(ct);
      
    } catch (e) {
      if (content) {
        const errorMessage = getSafeErrorMessage(e, 'paste viewing');
        content.classList.remove('loading');
        content.classList.add('error');
        safeDisplayContent(content, errorMessage);
      }
      if (updateStatus) {
        const errorMsg = getSafeErrorMessage(e, 'paste viewing');
        updateStatus(false, errorMsg.length > 50 ? 'Decryption failed' : errorMsg);
      }
    }
  })();
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

/**
 * Show loading state with optional message
 */
function showLoading(show: boolean, message?: string): void {
  // Use new UI function if available
  if (typeof (window as WindowWithUI).setButtonLoading === 'function') {
    (window as WindowWithUI).setButtonLoading?.(show, message);
  } else {
    // Fallback for old UI
    const loading = document.getElementById('loading');
    const form = document.getElementById('pasteForm') as HTMLFormElement;
    const saveBtn = document.getElementById('save') as HTMLButtonElement;
    
    if (loading) loading.style.display = show ? 'block' : 'none';
    if (form) form.style.display = show ? 'none' : 'block';
    if (saveBtn) saveBtn.disabled = show;
  }
}

/**
 * Show error message
 */
function showError(message: string): void {
  // Use new UI function if available
  if (typeof (window as WindowWithUI).showOutput === 'function') {
    (window as WindowWithUI).showOutput?.(false, 'Error', message, null);
  } else {
    // Fallback for old UI
    const out = document.getElementById('out');
    if (out) {
      out.textContent = `Error: ${message}`;
      out.style.color = 'red';
    }
  }
}

/**
 * Show success result
 */
function showSuccess(shareUrl: string, deleteUrl: string, isPasswordProtected: boolean = false): void {
  // Use new UI function if available
  if (typeof (window as WindowWithUI).showOutput === 'function') {
    const title = isPasswordProtected ? 'Password-protected paste ready!' : 'Success! Your paste is ready';
    const message = `Share this link with anyone you want to give access to:`;
    (window as WindowWithUI).showOutput?.(true, title, message, shareUrl);  } else {
    // Fallback for old UI
    const out = document.getElementById('out');
    if (out) {
      const title = isPasswordProtected ? 'Your password-protected paste is ready!' : 'Your secure paste is ready!';
      out.textContent = `${title}\n\nShare URL:\n${shareUrl}`;
      out.style.color = '';
    }
  }
}