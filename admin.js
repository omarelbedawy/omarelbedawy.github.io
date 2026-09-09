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

  const createLabel = (text) => {
    const label = document.createElement("label");
    label.appendChild(document.createTextNode(text));
    return label;
  };

  const createTextAreaField = (labelText, key, value, rows = 2) => {
    const label = createLabel(labelText);
    const textarea = document.createElement("textarea");
    textarea.setAttribute("data-key", key);
    textarea.rows = rows;
    textarea.value = value || "";
    label.appendChild(textarea);
    return label;
  };

  const createProjectEditor = (item, index) => {
    const card = document.createElement("div");
    card.className = "editor-card";

    const header = document.createElement("div");
    header.className = "editor-card-header";
    const title = document.createElement("strong");
    title.textContent = `Project ${String(index + 1).padStart(2, "0")}`;
    header.appendChild(title);
    card.appendChild(header);

    card.appendChild(createTextAreaField("Project name (HTML allowed)", `project-${index}-title`, item.title));
    card.appendChild(createTextAreaField("Category", `project-${index}-type`, item.type));
    card.appendChild(createTextAreaField("Description", `project-${index}-text`, item.text, 3));
    card.appendChild(
      createTextAreaField("Technology tags, separated by commas", `project-${index}-tags`, (item.tags || []).join(", "))
    );

    return card;
  };

  const createJourneyEditor = (item, index) => {
    const card = document.createElement("div");
    card.className = "editor-card";

    const header = document.createElement("div");
    header.className = "editor-card-header";

    const title = document.createElement("strong");
    title.textContent = `Chapter ${String(index + 1).padStart(2, "0")}`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-button";
    remove.dataset.remove = String(index);
    remove.textContent = "Remove";

    header.appendChild(title);
    header.appendChild(remove);
    card.appendChild(header);

    card.appendChild(createTextAreaField("Date", `journey-${index}-date`, item.date));
    card.appendChild(createTextAreaField("Title", `journey-${index}-title`, item.title));
    card.appendChild(createTextAreaField("Description", `journey-${index}-text`, item.text, 3));

    const currentLabel = document.createElement("label");
    const currentInput = document.createElement("input");
    currentInput.type = "checkbox";
    currentInput.dataset.current = String(index);
    currentInput.checked = Boolean(item.current);
    currentLabel.appendChild(currentInput);
    currentLabel.appendChild(document.createTextNode(" Current chapter"));
    card.appendChild(currentLabel);

    return card;
  };

  const createArchiveRow = (item, index) => {
    const row = document.createElement("div");
    row.className = "archive-row";

    const span = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = item.title || "Untitled";
    const small = document.createElement("small");
    small.textContent = `${item.kind || "Archive"} · ${item.filename || ""}`;
    span.appendChild(title);
    span.appendChild(small);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-button";
    remove.dataset.delete = String(index);
    remove.textContent = "Remove";

    row.appendChild(span);
    row.appendChild(remove);
    return row;
  };

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

    const projectEditors = document.getElementById("project-editors");
    projectEditors.textContent = "";
    data.projects.forEach((item, index) => {
      projectEditors.appendChild(createProjectEditor(item, index));
    });

    const journeyEditors = document.getElementById("journey-editors");
    journeyEditors.textContent = "";
    data.journey.items.forEach((item, index) => {
      journeyEditors.appendChild(createJourneyEditor(item, index));
    });

    document.querySelectorAll("[data-remove]").forEach((button) => {
      button.onclick = () => {
        data.journey.items.splice(Number(button.dataset.remove), 1);
        render();
      };
    });

    const archiveEditors = document.getElementById("archive-editors");
    archiveEditors.textContent = "";
    if (data.archive.length) {
      data.archive.forEach((item, index) => {
        archiveEditors.appendChild(createArchiveRow(item, index));
      });
    } else {
      const empty = document.createElement("p");
      empty.className = "section-label";
      empty.textContent = "No archive items yet.";
      archiveEditors.appendChild(empty);
    }

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
      const toggle = document.querySelector(`[data-visible="${key}"]`);
      if (toggle) data.settings.visible[key] = toggle.checked;
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
