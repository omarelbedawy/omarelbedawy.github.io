(async function () {
  const glow = document.querySelector(".cursor-glow");
  if (glow) {
    document.addEventListener("pointermove", (event) => {
      glow.style.left = event.clientX + "px";
      glow.style.top = event.clientY + "px";
    });
  }

  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".desktop-nav");
  if (menu && nav) {
    menu.addEventListener("click", () => {
      const open = menu.getAttribute("aria-expanded") === "true";
      menu.setAttribute("aria-expanded", String(!open));
      nav.style.display = open ? "" : "flex";
      if (!open) {
        Object.assign(nav.style, {
          position: "absolute",
          top: "70px",
          right: "20px",
          flexDirection: "column",
          background: "#f5f7f1",
          padding: "18px",
          gap: "18px"
        });
      }
    });
  }

  let studioClicks = 0;
  const studioTrigger = document.getElementById("studio-trigger");
  if (studioTrigger) {
    studioTrigger.addEventListener("click", (event) => {
      event.preventDefault();
      studioClicks += 1;
      if (studioClicks >= 5) window.location.href = "/admin.html";
    });
  }

  const tabLinks = document.querySelectorAll("[data-tab-link]");
  const tabSections = document.querySelectorAll("[data-tab-section]");
  const activateTab = (tab, updateHash = true) => {
    tabSections.forEach((section) => {
      const active = section.dataset.tabSection === tab;
      section.classList.toggle("is-active", active);
      section.hidden = !active;
    });
    tabLinks.forEach((link) => {
      const active = link.dataset.tabLink === tab;
      link.classList.toggle("is-active", active);
      link.setAttribute("aria-current", active ? "page" : "false");
    });
    if (updateHash) history.replaceState(null, "", `#${tab}`);
    if (menu && nav && window.innerWidth <= 800) {
      menu.setAttribute("aria-expanded", "false");
      nav.style.display = "";
      nav.removeAttribute("style");
    }
  };

  if (tabLinks.length && tabSections.length) {
    const allowedTabs = new Set(Array.from(tabSections).map((section) => section.dataset.tabSection));
    const initialTab = (location.hash || "").replace("#", "");
    activateTab(allowedTabs.has(initialTab) ? initialTab : "home", false);
    tabLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        activateTab(link.dataset.tabLink);
      });
    });
    window.addEventListener("hashchange", () => {
      const target = (location.hash || "").replace("#", "");
      if (allowedTabs.has(target)) activateTab(target, false);
    });
  }

  const cleanUrl = (value, { allowDataImage = false, fallback = "#" } = {}) => {
    const text = String(value || "").trim();
    if (!text) return fallback;
    if (allowDataImage && /^data:image\//i.test(text)) return text;
    if (/^mailto:/i.test(text)) return text;
    try {
      const url = new URL(text, location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : fallback;
    } catch {
      return fallback;
    }
  };

  const renderInlineMarkup = (element, value) => {
    if (!element) return;
    const input = String(value || "")
      .replace(/<br\s*\/?\s*>/gi, "[[BR]]")
      .replace(/<em>/gi, "[[EM_OPEN]]")
      .replace(/<\/em>/gi, "[[EM_CLOSE]]")
      .replace(/<span class=['"]arabic['"]>/gi, "[[ARABIC_OPEN]]")
      .replace(/<\/span>/gi, "[[ARABIC_CLOSE]]");

    element.textContent = "";
    const stack = [element];
    const parts = input.split(/(\[\[BR\]\]|\[\[EM_OPEN\]\]|\[\[EM_CLOSE\]\]|\[\[ARABIC_OPEN\]\]|\[\[ARABIC_CLOSE\]\])/);

    parts.forEach((part) => {
      const current = stack[stack.length - 1];
      if (!part) return;
      if (part === "[[BR]]") {
        current.appendChild(document.createElement("br"));
        return;
      }
      if (part === "[[EM_OPEN]]") {
        const em = document.createElement("em");
        current.appendChild(em);
        stack.push(em);
        return;
      }
      if (part === "[[EM_CLOSE]]") {
        if (stack.length > 1 && stack[stack.length - 1].tagName === "EM") stack.pop();
        return;
      }
      if (part === "[[ARABIC_OPEN]]") {
        const span = document.createElement("span");
        span.className = "arabic";
        current.appendChild(span);
        stack.push(span);
        return;
      }
      if (part === "[[ARABIC_CLOSE]]") {
        if (stack.length > 1 && stack[stack.length - 1].classList.contains("arabic")) stack.pop();
        return;
      }
      current.appendChild(document.createTextNode(part));
    });
  };

  const response = await fetch("content.json", { cache: "no-store" });
  const data = await response.json();
  const local = JSON.parse(localStorage.getItem("omarPortfolioDraft") || "null");
  if (local) {
    Object.assign(data, local, {
      settings: {
        ...data.settings,
        ...(local.settings || {}),
        visible: { ...data.settings.visible, ...((local.settings || {}).visible || {}) }
      },
      hero: { ...data.hero, ...(local.hero || {}) },
      about: { ...data.about, ...(local.about || {}) },
      journey: { ...data.journey, ...(local.journey || {}) }
    });
  }

  renderInlineMarkup(document.getElementById("hero-title"), data.hero.title);
  document.getElementById("hero-intro").textContent = data.hero.intro || "";
  renderInlineMarkup(document.getElementById("about-title"), data.about.title);
  document.getElementById("about-lead").textContent = data.about.lead || "";
  document.getElementById("about-copy").textContent = data.about.copy || "";
  document.getElementById("journey-title").textContent = data.journey.title || "";
  document.getElementById("journey-intro").textContent = data.journey.intro || "";

  const timeline = document.getElementById("timeline");
  if (timeline) {
    timeline.textContent = "";
    data.journey.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = `timeline-item ${item.current ? "current" : ""}`;

      const date = document.createElement("div");
      date.className = "timeline-date";
      date.textContent = item.date || "";

      const body = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = item.title || "";
      const text = document.createElement("p");
      text.textContent = item.text || "";
      body.appendChild(title);
      body.appendChild(text);

      const dot = document.createElement("span");
      dot.className = "timeline-dot";

      row.appendChild(date);
      row.appendChild(body);
      row.appendChild(dot);
      timeline.appendChild(row);
    });
  }

  document.querySelectorAll("[data-project]").forEach((card) => {
    const item = data.projects[Number(card.dataset.project)];
    if (!item) return;
    const projectType = card.querySelector(".project-type");
    const title = card.querySelector("h3");
    const description = card.querySelector("p");
    const tags = card.querySelector(".tags");

    projectType.textContent = item.type || "";
    title.textContent = "";
    renderInlineMarkup(title, item.title || "");
    const arrow = document.createElement("span");
    arrow.textContent = "↗";
    title.appendChild(arrow);
    description.textContent = item.text || "";

    tags.textContent = "";
    item.tags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.textContent = tag;
      tags.appendChild(chip);
    });
  });

  const visibility = {
    about: "#about",
    work: "#work",
    stack: ".stack-section",
    journey: "#journey",
    archive: "#additions",
    contact: "#contact"
  };

  Object.entries(visibility).forEach(([key, selector]) => {
    const section = document.querySelector(selector);
    if (section && data.settings.visible[key] === false) section.hidden = true;
  });

  const emailLink = document.querySelector(".email-link");
  if (emailLink) {
    emailLink.firstChild.textContent = (data.settings.contact || "") + " ";
  }

  const target = document.getElementById("dynamic-content");
  if (target) {
    target.textContent = "";
    if (!data.archive.length) {
      const empty = document.createElement("p");
      empty.className = "dynamic-empty";
      empty.textContent = "The archive is growing. New milestones and field notes will appear here.";
      target.appendChild(empty);
    } else {
      const grid = document.createElement("div");
      grid.className = "dynamic-grid";
      data.archive.forEach((item) => {
        const card = document.createElement("article");
        card.className = "dynamic-card";

        if (item.image) {
          const image = document.createElement("img");
          image.src = cleanUrl(item.image, { allowDataImage: true, fallback: "" });
          image.alt = item.title || "Omar Elbedawy archive file";
          if (image.src) card.appendChild(image);
        }

        const kind = document.createElement("small");
        kind.className = "section-label";
        kind.textContent = item.kind || "Archive";

        const heading = document.createElement("h3");
        heading.textContent = item.title || "Untitled";

        const summary = document.createElement("p");
        summary.textContent = item.description || "";

        card.appendChild(kind);
        card.appendChild(heading);
        card.appendChild(summary);

        if (item.file) {
          const download = document.createElement("a");
          download.href = cleanUrl(item.file, { allowDataImage: true, fallback: "#" });
          download.download = item.filename || "archive-file";
          download.className = "project-arrow";
          download.textContent = "Download file ↗";
          card.appendChild(download);
        }

        grid.appendChild(card);
      });
      target.appendChild(grid);
    }
  }
})().catch((error) => {
  console.error("Portfolio content could not load.", error);
});
