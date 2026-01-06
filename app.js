const API_BASE = "http://127.0.0.1:5000";

const grid = document.getElementById("grid");
const errorBox = document.getElementById("error");
const emptyBox = document.getElementById("empty");
const searchInput = document.getElementById("search");
const apiStatus = document.getElementById("apiStatus");

let allRecipes = [];

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

  const tags = [cuisine, diet].filter(Boolean).map(t => `<span class="tag">${t}</span>`).join("");

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

function applySearch() {
  const q = (searchInput.value || "").toLowerCase().trim();
  if (!q) return render(allRecipes);

  const filtered = allRecipes.filter(r => {
    const t = (r.title || "").toLowerCase();
    const d = (r.description || "").toLowerCase();
    return t.includes(q) || d.includes(q);
  });

  render(filtered);
}

async function loadRecipes() {
  clearError();
  grid.innerHTML = `<div class="skeleton">Recepten laden…</div>`;

  try {
    const res = await fetch(`${API_BASE}/recipes`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    setApiStatus(true);

    allRecipes = await res.json();
    render(allRecipes);

  } catch (err) {
    setApiStatus(false);
    grid.innerHTML = "";
    showError(`Kon recepten niet laden. Controleer of je backend draait op ${API_BASE}. (${err.message})`);
  }
}

searchInput.addEventListener("input", applySearch);

loadRecipes();
