(function () {
  const glow = document.querySelector(".cursor-glow");
  document.addEventListener("pointermove", (event) => { glow.style.left = event.clientX + "px"; glow.style.top = event.clientY + "px"; });
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".desktop-nav");
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", String(!open));
    nav.style.display = open ? "" : "flex";
    if (!open) Object.assign(nav.style, { position: "absolute", top: "70px", right: "20px", flexDirection: "column", background: "#f5f7f1", padding: "18px", gap: "18px" });
  });
  const data = {
    settings: { visible: { about: true, work: true, stack: true, journey: true, archive: true, contact: true }, contact: "elbedawyomar2009@gmail.com", linkedin: "https://www.linkedin.com/", github: "https://github.com/", whatsapp: "https://wa.me/201000000000" },
    hero: { title: "I build useful things<br><em>for real people.</em>", intro: "I’m Omar, a full-stack engineer and top-ranking STEM scholar from Egypt. I turn ambitious ideas into thoughtful products across web architecture, infrastructure, and human-centered AI." },
    about: { title: "Technical depth.<br><em>Human context.</em>", lead: "The best technology feels inevitable: quietly powerful, beautifully considered, and made for the person on the other side of the screen.", copy: "From a factory floor to a funded AI pitch, I’ve learned that good engineering is less about showing off complexity and more about earning trust. I bring that mindset to every system, interface, and team I touch." },
    journey: { title: "Still becoming.", intro: "The environments that shaped how I think, lead, and ship.", items: [{ date: "2024 — NOW", title: "Kafr El-Sheikh STEM High School", text: "Top-ranking STEM scholar exploring full-stack systems and human-centered AI while preparing for a world-class CS education.", current: true }, { date: "2024", title: "SPCS · Stanford Pre-Collegiate Studies", text: "Summer program participant, learning alongside ambitious students and widening my view of what is possible." }, { date: "2023 — 2024", title: "DECI · Digital Egypt Cubs Initiative", text: "Built a scalable e-commerce capstone and strengthened my foundations in architecture, deployment, and collaboration." }, { date: "ONGOING", title: "Factory floor · CNC laser operator", text: "40+ hours a week building humility, precision, and grit far away from a comfortable desk." }] },
    projects: [{ title: "PixelGuard", type: "NYAS · AI SAFETY", text: "A privacy-first anti-scraping SaaS that injects adversarial noise into images to disrupt AI facial-recognition systems.", tags: ["Adversarial ML", "SaaS", "Privacy"] }, { title: "Hajiz <span class='arabic'>حاجز</span>", type: "TRAVEL · BACKEND", text: "A travel-sync backend connecting real-time aviation APIs with hotel reservations, helping travelers avoid costly no-show penalties.", tags: ["Node.js", "APIs", "PostgreSQL"] }, { title: "Commerce OS", type: "DECI · CAPSTONE", text: "A production-minded e-commerce platform designed as a scalable system, orchestrated with Docker and Kubernetes.", tags: ["Docker", "Kubernetes", "MERN"] }],
    archive: []
  };
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
})();
