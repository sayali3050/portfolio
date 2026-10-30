// Home page only. Shared behaviour (dock, theme, reveal) lives in common.js.

// ---------- rotating role ----------
const roles = ["AI agents", "RAG pipelines", "full-stack apps", "LLM tools", "things that ship"];
const rotator = document.getElementById("rotator");
let roleIdx = 0, charIdx = roles[0].length, deleting = true;
function rotate() {
  if (deleting) {
    charIdx--;
    if (charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % roles.length; }
  } else {
    charIdx++;
  }
  rotator.textContent = roles[roleIdx].slice(0, charIdx) || " ";
  let delay = deleting ? 45 : 90;
  if (!deleting && charIdx === roles[roleIdx].length) { deleting = true; delay = 1800; }
  setTimeout(rotate, delay);
}
setTimeout(rotate, 2000);

// ---------- agent trace terminal ----------
const traceLines = [
  ['<span class="c-mute">$ python run.py --ticket 2041</span>', 500],
  ['<span class="c-vio">▸ thinking</span>  account_id is blank, resolve from email', 900],
  ['<span class="c-lime">↳ tool</span>  resolve_account("ops@acme.io")', 700],
  ['  <span class="c-mute">→ ACME-117 · Enterprise · renews in 21d</span>', 600],
  ['<span class="c-lime">↳ tool</span>  get_related_tickets("ACME-117")', 700],
  ['  <span class="c-mute">→ 2 open · 1 escalation last week</span>', 600],
  ['<span class="c-lime">↳ tool</span>  search_kb("invoice sync failure")', 700],
  ['  <span class="c-mute">→ KB-208 Support policy · KB-341 ERP sync</span>', 700],
  ['<span class="c-vio">▸ decide</span>  priority=<span class="c-pink">P1</span> route=TAM escalate=true', 900],
  ['<span class="c-lime">✓ reply drafted</span> · internal note logged · 2.1s', 600],
];
const trace = document.getElementById("trace");
async function runTrace() {
  while (true) {
    trace.innerHTML = "";
    for (const [line, wait] of traceLines) {
      trace.innerHTML = trace.innerHTML.replace('<span class="caret"></span>', "") + line + '\n<span class="caret"></span>';
      await new Promise((r) => setTimeout(r, wait));
    }
    await new Promise((r) => setTimeout(r, 3500));
  }
}
runTrace();

// ---------- terminal tilt ----------
const tilt = document.querySelector(".tilt");
const heroRight = document.querySelector(".hero-right");
heroRight.addEventListener("pointermove", (e) => {
  const r = heroRight.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  tilt.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
});
heroRight.addEventListener("pointerleave", () => (tilt.style.transform = ""));

// ---------- stat counters ----------
const counterObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    countUp(entry.target);
    counterObserver.unobserve(entry.target);
  }
}, { threshold: 0.5 });
document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));

function countUp(el) {
  const target = +el.dataset.count;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / 1400, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- experience index opens its entry ----------
document.querySelectorAll(".exp-index a").forEach((a) => {
  a.addEventListener("click", () => {
    document.querySelector(a.getAttribute("href")).open = true;
  });
});

// ---------- contact form (Formspree) ----------
const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;
  status.className = "form-status";
  status.textContent = "Sending…";
  try {
    const res = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error();
    form.reset();
    status.classList.add("ok");
    status.textContent = "✓ Message sent! I'll get back to you soon.";
  } catch {
    status.classList.add("err");
    status.textContent = "Something went wrong. Please try LinkedIn instead.";
  } finally {
    button.disabled = false;
  }
});
