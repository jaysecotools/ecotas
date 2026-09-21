export function toast(message, kind = "info", timeoutMs = 4000) {
  const root = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.setAttribute("role", kind === "error" ? "alert" : "status");
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), timeoutMs);
}
