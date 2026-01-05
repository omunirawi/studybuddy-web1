// ui.js
// Rendering functions + small helpers

function qs(id){ return document.getElementById(id); }

// Simple date helpers (for dashboard)
function toDateOnly(d){
  // d is "YYYY-MM-DD"
  const parts = d.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function daysBetween(a, b){
  const ms = 24 * 60 * 60 * 1000;
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bb - aa) / ms);
}

function priorityRank(p){
  if(p === "High") return 3;
  if(p === "Medium") return 2;
  return 1;
}

/* ---------- NAV + SECTIONS ---------- */
window.ui = {
  showSection(id){
    document.querySelectorAll("main section").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(id);
    if(target) target.classList.add("active");

    // active link state
    document.querySelectorAll(".nav-links a").forEach(a => {
      a.classList.toggle("active", a.dataset.target === id);
    });

    // close mobile menu after click
    document.body.classList.remove("nav-open");
  },

  applyTheme(){
    document.body.classList.toggle("dark", appState.settings.theme === "dark");
  },

  /* ---------- DASHBOARD ---------- */
  renderDashboard(){
    const total = appState.tasks.length;
    const done = appState.tasks.filter(t => t.completed).length;

    // soon due: today or within 2 days
    const today = new Date();
    const soon = appState.tasks.filter(t => {
      const d = toDateOnly(t.dueDate);
      const diff = daysBetween(today, d);
      return !t.completed && diff >= 0 && diff <= 2;
    });

    qs("dashSoon").textContent = soon.length;
    qs("dashDone").textContent = done;

    // habits progress (sum X/goal)
    let totalGoal = 0;
    let totalDone = 0;
    appState.habits.forEach(h => {
      totalGoal += Number(h.goal);
      totalDone += h.progress.filter(Boolean).length;
    });
    qs("dashHabit").textContent = totalDone + " / " + totalGoal;

    // progress bar
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    qs("dashProgressText").textContent = pct + "%";
    qs("dashProgressBar").style.width = pct + "%";

    // Today list
    const wrap = qs("todayList");
    wrap.innerHTML = "";
    if(soon.length === 0){
      wrap.innerHTML = '<p class="muted">No tasks due soon 🎉</p>';
      return;
    }
    soon.slice(0, 6).forEach(t => {
      const div = document.createElement("div");
      div.className = "card";
      div.style.boxShadow = "none";
      div.style.padding = "10px";
      div.innerHTML = `
        <div class="task-top">
          <div>
            <div class="task-title">${escapeHtml(t.title)}</div>
            <div class="task-meta">Due: ${t.dueDate}</div>
          </div>
          <span class="pill ${t.priority.toLowerCase()}">${t.priority}</span>
        </div>
      `;
      wrap.appendChild(div);
    });
  },

  /* ---------- TASKS ---------- */
  renderTasks(){
    // build category filter options (from existing tasks)
    const catSet = new Set(appState.tasks.map(t => t.category));
    const sel = qs("filterCategory");
    const current = sel.value || "all";
    sel.innerHTML = '<option value="all">All Categories</option>';
    Array.from(catSet).sort().forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      sel.appendChild(opt);
    });
    sel.value = catSet.has(current) ? current : "all";

    // apply filters
    let list = [...appState.tasks];
    const status = qs("filterStatus").value;
    const cat = qs("filterCategory").value;
    const sortBy = qs("sortBy").value;

    if(status === "active") list = list.filter(t => !t.completed);
    if(status === "completed") list = list.filter(t => t.completed);
    if(cat !== "all") list = list.filter(t => t.category === cat);

    if(sortBy === "due"){
      list.sort((a,b) => toDateOnly(a.dueDate) - toDateOnly(b.dueDate));
    }else{
      list.sort((a,b) => priorityRank(b.priority) - priorityRank(a.priority));
    }

    const wrap = qs("taskList");
    wrap.innerHTML = "";

    if(list.length === 0){
      wrap.innerHTML = '<p class="muted">No tasks to show.</p>';
      return;
    }

    list.forEach(t => {
      const item = document.createElement("div");
      item.className = "card task-item";
      item.style.boxShadow = "none";
      item.dataset.id = t.id;

      const titleClass = t.completed ? "task-title done" : "task-title";
      item.innerHTML = `
        <div class="task-top">
          <div>
            <div class="${titleClass}">${escapeHtml(t.title)}</div>
            <div class="task-meta">Due: ${t.dueDate} • ${escapeHtml(t.category)}</div>
          </div>
          <span class="pill ${t.priority.toLowerCase()}">${t.priority}</span>
        </div>

        ${t.description ? `<div class="muted" style="font-size:13px;">${escapeHtml(t.description)}</div>` : ""}

        <div class="row">
          <button class="btn small secondary" data-action="toggle">
            ${t.completed ? "Uncomplete" : "Complete"}
          </button>
          <button class="btn small secondary" data-action="edit">Edit</button>
          <button class="btn small danger" data-action="delete">Delete</button>
        </div>
      `;
      wrap.appendChild(item);
    });
  },

  /* ---------- HABITS ---------- */
  renderHabits(){
    const wrap = qs("habitList");
    wrap.innerHTML = "";

    if(appState.habits.length === 0){
      wrap.innerHTML = '<p class="muted">No habits yet. Add one on the left.</p>';
      qs("habitSummary").textContent = "0 / 0 goals achieved";
      return;
    }

    let achieved = 0;

    appState.habits.forEach(h => {
      const x = h.progress.filter(Boolean).length;
      if(x >= h.goal) achieved++;

      const card = document.createElement("div");
      card.className = "card";
      card.style.boxShadow = "none";
      card.dataset.id = h.id;

      // Days labels (Sat–Fri)
      const labels = ["Sat","Sun","Mon","Tue","Wed","Thu","Fri"];

      const daysHtml = labels.map((name, i) => {
        const on = h.progress[i] ? "day on" : "day";
        return `<div class="${on}" data-day="${i}">${name}</div>`;
      }).join("");

      card.innerHTML = `
        <div class="task-top">
          <div>
            <div class="task-title">${escapeHtml(h.name)}</div>
            <div class="task-meta">${x} / ${h.goal}</div>
          </div>
          <button class="btn small danger" data-action="deleteHabit">Delete</button>
        </div>
        <div class="week" style="margin-top:10px;">${daysHtml}</div>
      `;

      wrap.appendChild(card);
    });

    qs("habitSummary").textContent = achieved + " / " + appState.habits.length + " goals achieved";
  },

  /* ---------- RESOURCES ---------- */
  renderResources(allResources){
    const state = qs("resState");
    const wrap = qs("resList");
    const search = qs("resSearch").value.trim().toLowerCase();
    const cat = qs("resCategory").value;

    let list = [...allResources];

    if(search){
      list = list.filter(r => r.title.toLowerCase().includes(search));
    }
    if(cat !== "all"){
      list = list.filter(r => r.category === cat);
    }

    wrap.innerHTML = "";

    if(list.length === 0){
      state.textContent = "No results.";
      return;
    }
    state.textContent = "";

    list.forEach(r => {
      const favOn = appState.favorites.includes(r.id) ? "star on" : "star";
      const star = appState.favorites.includes(r.id) ? "★" : "☆";

      const div = document.createElement("div");
      div.className = "card";
      div.style.boxShadow = "none";
      div.dataset.id = r.id;

      div.innerHTML = `
        <div class="task-top">
          <div>
            <div class="task-title">${escapeHtml(r.title)}</div>
            <div class="task-meta">${escapeHtml(r.category)}</div>
          </div>
          <div class="${favOn}" data-action="fav" title="Favorite">${star}</div>
        </div>

        <p class="muted" style="margin-top:8px; font-size:13px;">${escapeHtml(r.description)}</p>
        <p style="margin-top:8px;">
          <a href="${r.link}" target="_blank" rel="noreferrer">Open link</a>
        </p>
      `;
      wrap.appendChild(div);
    });
  }
};

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

window.helpers = { toDateOnly, daysBetween };
