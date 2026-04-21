import { loadOrCreateQuizSession } from './libs/quiz-service.js';
import { createSessionStorageAdapter } from './libs/storage-adapter.js';

const QUIZ_STATE_KEY = 'quizState';
const SELECTED_THEME_KEY = 'selectedTheme';
const PLAYER_NAME_KEY = 'playerName';
const QUESTIONS_AMOUNT = 5;

/**
 * Obté el nom del tema seleccionat.
 *
 * @returns {string|null} Nom del tema o `null`
 */
function getSelectedThemeName() {
  return sessionStorage.getItem(SELECTED_THEME_KEY);
}

/**
 * Elimina el tema seleccionat de la sessió.
 *
 * @returns {void}
 */
function clearSelectedTheme() {
  sessionStorage.removeItem(SELECTED_THEME_KEY);
}

/**
 * Obté el nom del jugador.
 *
 * @returns {string} Nom del jugador o valor per defecte
 */
function getPlayerName() {
  return sessionStorage.getItem(PLAYER_NAME_KEY) ?? 'Jugador/a';
}

/**
 * Crea un element del DOM amb opcions bàsiques.
 *
 * @param {string} tag - Etiqueta HTML
 * @param {Object} [options={}] - Opcions de creació
 * @param {string} [options.className] - Classe CSS
 * @param {string} [options.text] - Text de l'element
 * @param {string} [options.html] - HTML intern
 * @returns {HTMLElement} Element creat
 */
function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text != null) {
    element.textContent = options.text;
  }

  if (options.html != null) {
    element.innerHTML = options.html;
  }

  return element;
}

/**
 * Torna a la pantalla de selecció de temes i neteja l'estat del quiz.
 *
 * @param {Object} quiz - Sessió del quiz
 * @returns {void}
 */
function goBackToThemes(quiz) {
  quiz.clear();
  clearSelectedTheme();
  globalThis.location.href = './index.html';
}

/**
 * Calcula el progrés visible.
 *
 * La pregunta actual només compta per al percentatge quan ja s'ha respost.
 *
 * @param {Object} quiz - Sessió del quiz
 * @returns {{
 *   questionNumber: number,
 *   total: number,
 *   answeredCount: number,
 *   percentage: number
 * }}
 */
function getDisplayProgress(quiz) {
  const { current, total } = quiz.getProgress();

  if (total === 0) {
    return {
      questionNumber: 0,
      total: 0,
      answeredCount: 0,
      percentage: 0
    };
  }

  const isAnswered = quiz.isCurrentQuestionAnswered();
  const safeCurrent = Math.max(1, Math.min(current, total));
  const answeredCount = isAnswered ? safeCurrent : safeCurrent - 1;
  const percentage = (answeredCount / total) * 100;

  return {
    questionNumber: safeCurrent,
    total,
    answeredCount,
    percentage
  };
}

/**
 * Actualitza el text del progrés visible.
 *
 * @param {HTMLElement} progressElement - Element on es mostra el progrés
 * @param {Object} quiz - Sessió del quiz
 * @returns {void}
 */
function updateProgressText(progressElement, quiz) {
  const { questionNumber, total, percentage } = getDisplayProgress(quiz);
  progressElement.textContent = `Pregunta ${questionNumber} de ${total} (${percentage.toFixed(0)}%)`;
}

/**
 * Actualitza la barra visual de progrés.
 *
 * @param {HTMLElement} progressFillElement - Element interior de la barra
 * @param {Object} quiz - Sessió del quiz
 * @returns {void}
 */
function updateProgressBar(progressFillElement, quiz) {
  const { percentage } = getDisplayProgress(quiz);
  progressFillElement.style.width = `${percentage}%`;
}

/**
 * Crea el botó per abandonar el quiz.
 *
 * @param {Object} quiz - Sessió del quiz
 * @returns {HTMLButtonElement} Botó creat
 */
function createAbandonButton(quiz) {
  const abandonButton = createElement('button', {
    text: 'Abandonar quiz'
  });

  abandonButton.type = 'button';
  abandonButton.classList.add('btn-secondary');

  abandonButton.addEventListener('click', () => {
    const confirmExit = globalThis.confirm('Segur que vols abandonar el quiz?');

    if (!confirmExit) {
      return;
    }

    goBackToThemes(quiz);
  });

  return abandonButton;
}

/**
 * Renderitza la pantalla principal del quiz.
 *
 * @param {HTMLElement} app - Contenidor principal
 * @param {Object} quiz - Sessió del quiz
 * @returns {void}
 */
function render(app, quiz) {
  const question = quiz.getQuestion();

  if (!question) {
    renderResults(app, quiz);
    return;
  }

  const theme = quiz.getTheme();
  const game = quiz.getState();

  app.innerHTML = '';

  const container = createElement('div', { className: 'quiz-container' });

  const title = createElement('h1', {
    text: `Tema: ${theme.name}`
  });

  const meta = createElement('div', { className: 'meta' });

  const progress = createElement('p');
  updateProgressText(progress, quiz);

  const score = createElement('p', {
    text: `Puntuació: ${game.score}`
  });

  const progressBar = createElement('div', { className: 'progress-bar' });
  const progressFill = createElement('div', { className: 'progress-fill' });
  updateProgressBar(progressFill, quiz);
  progressBar.appendChild(progressFill);

  meta.appendChild(progress);
  meta.appendChild(score);
  meta.appendChild(progressBar);

  const questionBlock = createElement('div', { className: 'question-block' });

  const questionTitle = createElement('h2', {
    text: question.announced
  });

  const optionsContainer = createElement('div', {
    className: 'options'
  });

  const feedback = createElement('div', {
    className: 'feedback'
  });

  const bottomActions = createElement('div', {
    className: 'actions'
  });

  const abandonButton = createAbandonButton(quiz);

  question.options.forEach((option, index) => {
    const button = createElement('button', {
      text: option.text
    });

    button.type = 'button';

    button.addEventListener('click', () => {
      if (quiz.isCurrentQuestionAnswered()) {
        return;
      }

      handleAnswer({
        app,
        quiz,
        question,
        selectedIndex: index,
        optionsContainer,
        feedback,
        progressElement: progress,
        progressFillElement: progressFill,
        scoreElement: score
      });
    });

    optionsContainer.appendChild(button);
  });

  bottomActions.appendChild(abandonButton);

  questionBlock.appendChild(questionTitle);
  questionBlock.appendChild(optionsContainer);
  questionBlock.appendChild(feedback);
  questionBlock.appendChild(bottomActions);

  container.appendChild(title);
  container.appendChild(meta);
  container.appendChild(questionBlock);

  app.appendChild(container);
}

/**
 * Gestiona la resposta de l'usuari a la pregunta actual.
 *
 * @param {Object} params
 * @param {HTMLElement} params.app - Contenidor principal
 * @param {Object} params.quiz - Sessió del quiz
 * @param {Object} params.question - Pregunta actual
 * @param {number} params.selectedIndex - Índex seleccionat
 * @param {HTMLElement} params.optionsContainer - Contenidor d'opcions
 * @param {HTMLElement} params.feedback - Contenidor de feedback
 * @param {HTMLElement} params.progressElement - Element visual del progrés
 * @param {HTMLElement} params.progressFillElement - Barra interior del progrés
 * @param {HTMLElement} params.scoreElement - Element visual de la puntuació
 * @returns {void}
 */
function handleAnswer({
  app,
  quiz,
  question,
  selectedIndex,
  optionsContainer,
  feedback,
  progressElement,
  progressFillElement,
  scoreElement
}) {
  let result;

  try {
    result = quiz.answer(selectedIndex);
  } catch (error) {
    console.error(error);
    feedback.innerHTML = '<p>No s’ha pogut desar la resposta.</p>';
    return;
  }

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

  updateProgressText(progressElement, quiz);
  updateProgressBar(progressFillElement, quiz);
  scoreElement.textContent = `Puntuació: ${quiz.getState().score}`;

  feedback.innerHTML = '';

  const message = createElement('p', {
    text: result.correct
      ? 'Correcte'
      : `Incorrecte. La resposta correcta era: ${question.options[result.correctIndex].text}`
  });

  const actions = createElement('div', { className: 'actions' });

  const nextButton = createElement('button', {
    text: result.finished ? 'Veure resultats' : 'Següent'
  });

  nextButton.type = 'button';
  nextButton.classList.add('btn-primary');

  nextButton.addEventListener('click', () => {
    render(app, quiz);
  });

  actions.appendChild(nextButton);

  feedback.appendChild(message);
  feedback.appendChild(actions);
}

/**
 * Renderitza la pantalla de resultats finals.
 *
 * @param {HTMLElement} app - Contenidor principal
 * @param {Object} quiz - Sessió del quiz
 * @returns {void}
 */
function renderResults(app, quiz) {
  const results = quiz.getResults();
  const theme = quiz.getTheme();
  const playerName = getPlayerName();

  app.innerHTML = '';

  const container = createElement('div', {
    className: 'results-container'
  });

  const title = createElement('h1', {
    text: `Resultats - ${theme.name}`
  });

  const player = createElement('p', {
    text: `Nom: ${playerName}`
  });

  const score = createElement('p', {
    text: `Puntuació: ${results.correct}/${results.total}`
  });

  const percent = createElement('p', {
    text: `Percentatge: ${results.percentage.toFixed(2)}%`
  });

  const progressBar = createElement('div', { className: 'progress-bar' });
  const progressFill = createElement('div', { className: 'progress-fill' });
  progressFill.style.width = `${results.percentage}%`;
  progressBar.appendChild(progressFill);

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

  const actions = createElement('div', {
    className: 'results-actions'
  });

  const backButton = createElement('button', {
    text: 'Tornar a selecció de temes'
  });

  backButton.type = 'button';
  backButton.classList.add('btn-primary');

  backButton.addEventListener('click', () => {
    goBackToThemes(quiz);
  });

  actions.appendChild(backButton);

  container.appendChild(title);
  container.appendChild(player);
  container.appendChild(score);
  container.appendChild(percent);
  container.appendChild(progressBar);
  container.appendChild(summaryTitle);
  container.appendChild(summaryList);
  container.appendChild(actions);

  app.appendChild(container);
}

/**
 * Inicialitza la pàgina del quiz.
 *
 * @returns {Promise<void>}
 */
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
    sessionStorage.removeItem(QUIZ_STATE_KEY);

    app.innerHTML = `
      <div class="results-container">
        <h1>Error en carregar el quiz</h1>
        <p>No s’ha pogut restaurar la sessió actual.</p>
        <div class="results-actions">
          <button id="btn-return-home" type="button" class="btn-primary">Tornar a l’inici</button>
        </div>
      </div>
    `;

    const button = document.getElementById('btn-return-home');

    button?.addEventListener('click', () => {
      clearSelectedTheme();
      globalThis.location.href = './index.html';
    });
  }
}

await init();