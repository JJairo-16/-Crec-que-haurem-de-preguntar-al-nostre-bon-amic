import {
  loadThemeQuiz,
  createQuizGame,
  getCurrentQuestion,
  answerCurrentQuestion,
  getGameResults
} from './themes-loader.js';

const QUIZ_STATE_KEY = 'quizState';
const SELECTED_THEME_KEY = 'selectedTheme';
const QUESTIONS_AMOUNT = 5;

function saveQuizState(game) {
  sessionStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(game));
}

function loadQuizState() {
  const raw = sessionStorage.getItem(QUIZ_STATE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(QUIZ_STATE_KEY);
    return null;
  }
}

function clearQuizState() {
  sessionStorage.removeItem(QUIZ_STATE_KEY);
}

function getSelectedThemeName() {
  return sessionStorage.getItem(SELECTED_THEME_KEY);
}

function clearSelectedTheme() {
  sessionStorage.removeItem(SELECTED_THEME_KEY);
}

function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text) {
    element.textContent = options.text;
  }

  if (options.html) {
    element.innerHTML = options.html;
  }

  return element;
}

function render(app, game, theme) {
  const question = getCurrentQuestion(game);

  if (!question) {
    renderResults(app, game, theme);
    return;
  }

  app.innerHTML = '';

  const container = createElement('div', { className: 'quiz-container' });

  const title = createElement('h1', {
    text: `Tema: ${theme.name}`
  });

  const progress = createElement('p', {
    text: `Pregunta ${game.currentQuestionIndex + 1} de ${game.questions.length}`
  });

  const score = createElement('p', {
    text: `Puntuació: ${game.score}`
  });

  const questionTitle = createElement('h2', {
    text: question.announced
  });

  const optionsContainer = createElement('div', {
    className: 'options'
  });

  const feedback = createElement('div', {
    className: 'feedback'
  });

  question.options.forEach((option, index) => {
    const button = createElement('button', {
      text: option.text
    });

    button.type = 'button';

    button.addEventListener('click', () => {
      handleAnswer({
        app,
        game,
        theme,
        question,
        selectedIndex: index,
        optionsContainer,
        feedback
      });
    });

    optionsContainer.appendChild(button);
  });

  container.appendChild(title);
  container.appendChild(progress);
  container.appendChild(score);
  container.appendChild(questionTitle);
  container.appendChild(optionsContainer);
  container.appendChild(feedback);

  app.appendChild(container);
}

function handleAnswer({
  app,
  game,
  theme,
  question,
  selectedIndex,
  optionsContainer,
  feedback
}) {
  const result = answerCurrentQuestion(game, selectedIndex);
  saveQuizState(game);

  const buttons = optionsContainer.querySelectorAll('button');

  buttons.forEach(button => {
    button.disabled = true;
  });

  buttons.forEach((button, index) => {
    if (index === result.correctIndex) {
      button.classList.add('correct');
    } else if (index === selectedIndex && !result.correct) {
      button.classList.add('wrong');
    }
  });

  feedback.innerHTML = '';

  const message = createElement('p', {
    text: result.correct
      ? 'Correcte'
      : `Incorrecte. La resposta correcta era: ${question.options[result.correctIndex].text}`
  });

  const nextButton = createElement('button', {
    text: result.finished ? 'Veure resultats' : 'Següent'
  });

  nextButton.type = 'button';
  nextButton.addEventListener('click', () => {
    render(app, game, theme);
  });

  feedback.appendChild(message);
  feedback.appendChild(nextButton);
}

function renderResults(app, game, theme) {
  const results = getGameResults(game);

  app.innerHTML = '';

  const container = createElement('div', {
    className: 'results-container'
  });

  const title = createElement('h1', {
    text: `Resultats - ${theme.name}`
  });

  const score = createElement('p', {
    text: `Puntuació: ${results.correct}/${results.total}`
  });

  const percent = createElement('p', {
    text: `Percentatge: ${results.percentage.toFixed(2)}%`
  });

  const summaryTitle = createElement('h2', {
    text: 'Resum'
  });

  const summaryList = createElement('ul');

  results.answers.forEach((answer, index) => {
    const item = createElement('li', {
      text: `Pregunta ${index + 1}: ${answer.correct ? 'Correcta' : 'Incorrecta'}`
    });

    summaryList.appendChild(item);
  });

  const backButton = createElement('button', {
    text: 'Tornar a selecció de temes'
  });

  backButton.type = 'button';
  backButton.addEventListener('click', () => {
    clearQuizState();
    clearSelectedTheme();
    globalThis.location.href = './index.html';
  });

  container.appendChild(title);
  container.appendChild(score);
  container.appendChild(percent);
  container.appendChild(summaryTitle);
  container.appendChild(summaryList);
  container.appendChild(backButton);

  app.appendChild(container);
}

async function init() {
  const app = document.getElementById('app');

  if (!app) {
    console.error('No s\'ha trobat l\'element #app');
    return;
  }

  const themeName = getSelectedThemeName();

  if (!themeName) {
    globalThis.location.href = './index.html';
    return;
  }

  app.innerHTML = '<p>Carregant quiz...</p>';

  try {
    let game = loadQuizState();
    let theme = { name: themeName };

    if (game?.themeName !== themeName) {
      const loaded = await loadThemeQuiz(themeName, {
        amount: QUESTIONS_AMOUNT,
        shuffleQuestions: true,
        shuffleOptions: true
      });

      theme = loaded.theme;
      game = createQuizGame(loaded.questions, {
        themeName: theme.name
      });

      saveQuizState(game);
    }

    render(app, game, theme);
  } catch (error) {
    console.error(error);
    app.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

init();