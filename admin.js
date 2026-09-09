(async function () {
  const state = { password: "", data: null, mode: "static" };
  const login = document.getElementById("login");
  const dashboard = document.getElementById("dashboard");
  const status = document.getElementById("save-state");
  const loginStatus = document.getElementById("login-status");
  const submitButton = document.querySelector('#content-form button[type="submit"]');

  const withLocalDraft = (content) => {
    const localDraft = JSON.parse(localStorage.getItem("omarPortfolioDraft") || "null");
    if (!localDraft) return content;
    return {
      ...content,
      ...localDraft,
      settings: {
        ...content.settings,
        ...(localDraft.settings || {}),
        visible: {
          ...content.settings.visible,
          ...((localDraft.settings || {}).visible || {})
        }
      },
      hero: { ...content.hero, ...(localDraft.hero || {}) },
      about: { ...content.about, ...(localDraft.about || {}) },
      journey: {
        ...content.journey,
        ...(localDraft.journey || {}),
        items: (localDraft.journey || {}).items || content.journey.items
      },
      projects: localDraft.projects || content.projects,
      archive: localDraft.archive || content.archive
    };
  };

  document.getElementById("login-form").onsubmit = async (event) => {
    event.preventDefault();
    state.password = document.getElementById("password").value;
    loginStatus.textContent = "Checking studio mode…";

    try {
      const response = await fetch("/api/content", { cache: "no-store" });
      if (response.ok) {
        state.data = await response.json();
        state.mode = "api";
        loginStatus.textContent = "";
      } else {
        throw new Error("API unavailable");
      }
    } catch {
      const fallback = await fetch("/content.json", { cache: "no-store" });
      if (!fallback.ok) {
        loginStatus.textContent = "Studio content is not reachable.";
        return;
      }
      state.data = withLocalDraft(await fallback.json());
      state.mode = "static";
      loginStatus.textContent = "Static mode unlocked. Changes save in this browser only.";
    }

    login.hidden = true;
    dashboard.hidden = false;
    render();
  };

  document.getElementById("logout").onclick = () => location.reload();

  const field = (label, key, value, rows = 2) =>
    `<label>${label}<textarea data-key="${key}" rows="${rows}">${value || ""}</textarea></label>`;

  function render() {
    const data = state.data;
    [
      ["hero-title", data.hero.title],
      ["hero-intro", data.hero.intro],
      ["about-title", data.about.title],
      ["about-lead", data.about.lead],
      ["about-copy", data.about.copy],
      ["journey-title", data.journey.title],
      ["journey-intro", data.journey.intro],
      ["contact", data.settings.contact],
      ["linkedin", data.settings.linkedin],
      ["github", data.settings.github],
      ["whatsapp", data.settings.whatsapp]
    ].forEach(([name, value]) => {
      const element = document.querySelector(`[name="${name}"]`);
      if (element) element.value = value || "";
    });

    Object.entries(data.settings.visible).forEach(([key, value]) => {
      const toggle = document.querySelector(`[data-visible="${key}"]`);
      if (toggle) toggle.checked = value;
    });

    document.getElementById("project-editors").innerHTML = data.projects
      .map(
        (item, index) =>
          `<div class="editor-card"><div class="editor-card-header"><strong>Project ${String(index + 1).padStart(2, "0")}</strong></div>${field("Project name (HTML allowed)", `project-${index}-title`, item.title)}${field("Category", `project-${index}-type`, item.type)}${field("Description", `project-${index}-text`, item.text, 3)}${field("Technology tags, separated by commas", `project-${index}-tags`, item.tags.join(", "))}</div>`
      )
      .join("");

    document.getElementById("journey-editors").innerHTML = data.journey.items
      .map(
        (item, index) =>
          `<div class="editor-card"><div class="editor-card-header"><strong>Chapter ${String(index + 1).padStart(2, "0")}</strong><button type="button" class="remove-button" data-remove="${index}">Remove</button></div>${field("Date", `journey-${index}-date`, item.date)}${field("Title", `journey-${index}-title`, item.title)}${field("Description", `journey-${index}-text`, item.text, 3)}<label><input type="checkbox" data-current="${index}" ${item.current ? "checked" : ""}> Current chapter</label></div>`
      )
      .join("");

    document.querySelectorAll("[data-remove]").forEach((button) => {
      button.onclick = () => {
        data.journey.items.splice(Number(button.dataset.remove), 1);
        render();
      };
    });

    document.getElementById("archive-editors").innerHTML = data.archive.length
      ? data.archive
          .map(
            (item, index) =>
              `<div class="archive-row"><span><strong>${item.title}</strong><small>${item.kind || "Archive"} · ${item.filename || ""}</small></span><button type="button" class="remove-button" data-delete="${index}">Remove</button></div>`
          )
          .join("")
      : '<p class="section-label">No archive items yet.</p>';

    document.querySelectorAll("[data-delete]").forEach((button) => {
      button.onclick = () => {
        data.archive.splice(Number(button.dataset.delete), 1);
        render();
      };
    });

    if (state.mode === "api") {
      status.textContent = "Connected to secure publish API";
      submitButton.textContent = "Publish changes globally ↗";
    } else {
      status.textContent = "Static mode (local draft only)";
      submitButton.textContent = "Save local draft ↗";
    }
  }

  function collect() {
    const data = state.data;
    const get = (name) => document.querySelector(`[name="${name}"]`).value;

    data.hero.title = get("hero-title");
    data.hero.intro = get("hero-intro");
    data.about.title = get("about-title");
    data.about.lead = get("about-lead");
    data.about.copy = get("about-copy");
    data.journey.title = get("journey-title");
    data.journey.intro = get("journey-intro");
    data.settings.contact = get("contact");
    data.settings.linkedin = get("linkedin");
    data.settings.github = get("github");
    data.settings.whatsapp = get("whatsapp");

    Object.keys(data.settings.visible).forEach((key) => {
      data.settings.visible[key] = document.querySelector(`[data-visible="${key}"]`).checked;
    });

    data.projects = data.projects.map((item, index) => ({
      title: document.querySelector(`[data-key="project-${index}-title"]`).value,
      type: document.querySelector(`[data-key="project-${index}-type"]`).value,
      text: document.querySelector(`[data-key="project-${index}-text"]`).value,
      tags: document
        .querySelector(`[data-key="project-${index}-tags"]`)
        .value.split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    }));

    data.journey.items = data.journey.items.map((item, index) => ({
      date: document.querySelector(`[data-key="journey-${index}-date"]`).value,
      title: document.querySelector(`[data-key="journey-${index}-title"]`).value,
      text: document.querySelector(`[data-key="journey-${index}-text"]`).value,
      current: document.querySelector(`[data-current="${index}"]`).checked
    }));

    return data;
  }

  document.getElementById("add-journey").onclick = () => {
    state.data.journey.items.push({ date: "NEW", title: "New chapter", text: "Describe this chapter." });
    render();
  };

  document.getElementById("file").onchange = (event) => {
    document.getElementById("file-label").textContent = event.target.files[0]
      ? event.target.files[0].name
      : "Choose image, PDF, video, or any file";
  };

  document.getElementById("add-file").onclick = () => {
    const file = document.getElementById("file").files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.data.archive.unshift({
        title: document.getElementById("file-title").value || file.name,
        description: document.getElementById("file-description").value,
        kind: file.type.startsWith("image/") ? "Photo" : "File",
        filename: file.name,
        image: file.type.startsWith("image/") ? reader.result : "",
        file: reader.result
      });
      render();
    };
    reader.readAsDataURL(file);
  };

  document.getElementById("content-form").onsubmit = async (event) => {
    event.preventDefault();
    const content = collect();

    if (state.mode === "static") {
      localStorage.setItem("omarPortfolioDraft", JSON.stringify(content));
      status.textContent = "Saved local draft in this browser ✓";
      status.className = "save-state status-good";
      return;
    }

    status.textContent = "Publishing…";
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: state.password, content })
    });
    const result = await response.json();
    status.textContent = response.ok ? "Published globally ✓" : result.error || "Publish failed.";
    status.className = response.ok ? "save-state status-good" : "save-state status-bad";
  };
})();
