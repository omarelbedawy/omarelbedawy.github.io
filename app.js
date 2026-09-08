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
  const setHTML = (id, value) => { const element = document.getElementById(id); if (element) element.innerHTML = value; };
  setHTML("hero-title", data.hero.title); setHTML("hero-intro", data.hero.intro); setHTML("about-title", data.about.title); setHTML("about-lead", data.about.lead); setHTML("about-copy", data.about.copy); setHTML("journey-title", data.journey.title); setHTML("journey-intro", data.journey.intro);
  document.getElementById("timeline").innerHTML = data.journey.items.map((item) => `<div class="timeline-item ${item.current ? "current" : ""}"><div class="timeline-date">${item.date}</div><div><h3>${item.title}</h3><p>${item.text}</p></div><span class="timeline-dot"></span></div>`).join("");
  document.querySelectorAll("[data-project]").forEach((card) => { const item = data.projects[Number(card.dataset.project)]; if (!item) return; card.querySelector(".project-type").textContent = item.type; card.querySelector("h3").innerHTML = item.title + "<span>↗</span>"; card.querySelector("p").textContent = item.text; card.querySelector(".tags").innerHTML = item.tags.map((tag) => `<span>${tag}</span>`).join(""); });
  const visibility = { about: "#about", work: "#work", stack: ".stack-section", journey: "#journey", archive: "#additions", contact: "#contact" };
  Object.entries(visibility).forEach(([key, selector]) => { if (data.settings.visible[key] === false) document.querySelector(selector).hidden = true; });
  document.querySelector(".email-link").href = "mailto:" + data.settings.contact; document.querySelector(".email-link").firstChild.textContent = data.settings.contact + " "; const socialLinks = document.querySelectorAll(".socials a"); [data.settings.linkedin, data.settings.github, data.settings.whatsapp].forEach((url, index) => { socialLinks[index].href = url; });
  const target = document.getElementById("dynamic-content");
  if (!data.archive.length) target.innerHTML = '<p class="dynamic-empty">The archive is growing. New milestones and field notes will appear here.</p>';
  else target.innerHTML = '<div class="dynamic-grid">' + data.archive.map((item) => `<article class="dynamic-card">${item.image ? `<img src="${item.image}" alt="${item.title || "Omar Elbedawy archive file"}">` : ""}<small class="section-label">${item.kind || "Archive"}</small><h3>${item.title || "Untitled"}</h3><p>${item.description || ""}</p>${item.file ? `<a href="${item.file}" download="${item.filename}" class="project-arrow">Download file ↗</a>` : ""}</article>`).join("") + "</div>";
})().catch((error) => { console.error("Portfolio content could not load.", error); });
