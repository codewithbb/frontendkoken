const API_BASE = "http://127.0.0.1:5000";

const grid = document.getElementById("grid");
const errorBox = document.getElementById("error");
const emptyBox = document.getElementById("empty");

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
  const cuisine = r.cuisine ? `<span class="tag">${escapeHtml(r.cuisine)}</span>` : "";
  const diet = r.diet ? `<span class="tag">${escapeHtml(r.diet)}</span>` : "";
  const visibility = r.is_public ? `<span class="tag">Publiek</span>` : `<span class="tag">Privé</span>`;

  const metaParts = [
    r.servings ? `Voor ${r.servings}` : null,
    (r.prep_time_minutes != null) ? `Prep ${r.prep_time_minutes}m` : null,
    (r.cook_time_minutes != null) ? `Kook ${r.cook_time_minutes}m` : null,
    r.difficulty ? `★ ${r.difficulty}/5` : null
  ].filter(Boolean);

  return `
    <div class="card">
      <div class="card-top">
        <h2 class="card-title">${title}</h2>
        <div class="tagrow">${visibility}${cuisine}${diet}</div>
      </div>
      <p class="card-desc">${desc}</p>
      <div class="card-meta">${metaParts.join(" • ")}</div>

      <div class="owner-actions">
        <a class="btn" href="recipe.html?id=${encodeURIComponent(r.id)}">Open</a>
        <a class="btn" href="edit-recipe.html?id=${encodeURIComponent(r.id)}">Bewerk</a>
        <button class="btn danger" data-id="${escapeHtml(r.id)}" type="button">Verwijder</button>
      </div>
    </div>
  `;
}

async function deleteRecipe(recipeId) {
  const res = await fetch(`${API_BASE}/recipes/${encodeURIComponent(recipeId)}`, {
    method: "DELETE",
    credentials: "include"
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Verwijderen mislukt");
}

async function loadMyRecipes() {
  clearError();
  grid.innerHTML = `<div class="skeleton">Mijn recepten laden…</div>`;

  try {
    const res = await fetch(`${API_BASE}/my/recipes`, { credentials: "include" });
    if (!res.ok) {
      if (res.status === 401) throw new Error("Je bent niet ingelogd. Log in om je recepten te zien.");
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    grid.innerHTML = data.map(recipeCard).join("");
    emptyBox.classList.toggle("hidden", data.length !== 0);

    // delete buttons
    grid.querySelectorAll("button[data-id]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (!confirm("Weet je zeker dat je dit recept wilt verwijderen?")) return;

        try {
          await deleteRecipe(id);
          await loadMyRecipes();
        } catch (e) {
          alert(e.message || "Verwijderen mislukt");
        }
      });
    });

  } catch (err) {
    grid.innerHTML = "";
    showError(err.message || "Kon mijn recepten niet laden");
  }
}

loadMyRecipes();
