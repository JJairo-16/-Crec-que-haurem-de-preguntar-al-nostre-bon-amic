import { loadThemes } from './libs/themes-loader.js';

const PLAYER_NAME_KEY = 'playerName';
const SELECTED_THEME_KEY = 'selectedTheme';

const dom = {
  btnEnter: document.getElementById('btn-enter'),
  btnStartGame: document.getElementById('btn-start-game'),
  userNameInput: document.getElementById('user-name'),
  sectionNameInput: document.getElementById('section-name-input'),
  sectionCategorySelect: document.getElementById('section-category-select'),
  displayName: document.getElementById('display-name'),
  categoryGrid: document.getElementById('category-grid')
};

const state = {
  playerName: '',
  selectedTheme: null
};

function savePlayerName(name) {
  sessionStorage.setItem(PLAYER_NAME_KEY, name);
}

function loadSavedPlayerName() {
  return sessionStorage.getItem(PLAYER_NAME_KEY) ?? '';
}

function saveSelectedTheme(themeName) {
  sessionStorage.setItem(SELECTED_THEME_KEY, themeName);
}

function loadSavedSelectedTheme() {
  return sessionStorage.getItem(SELECTED_THEME_KEY) ?? '';
}

function validatePlayerName() {
  const userName = dom.userNameInput.value.trim();

  if (!userName) {
    alert('Si us plau, introdueix el teu nom');
    return null;
  }

  return userName;
}

function showCategorySection(playerName) {
  dom.displayName.textContent = playerName;
  dom.sectionNameInput.style.display = 'none';
  dom.sectionCategorySelect.style.display = 'block';
}

function clearSelectedButtons() {
  const buttons = dom.categoryGrid.querySelectorAll('.btn-category');
  buttons.forEach(button => button.classList.remove('selected'));
}

function selectTheme(button, themeName) {
  state.selectedTheme = themeName;
  clearSelectedButtons();
  button.classList.add('selected');
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

function handleStartGame() {
  if (!state.playerName) {
    alert('Primer has d’introduir el teu nom');
    return;
  }

  if (!state.selectedTheme) {
    alert('Selecciona una categoria');
    return;
  }

  saveSelectedTheme(state.selectedTheme);
  globalThis.location.href = './quiz.html';
}

function restoreSessionVisibility() {
  const savedName = loadSavedPlayerName();

  if (!savedName) {
    return;
  }

  state.playerName = savedName;
  dom.userNameInput.value = savedName;
  showCategorySection(savedName);
}

function createThemeButton(theme, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-category';
  button.dataset.theme = theme.name;
  button.style.setProperty('--theme-bg', theme.color || 'linear-gradient(135deg, #64748b 0%, #334155 100%)');
  button.style.setProperty('--theme-delay', `${index * 70}ms`);

  const img = document.createElement('img');
  img.className = 'mascot-img';
  img.src = theme.img || '';
  img.alt = theme.name;

  const text = document.createElement('span');
  text.className = 'btn-category-text';
  text.textContent = theme.name;

  button.append(img, text);

  button.addEventListener('click', () => {
    selectTheme(button, theme.name);
  });

  return button;
}

async function renderThemeButtons() {
  const themes = await loadThemes();
  const savedTheme = loadSavedSelectedTheme();

  dom.categoryGrid.innerHTML = '';

  themes.forEach((theme, index) => {
    const button = createThemeButton(theme, index);
    dom.categoryGrid.appendChild(button);

    if (savedTheme === theme.name) {
      selectTheme(button, theme.name);
    }
  });
}

function bindEvents() {
  dom.btnEnter.addEventListener('click', handleEnter);

  dom.userNameInput.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
      handleEnter();
    }
  });

  dom.btnStartGame.addEventListener('click', handleStartGame);
}

async function init() {
  bindEvents();
  restoreSessionVisibility();

  try {
    await renderThemeButtons();
  } catch (error) {
    console.error(error);
    dom.categoryGrid.innerHTML = '<p>No s’han pogut carregar les categories.</p>';
  }
}

await init();