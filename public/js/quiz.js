import { createQuizSession, QuizSession } from './libs/quiz-service.js';
import { createSessionStorageAdapter } from './libs/storage-adapter.js';
import { getThemeByName } from './libs/themes-loader.js';

const PLAYER_NAME_KEY = 'playerName';
const SELECTED_THEME_KEY = 'selectedTheme';
const CURRENT_SCREEN_KEY = 'currentScreen';
const QUIZ_STATE_KEY = 'quizState';

const storage = createSessionStorageAdapter(sessionStorage);

let session = null;
let isAnswering = false;
let currentTheme = null;

const dom = {
  theme: document.getElementById('current-theme'),
  questionText: document.getElementById('question-text'),
  currentQuestion: document.getElementById('current-question'),
  totalQuestions: document.getElementById('total-questions'),
  currentScore: document.getElementById('current-score'),
  progressBar: document.getElementById('progress-bar'),
  btnLeave: document.getElementById('btn-leave'),
  btnNextQuestion: document.getElementById('btn-next-question'),
  optionButtons: [
    document.getElementById('option-a'),
    document.getElementById('option-b'),
    document.getElementById('option-c'),
    document.getElementById('option-d')
  ]
};

function loadSelectedTheme() {
  return sessionStorage.getItem(SELECTED_THEME_KEY) ?? '';
}

function loadPlayerName() {
  return sessionStorage.getItem(PLAYER_NAME_KEY) ?? '';
}

function saveCurrentScreen(screen) {
  sessionStorage.setItem(CURRENT_SCREEN_KEY, screen);
}

function goHome() {
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

  return createQuizSession({
    themeName,
    storage,
    stateKey: QUIZ_STATE_KEY
  });
}

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
  dom.btnNextQuestion.hidden = true;

  dom.optionButtons.forEach(button => {
    button.disabled = false;
    button.style.display = '';
    button.classList.remove('selected', 'correct', 'wrong');
    button.textContent = '';
  });
}

function renderQuestion() {
  isAnswering = false;

  if (session.hasFinished()) {
    renderResults();
    return;
  }

  const question = session.getQuestion();
  const theme = session.getTheme();

  dom.theme.textContent = theme.name ?? loadSelectedTheme();
  dom.questionText.textContent = question.announced;

  resetOptions();
  updateProgress();

  question.options.forEach((option, index) => {
    const button = dom.optionButtons[index];

    if (!button) {
      return;
    }

    button.textContent = option.text;
    button.dataset.index = String(index);
  });

  for (let i = question.options.length; i < dom.optionButtons.length; i++) {
    dom.optionButtons[i].style.display = 'none';
  }
}

function renderResults() {
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
    globalThis.location.href = './quiz.html';
  });

  document.getElementById('btn-exit').addEventListener('click', () => {
    storage.remove(QUIZ_STATE_KEY);
    globalThis.location.href = './index.html';
  });
}

function selectAnswer(selectedIndex) {
  if (isAnswering || session.hasFinished()) {
    return;
  }

  isAnswering = true;

  const result = session.answer(selectedIndex);

  dom.optionButtons.forEach((button, index) => {
    button.disabled = true;

    if (index === selectedIndex && !result.correct) {
      button.classList.add('wrong');
    }

    if (index === result.correctIndex) {
      button.classList.add('correct');
    }
  });

  dom.currentScore.textContent = String(result.score);
  updateProgress();

  dom.btnNextQuestion.hidden = false;
}

function bindEvents() {
  dom.optionButtons.forEach(button => {
    button.addEventListener('click', () => {
      selectAnswer(Number(button.dataset.index));
    });
  });

  dom.btnNextQuestion.addEventListener('click', () => {
    renderQuestion();
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