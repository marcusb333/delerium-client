/**
 * delete.ts - Delete paste functionality
 * 
 * Handles the deletion of pastes using the deletion token.
 */

const q = new URLSearchParams(location.search);
const id = q.get("p");
const token = q.get("token");

const content = document.getElementById("content");

if (!id || !token) {
  if (content) {
    content.innerHTML = `
      <div class="message error">
        <strong>Invalid Delete Link</strong>
        <p>Missing paste ID or deletion token.</p>
      </div>
    `;
  }
} else {
  const btn = document.getElementById("confirmDelete");
  if (btn) {
    btn.addEventListener("click", async () => {
      try {
        const res = await fetch(`/api/pastes/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, {
          method: "DELETE"
        });
        
        if (res.ok || res.status === 204) {
          if (content) {
            content.innerHTML = `
              <div class="message success">
                <strong>Paste Deleted</strong>
                <p>The paste has been permanently deleted.</p>
              </div>
            `;
          }
        } else {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          if (content) {
            content.innerHTML = `
              <div class="message error">
                <strong>Deletion Failed</strong>
                <p>Error: ${err.error || "Invalid token or paste not found"}</p>
              </div>
            `;
          }
        }
      } catch (e) {
        if (content) {
          content.innerHTML = `
            <div class="message error">
              <strong>Deletion Failed</strong>
              <p>Error: ${(e as Error).message}</p>
            </div>
          `;
        }
      }
    });
  }
}
