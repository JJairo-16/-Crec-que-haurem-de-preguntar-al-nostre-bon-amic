import { loadOrCreateQuizSession } from './libs/quiz-service.js';
import { createSessionStorageAdapter } from './libs/storage-adapter.js';

const QUIZ_STATE_KEY = 'quizState';
const SELECTED_THEME_KEY = 'selectedTheme';
const QUESTIONS_AMOUNT = 5;

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

function render(app, quiz) {
  const question = quiz.getQuestion();
  const theme = quiz.getTheme();
  const game = quiz.getState();
  const { current, total } = quiz.getProgress();

  if (!question) {
    renderResults(app, quiz);
    return;
  }

  app.innerHTML = '';

  const container = createElement('div', { className: 'quiz-container' });

  const title = createElement('h1', {
    text: `Tema: ${theme.name}`
  });

  const progress = createElement('p', {
    text: `Pregunta ${current} de ${total} (${current / total * 100}%)`
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
        quiz,
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
  quiz,
  question,
  selectedIndex,
  optionsContainer,
  feedback
}) {
  const result = quiz.answer(selectedIndex);

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
    render(app, quiz);
  });

  feedback.appendChild(message);
  feedback.appendChild(nextButton);
}

function renderResults(app, quiz) {
  const results = quiz.getResults();
  const theme = quiz.getTheme();

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
    quiz.clear();
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
    const storage = createSessionStorageAdapter(sessionStorage);

    const quiz = await loadOrCreateQuizSession({
      themeName,
      amount: QUESTIONS_AMOUNT,
      shuffleQuestions: true,
      shuffleOptions: true,
      storage,
      stateKey: QUIZ_STATE_KEY
    });

    render(app, quiz);
  } catch (error) {
    console.error(error);
    app.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

await init();