// state.js
// Simple app state (tasks, habits, favorites, settings)

window.appState = {
  tasks: [],
  habits: [],
  favorites: [],
  settings: {
    theme: "light"
  },
  editingTaskId: null
};

// Helper: generate simple id
window.makeId = function(){
  return Date.now() + "-" + Math.floor(Math.random() * 1000);
};
