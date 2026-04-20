import {
  loadThemeQuiz,
  createQuizGame,
  getCurrentQuestion,
  answerCurrentQuestion,
  getGameResults,
  isQuestionAnswered,
  isCurrentQuestionAnswered
} from './themes-loader.js';

const DEFAULT_QUESTIONS_AMOUNT = 5;

/**
 * Classe que gestiona una sessió de quiz.
 * Controla l'estat del joc, el progrés, les respostes i la persistència.
 */
export class QuizSession {
  /**
   * @param {Object} params
   * @param {Object} params.game - Estat intern del joc
   * @param {Object} params.theme - Informació del tema
   * @param {Object|null} params.storage - Sistema d'emmagatzematge opcional
   * @param {string} params.stateKey - Clau per guardar l'estat
   */
  constructor({ game, theme, storage = null, stateKey = 'quizState' }) {
    this.game = game;
    this.theme = theme;
    this.storage = storage;
    this.stateKey = stateKey;
  }

  /**
   * Retorna el tema actual del quiz.
   *
   * @returns {Object} Tema actual
   */
  getTheme() {
    return this.theme;
  }

  /**
   * Retorna l'estat complet del joc.
   *
   * @returns {Object} Estat del joc
   */
  getState() {
    return this.game;
  }

  /**
   * Retorna la pregunta actual.
   *
   * @returns {Object|null} Pregunta actual o `null`
   */
  getQuestion() {
    return getCurrentQuestion(this.game);
  }

  /**
   * Indica si el quiz ha finalitzat.
   *
   * @returns {boolean} `true` si ha finalitzat
   */
  hasFinished() {
    return !getCurrentQuestion(this.game);
  }

  /**
   * Comprova si una pregunta concreta ja ha estat resposta.
   *
   * @param {number} questionIndex - Índex de la pregunta
   * @returns {boolean} `true` si ja s'ha respost
   */
  isQuestionAnswered(questionIndex) {
    return isQuestionAnswered(this.game, questionIndex);
  }

  /**
   * Comprova si la pregunta actual ja ha estat resposta.
   *
   * @returns {boolean} `true` si la pregunta actual ja s'ha respost
   */
  isCurrentQuestionAnswered() {
    return isCurrentQuestionAnswered(this.game);
  }

  /**
   * Respon la pregunta actual.
   *
   * @param {number} selectedIndex - Índex de la resposta seleccionada
   * @throws {Error} Si la partida ja ha finalitzat
   * @returns {Object} Resultat de la resposta
   */
  answer(selectedIndex) {
    const currentQuestion = this.getQuestion();

    if (!currentQuestion) {
      throw new Error('La partida ja ha finalitzat');
    }

    const result = answerCurrentQuestion(this.game, selectedIndex);
    this.save();

    return {
      ...result,
      question: currentQuestion,
      finished: this.hasFinished()
    };
  }

  /**
   * Retorna els resultats finals del joc.
   *
   * @returns {Object} Resultats del joc
   */
  getResults() {
    return getGameResults(this.game);
  }

  /**
   * Retorna el progrés actual del quiz.
   *
   * @returns {{ current: number, total: number }} Progrés actual
   */
  getProgress() {
    return {
      current: this.game.currentQuestionIndex + 1,
      total: this.game.questions.length
    };
  }

  /**
   * Guarda l'estat actual al sistema d'emmagatzematge.
   *
   * @returns {void}
   */
  save() {
    if (!this.storage) {
      return;
    }

    this.storage.set(this.stateKey, this.game);
  }

  /**
   * Elimina l'estat guardat.
   *
   * @returns {void}
   */
  clear() {
    if (!this.storage) {
      return;
    }

    this.storage.remove(this.stateKey);
  }
}

/**
 * Crea una nova sessió de quiz.
 *
 * @param {Object} params
 * @param {string} params.themeName - Nom del tema
 * @param {number} [params.amount=DEFAULT_QUESTIONS_AMOUNT] - Nombre de preguntes
 * @param {boolean} [params.shuffleQuestions=true] - Si cal barrejar preguntes
 * @param {boolean} [params.shuffleOptions=true] - Si cal barrejar opcions
 * @param {Object|null} [params.storage=null] - Sistema d'emmagatzematge
 * @param {string} [params.stateKey='quizState'] - Clau d'emmagatzematge
 * @returns {Promise<QuizSession>} Nova sessió creada
 */
export async function createQuizSession({
  themeName,
  amount = DEFAULT_QUESTIONS_AMOUNT,
  shuffleQuestions = true,
  shuffleOptions = true,
  storage = null,
  stateKey = 'quizState'
}) {
  if (!themeName) {
    throw new Error('themeName és obligatori');
  }

  const loaded = await loadThemeQuiz(themeName, {
    amount,
    shuffleQuestions,
    shuffleOptions
  });

  const game = createQuizGame(loaded.questions, {
    themeName: loaded.theme.name
  });

  const session = new QuizSession({
    game,
    theme: loaded.theme,
    storage,
    stateKey
  });

  session.save();

  return session;
}

/**
 * Carrega una sessió existent o en crea una de nova.
 *
 * @param {Object} params
 * @param {string} params.themeName - Nom del tema
 * @param {number} [params.amount=DEFAULT_QUESTIONS_AMOUNT] - Nombre de preguntes
 * @param {boolean} [params.shuffleQuestions=true] - Si cal barrejar preguntes
 * @param {boolean} [params.shuffleOptions=true] - Si cal barrejar opcions
 * @param {Object|null} [params.storage=null] - Sistema d'emmagatzematge
 * @param {string} [params.stateKey='quizState'] - Clau d'emmagatzematge
 * @returns {Promise<QuizSession>} Sessió carregada o creada
 */
export async function loadOrCreateQuizSession({
  themeName,
  amount = DEFAULT_QUESTIONS_AMOUNT,
  shuffleQuestions = true,
  shuffleOptions = true,
  storage = null,
  stateKey = 'quizState'
}) {
  if (!themeName) {
    throw new Error('themeName és obligatori');
  }

  const savedGame = storage?.get(stateKey) ?? null;

  if (savedGame?.themeName === themeName) {
    return new QuizSession({
      game: savedGame,
      theme: { name: themeName },
      storage,
      stateKey
    });
  }

  return createQuizSession({
    themeName,
    amount,
    shuffleQuestions,
    shuffleOptions,
    storage,
    stateKey
  });
}