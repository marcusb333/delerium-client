/**
 * paste-viewer.ts - Paste viewing flow
 * 
 * Handles the complete paste viewing workflow including:
 * - URL parsing
 * - Paste retrieval
 * - Decryption (regular or password-based)
 * - Content display
 * - Delete button management
 */

import {
  secureClear,
  safeDisplayContent,
  getSafeErrorMessage,
  decryptWithPassword
} from '../security.js';

import { decodeBase64Url } from '../core/crypto/encoding.js';
import { AesGcmCryptoProvider } from '../core/crypto/aes-gcm.js';
import { HttpApiClient } from '../infrastructure/api/http-client.js';
import { getDeleteToken } from '../utils/storage.js';
import { WindowWithUI } from '../ui/ui-manager.js';

const apiClient = new HttpApiClient();
const cryptoProvider = new AesGcmCryptoProvider();

/**
 * View a paste
 */
export async function viewPaste(): Promise<void> {
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
      text = await cryptoProvider.decrypt({
        key: keyB64,
        iv: ivB64 || iv,
        ciphertext: ct
      });
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
          const salt = decodeBase64Url(keyB64);
          const ivBuffer = decodeBase64Url(ivB64 || iv);
          const ctBuffer = decodeBase64Url(ct);
          
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
    const deleteToken = getDeleteToken(id);
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
}

/**
 * Setup paste viewing
 */
export function setupPasteViewing(): void {
  if (typeof document === 'undefined' || typeof location === 'undefined') return;
  void viewPaste();}
