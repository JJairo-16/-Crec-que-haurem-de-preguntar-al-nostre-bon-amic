const DEFAULT_THEMES_PATH = './data/themes.json';

/**
 * Caché en memòria de la llista de temes carregada des de themes.json.
 * La clau és la ruta del fitxer de temes.
 * @type {Map<string, Array<{name: string, path: string}>>}
 */
const themesCache = new Map();

/**
 * Barreja un array sense modificar l'original.
 * Algorisme Fisher-Yates.
 *
 * @param {Array} array - Array a barrejar
 * @returns {Array} Nova còpia de l'array barrejada
 */
export function shuffleArray(array) {
  if (!Array.isArray(array)) {
    throw new TypeError('shuffleArray esperava un array');
  }

  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Fa fetch i retorna JSON validant errors HTTP.
 *
 * @param {string} path - Ruta del fitxer JSON
 * @returns {Promise<any>} Contingut parsejat del JSON
 */
export async function fetchJson(path) {
  const res = await fetch(path);

  if (!res.ok) {
    throw new Error(`Error en carregar "${path}": ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Valida la llista de temes.
 *
 * @param {any} themes - Contingut de themes.json
 * @returns {void}
 */
export function validateThemes(themes) {
  if (!Array.isArray(themes)) {
    throw new TypeError('themes.json ha de contenir un array');
  }

  for (const theme of themes) {
    if (typeof theme !== 'object' || theme === null) {
      throw new Error('Cada tema ha de ser un objecte');
    }

    if (typeof theme.name !== 'string' || theme.name.trim() === '') {
      throw new Error('Cada tema ha de tenir un "name" vàlid');
    }

    if (typeof theme.path !== 'string' || theme.path.trim() === '') {
      throw new Error(`El tema "${theme.name}" ha de tenir un "path" vàlid`);
    }
  }
}

/**
 * Valida un quiz.
 *
 * @param {any} quiz - Array de preguntes
 * @returns {void}
 */
export function validateQuiz(quiz) {
  if (!Array.isArray(quiz)) {
    throw new TypeError('El quiz ha de ser un array de preguntes');
  }

  for (const [questionIndex, question] of quiz.entries()) {
    validateQuestion(question, questionIndex);
  }
}

/**
 * Valida una pregunta del quiz.
 *
 * @param {Object} question - Objecte de la pregunta
 * @param {string} question.announced - Enunciat de la pregunta
 * @param {Array<Object>} question.options - Opcions de resposta
 * @param {number} questionIndex - Índex de la pregunta
 * @returns {void}
 */
function validateQuestion(question, questionIndex) {
  if (typeof question !== 'object' || question === null) {
    throw new Error(`La pregunta #${questionIndex + 1} no és vàlida`);
  }

  if (typeof question.announced !== 'string' || question.announced.trim() === '') {
    throw new Error(`La pregunta #${questionIndex + 1} ha de tenir "announced"`);
  }

  if (!Array.isArray(question.options) || question.options.length < 2) {
    throw new Error(`La pregunta "${question.announced}" ha de tenir almenys 2 opcions`);
  }

  let correctCount = 0;

  for (const [optionIndex, option] of question.options.entries()) {
    validateOption(optionIndex, option, question);
    if (option.correct) correctCount++;
  }

  if (correctCount === 0) {
    throw new Error(`La pregunta "${question.announced}" no té cap resposta correcta`);
  }
}

/**
 * Valida una opció d'una pregunta del quiz.
 *
 * @param {number} optionIndex - Índex de l'opció
 * @param {Object} option - Opció a validar
 * @param {string} option.text - Text visible de l'opció
 * @param {boolean} option.correct - Indica si és correcta
 * @param {Object} question - Pregunta propietària
 * @param {string} question.announced - Enunciat de la pregunta
 * @returns {void}
 */
function validateOption(optionIndex, option, question) {
  if (typeof option !== 'object' || option === null) {
    throw new Error(
      `L'opció #${optionIndex + 1} de la pregunta "${question.announced}" no és vàlida`
    );
  }

  if (typeof option.text !== 'string' || option.text.trim() === '') {
    throw new TypeError(
      `L'opció #${optionIndex + 1} de la pregunta "${question.announced}" ha de tenir "text"`
    );
  }

  if (typeof option.correct !== 'boolean') {
    throw new TypeError(
      `L'opció "${option.text}" de la pregunta "${question.announced}" ha de tenir "correct" booleà`
    );
  }
}

/**
 * Carrega la llista de temes.
 * Utilitza caché en memòria per evitar recàrregues repetides.
 *
 * @param {string} [themesPath=DEFAULT_THEMES_PATH] - Ruta del fitxer de temes
 * @returns {Promise<Array<{name: string, path: string}>>} Llista normalitzada de temes
 */
export async function loadThemes(themesPath = DEFAULT_THEMES_PATH) {
  if (themesCache.has(themesPath)) {
    return themesCache.get(themesPath);
  }

  const themes = await fetchJson(themesPath);
  validateThemes(themes);

  const normalizedThemes = themes.map(theme => ({
    name: theme.name,
    path: theme.path
  }));

  themesCache.set(themesPath, normalizedThemes);

  return normalizedThemes;
}

/**
 * Buida la caché de temes.
 *
 * @param {string} [themesPath] - Ruta concreta a invalidar. Si no es passa, s'esborra tota la caché
 * @returns {void}
 */
export function clearThemesCache(themesPath) {
  if (themesPath) {
    themesCache.delete(themesPath);
    return;
  }

  themesCache.clear();
}

/**
 * Busca un tema pel seu nom.
 *
 * @param {string} themeName - Nom del tema
 * @param {string} [themesPath=DEFAULT_THEMES_PATH] - Ruta del fitxer de temes
 * @returns {Promise<{name: string, path: string}>} Tema trobat
 */
export async function getThemeByName(themeName, themesPath = DEFAULT_THEMES_PATH) {
  const themes = await loadThemes(themesPath);
  const theme = themes.find(item => item.name === themeName);

  if (!theme) {
    throw new Error(`No s'ha trobat el tema "${themeName}"`);
  }

  return theme;
}

/**
 * Carrega el quiz d'un tema.
 * No clona les preguntes perquè provenen d'un JSON controlat.
 *
 * @param {string} path - Ruta del fitxer del quiz
 * @param {number|null} [amount=null] - Nombre màxim de preguntes
 * @param {boolean} [shuffleQuestions=true] - Si s'han de barrejar les preguntes
 * @param {boolean} [shuffleOptions=true] - Si s'han de barrejar les opcions
 * @returns {Promise<Array>} Array de preguntes preparades
 */
export async function loadQuiz(
  path,
  amount = null,
  shuffleQuestions = true,
  shuffleOptions = true
) {
  const quiz = await fetchJson(`data/${path}`);
  validateQuiz(quiz);

  let result = quiz;

  if (shuffleQuestions) {
    result = shuffleArray(result);
  }

  if (shuffleOptions) {
    result = result.map(question => ({
      ...question,
      options: shuffleArray(question.options)
    }));
  }

  if (amount == null) {
    return result;
  }

  if (!Number.isInteger(amount) || amount < 1) {
    throw new Error('amount ha de ser un número enter major que 0');
  }

  return result.slice(0, amount);
}

/**
 * Carrega un quiz a partir del nom d'un tema.
 *
 * @param {string} themeName - Nom del tema
 * @param {Object} [options={}] - Opcions de càrrega
 * @param {string} [options.themesPath=DEFAULT_THEMES_PATH] - Ruta del fitxer de temes
 * @param {number|null} [options.amount=null] - Nombre màxim de preguntes
 * @param {boolean} [options.shuffleQuestions=true] - Si s'han de barrejar les preguntes
 * @param {boolean} [options.shuffleOptions=true] - Si s'han de barrejar les opcions
 * @returns {Promise<{theme: {name: string, path: string}, questions: Array}>}
 */
export async function loadThemeQuiz(themeName, options = {}) {
  const {
    themesPath = DEFAULT_THEMES_PATH,
    amount = null,
    shuffleQuestions = true,
    shuffleOptions = true
  } = options;

  const theme = await getThemeByName(themeName, themesPath);
  const questions = await loadQuiz(
    theme.path,
    amount,
    shuffleQuestions,
    shuffleOptions
  );

  return { theme, questions };
}

/**
 * Comprova si una opció és correcta.
 *
 * @param {Object} option - Opció a comprovar
 * @returns {boolean} `true` si l'opció és correcta
 */
export function isCorrectOption(option) {
  if (!option || typeof option.correct !== 'boolean') {
    throw new Error('Opció invàlida');
  }

  return option.correct;
}

/**
 * Retorna l'índex de la resposta correcta.
 *
 * @param {Object} question - Pregunta
 * @param {Array<Object>} question.options - Opcions de la pregunta
 * @returns {number} Índex de l'opció correcta o `-1` si no existeix
 */
export function getCorrectOptionIndex(question) {
  if (!question || !Array.isArray(question.options)) {
    throw new Error('Pregunta invàlida');
  }

  return question.options.findIndex(opt => opt.correct);
}

/**
 * Comprova si una pregunta concreta ja ha estat resposta.
 *
 * És compatible amb dos formats:
 * - antic: es dedueix per la posició (`questionIndex < answers.length`)
 * - nou: cada resposta pot incloure `questionIndex`
 *
 * @param {Object} game - Estat del joc
 * @param {number} questionIndex - Índex de la pregunta
 * @returns {boolean} `true` si la pregunta ja ha estat resposta
 */
export function isQuestionAnswered(game, questionIndex) {
  if (!game || !Array.isArray(game.answers)) {
    throw new Error('Estat del joc invàlid');
  }

  if (!Number.isInteger(questionIndex) || questionIndex < 0) {
    throw new TypeError('questionIndex ha de ser un enter major o igual que 0');
  }

  if (game.answers.length === 0) {
    return false;
  }

  const hasIndexedAnswers = game.answers.some(
    answer => answer && Number.isInteger(answer.questionIndex)
  );

  if (hasIndexedAnswers) {
    return game.answers.some(answer => answer?.questionIndex === questionIndex);
  }

  return questionIndex < game.answers.length;
}

/**
 * Comprova si la pregunta actual ja ha estat resposta.
 *
 * @param {Object} game - Estat del joc
 * @returns {boolean} `true` si la pregunta actual ja està resposta
 */
export function isCurrentQuestionAnswered(game) {
  if (!game || typeof game.currentQuestionIndex !== 'number') {
    throw new Error('Estat del joc invàlid');
  }

  return isQuestionAnswered(game, game.currentQuestionIndex);
}

/**
 * Comprova una resposta seleccionada per l'usuari.
 *
 * @param {Object} question - Pregunta actual
 * @param {number} selectedIndex - Índex de l'opció seleccionada
 * @returns {boolean} `true` si la resposta és correcta
 */
export function checkAnswer(question, selectedIndex) {
  if (!question || !Array.isArray(question.options)) {
    throw new Error('Pregunta invàlida');
  }

  if (!Number.isInteger(selectedIndex)) {
    throw new TypeError('selectedIndex ha de ser un enter');
  }

  if (selectedIndex < 0 || selectedIndex >= question.options.length) {
    throw new RangeError('selectedIndex fora de rang');
  }

  return question.options[selectedIndex].correct;
}

/**
 * Crea l'estat inicial del joc.
 * No es clonen les preguntes per evitar cost innecessari.
 *
 * @param {Array} questions - Preguntes del quiz
 * @param {Object} [extra={}] - Dades extra del joc
 * @param {string|null} [extra.themeName=null] - Nom del tema
 * @returns {{
 *   themeName: string | null,
 *   questions: Array,
 *   currentQuestionIndex: number,
 *   score: number,
 *   answers: Array,
 *   finished: boolean
 * }}
 */
export function createQuizGame(questions, extra = {}) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No hi ha preguntes per crear el joc');
  }

  return {
    themeName: extra.themeName ?? null,
    questions,
    currentQuestionIndex: 0,
    score: 0,
    answers: [],
    finished: false
  };
}

/**
 * Obté la pregunta actual.
 *
 * @param {Object} game - Estat del joc
 * @returns {Object|null} Pregunta actual o `null` si el joc ha acabat
 */
export function getCurrentQuestion(game) {
  if (game.finished) {
    return null;
  }

  return game.questions[game.currentQuestionIndex] ?? null;
}

/**
 * Respon la pregunta actual.
 *
 * Manté compatibilitat amb el format antic d'`answers` afegint dades noves
 * sense eliminar les existents.
 *
 * @param {Object} game - Estat mutable del joc
 * @param {number} selectedIndex - Índex de l'opció seleccionada
 * @returns {{
 *   correct: boolean,
 *   correctIndex: number,
 *   finished: boolean,
 *   score: number
 * }}
 */
export function answerCurrentQuestion(game, selectedIndex) {
  const question = getCurrentQuestion(game);

  if (!question) {
    throw new Error('No hi ha cap pregunta actual');
  }

  const questionIndex = game.currentQuestionIndex;
  const correct = checkAnswer(question, selectedIndex);
  const correctIndex = getCorrectOptionIndex(question);

  game.answers.push({
    questionIndex,
    selectedIndex,
    correct
  });

  if (correct) {
    game.score++;
  }

  game.currentQuestionIndex++;

  if (game.currentQuestionIndex >= game.questions.length) {
    game.finished = true;
  }

  return {
    correct,
    correctIndex,
    finished: game.finished,
    score: game.score
  };
}

/**
 * Retorna un resum final del joc.
 *
 * @param {Object} game - Estat del joc
 * @returns {{
 *   total: number,
 *   correct: number,
 *   incorrect: number,
 *   score: number,
 *   percentage: number,
 *   answers: Array
 * }}
 */
export function getGameResults(game) {
  if (!game || !Array.isArray(game.questions)) {
    throw new Error('Estat del joc invàlid');
  }

  const total = game.questions.length;
  const correct = game.score;
  const incorrect = total - correct;
  const percentage = total > 0 ? (correct / total) * 100 : 0;

  return {
    total,
    correct,
    incorrect,
    score: correct,
    percentage,
    answers: [...game.answers]
  };
}