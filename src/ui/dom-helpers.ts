/**
 * dom-helpers.ts - DOM manipulation and UI utilities
 * 
 * Provides helpers for DOM ready state, event handlers, and UI setup
 */

/**
 * Execute callback when DOM is ready
 */
export function onDomReady(callback: () => void): void {
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  } else {
    callback();
  }
}

/**
 * Setup character counter for textarea
 */
export function setupCharCounter(maxCharacters: number): void {
  if (typeof document === 'undefined') return;
  const textarea = document.getElementById('paste') as HTMLTextAreaElement | null;
  const counter = document.getElementById('charCounter');
  if (!textarea || !counter) return;

  const updateCounter = (): void => {
    const length = textarea.value.length;
    counter.textContent = `${length.toLocaleString()} / ${maxCharacters.toLocaleString()}`;
    counter.classList.remove('warning', 'danger');
    if (length > maxCharacters * 0.9) {
      counter.classList.add('danger');
    } else if (length > maxCharacters * 0.7) {
      counter.classList.add('warning');
    }
  };

  updateCounter();
  textarea.addEventListener('input', updateCounter);
}

/**
 * Setup copy button for viewing paste content
 */
export function setupViewCopyButton(): void {
  if (typeof document === 'undefined') return;
  const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement | null;
  const copyText = document.getElementById('copyText');
  const content = document.getElementById('content');
  if (!copyBtn || !copyText || !content) return;

  copyBtn.addEventListener('click', () => {
    const text = content.textContent ?? '';
    const finish = () => {
      copyText.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');
      window.setTimeout(() => {
        copyText.textContent = 'Copy to Clipboard';
        copyBtn.classList.remove('copied');
      }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(finish).catch(() => {
        finish();
      });
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    finish();
  });
}

/**
 * Setup URL input selection behavior
 */
export function setupUrlInputSelection(): void {
  if (typeof document === 'undefined') return;
  const urlInput = document.getElementById('pasteUrl') as HTMLInputElement | null;
  if (!urlInput) return;
  urlInput.addEventListener('click', () => {
    urlInput.select();
    urlInput.setSelectionRange(0, urlInput.value.length);
  });
}

/**
 * Setup password field toggle
 */
export function setupPasswordToggle(): void {
  if (typeof document === 'undefined') return;
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
export function setupSingleViewToggle(): void {
  if (typeof document === 'undefined') return;
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
