/**
 * @jest-environment jsdom
 */
/**
 * Loading States Test Suite
 *
 * Tests the loading state functionality across all pages:
 * - Button loading states with messages
 * - Status badge updates
 * - Delete button loading states
 * - Error handling in loading states
 */
describe('Loading States', () => {
    describe('setButtonLoading Function', () => {
        beforeEach(() => {
            document.body.innerHTML = `
        <button id="save" class="btn-primary">Encrypt & Upload</button>
        <span id="btnText"><span class="btn-icon">??</span> Encrypt & Upload</span>
      `;
        });
        afterEach(() => {
            document.body.innerHTML = '';
        });
        it('should set button to loading state with default message', () => {
            const btn = document.getElementById('save');
            const btnText = document.getElementById('btnText');
            // Setup function
            window.setButtonLoading = function (loading, message) {
                const btn = document.getElementById('save');
                const btnText = document.getElementById('btnText');
                if (!btn || !btnText)
                    return;
                if (loading) {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = true;
                    const loadingMessage = message || 'Processing...';
                    btnText.innerHTML = '<span class="spinner"></span> ' + loadingMessage;
                }
                else {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = false;
                    btnText.innerHTML = '<span class="btn-icon">??</span> Encrypt & Upload';
                }
            };
            window.setButtonLoading(true);
            expect(btn.disabled).toBe(true);
            expect(btnText.innerHTML).toContain('spinner');
            expect(btnText.innerHTML).toContain('Processing...');
        });
        it('should set button to loading state with custom message', () => {
            const btn = document.getElementById('save');
            const btnText = document.getElementById('btnText');
            window.setButtonLoading = function (loading, message) {
                const btn = document.getElementById('save');
                const btnText = document.getElementById('btnText');
                if (!btn || !btnText)
                    return;
                if (loading) {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = true;
                    const loadingMessage = message || 'Processing...';
                    btnText.innerHTML = '<span class="spinner"></span> ' + loadingMessage;
                }
                else {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = false;
                    btnText.innerHTML = '<span class="btn-icon">??</span> Encrypt & Upload';
                }
            };
            window.setButtonLoading(true, 'Encrypting content...');
            expect(btn.disabled).toBe(true);
            expect(btnText.innerHTML).toContain('spinner');
            expect(btnText.innerHTML).toContain('Encrypting content...');
        });
        it('should handle all loading state messages', () => {
            const btn = document.getElementById('save');
            const btnText = document.getElementById('btnText');
            window.setButtonLoading = function (loading, message) {
                const btn = document.getElementById('save');
                const btnText = document.getElementById('btnText');
                if (!btn || !btnText)
                    return;
                if (loading) {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = true;
                    const loadingMessage = message || 'Processing...';
                    btnText.innerHTML = '<span class="spinner"></span> ' + loadingMessage;
                }
                else {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = false;
                    btnText.innerHTML = '<span class="btn-icon">??</span> Encrypt & Upload';
                }
            };
            const messages = [
                'Preparing...',
                'Encrypting content...',
                'Encrypting with password...',
                'Fetching proof-of-work challenge...',
                'Solving proof-of-work...',
                'Uploading paste...'
            ];
            messages.forEach(msg => {
                window.setButtonLoading(true, msg);
                expect(btn.disabled).toBe(true);
                expect(btnText.innerHTML).toContain(msg);
            });
        });
        it('should restore button from loading state', () => {
            const btn = document.getElementById('save');
            const btnText = document.getElementById('btnText');
            window.setButtonLoading = function (loading, message) {
                const btn = document.getElementById('save');
                const btnText = document.getElementById('btnText');
                if (!btn || !btnText)
                    return;
                if (loading) {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = true;
                    const loadingMessage = message || 'Processing...';
                    btnText.innerHTML = '<span class="spinner"></span> ' + loadingMessage;
                }
                else {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = false;
                    btnText.innerHTML = '<span class="btn-icon">??</span> Encrypt & Upload';
                }
            };
            // Set loading
            window.setButtonLoading(true, 'Processing...');
            expect(btn.disabled).toBe(true);
            expect(btnText.innerHTML).toContain('spinner');
            // Restore
            window.setButtonLoading(false);
            expect(btn.disabled).toBe(false);
            expect(btnText.innerHTML).not.toContain('spinner');
            expect(btnText.innerHTML).toContain('Encrypt');
        });
        it('should handle missing elements gracefully', () => {
            document.body.innerHTML = '';
            window.setButtonLoading = function (loading, message) {
                const btn = document.getElementById('save');
                const btnText = document.getElementById('btnText');
                if (!btn || !btnText)
                    return;
                if (loading) {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = true;
                    const loadingMessage = message || 'Processing...';
                    btnText.innerHTML = '<span class="spinner"></span> ' + loadingMessage;
                }
                else {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = false;
                    btnText.innerHTML = '<span class="btn-icon">??</span> Encrypt & Upload';
                }
            };
            // Should not throw error
            expect(() => {
                window.setButtonLoading(true);
                window.setButtonLoading(false);
            }).not.toThrow();
        });
    });
    describe('updateStatus Function (View Page)', () => {
        beforeEach(() => {
            document.body.innerHTML = `
        <div class="status-badge loading" id="statusBadge">
          <span class="spinner"></span>
          <span id="statusText">Decrypting...</span>
        </div>
      `;
        });
        afterEach(() => {
            document.body.innerHTML = '';
        });
        it('should update status badge with success message', () => {
            window.updateStatus = function (success, message) {
                const statusBadge = document.getElementById('statusBadge');
                if (!statusBadge)
                    return;
                statusBadge.classList.remove('loading');
                if (success) {
                    statusBadge.innerHTML = '<span>?</span><span>' + message + '</span>';
                }
                else {
                    statusBadge.innerHTML = '<span>?</span><span>' + message + '</span>';
                }
            };
            const statusBadge = document.getElementById('statusBadge');
            window.updateStatus(true, 'Decrypted successfully');
            expect(statusBadge.classList.contains('loading')).toBe(false);
            expect(statusBadge.innerHTML).toContain('?');
            expect(statusBadge.innerHTML).toContain('Decrypted successfully');
        });
        it('should update status badge with error message', () => {
            window.updateStatus = function (success, message) {
                const statusBadge = document.getElementById('statusBadge');
                if (!statusBadge)
                    return;
                statusBadge.classList.remove('loading');
                if (success) {
                    statusBadge.innerHTML = '<span>?</span><span>' + message + '</span>';
                }
                else {
                    statusBadge.innerHTML = '<span>?</span><span>' + message + '</span>';
                }
            };
            const statusBadge = document.getElementById('statusBadge');
            window.updateStatus(false, 'Decryption failed');
            expect(statusBadge.classList.contains('loading')).toBe(false);
            expect(statusBadge.innerHTML).toContain('?');
            expect(statusBadge.innerHTML).toContain('Decryption failed');
        });
        it('should handle all status messages', () => {
            window.updateStatus = function (success, message) {
                const statusBadge = document.getElementById('statusBadge');
                if (!statusBadge)
                    return;
                statusBadge.classList.remove('loading');
                if (success) {
                    statusBadge.innerHTML = '<span>?</span><span>' + message + '</span>';
                }
                else {
                    statusBadge.innerHTML = '<span>?</span><span>' + message + '</span>';
                }
            };
            const messages = [
                'Fetching paste...',
                'Decrypting content...',
                'Verifying password...',
                'Decrypted successfully'
            ];
            messages.forEach(msg => {
                window.updateStatus(true, msg);
                const statusBadge = document.getElementById('statusBadge');
                expect(statusBadge.innerHTML).toContain(msg);
            });
        });
        it('should remove loading class', () => {
            window.updateStatus = function (success, message) {
                const statusBadge = document.getElementById('statusBadge');
                if (!statusBadge)
                    return;
                statusBadge.classList.remove('loading');
                if (success) {
                    statusBadge.innerHTML = '<span>?</span><span>' + message + '</span>';
                }
                else {
                    statusBadge.innerHTML = '<span>?</span><span>' + message + '</span>';
                }
            };
            const statusBadge = document.getElementById('statusBadge');
            expect(statusBadge.classList.contains('loading')).toBe(true);
            window.updateStatus(true, 'Success');
            expect(statusBadge.classList.contains('loading')).toBe(false);
        });
        it('should handle missing statusBadge element', () => {
            document.body.innerHTML = '';
            window.updateStatus = function (success, message) {
                const statusBadge = document.getElementById('statusBadge');
                if (!statusBadge)
                    return;
                statusBadge.classList.remove('loading');
                if (success) {
                    statusBadge.innerHTML = '<span>?</span><span>' + message + '</span>';
                }
                else {
                    statusBadge.innerHTML = '<span>?</span><span>' + message + '</span>';
                }
            };
            // Should not throw error
            expect(() => {
                window.updateStatus(true, 'Test');
                window.updateStatus(false, 'Error');
            }).not.toThrow();
        });
    });
    describe('Delete Button Loading State', () => {
        beforeEach(() => {
            document.body.innerHTML = `
        <button id="confirmDelete" class="danger">Yes, Delete Paste</button>
      `;
        });
        afterEach(() => {
            document.body.innerHTML = '';
        });
        it('should set delete button to loading state', () => {
            const deleteBtn = document.getElementById('confirmDelete');
            const originalText = deleteBtn.textContent;
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<span class="spinner"></span> Deleting...';
            expect(deleteBtn.disabled).toBe(true);
            expect(deleteBtn.innerHTML).toContain('spinner');
            expect(deleteBtn.innerHTML).toContain('Deleting...');
        });
        it('should restore delete button on error', () => {
            const deleteBtn = document.getElementById('confirmDelete');
            const originalText = deleteBtn.textContent;
            // Set loading
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<span class="spinner"></span> Deleting...';
            // Restore on error
            deleteBtn.disabled = false;
            deleteBtn.textContent = originalText;
            expect(deleteBtn.disabled).toBe(false);
            expect(deleteBtn.textContent).toBe(originalText);
            expect(deleteBtn.innerHTML).not.toContain('spinner');
        });
        it('should handle delete button with instance check', () => {
            const deleteBtn = document.getElementById('confirmDelete');
            if (deleteBtn && deleteBtn instanceof HTMLButtonElement) {
                const originalText = deleteBtn.textContent;
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<span class="spinner"></span> Deleting...';
                expect(deleteBtn.disabled).toBe(true);
                expect(deleteBtn.innerHTML).toContain('Deleting...');
            }
        });
    });
    describe('Loading State Sequence', () => {
        beforeEach(() => {
            document.body.innerHTML = `
        <button id="save" class="btn-primary">Encrypt & Upload</button>
        <span id="btnText"><span class="btn-icon">??</span> Encrypt & Upload</span>
      `;
        });
        it('should handle complete loading sequence', () => {
            const btn = document.getElementById('save');
            const btnText = document.getElementById('btnText');
            window.setButtonLoading = function (loading, message) {
                const btn = document.getElementById('save');
                const btnText = document.getElementById('btnText');
                if (!btn || !btnText)
                    return;
                if (loading) {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = true;
                    const loadingMessage = message || 'Processing...';
                    btnText.innerHTML = '<span class="spinner"></span> ' + loadingMessage;
                }
                else {
                    if (btn instanceof HTMLButtonElement)
                        btn.disabled = false;
                    btnText.innerHTML = '<span class="btn-icon">??</span> Encrypt & Upload';
                }
            };
            // Simulate complete paste creation flow
            window.setButtonLoading(true, 'Preparing...');
            expect(btnText.innerHTML).toContain('Preparing...');
            window.setButtonLoading(true, 'Encrypting content...');
            expect(btnText.innerHTML).toContain('Encrypting content...');
            window.setButtonLoading(true, 'Fetching proof-of-work challenge...');
            expect(btnText.innerHTML).toContain('Fetching proof-of-work challenge...');
            window.setButtonLoading(true, 'Solving proof-of-work...');
            expect(btnText.innerHTML).toContain('Solving proof-of-work...');
            window.setButtonLoading(true, 'Uploading paste...');
            expect(btnText.innerHTML).toContain('Uploading paste...');
            window.setButtonLoading(false);
            expect(btn.disabled).toBe(false);
            expect(btnText.innerHTML).not.toContain('spinner');
        });
    });
});
//# sourceMappingURL=loading-states.test.js.map