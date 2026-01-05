// storage.js
// localStorage helpers (save/load/reset)

const KEYS = {
  tasks: "sb_tasks",
  habits: "sb_habits",
  favorites: "sb_favorites",
  theme: "sb_theme"
};

window.storage = {
  load(){
    try{
      appState.tasks = JSON.parse(localStorage.getItem(KEYS.tasks)) || [];
      appState.habits = JSON.parse(localStorage.getItem(KEYS.habits)) || [];
      appState.favorites = JSON.parse(localStorage.getItem(KEYS.favorites)) || [];
      appState.settings.theme = localStorage.getItem(KEYS.theme) || "light";
    }catch(e){
      // if something is broken, just start fresh
      appState.tasks = [];
      appState.habits = [];
      appState.favorites = [];
      appState.settings.theme = "light";
    }
  },

  saveTasks(){
    localStorage.setItem(KEYS.tasks, JSON.stringify(appState.tasks));
  },

  saveHabits(){
    localStorage.setItem(KEYS.habits, JSON.stringify(appState.habits));
  },

  saveFavorites(){
    localStorage.setItem(KEYS.favorites, JSON.stringify(appState.favorites));
  },

  saveTheme(){
    localStorage.setItem(KEYS.theme, appState.settings.theme);
  },

  resetAll(){
    if(!confirm("Are you sure you want to reset all data?")){
      return false;
    }
    localStorage.removeItem(KEYS.tasks);
    localStorage.removeItem(KEYS.habits);
    localStorage.removeItem(KEYS.favorites);
    localStorage.removeItem(KEYS.theme);

    appState.tasks = [];
    appState.habits = [];
    appState.favorites = [];
    appState.settings.theme = "light";
    return true;
  }
};
