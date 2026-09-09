(async function () {
  const glow = document.querySelector(".cursor-glow");
  document.addEventListener("pointermove", (event) => { glow.style.left = event.clientX + "px"; glow.style.top = event.clientY + "px"; });
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".desktop-nav");
  let studioClicks = 0;
  document.getElementById("studio-trigger").addEventListener("click", (event) => {
    event.preventDefault();
    studioClicks += 1;
    if (studioClicks >= 5) window.location.href = "/admin.html";
  });
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", String(!open));
    nav.style.display = open ? "" : "flex";
    if (!open) Object.assign(nav.style, { position: "absolute", top: "70px", right: "20px", flexDirection: "column", background: "#f5f7f1", padding: "18px", gap: "18px" });
  });

  // ---- Inline lightbox for uploaded photos & certificates (stays on the page, never a new tab) ----
  const lightbox = document.getElementById("lightbox");
  const lightboxBody = document.getElementById("lightbox-body");
  function fileKind(path) {
    const ext = (path.split(".").pop() || "").toLowerCase().split("?")[0];
    if (["jpg", "jpeg", "png", "gif", "webp", "jfif", "svg", "avif"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
    return "file";
  }
  function openLightbox(path, title) {
    if (!path) return;
    const kind = fileKind(path);
    let inner = "";
    if (kind === "image") inner = `<img src="${path}" alt="${title || "Uploaded file"}">`;
    else if (kind === "pdf") inner = `<iframe src="${path}" title="${title || "Document"}"></iframe>`;
    else if (kind === "video") inner = `<video src="${path}" controls autoplay></video>`;
    else inner = `<div class="lightbox-fallback"><p>${title || "This file"} can't be previewed inline.</p><a class="button button-primary" href="${path}" download>Download file ↓</a></div>`;
    lightboxBody.innerHTML = (title ? `<h3 class="lightbox-title">${title}</h3>` : "") + inner;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lightbox.hidden = true;
    lightboxBody.innerHTML = "";
    document.body.style.overflow = "";
  }
  lightbox.addEventListener("click", (event) => { if (event.target.hasAttribute("data-close")) closeLightbox(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !lightbox.hidden) closeLightbox(); });

  const response = await fetch("content.json", { cache: "no-store" });
  const data = await response.json();
  const local = JSON.parse(localStorage.getItem("omarPortfolioDraft") || "null");
  if (local) Object.assign(data, local, { settings: { ...data.settings, ...(local.settings || {}), visible: { ...data.settings.visible, ...((local.settings || {}).visible || {}) } }, hero: { ...data.hero, ...(local.hero || {}) }, about: { ...data.about, ...(local.about || {}) }, journey: { ...data.journey, ...(local.journey || {}) } });

  document.getElementById("hero-title").textContent = data.hero.title;
  document.getElementById("hero-intro").textContent = data.hero.intro;
  document.getElementById("about-title").textContent = data.about.title;
  document.getElementById("about-lead").textContent = data.about.lead;
  document.getElementById("about-copy").textContent = data.about.copy;

  document.getElementById("timeline").innerHTML = data.journey.items.map((item, index) => `<div class="timeline-item ${item.current ? "current" : ""}"><div class="timeline-date">${item.date}</div><div>${item.image ? `<img class="timeline-image" src="${item.image}" alt="${item.title}" data-open-file="journey-${index}">` : ""}<h3>${item.title}</h3><p>${item.text}</p>${item.file ? `<button type="button" class="project-link" data-open-file="journey-${index}">View certificate</button>` : ""}</div><span class="timeline-dot"></span></div>`).join("");
  document.querySelectorAll('[data-open-file^="journey-"]').forEach((el) => {
    el.addEventListener("click", () => {
      const index = Number(el.dataset.openFile.split("-")[1]);
      const item = data.journey.items[index];
      openLightbox(item.file || item.image, item.title);
    });
  });

  document.querySelectorAll("[data-project]").forEach((card) => {
    const item = data.projects[Number(card.dataset.project)];
    if (!item) return;
    card.querySelector(".project-type").textContent = item.type;
    card.querySelector("h3").textContent = item.title;
    card.querySelector("p").textContent = item.text;
    card.querySelector(".tags").innerHTML = item.tags.map((tag) => `<span>${tag}</span>`).join("");
    const link = card.querySelector(".project-link");
    if (item.url) { link.href = item.url; link.hidden = false; } else { link.removeAttribute("href"); link.hidden = true; }
    if (item.image) { card.style.setProperty("--project-image", `url("${item.image}")`); card.classList.add("has-project-image"); }
  });

  const visibility = { about: "#about", work: "#work", stack: ".stack-section", archive: "#additions", contact: "#contact" };
  Object.entries(visibility).forEach(([key, selector]) => { if (data.settings.visible[key] === false) document.querySelector(selector).hidden = true; });

  document.querySelector(".email-link").href = "mailto:" + data.settings.contact;
  document.querySelector(".email-link").firstChild.textContent = data.settings.contact + " ";
  document.querySelector(".top-email").href = "mailto:" + data.settings.contact;
  document.getElementById("top-email-text").textContent = data.settings.contact;

  const socialUrls = { linkedin: data.settings.linkedin, github: data.settings.github, whatsapp: data.settings.whatsapp };
  Object.entries(socialUrls).forEach(([key, url]) => {
    document.querySelectorAll(`[data-social="${key}"]`).forEach((a) => { a.href = url; });
  });

  // Hero image now renders as a big, clear full-bleed background — no floating photo card.
  if (data.settings.heroImage) document.getElementById("hero-section").style.setProperty("--hero-image", `url("${data.settings.heroImage}")`);

  const target = document.getElementById("dynamic-content");
  if (!data.archive.length) {
    target.innerHTML = '<p class="dynamic-empty">The archive is growing. New milestones and field notes will appear here.</p>';
  } else {
    target.innerHTML = '<div class="dynamic-grid">' + data.archive.map((item, index) => `<article class="dynamic-card">${item.image ? `<img src="${item.image}" alt="${item.title || "Omar Elbedawy archive file"}" data-open-file="archive-${index}">` : ""}<small class="section-label">${item.kind || "Archive"}</small><h3>${item.title || "Untitled"}</h3><p>${item.description || ""}</p>${item.file ? `<button type="button" class="project-arrow" data-open-file="archive-${index}">View file</button>` : ""}</article>`).join("") + "</div>";
    document.querySelectorAll('[data-open-file^="archive-"]').forEach((el) => {
      el.addEventListener("click", () => {
        const index = Number(el.dataset.openFile.split("-")[1]);
        const item = data.archive[index];
        openLightbox(item.file || item.image, item.title);
      });
    });
  }
})().catch((error) => { console.error("Portfolio content could not load.", error); });
