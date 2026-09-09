(async function () {
  const REPO_OWNER = "omarelbedawy";
  const REPO_NAME = "omarelbedawy.github.io";
  const REPO_BRANCH = "main";
  const STORAGE_KEY = "omarPortfolioGitHubToken";
  const state = { token: localStorage.getItem(STORAGE_KEY), data: null, contentSha: "" };
  const login = document.getElementById("login");
  const dashboard = document.getElementById("dashboard");
  const status = document.getElementById("save-state");
  const loginStatus = document.getElementById("login-status");

  function apiUrl(path) {
    return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/${path}`;
  }

  async function github(path, options = {}) {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${state.token}`,
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.message || `GitHub API returned ${response.status}.`);
    }
    return response.json();
  }

  function decodeContent(encoded) {
    const bytes = Uint8Array.from(atob(encoded.replace(/\n/g, "")), (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeContent(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(new Error("The selected file could not be read."));
      reader.readAsDataURL(file);
    });
  }

  async function uploadAsset(file, folder, message) {
    const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-");
    const path = `uploads/${folder}/${Date.now()}-${safeName}`;
    await putFile(path, await readFile(file), message || `Upload ${safeName}`);
    return `/${path}`;
  }

  async function loadContent() {
    const file = await github(`contents/content.json?ref=${REPO_BRANCH}`);
    state.contentSha = file.sha;
    return JSON.parse(decodeContent(file.content));
  }

  async function putFile(path, content, message, sha) {
    const payload = { message, content, branch: REPO_BRANCH };
    if (sha) payload.sha = sha;
    return github(`contents/${path}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  }

  async function signIn(token) {
    state.token = token.trim();
    state.data = await loadContent();
    localStorage.setItem(STORAGE_KEY, state.token);
    login.hidden = true;
    dashboard.hidden = false;
    render();
  }

  document.getElementById("login-form").onsubmit = async (event) => {
    event.preventDefault();
    loginStatus.textContent = "Checking GitHub token…";
    try {
      await signIn(document.getElementById("token").value);
    } catch (error) {
      state.token = null;
      loginStatus.textContent = error.message;
    }
  };

  document.getElementById("logout").onclick = () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  };

  const field = (label, key, value, rows = 2) => `<label>${label}<textarea data-key="${key}" rows="${rows}">${value || ""}</textarea></label>`;

  function render() {
    const data = state.data;
    [["hero-title", data.hero.title], ["hero-intro", data.hero.intro], ["about-title", data.about.title], ["about-lead", data.about.lead], ["about-copy", data.about.copy], ["journey-title", data.journey.title], ["journey-intro", data.journey.intro], ["contact", data.settings.contact], ["linkedin", data.settings.linkedin], ["github", data.settings.github], ["whatsapp", data.settings.whatsapp], ["hero-image", data.settings.heroImage]].forEach(([name, value]) => {
      const element = document.querySelector(`[name="${name}"]`);
      if (element) element.value = value || "";
    });
    Object.entries(data.settings.visible).forEach(([key, value]) => { document.querySelector(`[data-visible="${key}"]`).checked = value; });
    document.getElementById("project-editors").innerHTML = data.projects.map((item, index) => `<div class="editor-card"><div class="editor-card-header"><strong>Project ${String(index + 1).padStart(2, "0")}</strong></div>${field("Project name", `project-${index}-title`, item.title)}${field("Category", `project-${index}-type`, item.type)}${field("Description", `project-${index}-text`, item.text, 3)}${field("Technology tags, separated by commas", `project-${index}-tags`, item.tags.join(", "))}<label>Project link<input data-key="project-${index}-url" type="url" value="${item.url || ""}" placeholder="https://github.com/..."></label><label class="file-picker"><input data-project-file="${index}" type="file" accept="image/*"><span>${item.image ? "Replace project image" : "Upload project image"}</span></label><small class="uploaded-path">${item.image || ""}</small><input data-key="project-${index}-image" type="hidden" value="${item.image || ""}"></div>`).join("");
    document.querySelectorAll("[data-project-file]").forEach((input) => input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        status.textContent = "Uploading project image…";
        const index = Number(input.dataset.projectFile);
        const path = await uploadAsset(file, "projects", `Upload project image ${file.name}`);
        state.data.projects[index].image = path;
        render();
        status.textContent = "Project image uploaded — publish to save the card.";
      } catch (error) {
        status.textContent = error.message;
        status.className = "save-state status-bad";
      }
    });
    document.getElementById("journey-editors").innerHTML = data.journey.items.map((item, index) => `<div class="editor-card"><div class="editor-card-header"><strong>Chapter ${String(index + 1).padStart(2, "0")}</strong><button type="button" class="remove-button" data-remove="${index}">Remove</button></div>${field("Date", `journey-${index}-date`, item.date)}${field("Title", `journey-${index}-title`, item.title)}${field("Description", `journey-${index}-text`, item.text, 3)}<label><input type="checkbox" data-current="${index}" ${item.current ? "checked" : ""}> Current chapter</label></div>`).join("");
    document.querySelectorAll("[data-remove]").forEach((button) => button.onclick = () => { data.journey.items.splice(Number(button.dataset.remove), 1); render(); });
    document.getElementById("archive-editors").innerHTML = data.archive.length ? data.archive.map((item, index) => `<div class="archive-row"><span><strong>${item.title}</strong><small>${item.kind || "Archive"} · ${item.filename || ""}</small></span><button type="button" class="remove-button" data-delete="${index}">Remove</button></div>`).join("") : '<p class="section-label">No archive items yet.</p>';
    document.querySelectorAll("[data-delete]").forEach((button) => button.onclick = () => { data.archive.splice(Number(button.dataset.delete), 1); render(); });
  }

  function collect() {
    const data = state.data;
    const get = (name) => document.querySelector(`[name="${name}"]`).value;
    data.hero.title = get("hero-title"); data.hero.intro = get("hero-intro"); data.about.title = get("about-title"); data.about.lead = get("about-lead"); data.about.copy = get("about-copy"); data.journey.title = get("journey-title"); data.journey.intro = get("journey-intro"); data.settings.contact = get("contact"); data.settings.linkedin = get("linkedin"); data.settings.github = get("github"); data.settings.whatsapp = get("whatsapp");
    Object.keys(data.settings.visible).forEach((key) => { data.settings.visible[key] = document.querySelector(`[data-visible="${key}"]`).checked; });
    data.projects = data.projects.map((item, index) => ({ title: document.querySelector(`[data-key="project-${index}-title"]`).value, type: document.querySelector(`[data-key="project-${index}-type"]`).value, text: document.querySelector(`[data-key="project-${index}-text"]`).value, tags: document.querySelector(`[data-key="project-${index}-tags"]`).value.split(",").map((tag) => tag.trim()).filter(Boolean), url: document.querySelector(`[data-key="project-${index}-url"]`).value, image: document.querySelector(`[data-key="project-${index}-image"]`).value }));
    data.journey.items = data.journey.items.map((item, index) => ({ date: document.querySelector(`[data-key="journey-${index}-date"]`).value, title: document.querySelector(`[data-key="journey-${index}-title"]`).value, text: document.querySelector(`[data-key="journey-${index}-text"]`).value, current: document.querySelector(`[data-current="${index}"]`).checked }));
    return data;
  }

  document.getElementById("add-journey").onclick = () => { state.data.journey.items.push({ date: "NEW", title: "New chapter", text: "Describe this chapter." }); render(); };
  document.getElementById("hero-file").onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      status.textContent = "Uploading hero photo…";
      state.data.settings.heroImage = await uploadAsset(file, "hero", `Upload hero photo ${file.name}`);
      render();
      status.textContent = "Hero photo uploaded — publish to save it.";
    } catch (error) {
      status.textContent = error.message;
      status.className = "save-state status-bad";
    }
  };
  document.getElementById("file").onchange = (event) => { document.getElementById("file-label").textContent = event.target.files[0] ? event.target.files[0].name : "Choose image, PDF, video, or any file"; };
  document.getElementById("add-file").onclick = async () => {
    const file = document.getElementById("file").files[0];
    if (!file) return;
    try {
        status.textContent = "Uploading milestone to GitHub…";
        const publicPath = await uploadAsset(file, "archive", `Upload archive file ${file.name}`);
        state.data.archive.unshift({ title: document.getElementById("file-title").value || file.name, description: document.getElementById("file-description").value, kind: file.type.startsWith("image/") ? "Photo" : "File", filename: file.name, image: file.type.startsWith("image/") ? publicPath : "", file: publicPath });
        document.getElementById("file").value = "";
        render();
        status.textContent = "Milestone uploaded — publish to add it to the site.";
    } catch (error) {
        status.textContent = error.message;
        status.className = "save-state status-bad";
    }
  };

  document.getElementById("content-form").onsubmit = async (event) => {
    event.preventDefault();
    status.textContent = "Publishing to GitHub…";
    status.className = "save-state";
    try {
      const content = collect();
      const latest = await loadContent();
      const response = await putFile("content.json", encodeContent(`${JSON.stringify(content, null, 2)}\n`), "Update portfolio content", state.contentSha);
      state.contentSha = response.content.sha;
      state.data = content;
      status.textContent = "Published to main ✓";
      status.className = "save-state status-good";
      render();
    } catch (error) {
      status.textContent = error.message.includes("409") ? "Content changed remotely. Reload and try again." : error.message;
      status.className = "save-state status-bad";
    }
  };

  if (state.token) {
    try { await signIn(state.token); } catch (error) { localStorage.removeItem(STORAGE_KEY); state.token = null; loginStatus.textContent = "Saved token expired or was revoked. Paste a new one."; }
  }
})();
