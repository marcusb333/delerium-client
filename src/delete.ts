/**
 * delete.ts - Delete paste functionality
 * 
 * Handles the deletion of pastes using the deletion token.
 */

const q = new URLSearchParams(location.search);
const id = q.get("p");
const token = q.get("token");

const content = document.getElementById("content");

function renderMessage(type: 'success' | 'error' | 'info', title: string, messages: string[]): void {
  if (!content) return;
  content.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = `message ${type}`;

  const heading = document.createElement('strong');
  heading.textContent = title;
  wrapper.appendChild(heading);

  messages.forEach(msg => {
    const paragraph = document.createElement('p');
    paragraph.textContent = msg;
    wrapper.appendChild(paragraph);
  });

  content.appendChild(wrapper);
}

if (!id || !token) {
  renderMessage('error', 'Invalid Delete Link', ['Missing paste ID or deletion token.']);
} else {
  const btn = document.getElementById("confirmDelete");
  if (btn && btn instanceof HTMLButtonElement) {
    btn.addEventListener("click", async () => {
      // Show loading state
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Deleting...';
      
      try {
        const res = await fetch(`/api/pastes/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, {
          method: "DELETE"
        });
        
        if (res.ok || res.status === 204) {
          renderMessage('success', 'Paste Deleted', ['The paste has been permanently deleted.']);
        } else {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          renderMessage('error', 'Deletion Failed', [`Error: ${err.error || "Invalid token or paste not found"}`]);
          // Restore button on error
          btn.disabled = false;
          btn.textContent = originalText;
        }
      } catch (e) {
        renderMessage('error', 'Deletion Failed', [`Error: ${(e as Error).message}`]);
        // Restore button on error
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }
}
