const API_BASE = "http://127.0.0.1:5000";

const form = document.getElementById("form");
const msg = document.getElementById("msg");

function show(text, ok=false){
  msg.textContent = text;
  msg.classList.remove("hidden");
  msg.classList.toggle("alert-error", !ok);
}

function getIdFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function linesToList(text) {
  return (text || "")
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);
}

async function loadRecipeIntoForm(recipeId) {
  const res = await fetch(`${API_BASE}/recipes/${encodeURIComponent(recipeId)}`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Kon recept niet laden");

  const r = await res.json();

  form.title.value = r.title ?? "";
  form.description.value = r.description ?? "";
  form.servings.value = r.servings ?? 1;
  form.prep_time_minutes.value = r.prep_time_minutes ?? 0;
  form.cook_time_minutes.value = r.cook_time_minutes ?? 0;
  form.cuisine.value = r.cuisine ?? "";
  form.diet.value = r.diet ?? "";
  form.difficulty.value = r.difficulty ?? "";
  form.voice_summary.value = r.voice_summary ?? "";
  form.image_url.value = r.image_url ?? "";
  form.is_public.checked = !!r.is_public;

  const ingLines = (r.ingredients || []).map(i => typeof i === "string" ? i : i.line);
  form.ingredients.value = ingLines.join("\n");

  const stepLines = (r.steps || []).map(s => typeof s === "string" ? s : s.instruction);
  form.steps.value = stepLines.join("\n");

  // ✅ tags vullen
  form.tags.value = Array.isArray(r.tags) ? r.tags.join(", ") : "";
}

async function updateRecipe(recipeId, payload) {
  const res = await fetch(`${API_BASE}/recipes/${encodeURIComponent(recipeId)}`, {
    method: "PUT",
    headers: {"Content-Type":"application/json"},
    credentials: "include",
    body: JSON.stringify(payload)
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Opslaan mislukt");
  return body;
}

const recipeId = getIdFromUrl();
if (!recipeId) show("Geen recept-id in URL", false);
else loadRecipeIntoForm(recipeId).catch(e => show(e.message, false));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.classList.add("hidden");

  const fd = new FormData(form);
  const payload = {
    title: fd.get("title"),
    description: fd.get("description"),
    image_url: (fd.get("image_url") || "").trim() || null,
    servings: Number(fd.get("servings") || 1),
    prep_time_minutes: Number(fd.get("prep_time_minutes") || 0),
    cook_time_minutes: Number(fd.get("cook_time_minutes") || 0),
    cuisine: (fd.get("cuisine") || "").trim() || null,
    diet: (fd.get("diet") || "").trim() || null,
    difficulty: (fd.get("difficulty") || "").toString() || null,
    is_public: fd.get("is_public") === "on",
    voice_summary: (fd.get("voice_summary") || "").trim() || null,
    ingredients: linesToList(fd.get("ingredients")),
    steps: linesToList(fd.get("steps")).map((instruction, idx) => ({
      step_number: idx + 1,
      instruction,
      skill_level: null,
      technique: null,
      can_be_spoken: true
    })),
    tags: (fd.get("tags") || "")
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
  };

  try {
    await updateRecipe(recipeId, payload);
    show("Opgeslagen! Terug naar recept…", true);
    setTimeout(() => window.location.href = `recipe.html?id=${recipeId}`, 600);
  } catch (err) {
    show(err.message || "Opslaan mislukt", false);
  }
});
