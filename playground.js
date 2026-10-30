// Playground page: lofi generator, Bug Squash, Prompt Sprint, wisdom cards.

// ---------- high scores (per browser) ----------
function getBest(key) {
  try { return +localStorage.getItem(key) || 0; } catch { return 0; }
}
function saveBest(key, score) {
  try { if (score > getBest(key)) localStorage.setItem(key, score); } catch {}
}

// ---------- lofi radio (Web Audio, synthesized live) ----------
const lofi = (() => {
  let ctx, master, timer, step = 0;
  // a gentle ii–V–I–vi style loop in C, voiced as 7th chords (MIDI note numbers)
  const chords = [
    [50, 53, 57, 60], // Dm7
    [43, 53, 55, 59], // G7
    [48, 52, 55, 59], // Cmaj7
    [45, 52, 55, 60], // Am7
  ];
  const scale = [72, 74, 76, 79, 81, 84];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function note(freq, start, dur, type, vol, dest) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 12; // a little tape wobble
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g).connect(dest);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  function kick(t) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  function hat(t, noiseBuf) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + 0.06);
  }

  function start() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = document.getElementById("lofi-vol").value / 100;
    const warm = ctx.createBiquadFilter(); // muffled, "through the wall" tone
    warm.type = "lowpass";
    warm.frequency.value = 1400;
    master.connect(warm).connect(ctx.destination);

    // vinyl crackle bed
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() < 0.0008 ? Math.random() * 2 - 1 : (Math.random() * 2 - 1) * 0.02;
    const crackle = ctx.createBufferSource();
    crackle.buffer = noiseBuf;
    crackle.loop = true;
    const cg = ctx.createGain();
    cg.gain.value = 0.25;
    crackle.connect(cg).connect(master);
    crackle.start();

    const beat = 60 / 72; // 72 bpm
    let next = ctx.currentTime + 0.1;
    step = 0;
    const schedule = () => {
      while (next < ctx.currentTime + 0.5) {
        const bar = Math.floor(step / 4) % chords.length;
        const beatInBar = step % 4;
        if (beatInBar === 0) {
          chords[bar].forEach((m, i) => note(hz(m), next + i * 0.03, beat * 4, "triangle", 0.07, master));
          note(hz(chords[bar][0] - 12), next, beat * 2, "sine", 0.18, master);
        }
        if (beatInBar === 0) kick(next);
        if (beatInBar === 2) kick(next + beat * 0.5);
        hat(next + beat * 0.5, noiseBuf);
        if (Math.random() < 0.45) {
          const m = scale[Math.floor(Math.random() * scale.length)];
          note(hz(m), next + (Math.random() < 0.5 ? 0 : beat / 2), beat * 1.5, "sine", 0.05, master);
        }
        next += beat;
        step++;
      }
    };
    schedule();
    timer = setInterval(schedule, 100);
  }

  function stop() {
    clearInterval(timer);
    if (ctx) ctx.close();
    ctx = null;
  }

  return {
    toggle() { ctx ? stop() : start(); return !!ctx; },
    volume(v) { if (master) master.gain.value = v; },
  };
})();

const lofiBtn = document.getElementById("lofi-btn");
lofiBtn.addEventListener("click", () => {
  const playing = lofi.toggle();
  lofiBtn.textContent = playing ? "❚❚ Pause" : "▶ Play";
  document.getElementById("vinyl").classList.toggle("spinning", playing);
  document.getElementById("lofi-status").textContent = playing
    ? "Now playing: an endless loop of 7th chords and vinyl crackle."
    : "Generated live in your browser, never the same twice.";
});
document.getElementById("lofi-vol").addEventListener("input", (e) => lofi.volume(e.target.value / 100));

// ---------- Bug Squash ----------
const bug = {
  arena: document.getElementById("bug-arena"),
  msg: document.getElementById("bug-msg"),
  scoreEl: document.getElementById("bug-score"),
  timeEl: document.getElementById("bug-time"),
  bestEl: document.getElementById("bug-best"),
  startBtn: document.getElementById("bug-start"),
};
bug.bestEl.textContent = getBest("best-bugs");

function spawnCritter(isFeature, lifetime, onHit) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "critter";
  el.textContent = isFeature ? "✨" : ["🐛", "🐞", "🪲"][Math.floor(Math.random() * 3)];
  el.setAttribute("aria-label", isFeature ? "feature, don't click" : "bug");
  const r = bug.arena.getBoundingClientRect();
  el.style.left = Math.random() * (r.width - 48) + "px";
  el.style.top = Math.random() * (r.height - 48) + "px";
  el.addEventListener("pointerdown", () => {
    onHit(isFeature);
    el.classList.add("squashed");
    setTimeout(() => el.remove(), 200);
  }, { once: true });
  bug.arena.appendChild(el);
  setTimeout(() => el.remove(), lifetime);
}

bug.startBtn.addEventListener("click", () => {
  let score = 0, time = 30;
  bug.arena.querySelectorAll(".critter").forEach((c) => c.remove());
  bug.msg.style.display = "none";
  bug.startBtn.disabled = true;
  bug.scoreEl.textContent = 0;
  bug.timeEl.textContent = time;

  const hit = (isFeature) => {
    score = Math.max(0, score + (isFeature ? -2 : 1));
    bug.scoreEl.textContent = score;
  };
  const spawnLoop = () => {
    if (time <= 0) return;
    const lifetime = Math.max(550, 1200 - (30 - time) * 22); // bugs get faster
    spawnCritter(Math.random() < 0.18, lifetime, hit);
    setTimeout(spawnLoop, Math.max(320, 700 - (30 - time) * 12));
  };
  spawnLoop();

  const clock = setInterval(() => {
    time--;
    bug.timeEl.textContent = time;
    if (time > 0) return;
    clearInterval(clock);
    bug.arena.querySelectorAll(".critter").forEach((c) => c.remove());
    const isBest = score > getBest("best-bugs");
    saveBest("best-bugs", score);
    bug.bestEl.textContent = getBest("best-bugs");
    bug.msg.textContent = isBest ? `🎉 New best! ${score} bugs fixed.` : `Shift over: ${score} bugs fixed.`;
    bug.msg.style.display = "";
    bug.startBtn.textContent = "Play again";
    bug.startBtn.disabled = false;
  }, 1000);
});

// ---------- Prompt Sprint ----------
const WORDS = [
  "agent", "embedding", "retrieval", "fastapi", "langchain", "vector", "prompt", "token",
  "context", "tool_call", "rerank", "chunking", "latency", "pydantic", "schema", "faiss",
  "ollama", "inference", "grounded", "citation", "pipeline", "evals", "orchestrate", "memory",
  "planner", "guardrail", "streaming", "endpoint", "async", "docker", "postgres", "react",
  "mcp", "workflow", "trace", "judge", "dataset", "finetune", "cosine", "semantic",
];
const typer = {
  word: document.getElementById("type-word"),
  input: document.getElementById("type-input"),
  scoreEl: document.getElementById("type-score"),
  timeEl: document.getElementById("type-time"),
  bestEl: document.getElementById("type-best"),
  startBtn: document.getElementById("type-start"),
  current: "",
  score: 0,
  running: false,
};
typer.bestEl.textContent = getBest("best-words");

function nextWord() {
  let w;
  do { w = WORDS[Math.floor(Math.random() * WORDS.length)]; } while (w === typer.current);
  typer.current = w;
  renderWord("");
}
function renderWord(typed) {
  const w = typer.current;
  let ok = 0;
  while (ok < typed.length && typed[ok] === w[ok]) ok++;
  const bad = typed.length > ok;
  typer.word.innerHTML =
    `<span class="done">${w.slice(0, ok)}</span>` +
    (bad ? `<span class="bad">${w.slice(ok, typed.length) || "·"}</span>${w.slice(typed.length)}` : w.slice(ok));
}

typer.input.addEventListener("input", () => {
  if (!typer.running) return;
  const v = typer.input.value;
  if (/[\s]$/.test(v)) {
    if (v.trim() === typer.current) {
      typer.score++;
      typer.scoreEl.textContent = typer.score;
    }
    typer.input.value = "";
    nextWord();
  } else {
    renderWord(v);
  }
});
typer.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    typer.input.value += " ";
    typer.input.dispatchEvent(new Event("input"));
  }
});

typer.startBtn.addEventListener("click", () => {
  let time = 30;
  typer.score = 0;
  typer.running = true;
  typer.scoreEl.textContent = 0;
  typer.timeEl.textContent = time;
  typer.startBtn.disabled = true;
  typer.input.disabled = false;
  typer.input.value = "";
  typer.input.focus();
  nextWord();

  const clock = setInterval(() => {
    time--;
    typer.timeEl.textContent = time;
    if (time > 0) return;
    clearInterval(clock);
    typer.running = false;
    typer.input.disabled = true;
    const isBest = typer.score > getBest("best-words");
    saveBest("best-words", typer.score);
    typer.bestEl.textContent = getBest("best-words");
    typer.word.textContent = isBest ? `🎉 new best: ${typer.score * 2} wpm` : `${typer.score * 2} wpm`;
    typer.startBtn.textContent = "Sprint again";
    typer.startBtn.disabled = false;
  }, 1000);
});

// ---------- agent wisdom cards ----------
const WISDOM = [
  ["Retrieval", "If the answer isn't in the retrieved chunks, the model will happily invent one. Fix retrieval before you touch the prompt."],
  ["Citations", "An answer with a source is a claim you can check. An answer without one is a vibe."],
  ["Tools", "Give an agent fewer, sharper tools. Ten vague tools make worse decisions than three clear ones."],
  ["Evals", "If you can't measure it, every prompt change is just a guess with extra steps."],
  ["Humans", "In high-stakes domains, label AI output as a suggestion. Let people make the final call."],
  ["Schemas", "Make the model fill in a schema. Free text is for humans, structured output is for systems."],
  ["Traces", "Log every tool call. Future you, debugging at 2am, will be grateful."],
  ["Local LLMs", "A small local model with good retrieval often beats a giant model guessing from memory."],
  ["Chunking", "Chunk size is a product decision: too small loses context, too big buries the answer."],
];
const deck = document.getElementById("wisdom-deck");
WISDOM.sort(() => Math.random() - 0.5).slice(0, 6).forEach(([topic, text], i) => {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "wisdom";
  card.setAttribute("aria-label", `Flip card: ${topic}`);
  card.innerHTML = `
    <div class="wisdom-inner">
      <div class="wisdom-face wisdom-front"><small>card ${String(i + 1).padStart(2, "0")}</small>${topic}<small>tap to flip ↻</small></div>
      <div class="wisdom-face wisdom-back"><small>${topic.toLowerCase()}</small><p>${text}</p></div>
    </div>`;
  card.addEventListener("click", () => card.classList.toggle("flipped"));
  deck.appendChild(card);
});
