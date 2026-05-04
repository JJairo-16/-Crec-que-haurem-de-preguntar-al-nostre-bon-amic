import { createQuizSession, QuizSession } from './libs/quiz-service.js';
import { createSessionStorageAdapter } from './libs/storage-adapter.js';
import { getThemeByName } from './libs/themes-loader.js';

const SELECTED_THEME_KEY = 'selectedTheme';
const QUIZ_STATE_KEY = 'quizState';
const TIMER_STATE_KEY = 'quizTimerState';

const QUESTION_TIME_LIMIT_MS = 20000;

const storage = createSessionStorageAdapter(sessionStorage);

let session = null;
let currentTheme = null;

let answeredCurrentQuestion = false;
let selectedAnswerIndex = null;
let currentQuestionSnapshot = null;

let timerId = null;
let remainingMs = QUESTION_TIME_LIMIT_MS;
let lastTick = null;

const dom = {
  theme: document.getElementById('current-theme'),
  questionText: document.getElementById('question-text'),
  currentQuestion: document.getElementById('current-question'),
  totalQuestions: document.getElementById('total-questions'),
  currentScore: document.getElementById('current-score'),
  progressBar: document.getElementById('progress-bar'),
  timerText: document.getElementById('timer-text'),
  timerBar: document.getElementById('timer-bar'),
  btnLeave: document.getElementById('btn-leave'),
  btnNextQuestion: document.getElementById('btn-next-question'),
  optionButtons: [
    document.getElementById('option-a'),
    document.getElementById('option-b'),
    document.getElementById('option-c'),
    document.getElementById('option-d')
  ]
};

/* =========================
   STORAGE
========================= */

function loadSelectedTheme() {
  return sessionStorage.getItem(SELECTED_THEME_KEY) ?? '';
}

function saveTimerState() {
  if (!session) return;

  storage.set(TIMER_STATE_KEY, {
    questionIndex: session.getState().currentQuestionIndex,
    remainingMs
  });
}

function loadTimerState() {
  return storage.get(TIMER_STATE_KEY);
}

function clearTimerState() {
  storage.remove(TIMER_STATE_KEY);
}

/* =========================
   TIMER
========================= */

function stopTimer() {
  if (timerId !== null) {
    cancelAnimationFrame(timerId);
    timerId = null;
  }
}

function updateTimerDisplay() {
  if (!dom.timerText || !dom.timerBar) return;

  const safeMs = Math.max(remainingMs, 0);
  const percentage = (safeMs / QUESTION_TIME_LIMIT_MS) * 100;

  const seconds = Math.ceil(safeMs / 1000);

  dom.timerText.textContent = `${seconds}s`;
  dom.timerBar.style.width = `${percentage}%`;
  dom.timerBar.classList.toggle('timer-danger', seconds <= 5);
}

function startTimer() {
  stopTimer();

  const currentQuestionIndex = session.getState().currentQuestionIndex;
  const savedTimer = loadTimerState();

  if (
    savedTimer &&
    savedTimer.questionIndex === currentQuestionIndex &&
    typeof savedTimer.remainingMs === 'number'
  ) {
    remainingMs = Math.max(savedTimer.remainingMs, 0);
  } else {
    remainingMs = QUESTION_TIME_LIMIT_MS;
    saveTimerState();
  }

  updateTimerDisplay();

  if (remainingMs <= 0) {
    submitAnswer({ timedOut: true });
    return;
  }

  lastTick = performance.now();

  timerId = requestAnimationFrame(tick);
}

function tick(now) {
  const delta = now - lastTick;
  lastTick = now;

  remainingMs = Math.max(remainingMs - delta, 0);

  saveTimerState();
  updateTimerDisplay();

  if (remainingMs <= 0) {
    submitAnswer({ timedOut: true });
    return;
  }

  timerId = requestAnimationFrame(tick);
}

/* =========================
   QUIZ SESSION
========================= */

function goHome() {
  stopTimer();
  clearTimerState();
  storage.remove(QUIZ_STATE_KEY);
  globalThis.location.href = './index.html';
}

function isReusableSavedGame(savedGame, themeName) {
  return Boolean(
    savedGame &&
    typeof savedGame === 'object' &&
    savedGame.themeName === themeName &&
    Array.isArray(savedGame.questions) &&
    Array.isArray(savedGame.answers) &&
    typeof savedGame.currentQuestionIndex === 'number' &&
    typeof savedGame.score === 'number'
  );
}

async function loadQuizSession(themeName) {
  const savedGame = storage.get(QUIZ_STATE_KEY);

  if (isReusableSavedGame(savedGame, themeName)) {
    return new QuizSession({
      game: savedGame,
      theme: { name: themeName },
      storage,
      stateKey: QUIZ_STATE_KEY
    });
  }

  storage.remove(QUIZ_STATE_KEY);
  clearTimerState();

  return createQuizSession({
    themeName,
    storage,
    stateKey: QUIZ_STATE_KEY
  });
}

/* =========================
   QUESTION HELPERS
========================= */

function getCorrectIndexFromQuestion(question) {
  if (!question?.options) return -1;

  return question.options.findIndex(option =>
    option.correct === true ||
    option.isCorrect === true ||
    option.is_correct === true
  );
}

function getTimeoutWrongIndex(question) {
  if (!question?.options?.length) return -1;

  const correctIndex = getCorrectIndexFromQuestion(question);

  const wrongIndex = question.options.findIndex((_, index) => {
    return index !== correctIndex;
  });

  return wrongIndex === -1 ? 0 : wrongIndex;
}

/* =========================
   RENDER
========================= */

function updateProgress() {
  const progress = session.getProgress();
  const state = session.getState();

  const percentage = progress.total > 0
    ? Math.round((state.currentQuestionIndex / progress.total) * 100)
    : 0;

  dom.currentQuestion.textContent = String(
    Math.min(state.currentQuestionIndex + 1, progress.total)
  );

  dom.totalQuestions.textContent = String(progress.total);
  dom.currentScore.textContent = String(state.score);
  dom.progressBar.style.width = `${percentage}%`;

  const counter = dom.currentQuestion.closest('.question-counter');

  if (counter) {
    counter.innerHTML = `
      Pregunta <span id="current-question">${Math.min(state.currentQuestionIndex + 1, progress.total)}</span>
      de <span id="total-questions">${progress.total}</span>
      (${percentage}%)
    `;

    dom.currentQuestion = document.getElementById('current-question');
    dom.totalQuestions = document.getElementById('total-questions');
  }
}

function resetOptions() {
  answeredCurrentQuestion = false;
  selectedAnswerIndex = null;

  document.querySelector('.options-grid')?.classList.remove('answered');

  dom.btnNextQuestion.hidden = false;
  dom.btnNextQuestion.disabled = true;
  dom.btnNextQuestion.textContent = 'Enviar';

  dom.optionButtons.forEach(button => {
    button.disabled = false;
    button.style.display = '';
    button.classList.remove('selected', 'correct', 'wrong');
    button.textContent = '';
  });
}

function renderQuestion() {
  stopTimer();

  if (session.hasFinished()) {
    renderResults();
    return;
  }

  const question = session.getQuestion();
  const theme = session.getTheme();

  currentQuestionSnapshot = question;

  dom.theme.textContent = theme.name ?? loadSelectedTheme();
  dom.questionText.textContent = question.announced;

  resetOptions();
  updateProgress();

  question.options.forEach((option, index) => {
    const button = dom.optionButtons[index];
    if (!button) return;

    button.textContent = option.text;
    button.dataset.index = String(index);
  });

  for (let i = question.options.length; i < dom.optionButtons.length; i++) {
    dom.optionButtons[i].style.display = 'none';
  }

  startTimer();
}

function renderResults() {
  stopTimer();
  clearTimerState();

  const results = session.getResults();
  const percentage = Math.round(results.percentage);
  const quizContainer = document.querySelector('.quiz-container');

  quizContainer.innerHTML = `
    <section class="result-screen">
      <article class="result-card">
        <div class="result-top">
          <h1 class="result-title">RESULTAT</h1>
          <img 
            src="./${currentTheme.img}" 
            alt="${currentTheme.name}" 
            class="result-mascot"
          >
        </div>

        <div class="result-bottom">
          <p class="result-percentage">
            ${percentage}% de preguntes acertades
          </p>

          <button id="btn-play-again" class="result-btn result-btn-play">
            TORNAR A JUGAR
          </button>

          <button id="btn-exit" class="result-btn result-btn-exit">
            SORTIR
          </button>
        </div>
      </article>
    </section>
  `;

  document.getElementById('btn-play-again').addEventListener('click', () => {
    storage.remove(QUIZ_STATE_KEY);
    clearTimerState();
    globalThis.location.href = './quiz.html';
  });

  document.getElementById('btn-exit').addEventListener('click', () => {
    storage.remove(QUIZ_STATE_KEY);
    clearTimerState();
    globalThis.location.href = './index.html';
  });
}

/* =========================
   ANSWERS
========================= */

function selectAnswer(selectedIndex) {
  if (session.hasFinished() || answeredCurrentQuestion) return;

  selectedAnswerIndex = selectedIndex;
  dom.btnNextQuestion.disabled = false;

  dom.optionButtons.forEach((button, index) => {
    button.classList.toggle('selected', index === selectedIndex);
    button.classList.remove('correct', 'wrong');
  });
}

function revealAnswer(result, selectedIndex, timedOut = false) {
  const question = currentQuestionSnapshot;

  document.querySelector('.options-grid')?.classList.add('answered');

  dom.optionButtons.forEach((button, index) => {
    button.disabled = true;
    button.classList.remove('selected', 'correct', 'wrong');

    if (index === result.correctIndex) {
      button.classList.add('correct');
      return;
    }

    if (timedOut) {
      button.classList.add('wrong');
      return;
    }

    if (index === selectedIndex) {
      button.classList.add('selected', 'wrong');
    }
  });

  if (timedOut && question) {
    dom.questionText.textContent =
      `${question.announced} — Temps esgotat. La resposta compta com a incorrecta.`;
  }
}

function submitAnswer({ timedOut = false } = {}) {
  if (session.hasFinished() || answeredCurrentQuestion) return;

  if (!timedOut && selectedAnswerIndex === null) return;

  stopTimer();
  clearTimerState();

  answeredCurrentQuestion = true;

  const selectedIndex = timedOut
    ? getTimeoutWrongIndex(currentQuestionSnapshot)
    : selectedAnswerIndex;

  const result = session.answer(selectedIndex);
  const isLastQuestion = result.finished;

  revealAnswer(result, selectedIndex, timedOut);

  dom.currentScore.textContent = String(result.score);

  dom.btnNextQuestion.disabled = false;
  dom.btnNextQuestion.textContent = isLastQuestion
    ? 'Finalitzar test'
    : 'Següent pregunta';
}

/* =========================
   EVENTS / INIT
========================= */

function bindEvents() {
  dom.optionButtons.forEach(button => {
    button.addEventListener('click', () => {
      selectAnswer(Number(button.dataset.index));
    });
  });

  dom.btnNextQuestion.addEventListener('click', () => {
    if (answeredCurrentQuestion) {
      renderQuestion();
      return;
    }

    submitAnswer();
  });

  dom.btnLeave?.addEventListener('click', goHome);
}

async function init() {
  bindEvents();

  const selectedTheme = loadSelectedTheme();

  if (!selectedTheme) {
    dom.questionText.textContent = 'No has seleccionat cap categoria.';
    setTimeout(goHome, 1200);
    return;
  }

  try {
    currentTheme = await getThemeByName(selectedTheme);
    session = await loadQuizSession(selectedTheme);
    renderQuestion();
  } catch (error) {
    console.error(error);
    dom.questionText.textContent = 'No s’ha pogut carregar el quiz.';
  }
}

await init();