// themes-loader.js

const DEFAULT_THEMES_PATH = './data/themes.json';

/**
 * Barreja un array sense modificar l'original.
 * Algorisme Fisher-Yates.
 * @param {Array} array
 * @returns {Array}
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
 * @param {string} path
 * @returns {Promise<any>}
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
 * @param {any} themes
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
 * @param {any} quiz
 */
export function validateQuiz(quiz) {
    if (!Array.isArray(quiz)) {
        throw new TypeError('El quiz ha de ser un array de preguntes');
    }

    for (const [questionIndex, question] of quiz.entries()) {
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
            if (typeof option !== 'object' || option === null) {
                throw new Error(
                    `L'opció #${optionIndex + 1} de la pregunta "${question.announced}" no és vàlida`
                );
            }

            if (typeof option.text !== 'string') {
                throw new TypeError(
                    `L'opció #${optionIndex + 1} de la pregunta "${question.announced}" ha de tenir "text"`
                );
            }

            if (typeof option.correct !== 'boolean') {
                throw new TypeError(
                    `L'opció "${option.text}" de la pregunta "${question.announced}" ha de tenir "correct" booleà`
                );
            }

            if (option.correct) correctCount++;
        }

        if (correctCount === 0) {
            throw new Error(`La pregunta "${question.announced}" no té cap resposta correcta`);
        }
    }
}

/**
 * Retorna una còpia profunda simple d'un quiz.
 * @param {Array} quiz
 * @returns {Array}
 */
export function cloneQuiz(quiz) {
    return quiz.map(question => ({
        ...question,
        options: question.options.map(option => ({ ...option }))
    }));
}

/**
 * Carrega la llista de temes.
 */
export async function loadThemes(themesPath = DEFAULT_THEMES_PATH) {
    const themes = await fetchJson(themesPath);
    validateThemes(themes);

    return themes.map(theme => ({
        name: theme.name,
        path: theme.path
    }));
}

/**
 * Busca un tema pel seu nom.
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
 */
export async function loadQuiz(
    path,
    amount = null,
    shuffleQuestions = true,
    shuffleOptions = true
) {
    const quiz = await fetchJson(`data/${path}`);
    validateQuiz(quiz);

    let result = cloneQuiz(quiz);

    if (shuffleQuestions) result = shuffleArray(result);

    if (shuffleOptions) {
        result = result.map(q => ({
            ...q,
            options: shuffleArray(q.options)
        }));
    }

    if (amount == null) return result;

    if (!Number.isInteger(amount) || amount < 1) {
        throw new Error('amount ha de ser un número enter major que 0');
    }

    return result.slice(0, amount);
}

/**
 * Carrega un quiz per nom de tema.
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
 */
export function isCorrectOption(option) {
    if (!option || typeof option.correct !== 'boolean') {
        throw new Error('Opció invàlida');
    }
    return option.correct;
}

/**
 * Retorna l'índex de la resposta correcta.
 */
export function getCorrectOptionIndex(question) {
    if (!question || !Array.isArray(question.options)) {
        throw new Error('Pregunta invàlida');
    }
    return question.options.findIndex(opt => opt.correct);
}

/**
 * Comprova una resposta.
 */
export function checkAnswer(question, selectedIndex) {
    if (!Number.isInteger(selectedIndex)) {
        throw new TypeError('selectedIndex ha de ser un enter');
    }

    return Boolean(question.options[selectedIndex].correct);
}

/**
 * Crea l'estat del joc.
 */
export function createQuizGame(questions, extra = {}) {
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No hi ha preguntes per crear el joc');
    }

    return {
        themeName: extra.themeName ?? null,
        questions: cloneQuiz(questions),
        currentQuestionIndex: 0,
        score: 0,
        answers: [],
        finished: false
    };
}

/**
 * Obté la pregunta actual.
 */
export function getCurrentQuestion(game) {
    if (game.finished) return null;
    return game.questions[game.currentQuestionIndex] ?? null;
}

/**
 * Respon la pregunta actual.
 */
export function answerCurrentQuestion(game, selectedIndex) {
    const question = getCurrentQuestion(game);

    const correct = checkAnswer(question, selectedIndex);
    const correctIndex = getCorrectOptionIndex(question);

    game.answers.push({ selectedIndex, correct });

    if (correct) game.score++;

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
 * @param {object} game
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