

// ---------- API ENDPOINTS ----------
const API = {
  categories: "https://www.themealdb.com/api/json/v1/1/categories.php",
  filterByCategory: (c) =>
    `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(c)}`,
  lookupById: (id) =>
    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`,
  searchByName: (name) =>
    `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`,
};

// ---------- Drawer ----------
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
    
    // 🔹 store globally so CategoryController can use descriptions
    window._allCategories = cats;

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
    // optional: fail silently
  }
}


// ---------- Shared hero (search + text) ----------
function ViewHero() {
  return `
    <section class="search">
      <div class="search-bar">
        <input id="searchInput" type="text" placeholder="Search recipes here ..." />
        <button id="searchBtn" type="button" aria-label="Search">
          <i class="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>
      <p id="search-text1">What are your favorite cuisines?</p>
      <p id="search-text2">PERSONALIZE YOUR EXPERIENCE</p>
    </section>
  `;
}

// ---------- Views ----------
function ViewHome() {
  return `
    ${ViewHero()}

    <!-- MEAL SEARCH RESULTS -->
    <section id="resultsWrap" class="mf-results" style="display:none;">
      <div class="categories-header">
        <h1>MEALS</h1>
      </div>
      <div class="border"></div>

      <p id="resultsLoading" class="status" style="margin-top:0;">Loading meals…</p>
      <p id="resultsError" class="status error" hidden>No meals found. Try another name.</p>

      <div id="resultsGrid" class="mf-meal-grid"></div>
    </section>

    <!-- CATEGORIES -->
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
  `;
}

function ViewCategory(category) {
  return `
    ${ViewHero()}

    <section class="categories" style="padding-top:8px;">
      <div class="categories-header">
        <h1 id="catTitle">${category ? category : "Category"}</h1>
      </div>
      <div class="border"></div>

      <!-- Category description card -->
      <div class="category-desc" id="catDescWrap" hidden>
        <p id="catDesc"></p>
      </div>

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
    ${ViewHero()}

    <div class="bainganbhartapage">
      <a href="#/"><i class="fa-solid fa-house fa-lg"></i></a>
      <span id="breadcrumbText">> M E A L</span>
    </div>

    <div class="details-header">
      <h1>M E A L D E T A I L S</h1>
    </div>
    <div class="border-baingan"></div>

    <div class="details-table">
      <p id="mealLoading" class="status">Loading meal…</p>
      <p id="mealError" class="status error" hidden>Couldn’t load this meal.</p>

      <div class="details-main" id="details" hidden>
        <div class="bainganbhartaimg">
          <img id="mealThumb" src="" alt="">
        </div>

        <div class="baingan-ingredients">
          <h4 id="mealTitle">Meal</h4>

          <p>
            <strong>CATEGORY:</strong>
            <span id="mealCategory"></span>
          </p>

          <p id="sourceLine">
            <strong>Source:</strong>
            <a id="sourceLink" href="#" target="_blank" rel="noopener"></a>
          </p>

          <p id="tags">
            <strong>Tags:</strong>
            <span id="tagsWrap"></span>
          </p>

          <div class="ingredients">
            <h1>Ingredients</h1>
            <ul id="ingredientsList"></ul>
          </div>
        </div>
      </div>

      <div class="measure" id="measureBlock" hidden>
        <div class="measure-header">
          <p>Measure:</p>
        </div>
        <div class="measures-items">
          <ul id="measureList"></ul>
        </div>
      </div>

      <div class="instructions" id="instructionsBlock" hidden>
        <div class="instructions-header">
          <h1>Instructions</h1>
        </div>
        <div class="instructions-list">
          <ul id="instructionsList"></ul>
        </div>
      </div>
    </div>
  `;
}

// ---------- Shared search initialiser  ----------
function initSearchBar(initialQuery = "") {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");
  if (!input || !btn) return;

  if (initialQuery) input.value = initialQuery;

  function submit() {
    const raw = (input.value || "").trim();
    if (!raw) return;

    // If only digits → treat as meal ID
    if (/^\d+$/.test(raw)) {
      location.hash = `#/meal/${raw}`;
      return;
    }

    
    location.hash = `#/search/${encodeURIComponent(raw)}`;
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
  btn.addEventListener("click", submit);
}

// ---------- Controllers ----------

// Home: categories search results
async function HomeController(initialQuery = "") {
  const el = {
    cards: document.getElementById("cards"),
    loading: document.getElementById("loading"),
    error: document.getElementById("error"),
    resultsWrap: document.getElementById("resultsWrap"),
    resultsGrid: document.getElementById("resultsGrid"),
    resultsLoading: document.getElementById("resultsLoading"),
    resultsError: document.getElementById("resultsError"),
  };

  let categories = [];

  initSearchBar(initialQuery);

  function buildCategoryCard(cat) {
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
    list.forEach((c) => el.cards.appendChild(buildCategoryCard(c)));
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

  function hideResults() {
    if (!el.resultsWrap) return;
    el.resultsWrap.style.display = "none";
    el.resultsGrid.innerHTML = "";
    el.resultsError.hidden = true;
    el.resultsLoading.hidden = true;
  }

  async function searchMealsByName(query) {
    const q = query.trim();
    if (!q) {
      hideResults();
      return;
    }

    el.resultsWrap.style.display = "";
    el.resultsGrid.innerHTML = "";
    el.resultsError.hidden = true;
    el.resultsLoading.hidden = false;

    try {
      const res = await fetch(API.searchByName(q));
      if (!res.ok) throw new Error("net");
      const data = await res.json();
      const meals = Array.isArray(data?.meals) ? data.meals : null;

      el.resultsLoading.hidden = true;

      if (!meals || meals.length === 0) {
        el.resultsError.hidden = false;
        return;
      }

      meals.forEach((m) => {
        const card = document.createElement("div");
        card.className = "mf-meal-card";
        card.innerHTML = `
          <img class="mf-meal-thumb" src="${m.strMealThumb}" alt="${m.strMeal}">
          <div class="mf-meal-name">${m.strMeal}</div>
        `;
        card.addEventListener("click", () => {
          location.hash = `#/meal/${m.idMeal}`;
        });
        el.resultsGrid.appendChild(card);
      });
    } catch {
      el.resultsLoading.hidden = true;
      el.resultsError.hidden = false;
    }
  }

  await loadCategories();

  if (initialQuery) {
    await searchMealsByName(initialQuery);
  } else {
    hideResults();
  }
}

// Category: list meals in that category
async function CategoryController(category) {
  initSearchBar(); 

  const el = {
    catTitle: document.getElementById("catTitle"),
    mealsGrid: document.getElementById("mealsGrid"),
    catLoading: document.getElementById("catLoading"),
    catError: document.getElementById("catError"),
    catDescWrap: document.getElementById("catDescWrap"),
    catDesc: document.getElementById("catDesc"),
  };

  function setCategoryDescription(name) {
    if (!el.catDescWrap || !el.catDesc || !name) return;

    const cats = window._allCategories || [];
    const match = cats.find(
      (c) => (c.strCategory || "").toLowerCase() === name.toLowerCase()
    );

    if (match && match.strCategoryDescription) {
      el.catDesc.textContent = match.strCategoryDescription.trim();
      el.catDescWrap.hidden = false;
    } else {
      el.catDescWrap.hidden = true;
    }
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

  async function loadMeals() {
    el.catTitle.textContent = category || "Category";

    // 🔹 show description under title
    setCategoryDescription(category);

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


// Meal: Baingan-style layout filled from API
async function MealController(id) {
  initSearchBar(); // hero search active on meal page

  const el = {
    breadcrumbText: document.getElementById("breadcrumbText"),
    mealTitle: document.getElementById("mealTitle"),
    mealThumb: document.getElementById("mealThumb"),
    mealCategory: document.getElementById("mealCategory"),
    sourceLine: document.getElementById("sourceLine"),
    sourceLink: document.getElementById("sourceLink"),
    tagsWrap: document.getElementById("tagsWrap"),
    ingredientsList: document.getElementById("ingredientsList"),
    measureList: document.getElementById("measureList"),
    instructionsList: document.getElementById("instructionsList"),
    details: document.getElementById("details"),
    measureBlock: document.getElementById("measureBlock"),
    instructionsBlock: document.getElementById("instructionsBlock"),
    mealLoading: document.getElementById("mealLoading"),
    mealError: document.getElementById("mealError"),
  };

  function setBreadcrumb(name) {
    if (!el.breadcrumbText) return;
    el.breadcrumbText.textContent = `> ${name || "Meal"}`;
  }

  function renderIngredientsAndMeasures(meal) {
    if (!el.ingredientsList || !el.measureList) return;

    el.ingredientsList.innerHTML = "";
    el.measureList.innerHTML = "";

    let idx = 1;
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const meas = meal[`strMeasure${i}`];
      if (ing && ing.trim()) {
        const liIng = document.createElement("li");
        liIng.innerHTML = `<span>${idx}</span> ${ing}`;
        el.ingredientsList.appendChild(liIng);

        const liMeas = document.createElement("li");
        liMeas.innerHTML = `<i class="fa-solid fa-spoon"></i> ${meas ? meas.trim() : ""}`;
        el.measureList.appendChild(liMeas);

        idx++;
      }
    }
  }

  function renderTags(tagsStr) {
    if (!el.tagsWrap) return;
    el.tagsWrap.innerHTML = "";

    if (!tagsStr) {
      el.tagsWrap.textContent = "None";
      return;
    }

    tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => {
        const btn = document.createElement("button");
        btn.textContent = t;
        el.tagsWrap.appendChild(btn);
      });
  }

  function renderMeta(meal) {
    if (el.mealCategory) {
      const cat = (meal.strCategory || "").toUpperCase();
      el.mealCategory.textContent = cat;
    }

    if (el.sourceLine && el.sourceLink) {
      if (meal.strSource) {
        el.sourceLink.href = meal.strSource;
        el.sourceLink.textContent = meal.strSource;
        el.sourceLine.style.display = "block";
      } else {
        el.sourceLine.style.display = "none";
      }
    }
  }

  function renderInstructions(text) {
    if (!el.instructionsList) return;
    el.instructionsList.innerHTML = "";
    if (!text) return;

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    lines.forEach((line, index) => {
      const li = document.createElement("li");
      li.innerHTML = `<i class="fa-regular fa-square-check"></i>${index + 1}. ${line}`;
      el.instructionsList.appendChild(li);
    });
  }

  async function loadMeal() {
    if (el.mealLoading) el.mealLoading.hidden = false;
    if (el.mealError) el.mealError.hidden = true;
    if (el.details) el.details.hidden = true;
    if (el.measureBlock) el.measureBlock.hidden = true;
    if (el.instructionsBlock) el.instructionsBlock.hidden = true;

    try {
      const res = await fetch(API.lookupById(id));
      if (!res.ok) throw new Error("net");
      const data = await res.json();
      const meal = Array.isArray(data?.meals) ? data.meals[0] : null;
      if (!meal) {
        if (el.mealError) el.mealError.hidden = false;
        return;
      }

      if (el.mealThumb) {
        el.mealThumb.src = meal.strMealThumb || "";
        el.mealThumb.alt = meal.strMeal || "Meal image";
      }

      if (el.mealTitle) el.mealTitle.textContent = meal.strMeal || "Meal";
      setBreadcrumb(meal.strMeal);

      renderMeta(meal);
      renderTags(meal.strTags);
      renderIngredientsAndMeasures(meal);
      renderInstructions(meal.strInstructions);

      if (el.details) el.details.hidden = false;
      if (el.measureBlock) el.measureBlock.hidden = false;
      if (el.instructionsBlock) el.instructionsBlock.hidden = false;
    } catch {
      if (el.mealError) el.mealError.hidden = false;
    } finally {
      if (el.mealLoading) el.mealLoading.hidden = true;
    }
  }

  await loadMeal();
}

// ---------- Router ----------
function parseRoute() {
  const hash = location.hash.replace(/^#/, "");
  const [, route, param] = hash.split("/");

  if (!route) return { view: "home", param: "" };

  if (route.toLowerCase() === "search") {
    return { view: "home", param: decodeURIComponent(param || "") };
  }
  if (route.toLowerCase() === "category") {
    return { view: "category", param: decodeURIComponent(param || "") };
  }
  if (route.toLowerCase() === "meal") {
    return { view: "meal", param: decodeURIComponent(param || "") };
  }

  return { view: "home", param: "" };
}

async function render() {

  window._drawerInited || (initDrawer(), (window._drawerInited = true));
  window._drawerCatsLoaded || (await loadDrawerCategories(), (window._drawerCatsLoaded = true));

  const { view, param } = parseRoute();
  const app = document.getElementById("app");
  if (!app) return;

  if (view === "home") {
    app.innerHTML = ViewHome();
    await HomeController(param); 
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
