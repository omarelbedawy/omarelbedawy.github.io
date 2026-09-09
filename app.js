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

  const setHTML = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.innerHTML = value;
  };

  setHTML("hero-title", data.hero.title);
  setHTML("hero-intro", data.hero.intro);
  setHTML("about-title", data.about.title);
  setHTML("about-lead", data.about.lead);
  setHTML("about-copy", data.about.copy);
  setHTML("journey-title", data.journey.title);
  setHTML("journey-intro", data.journey.intro);

  const timeline = document.getElementById("timeline");
  if (timeline) {
    timeline.innerHTML = data.journey.items
      .map(
        (item) =>
          `<div class="timeline-item ${item.current ? "current" : ""}"><div class="timeline-date">${item.date}</div><div><h3>${item.title}</h3><p>${item.text}</p></div><span class="timeline-dot"></span></div>`
      )
      .join("");
  }

  document.querySelectorAll("[data-project]").forEach((card) => {
    const item = data.projects[Number(card.dataset.project)];
    if (!item) return;
    card.querySelector(".project-type").textContent = item.type;
    card.querySelector("h3").innerHTML = item.title + "<span>↗</span>";
    card.querySelector("p").textContent = item.text;
    card.querySelector(".tags").innerHTML = item.tags.map((tag) => `<span>${tag}</span>`).join("");
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
    emailLink.href = "mailto:" + data.settings.contact;
    emailLink.firstChild.textContent = data.settings.contact + " ";
  }

  const socialLinks = document.querySelectorAll(".socials a");
  [data.settings.linkedin, data.settings.github, data.settings.whatsapp].forEach((url, index) => {
    if (socialLinks[index]) socialLinks[index].href = url;
  });

  const target = document.getElementById("dynamic-content");
  if (target) {
    if (!data.archive.length) {
      target.innerHTML = '<p class="dynamic-empty">The archive is growing. New milestones and field notes will appear here.</p>';
    } else {
      target.innerHTML =
        '<div class="dynamic-grid">' +
        data.archive
          .map(
            (item) =>
              `<article class="dynamic-card">${
                item.image ? `<img src="${item.image}" alt="${item.title || "Omar Elbedawy archive file"}">` : ""
              }<small class="section-label">${item.kind || "Archive"}</small><h3>${item.title || "Untitled"}</h3><p>${item.description || ""}</p>${
                item.file ? `<a href="${item.file}" download="${item.filename}" class="project-arrow">Download file ↗</a>` : ""
              }</article>`
          )
          .join("") +
        "</div>";
    }
  }
})().catch((error) => {
  console.error("Portfolio content could not load.", error);
});
