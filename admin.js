(async function () {
  const content = document.getElementById("content");
  const status = document.getElementById("status");
  try { const response = await fetch("/api/content"); if (!response.ok) throw new Error("Could not load content."); content.value = JSON.stringify(await response.json(), null, 2); } catch (error) { status.textContent = error.message; }
  document.getElementById("admin-form").addEventListener("submit", async (event) => {
    event.preventDefault(); status.textContent = "Publishing…";
    let payload;
    try { payload = JSON.parse(content.value); } catch { status.textContent = "Content JSON is not valid."; return; }
    const response = await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: document.getElementById("password").value, content: payload }) });
    const result = await response.json();
    status.textContent = response.ok ? "Published. The site will redeploy shortly." : (result.error || "Publish failed.");
  });
})();
