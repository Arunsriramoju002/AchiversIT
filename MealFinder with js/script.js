// app.js — Single Page App with hash routing (with live meals preview on Home search)

const API = {
  categories: "https://www.themealdb.com/api/json/v1/1/categories.php",
  filterByCategory: (c) =>
    `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(c)}`,
  lookupById: (id) =>
    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`,
};

// ---------- Drawer (shared) ----------
function initDrawer() {
  const ham = document.querySelector(".nav-ham");
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawerOverlay");
  const closeBtn = document.getElementById("drawerClose");

  function open() {
    drawer.classList.add("open");
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function close() {
    drawer.classList.remove("open");
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  ham?.addEventListener("click", open);
  overlay?.addEventListener("click", close);
  closeBtn?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => e.key === "Escape" && close());

  return { open, close };
}

async function loadDrawerCategories() {
  const list = document.getElementById("drawerList");
  if (!list) return;
  try {
    const res = await fetch(API.categories);
    const data = await res.json();
    const cats = Array.isArray(data?.categories) ? data.categories : [];
    list.innerHTML = "";
    cats.forEach((cat) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <a href="#/category/${encodeURIComponent(cat.strCategory)}">
          <img src="${cat.strCategoryThumb}" alt="${cat.strCategory}"/>
          <span>${cat.strCategory}</span>
        </a>`;
      list.appendChild(li);
    });
  } catch {
    // optional
  }
}

// ---------- Views ----------
function ViewHome() {
  // Added Results section under categories to show live meals for best-matched category
  return `
    <section class="search">
      <div class="search-bar">
        <input id="searchInput" type="text" placeholder=" category" />
        <button id="searchBtn" type="button" aria-label="Search">
          <i class="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>
      <p id="search-text2">PERSONALIZE YOUR EXPERIENCE</p>
    </section>

    <section class="categories">
      <div class="categories-header">
        <h1>C A T E G O R I E S</h1>
      </div>
      <div class="border"></div>

      <div class="categories-cards">
        <div class="cards" id="cards"></div>
      </div>

      <p id="loading" class="status">Loading categories…</p>
      <p id="error" class="status error" hidden>Couldn’t load categories. Please try again.</p>
    </section>

    <!-- Live meals preview for best-matched category -->
    <section id="resultsWrap" class="mf-results" style="display:none;">
      <div class="mf-results-head">
        <h2 id="resultsTitle">Meals</h2>
        <button id="resultsViewAll" class="mf-results-close" title="Open full category view">→</button>
      </div>
      <p id="resultsLoading" class="status" style="margin-top:0;">Loading meals…</p>
      <p id="resultsError" class="status error" hidden>Couldn’t load meals for this category.</p>
      <div id="resultsGrid" class="mf-meal-grid"></div>
    </section>
  `;
}

function ViewCategory(category) {
  return `
    <section class="categories" style="padding-top:8px;">
      <div class="categories-header">
        <h1 id="catTitle">${category ? category : "Category"}</h1>
      </div>
      <div class="border"></div>
      <p id="catLoading" class="status">Loading meals…</p>
      <p id="catError" class="status error" hidden>Couldn’t load meals for this category.</p>
    </section>

    <section class="mf-results" style="padding-top:0;">
      <div id="mealsGrid" class="mf-meal-grid"></div>
    </section>
  `;
}

function ViewMeal() {
  return `
    <div class="mf-breadcrumb" id="crumb"></div>

    <section class="mf-meal-hero">
      <div class="categories-header">
        <h1 id="mealTitle">Meal</h1>
      </div>
      <div class="border"></div>
      <p id="mealLoading" class="status">Loading meal…</p>
      <p id="mealError" class="status error" hidden>Couldn’t load this meal.</p>
    </section>

    <div class="mf-meta" id="meta"></div>
    <div class="mf-pills" id="tags"></div>

    <section class="mf-two-col" id="details" hidden>
      <div class="mf-left">
        <img id="thumb" class="mf-cover" src="" alt=""/>
        <div class="mf-section">
          <h3>Ingredients</h3>
          <div class="mf-body">
            <ul id="ingList" class="ingredients-list" style="list-style:none; padding:0; margin:0;"></ul>
          </div>
        </div>
      </div>
      <div class="mf-right">
        <div class="mf-section">
          <h3>Instructions</h3>
          <div class="mf-body" id="instructions"></div>
        </div>
        <div class="mf-section">
          <h3>Extras</h3>
          <div class="mf-body">
            <div id="youtube"></div>
            <div id="sourceWrap" style="margin-top:8px;"></div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ---------- Controllers ----------
async function HomeController() {
  const el = {
    cards: document.getElementById("cards"),
    loading: document.getElementById("loading"),
    error: document.getElementById("error"),
    searchInput: document.getElementById("searchInput"),
    searchBtn: document.getElementById("searchBtn"),
    // results
    resultsWrap: document.getElementById("resultsWrap"),
    resultsTitle: document.getElementById("resultsTitle"),
    resultsGrid: document.getElementById("resultsGrid"),
    resultsLoading: document.getElementById("resultsLoading"),
    resultsError: document.getElementById("resultsError"),
    resultsViewAll: document.getElementById("resultsViewAll"),
  };

  let categories = [];
  let lastMatch = ""; // remember the last matched category for "View all"

  // --- helpers ---
  const debounce = (fn, ms = 300) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  function buildCard(cat) {
    const item = document.createElement("div");
    item.className = "cards-item";
    item.innerHTML = `
      <a href="#/category/${encodeURIComponent(cat.strCategory)}">
        <img src="${cat.strCategoryThumb}" alt="${cat.strCategory}"/>
      </a>
      <span>${(cat.strCategory || "").toUpperCase()}</span>
    `;
    return item;
  }

  function renderCategories(list) {
    el.cards.innerHTML = "";
    if (!list?.length) {
      el.cards.innerHTML = `<p class="status">No categories found.</p>`;
      return;
    }
    list.forEach((c) => el.cards.appendChild(buildCard(c)));
  }

  function mealCard(m) {
    const card = document.createElement("div");
    card.className = "mf-meal-card";
    card.innerHTML = `
      <img class="mf-meal-thumb" src="${m.strMealThumb}" alt="${m.strMeal}">
      <div class="mf-meal-name">${m.strMeal}</div>
    `;
    card.addEventListener("click", () => (location.hash = `#/meal/${m.idMeal}`));
    return card;
  }

  function showResults(show) {
    el.resultsWrap.style.display = show ? "" : "none";
  }

  function resetResults() {
    el.resultsGrid.innerHTML = "";
    el.resultsError.hidden = true;
    el.resultsLoading.hidden = true;
  }

  function bestCategoryMatch(q) {
    if (!q) return null;
    const lc = q.toLowerCase().trim();
    // exact (case-insensitive)
    let found = categories.find(c => (c.strCategory || "").toLowerCase() === lc);
    if (found) return found.strCategory;

    // "veg" convenience → Vegetarian
    if (lc === "veg" || lc === "veget" || lc === "veggie") {
      found = categories.find(c => /^vegetarian$/i.test(c.strCategory));
      if (found) return found.strCategory;
    }

    // prefix match
    found = categories.find(c => (c.strCategory || "").toLowerCase().startsWith(lc));
    if (found) return found.strCategory;

    // substring match
    found = categories.find(c => (c.strCategory || "").toLowerCase().includes(lc));
    return found ? found.strCategory : null;
  }

  async function renderMealsPreview(categoryName) {
    resetResults();
    if (!categoryName) {
      showResults(false);
      return;
    }
    lastMatch = categoryName;
    el.resultsTitle.textContent = `Meals in ${categoryName}`;
    showResults(true);
    el.resultsLoading.hidden = false;

    try {
      const res = await fetch(API.filterByCategory(categoryName));
      if (!res.ok) throw new Error("net");
      const data = await res.json();
      const meals = Array.isArray(data?.meals) ? data.meals : null;
      el.resultsLoading.hidden = true;
      if (!meals || meals.length === 0) {
        el.resultsError.hidden = false;
        return;
      }
      // Render up to 12 preview meals
      el.resultsGrid.innerHTML = "";
      meals.slice(0, 12).forEach((m) => el.resultsGrid.appendChild(mealCard(m)));
    } catch {
      el.resultsLoading.hidden = true;
      el.resultsError.hidden = false;
    }
  }

  async function loadCategories() {
    el.loading.hidden = false;
    el.error.hidden = true;
    try {
      const res = await fetch(API.categories);
      if (!res.ok) throw new Error("net");
      const data = await res.json();
      categories = Array.isArray(data?.categories) ? data.categories : [];
      renderCategories(categories);
    } catch {
      el.error.hidden = false;
    } finally {
      el.loading.hidden = true;
    }
  }

  // --- Searching behaviour on Home ---
  function normalizeCategoryName(q) {
    return q.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
  }

  // Enter / button → navigate
  function goSearchRoute() {
    const raw = (el.searchInput?.value || "").trim();
    if (!raw) return;

    // digits only → meal by ID
    if (/^\d+$/.test(raw)) {
      location.hash = `#/meal/${raw}`;
      return;
    }

    const match = bestCategoryMatch(raw) || normalizeCategoryName(raw);
    location.hash = `#/category/${encodeURIComponent(match)}`;
  }

  // Live preview → debounce
  const onType = debounce(async () => {
    const q = (el.searchInput?.value || "").trim();
    if (!q) {
      // empty → hide results + show original categories (already visible)
      showResults(false);
      renderCategories(categories);
      return;
    }
    // if digits, hint meal id: show no preview, wait for Enter (or you can auto-route)
    if (/^\d+$/.test(q)) {
      showResults(false);
      return;
    }
    const match = bestCategoryMatch(q);
    await renderMealsPreview(match);
    // also softly filter the visible category cards as user types
    renderCategories(
      categories.filter(c => (c.strCategory || "").toLowerCase().includes(q.toLowerCase()))
    );
  }, 300);

  // Wire events
  el.searchInput?.addEventListener("input", onType);
  el.searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") goSearchRoute(); });
  el.searchBtn?.addEventListener("click", goSearchRoute);
  el.resultsViewAll?.addEventListener("click", () => {
    if (lastMatch) location.hash = `#/category/${encodeURIComponent(lastMatch)}`;
  });

  await loadCategories();
}

async function CategoryController(category) {
  const el = {
    catTitle: document.getElementById("catTitle"),
    mealsGrid: document.getElementById("mealsGrid"),
    catLoading: document.getElementById("catLoading"),
    catError: document.getElementById("catError"),
  };

  function mealCard(m) {
    const card = document.createElement("div");
    card.className = "mf-meal-card";
    card.innerHTML = `
      <img class="mf-meal-thumb" src="${m.strMealThumb}" alt="${m.strMeal}">
      <div class="mf-meal-name">${m.strMeal}</div>
    `;
    card.addEventListener("click", () => (location.hash = `#/meal/${m.idMeal}`));
    return card;
  }

  async function loadMeals() {
    el.catTitle.textContent = category || "Category";
    el.catLoading.hidden = false;
    el.catError.hidden = true;
    el.mealsGrid.innerHTML = "";

    try {
      const res = await fetch(API.filterByCategory(category));
      if (!res.ok) throw new Error("net");
      const data = await res.json();
      const meals = Array.isArray(data?.meals) ? data.meals : null;
      if (!meals) {
        el.catError.hidden = false;
        return;
      }
      meals.forEach((m) => el.mealsGrid.appendChild(mealCard(m)));
    } catch {
      el.catError.hidden = false;
    } finally {
      el.catLoading.hidden = true;
    }
  }

  await loadMeals();
}

async function MealController(id) {
  const el = {
    crumb: document.getElementById("crumb"),
    mealTitle: document.getElementById("mealTitle"),
    mealLoading: document.getElementById("mealLoading"),
    mealError: document.getElementById("mealError"),
    meta: document.getElementById("meta"),
    tags: document.getElementById("tags"),
    details: document.getElementById("details"),
    thumb: document.getElementById("thumb"),
    ingList: document.getElementById("ingList"),
    instructions: document.getElementById("instructions"),
    youtube: document.getElementById("youtube"),
    sourceWrap: document.getElementById("sourceWrap"),
  };

  function setBreadcrumb(name, category) {
    el.crumb.innerHTML = [
      `<a href="#/">Home</a>`,
      category ? `<span>/</span> <a href="#/category/${encodeURIComponent(category)}">${category}</a>` : "",
      `<span>/</span> <span>${name || "Meal"}</span>`,
    ].join(" ");
  }

  function renderIngredients(meal) {
    el.ingList.innerHTML = "";
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const meas = meal[`strMeasure${i}`];
      if (ing && ing.trim()) {
        const li = document.createElement("li");
        li.style.margin = "6px 0";
        li.innerHTML = `<strong>${ing}</strong>${meas ? " — " + meas : ""}`;
        el.ingList.appendChild(li);
      }
    }
  }

  function renderTags(tagsStr) {
    el.tags.innerHTML = "";
    if (!tagsStr) return;
    tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => {
        const pill = document.createElement("span");
        pill.className = "mf-pill";
        pill.textContent = t;
        el.tags.appendChild(pill);
      });
  }

  function renderMeta({ strArea, strCategory }) {
    const bits = [];
    if (strCategory) bits.push(`Category: <a href="#/category/${encodeURIComponent(strCategory)}">${strCategory}</a>`);
    if (strArea) bits.push(`Area: ${strArea}`);
    el.meta.innerHTML = bits.join(" · ");
  }

  function renderExtras({ strYoutube, strSource }) {
    el.youtube.innerHTML = "";
    el.sourceWrap.innerHTML = "";
    if (strYoutube) {
      const a = document.createElement("a");
      a.href = strYoutube;
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "mf-yt";
      a.innerHTML = '<i class="fa-brands fa-youtube"></i> Watch on YouTube';
      el.youtube.appendChild(a);
    }
    if (strSource) {
      const p = document.createElement("p");
      p.innerHTML = `Source: <a class="mf-source" href="${strSource}" target="_blank" rel="noopener">${strSource}</a>`;
      el.sourceWrap.appendChild(p);
    }
  }

  async function loadMeal() {
    el.mealLoading.hidden = false;
    el.mealError.hidden = true;
    el.details.hidden = true;

    try {
      const res = await fetch(API.lookupById(id));
      if (!res.ok) throw new Error("net");
      const data = await res.json();
      const meal = Array.isArray(data?.meals) ? data.meals[0] : null;
      if (!meal) {
        el.mealError.hidden = false;
        return;
      }

      el.mealTitle.textContent = meal.strMeal || "Meal";
      setBreadcrumb(meal.strMeal, meal.strCategory);
      el.thumb.src = meal.strMealThumb || "";
      el.thumb.alt = meal.strMeal || "Meal image";

      renderMeta(meal);
      renderTags(meal.strTags);
      renderIngredients(meal);

      el.instructions.innerHTML = (meal.strInstructions || "")
        .split(/\r?\n\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p style="margin:8px 0; line-height:1.7;">${p}</p>`)
        .join("");

      renderExtras(meal);

      el.details.hidden = false;
    } catch {
      el.mealError.hidden = false;
    } finally {
      el.mealLoading.hidden = true;
    }
  }

  await loadMeal();
}

// ---------- Router ----------
function parseRoute() {
  const hash = location.hash.replace(/^#/, "");
  const [ , route, param ] = hash.split("/");

  if (!route) return { view: "home" };
  if (route.toLowerCase() === "category") return { view: "category", param: decodeURIComponent(param || "") };
  if (route.toLowerCase() === "meal") return { view: "meal", param: decodeURIComponent(param || "") };
  return { view: "home" };
}

async function render() {
  window._drawerInited || (initDrawer(), (window._drawerInited = true));
  window._drawerCatsLoaded || (await loadDrawerCategories(), (window._drawerCatsLoaded = true));

  const { view, param } = parseRoute();
  const app = document.getElementById("app");
  if (!app) return;

  if (view === "home") {
    app.innerHTML = ViewHome();
    await HomeController();
    return;
  }
  if (view === "category") {
    app.innerHTML = ViewCategory(param);
    await CategoryController(param);
    return;
  }
  if (view === "meal") {
    app.innerHTML = ViewMeal();
    await MealController(param);
    return;
  }
  app.innerHTML = ViewHome();
  await HomeController();
}

window.addEventListener("hashchange", render);
document.addEventListener("DOMContentLoaded", render);
