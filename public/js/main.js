import { loadThemes } from './libs/themes-loader.js';

const PLAYER_NAME_KEY = 'playerName';
const SELECTED_THEME_KEY = 'selectedTheme';
const CURRENT_SCREEN_KEY = 'currentScreen';

const dom = {
  btnEnter: document.getElementById('btn-enter'),
  btnStartGame: document.getElementById('btn-start-game'),
  btnBackToName: document.getElementById('btn-back-to-name'),
  userNameInput: document.getElementById('user-name'),
  sectionNameInput: document.getElementById('section-name-input'),
  sectionCategorySelect: document.getElementById('section-category-select'),
  displayName: document.getElementById('display-name'),
  categoryGrid: document.getElementById('category-grid'),
  userNameError: document.getElementById('user-name-error')
};

const state = {
  playerName: '',
  selectedTheme: null,
  selectedButton: null
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

function clearSelectedTheme() {
  sessionStorage.removeItem(SELECTED_THEME_KEY);
}

function saveCurrentScreen(screen) {
  sessionStorage.setItem(CURRENT_SCREEN_KEY, screen);
}

function loadCurrentScreen() {
  return sessionStorage.getItem(CURRENT_SCREEN_KEY) ?? 'name';
}

function clearValidationError() {
  dom.userNameError.textContent = '';
  dom.userNameInput.classList.remove('input-invalid');
}

function showValidationError(message) {
  dom.userNameError.textContent = message;
  dom.userNameInput.classList.add('input-invalid');
}

function validatePlayerName() {
  const userName = dom.userNameInput.value.trim();

  clearValidationError();

  if (!userName) {
    showValidationError('Si us plau, introdueix el teu nom');
    return null;
  }

  return userName;
}

function showCategorySection(playerName) {
  dom.displayName.textContent = playerName;
  dom.sectionNameInput.style.display = 'none';
  dom.sectionCategorySelect.style.display = 'block';
  saveCurrentScreen('category');
}

function showNameSection() {
  dom.sectionNameInput.style.display = 'block';
  dom.sectionCategorySelect.style.display = 'none';
  dom.userNameInput.focus();
  saveCurrentScreen('name');
}

function resetThemeSelection() {
  if (state.selectedButton) {
    state.selectedButton.classList.remove('selected');
  }

  state.selectedButton = null;
  state.selectedTheme = null;
  clearSelectedTheme();
}

function backToNameSelection() {
  resetThemeSelection();
  showNameSection();
}

function selectTheme(button, themeName) {
  if (state.selectedButton && state.selectedButton !== button) {
    state.selectedButton.classList.remove('selected');
  }

  state.selectedButton = button;
  state.selectedTheme = themeName;
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
    showValidationError('Primer has d’introduir el teu nom');
    showNameSection();
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
  const savedScreen = loadCurrentScreen();

  if (!savedName) {
    showNameSection();
    return;
  }

  state.playerName = savedName;

  if (savedScreen === 'name') {
    showNameSection();
    return;
  }

  showCategorySection(savedName);
}

function createThemeButton(theme, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-category';
  button.dataset.theme = theme.name;
  button.style.setProperty(
    '--theme-bg',
    theme.color || 'linear-gradient(135deg, #64748b 0%, #334155 100%)'
  );
  button.style.setProperty('--theme-delay', `${index * 70}ms`);

  const img = document.createElement('img');
  img.className = 'mascot-img';
  img.src = theme.img || '';
  img.alt = theme.name;

  const text = document.createElement('span');
  text.className = 'btn-category-text';
  text.textContent = theme.name;

  button.append(img, text);
  return button;
}

async function renderThemeButtons() {
  const themes = await loadThemes();
  const savedTheme = loadSavedSelectedTheme();
  const fragment = document.createDocumentFragment();

  dom.categoryGrid.innerHTML = '';
  state.selectedButton = null;
  state.selectedTheme = null;

  for (const [index, theme] of themes.entries()) {
    const button = createThemeButton(theme, index);
    fragment.appendChild(button);

    if (savedTheme === theme.name) {
      state.selectedButton = button;
      state.selectedTheme = theme.name;
      button.classList.add('selected');
    }
  }

  dom.categoryGrid.appendChild(fragment);
}

function handleCategoryGridClick(event) {
  const button = event.target.closest('.btn-category');

  if (!button || !dom.categoryGrid.contains(button)) {
    return;
  }

  const themeName = button.dataset.theme;

  if (!themeName) {
    return;
  }

  selectTheme(button, themeName);
}

function bindEvents() {
  dom.btnEnter.addEventListener('click', handleEnter);

  dom.userNameInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      handleEnter();
    }
  });

  dom.userNameInput.addEventListener('input', () => {
    clearValidationError();
  });

  dom.btnStartGame.addEventListener('click', handleStartGame);
  dom.categoryGrid.addEventListener('click', handleCategoryGridClick);
  dom.btnBackToName?.addEventListener('click', backToNameSelection);
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