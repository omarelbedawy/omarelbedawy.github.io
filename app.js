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
  const response = await fetch("content.json", { cache: "no-store" });
  const data = await response.json();
  const local = JSON.parse(localStorage.getItem("omarPortfolioDraft") || "null");
  if (local) Object.assign(data, local, { settings: { ...data.settings, ...(local.settings || {}), visible: { ...data.settings.visible, ...((local.settings || {}).visible || {}) } }, hero: { ...data.hero, ...(local.hero || {}) }, about: { ...data.about, ...(local.about || {}) }, journey: { ...data.journey, ...(local.journey || {}) } });
  document.getElementById("hero-title").textContent = data.hero.title; document.getElementById("hero-intro").textContent = data.hero.intro; document.getElementById("about-title").textContent = data.about.title; document.getElementById("about-lead").textContent = data.about.lead; document.getElementById("about-copy").textContent = data.about.copy;
  document.getElementById("timeline").innerHTML = data.journey.items.map((item) => `<div class="timeline-item ${item.current ? "current" : ""}"><div class="timeline-date">${item.date}</div><div>${item.image ? `<img class="timeline-image" src="${item.image}" alt="${item.title}">` : ""}<h3>${item.title}</h3><p>${item.text}</p>${item.file ? `<a class="project-link" href="${item.file}" target="_blank" rel="noreferrer">View certificate ↗</a>` : ""}</div><span class="timeline-dot"></span></div>`).join("");
  document.querySelectorAll("[data-project]").forEach((card) => { const item = data.projects[Number(card.dataset.project)]; if (!item) return; card.querySelector(".project-type").textContent = item.type; card.querySelector("h3").textContent = item.title; card.querySelector("p").textContent = item.text; card.querySelector(".tags").innerHTML = item.tags.map((tag) => `<span>${tag}</span>`).join(""); const link = card.querySelector(".project-link"); if (item.url) { link.href = item.url; link.hidden = false; } else { link.removeAttribute("href"); link.hidden = true; } if (item.image) { card.style.setProperty("--project-image", `url("${item.image}")`); card.classList.add("has-project-image"); } });
  const visibility = { about: "#about", work: "#work", stack: ".stack-section", archive: "#additions", contact: "#contact" };
  Object.entries(visibility).forEach(([key, selector]) => { if (data.settings.visible[key] === false) document.querySelector(selector).hidden = true; });
  document.querySelector(".email-link").href = "mailto:" + data.settings.contact; document.querySelector(".email-link").firstChild.textContent = data.settings.contact + " "; const socialLinks = document.querySelectorAll(".socials a"); [data.settings.linkedin, data.settings.github, data.settings.whatsapp].forEach((url, index) => { socialLinks[index].href = url; });
  if (data.settings.heroImage) document.querySelector(".hero").style.setProperty("--hero-image", `url("${data.settings.heroImage}")`);
  if (data.settings.heroImage) { const photo = document.getElementById("hero-photo"); photo.src = data.settings.heroImage; photo.hidden = false; document.querySelector(".portrait-card").classList.add("has-photo"); }
  const target = document.getElementById("dynamic-content");
  if (!data.archive.length) target.innerHTML = '<p class="dynamic-empty">The archive is growing. New milestones and field notes will appear here.</p>';
  else target.innerHTML = '<div class="dynamic-grid">' + data.archive.map((item) => `<article class="dynamic-card">${item.image ? `<img src="${item.image}" alt="${item.title || "Omar Elbedawy archive file"}">` : ""}<small class="section-label">${item.kind || "Archive"}</small><h3>${item.title || "Untitled"}</h3><p>${item.description || ""}</p>${item.file ? `<a href="${item.file}" download="${item.filename}" class="project-arrow">Download file ↗</a>` : ""}</article>`).join("") + "</div>";
})().catch((error) => { console.error("Portfolio content could not load.", error); });
