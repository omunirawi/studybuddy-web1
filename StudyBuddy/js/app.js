// app.js
// Main events + SPA navigation + fetch resources

let allResources = [];

// ---------- NAV ----------
function setupNav(){
  const navToggle = document.getElementById("navToggle");
  navToggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });

  document.querySelectorAll(".nav-links a").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = a.dataset.target;
      location.hash = target; // hash navigation
    });
  });

  // listen hash changes
  window.addEventListener("hashchange", () => {
    const id = (location.hash || "#dashboard").replace("#","");
    ui.showSection(id);
  });

  // initial
  const first = (location.hash || "#dashboard").replace("#","");
  ui.showSection(first);
}

// ---------- TASKS ----------
function setupTasks(){
  const form = document.getElementById("taskForm");
  const cancelBtn = document.getElementById("taskCancelBtn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // basic validation
    const title = document.getElementById("tTitle").value.trim();
    const desc = document.getElementById("tDesc").value.trim();
    const dueDate = document.getElementById("tDate").value;
    const priority = document.getElementById("tPriority").value;
    const category = document.getElementById("tCategory").value;

    document.getElementById("errTitle").textContent = "";
    document.getElementById("errDate").textContent = "";

    let ok = true;
    if(!title){
      document.getElementById("errTitle").textContent = "Title is required.";
      ok = false;
    }
    if(!dueDate){
      document.getElementById("errDate").textContent = "Due date is required.";
      ok = false;
    }
    if(!ok) return;

    if(appState.editingTaskId){
      // update existing
      const t = appState.tasks.find(x => x.id === appState.editingTaskId);
      if(t){
        t.title = title;
        t.description = desc;
        t.dueDate = dueDate;
        t.priority = priority;
        t.category = category;
      }
      appState.editingTaskId = null;
      document.getElementById("taskSubmitBtn").textContent = "Add";
      document.getElementById("taskFormTitle").textContent = "Add Task";
      cancelBtn.style.display = "none";
    }else{
      // create new
      appState.tasks.push({
        id: makeId(),
        title,
        description: desc,
        dueDate,
        priority,
        category,
        completed: false
      });
    }

    storage.saveTasks();
    form.reset();
    document.getElementById("tPriority").value = "Medium";
    document.getElementById("tCategory").value = "General";

    ui.renderTasks();
    ui.renderDashboard();
  });

  cancelBtn.addEventListener("click", () => {
    appState.editingTaskId = null;
    document.getElementById("taskSubmitBtn").textContent = "Add";
    document.getElementById("taskFormTitle").textContent = "Add Task";
    cancelBtn.style.display = "none";
    form.reset();
  });

  // controls
  ["filterStatus","filterCategory","sortBy"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => ui.renderTasks());
  });

  // event delegation for task buttons
  document.getElementById("taskList").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if(!btn) return;

    const card = e.target.closest("[data-id]");
    if(!card) return;
    const id = card.dataset.id;
    const action = btn.dataset.action;

    const t = appState.tasks.find(x => x.id === id);
    if(!t) return;

    if(action === "toggle"){
      t.completed = !t.completed;
      storage.saveTasks();
      ui.renderTasks();
      ui.renderDashboard();
    }

    if(action === "edit"){
      appState.editingTaskId = id;
      document.getElementById("taskFormTitle").textContent = "Edit Task";
      document.getElementById("taskSubmitBtn").textContent = "Save";
      cancelBtn.style.display = "inline-block";

      document.getElementById("tTitle").value = t.title;
      document.getElementById("tDesc").value = t.description || "";
      document.getElementById("tDate").value = t.dueDate;
      document.getElementById("tPriority").value = t.priority;
      document.getElementById("tCategory").value = t.category;
    }

    if(action === "delete"){
      if(confirm("Delete this task?")){
        appState.tasks = appState.tasks.filter(x => x.id !== id);
        storage.saveTasks();
        ui.renderTasks();
        ui.renderDashboard();
      }
    }
  });

  // quick add (dashboard)
  document.getElementById("quickAddBtn").addEventListener("click", () => {
    const title = document.getElementById("quickTitle").value.trim();
    const date = document.getElementById("quickDate").value;
    document.getElementById("quickErr").textContent = "";

    if(!title){
      document.getElementById("quickErr").textContent = "Please enter a title.";
      return;
    }
    if(!date){
      document.getElementById("quickErr").textContent = "Please choose a due date.";
      return;
    }

    appState.tasks.push({
      id: makeId(),
      title,
      description: "",
      dueDate: date,
      priority: "Medium",
      category: "General",
      completed: false
    });

    storage.saveTasks();
    document.getElementById("quickTitle").value = "";
    document.getElementById("quickDate").value = "";

    ui.renderTasks();
    ui.renderDashboard();
  });
}

// ---------- HABITS ----------
function setupHabits(){
  const form = document.getElementById("habitForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("hName").value.trim();
    const goal = Number(document.getElementById("hGoal").value);

    document.getElementById("errHabitName").textContent = "";
    document.getElementById("errHabitGoal").textContent = "";

    let ok = true;
    if(!name){
      document.getElementById("errHabitName").textContent = "Habit name is required.";
      ok = false;
    }
    if(!goal || goal < 1 || goal > 7){
      document.getElementById("errHabitGoal").textContent = "Goal must be between 1 and 7.";
      ok = false;
    }
    if(!ok) return;

    appState.habits.push({
      id: makeId(),
      name,
      goal,
      // Sat–Fri progress array
      progress: [false,false,false,false,false,false,false]
    });

    storage.saveHabits();
    form.reset();
    document.getElementById("hGoal").value = "3";
    ui.renderHabits();
    ui.renderDashboard();
  });

  // delegation for habits day toggle + delete
  document.getElementById("habitList").addEventListener("click", (e) => {
    const habitCard = e.target.closest("[data-id]");
    if(!habitCard) return;

    const id = habitCard.dataset.id;
    const habit = appState.habits.find(h => h.id === id);
    if(!habit) return;

    // delete habit
    const delBtn = e.target.closest("button[data-action='deleteHabit']");
    if(delBtn){
      if(confirm("Delete this habit?")){
        appState.habits = appState.habits.filter(h => h.id !== id);
        storage.saveHabits();
        ui.renderHabits();
        ui.renderDashboard();
      }
      return;
    }

    // toggle day
    const day = e.target.closest("[data-day]");
    if(day){
      const i = Number(day.dataset.day);
      habit.progress[i] = !habit.progress[i];
      storage.saveHabits();
      ui.renderHabits();
      ui.renderDashboard();
    }
  });
}

// ---------- RESOURCES ----------
function setupResources(){
  document.getElementById("resSearch").addEventListener("input", () => {
    ui.renderResources(allResources);
  });
  document.getElementById("resCategory").addEventListener("change", () => {
    ui.renderResources(allResources);
  });

  // delegation for favorites
  document.getElementById("resList").addEventListener("click", (e) => {
    const star = e.target.closest("[data-action='fav']");
    if(!star) return;

    const card = e.target.closest("[data-id]");
    if(!card) return;

    const id = Number(card.dataset.id);
    const idx = appState.favorites.indexOf(id);

    if(idx === -1){
      appState.favorites.push(id);
    }else{
      appState.favorites.splice(idx, 1);
    }

    storage.saveFavorites();
    ui.renderResources(allResources);
  });
}

async function loadResources(){
  const state = document.getElementById("resState");
  state.textContent = "Loading...";
  try{
    const res = await fetch("./resources.json");
    if(!res.ok) throw new Error("Failed to load");
    allResources = await res.json();
    state.textContent = "";
    ui.renderResources(allResources);
  }catch(err){
    state.textContent = "Error loading resources. Try Live Server.";
  }
}

// ---------- SETTINGS ----------
function setupSettings(){
  document.getElementById("themeBtn").addEventListener("click", () => {
    appState.settings.theme = appState.settings.theme === "dark" ? "light" : "dark";
    storage.saveTheme();
    ui.applyTheme();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    const ok = storage.resetAll();
    if(ok){
      ui.applyTheme();
      ui.renderTasks();
      ui.renderHabits();
      ui.renderDashboard();
      ui.renderResources(allResources);
    }
  });
}

// ---------- START ----------
function start(){
  storage.load();
  ui.applyTheme();

  setupNav();
  setupTasks();
  setupHabits();
  setupResources();
  setupSettings();

  ui.renderTasks();
  ui.renderHabits();
  ui.renderDashboard();
  loadResources();
}

document.addEventListener("DOMContentLoaded", start);
