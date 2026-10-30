// Shared by every page: theme toggle, dock, cursor glow, scroll reveal.
// Pages set <body data-root=""> (site root) or data-root="../" (pages in /work).

const ROOT = document.body.dataset.root || "";
const onHome = !!document.getElementById("about");
const RESUME = "https://drive.google.com/file/d/1Oyu4a_1qs8sjJwF7FfjTXfUL7Ve95aMi/view?usp=sharing";

// ---------- theme ----------
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("theme", theme); } catch {}
}

// ---------- dock ----------
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  about: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  skills: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  experience: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  work: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  education: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  contact: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  github: '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
  resume: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  play: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
};
const svg = (name, cls = "") => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${ICONS[name]}</svg>`;
const section = (id) => (onHome ? "#" + id : ROOT + "index.html#" + id);

const DOCK = [
  { label: "Home", icon: "home", href: onHome ? "#top" : ROOT + "index.html", optional: true },
  { label: "About", icon: "about", href: section("about"), section: "about" },
  { label: "Skills", icon: "skills", href: section("skills"), section: "skills", optional: true },
  { label: "Experience", icon: "experience", href: section("experience"), section: "experience" },
  { label: "Work", icon: "work", href: section("work"), section: "work" },
  { label: "Education", icon: "education", href: section("education"), section: "education", optional: true },
  { label: "Contact", icon: "contact", href: section("contact"), section: "contact" },
  "sep",
  { label: "GitHub", icon: "github", href: "https://github.com/sayali3050", external: true },
  { label: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/in/sayali-bhagyawant-726a87310/", external: true },
  { label: "Résumé", icon: "resume", href: RESUME, external: true, optional: true },
  "sep",
  { label: "Playground", icon: "play", href: ROOT + "playground.html" },
];

const dock = document.createElement("nav");
dock.className = "dock";
dock.setAttribute("aria-label", "Site");
dock.innerHTML =
  DOCK.map((item) => {
    if (item === "sep") return '<span class="dock-sep" aria-hidden="true"></span>';
    const ext = item.external ? ' target="_blank" rel="noopener"' : "";
    const cls = "dock-item" + (item.optional ? " dock-optional" : "");
    const sec = item.section ? ` data-section="${item.section}"` : "";
    return `<a class="${cls}" href="${item.href}" data-label="${item.label}" aria-label="${item.label}"${sec}${ext}>${svg(item.icon)}</a>`;
  }).join("") +
  `<button class="dock-item" type="button" data-label="Toggle theme" aria-label="Toggle light and dark theme" id="theme-toggle">${svg("moon", "icon-moon")}${svg("sun", "icon-sun")}</button>`;
document.body.appendChild(dock);

document.getElementById("theme-toggle").addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
});

// magnify icons near the pointer, like a desktop dock
const dockItems = [...dock.querySelectorAll(".dock-item")];
const canMagnify = matchMedia("(hover: hover) and (min-width: 601px)").matches;
if (canMagnify) {
  dock.addEventListener("pointermove", (e) => {
    for (const item of dockItems) {
      const r = item.getBoundingClientRect();
      const dist = Math.abs(e.clientX - (r.left + r.width / 2));
      const s = 1 + 0.55 * Math.max(0, 1 - dist / 140);
      item.style.setProperty("--s", s.toFixed(3));
    }
  });
  dock.addEventListener("pointerleave", () => dockItems.forEach((i) => i.style.setProperty("--s", 1)));
}

// highlight the section currently on screen
if (onHome) {
  const sectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      dockItems.forEach((i) => i.classList.toggle("active", i.dataset.section === entry.target.id));
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("section[id]").forEach((s) => sectionObserver.observe(s));
} else if (location.pathname.endsWith("playground.html")) {
  dock.querySelector('[data-label="Playground"]').classList.add("active");
} else {
  dock.querySelector('[data-label="Work"]').classList.add("active");
}

// ---------- cursor glow ----------
const glow = document.querySelector(".cursor-glow");
if (glow) {
  window.addEventListener("pointermove", (e) => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });
}

// ---------- scroll reveal ----------
const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add("in");
    revealObserver.unobserve(entry.target);
  }
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ---------- footer year ----------
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
