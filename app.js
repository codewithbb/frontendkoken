const API_BASE = "http://127.0.0.1:5000";

const grid = document.getElementById("grid");
const errorBox = document.getElementById("error");
const emptyBox = document.getElementById("empty");
const apiStatus = document.getElementById("apiStatus");

const searchInput = document.getElementById("search");
const cuisineSel = document.getElementById("cuisine");
const dietSel = document.getElementById("diet");
const difficultySel = document.getElementById("difficulty");
const tagSel = document.getElementById("tag");
const clearBtn = document.getElementById("clear");

function setApiStatus(ok) {
  apiStatus.textContent = ok ? "API: verbonden" : "API: niet bereikbaar";
  apiStatus.classList.toggle("pill-ok", ok);
  apiStatus.classList.toggle("pill-bad", !ok);
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}
function clearError() {
  errorBox.classList.add("hidden");
  errorBox.textContent = "";
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
}

function recipeCard(r) {
  const title = escapeHtml(r.title ?? "");
  const desc = escapeHtml(r.description ?? "");
  const cuisine = r.cuisine ? escapeHtml(r.cuisine) : "";
  const diet = r.diet ? escapeHtml(r.diet) : "";
  const diff = r.difficulty ? `★ ${r.difficulty}/5` : "";

  const metaParts = [
    r.servings ? `Voor ${r.servings}` : null,
    (r.prep_time_minutes != null) ? `Prep ${r.prep_time_minutes}m` : null,
    (r.cook_time_minutes != null) ? `Kook ${r.cook_time_minutes}m` : null,
    diff || null
  ].filter(Boolean);

  const tags = [cuisine, diet].filter(Boolean)
    .map(t => `<span class="tag">${t}</span>`).join("");

  return `
    <a class="card" href="recipe.html?id=${encodeURIComponent(r.id)}">
      <div class="card-top">
        <h2 class="card-title">${title}</h2>
        ${tags ? `<div class="tagrow">${tags}</div>` : ""}
      </div>
      <p class="card-desc">${desc}</p>
      <div class="card-meta">${metaParts.join(" • ")}</div>
    </a>
  `;
}

function render(recipes) {
  grid.innerHTML = recipes.map(recipeCard).join("");
  emptyBox.classList.toggle("hidden", recipes.length !== 0);
}

function buildQueryParams() {
  const params = new URLSearchParams();

  const q = searchInput.value.trim();
  if (q) params.set("q", q);

  if (cuisineSel.value) params.set("cuisine", cuisineSel.value);
  if (dietSel.value) params.set("diet", dietSel.value);
  if (difficultySel.value) params.set("difficulty", difficultySel.value);
  if (tagSel.value) params.set("tag", tagSel.value);

  return params.toString();
}

let debounceTimer = null;
function scheduleLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadRecipes, 250);
}

async function loadFilters() {
  try {
    const res = await fetch(`${API_BASE}/filters`);
    if (!res.ok) throw new Error(`filters: ${res.status}`);
    const data = await res.json();

    // vul cuisine
    data.cuisines.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      cuisineSel.appendChild(opt);
    });

    // vul diet
    data.diets.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      dietSel.appendChild(opt);
    });

    // vul tags
    data.tags.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      tagSel.appendChild(opt);
    });
  } catch (err) {
    // niet fatal; filters kunnen leeg blijven
    console.warn("Kon filters niet laden:", err.message);
  }
}

async function loadRecipes() {
  clearError();
  grid.innerHTML = `<div class="skeleton">Recepten laden…</div>`;

  const qs = buildQueryParams();
  const url = qs ? `${API_BASE}/recipes?${qs}` : `${API_BASE}/recipes`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    setApiStatus(true);

    const recipes = await res.json();
    render(recipes);
  } catch (err) {
    setApiStatus(false);
    grid.innerHTML = "";
    showError(`Kon recepten niet laden. Backend: ${API_BASE}. (${err.message})`);
  }
}

// events
searchInput.addEventListener("input", scheduleLoad);
[cuisineSel, dietSel, difficultySel, tagSel].forEach(sel => sel.addEventListener("change", loadRecipes));

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  cuisineSel.value = "";
  dietSel.value = "";
  difficultySel.value = "";
  tagSel.value = "";
  loadRecipes();
});

// init
loadFilters().then(loadRecipes);
