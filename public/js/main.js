const PLAYER_NAME_KEY = 'playerName';
const SELECTED_THEME_KEY = 'selectedTheme';

const dom = {
  btnEnter: document.getElementById('btn-enter'),
  btnCinema: document.getElementById('btn-cinema'),
  btnSports: document.getElementById('btn-sports'),
  btnStartGame: document.getElementById('btn-start-game'),
  userNameInput: document.getElementById('user-name'),
  sectionNameInput: document.getElementById('section-name-input'),
  sectionCategorySelect: document.getElementById('section-category-select'),
  displayName: document.getElementById('display-name'),
};

const state = {
  playerName: '',
  selectedTheme: null
};

function showCategorySection(playerName) {
  dom.displayName.textContent = playerName;
  dom.sectionNameInput.style.display = 'none';
  dom.sectionCategorySelect.style.display = 'block';
}

function savePlayerName(name) {
  sessionStorage.setItem(PLAYER_NAME_KEY, name);
}

function saveSelectedTheme(themeName) {
  sessionStorage.setItem(SELECTED_THEME_KEY, themeName);
}

function loadSavedPlayerName() {
  return sessionStorage.getItem(PLAYER_NAME_KEY) ?? '';
}

function validatePlayerName() {
  const userName = dom.userNameInput.value.trim();

  if (userName === '') {
    alert('Si us plau, introdueix el teu nom');
    return null;
  }

  return userName;
}

function handleEnter() {
  const userName = validatePlayerName();

  if (!userName) {
    return;
  }

  state.playerName = userName;
  savePlayerName(userName);
  showCategorySection(userName);
}

function selectTheme(themeName) {
  state.selectedTheme = themeName;

  dom.btnCinema.classList.remove('selected');
  dom.btnSports.classList.remove('selected');

  if (themeName === 'Cine') {
    dom.btnCinema.classList.add('selected');
  }

  if (themeName === 'Deportes') {
    dom.btnSports.classList.add('selected');
  }
}

function handleStartGame() {
  if (!state.playerName || !state.selectedTheme) {
    alert('Primer has d’introduir el teu nom i seleccionar una categoria');
    return;
  }

  saveSelectedTheme(state.selectedTheme);
  globalThis.location.href = './quiz.html';
}

function restoreSession() {
  const savedName = loadSavedPlayerName();

  if (!savedName) {
    return;
  }

  state.playerName = savedName;
  dom.userNameInput.value = savedName;
  showCategorySection(savedName);
}

function bindEvents() {
  dom.btnEnter.addEventListener('click', handleEnter);

  dom.userNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      handleEnter();
    }
  });

  dom.btnCinema.addEventListener('click', () => {
    selectTheme('Cine');
  });

  dom.btnSports.addEventListener('click', () => {
    selectTheme('test');
  });

  dom.btnStartGame.addEventListener('click', handleStartGame);
}

function init() {
  bindEvents();
  restoreSession();
}

init();