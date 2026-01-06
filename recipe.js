const API_BASE = "http://127.0.0.1:5000";

const titleEl = document.getElementById("title");
const descEl = document.getElementById("description");
const metaEl = document.getElementById("meta");
const ingEl = document.getElementById("ingredients");
const stepsEl = document.getElementById("steps");
const errorBox = document.getElementById("error");
const voiceSummaryEl = document.getElementById("voiceSummary");
const voicePanel = document.getElementById("voicePanel");

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
}

function getIdFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function renderMeta(r) {
  const parts = [
    r.cuisine ? r.cuisine : null,
    r.diet ? r.diet : null,
    r.servings ? `Voor ${r.servings}` : null,
    (r.prep_time_minutes != null) ? `Prep ${r.prep_time_minutes}m` : null,
    (r.cook_time_minutes != null) ? `Kook ${r.cook_time_minutes}m` : null,
    r.difficulty ? `★ ${r.difficulty}/5` : null
  ].filter(Boolean);

  metaEl.textContent = parts.join(" • ");
}

function renderIngredients(ingredients) {
  ingEl.innerHTML = "";
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    ingEl.innerHTML = `<li class="muted">Geen ingrediënten gevonden.</li>`;
    return;
  }

  // jouw API kan ingredients als objects (line/sort_order) geven
  ingredients.forEach(i => {
    const text = (typeof i === "string") ? i : (i.line ?? "");
    const li = document.createElement("li");
    li.textContent = text;
    ingEl.appendChild(li);
  });
}

function renderSteps(steps) {
  stepsEl.innerHTML = "";
  if (!Array.isArray(steps) || steps.length === 0) {
    stepsEl.innerHTML = `<li class="muted">Geen stappen gevonden.</li>`;
    return;
  }

  steps.forEach(s => {
    const instruction = (typeof s === "string") ? s : (s.instruction ?? "");
    const skill = (typeof s === "object" && s.skill_level) ? `Skill ${s.skill_level}/5` : "";
    const tech = (typeof s === "object" && s.technique) ? s.technique : "";

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="step-line">${escapeHtml(instruction)}</div>
      ${(skill || tech) ? `<div class="step-meta">${escapeHtml([tech, skill].filter(Boolean).join(" • "))}</div>` : ""}
    `;
    stepsEl.appendChild(li);
  });
}

async function loadRecipe() {
  const id = getIdFromUrl();
  if (!id) {
    showError("Geen recept-id gevonden in de URL.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/recipes/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("Recept niet gevonden.");
      throw new Error(`API error: ${res.status}`);
    }
    const r = await res.json();

    titleEl.textContent = r.title ?? "Recept";
    descEl.textContent = r.description ?? "";
    renderMeta(r);

    if (r.voice_summary) {
      voiceSummaryEl.textContent = r.voice_summary;
      voicePanel.classList.remove("hidden");
    } else {
      voicePanel.classList.add("hidden");
    }

    renderIngredients(r.ingredients);
    renderSteps(r.steps);

    document.title = `${r.title ?? "Recept"} | Details`;
  } catch (err) {
    showError(`Kon recept niet laden. (${err.message})`);
  }
}

loadRecipe();
