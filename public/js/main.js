import { loadThemes } from './libs/themes-loader.js';

const PLAYER_NAME_KEY = 'playerName';

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

async function initThemesPage() {
    const app = document.getElementById('app');

    const name_label = createElement('p', {
        text: 'Nom: '
    });

    const name_input = createElement('input');
    name_input.placeholder = 'Introdueix el teu nom';

    const savedName = sessionStorage.getItem(PLAYER_NAME_KEY);
    if (savedName) {
        name_input.value = savedName;
    }

    try {
        const themes = await loadThemes();

        const title = document.createElement('h1');
        title.textContent = 'Selecciona un tema';

        const list = document.createElement('div');

        themes.forEach(theme => {
            const button = document.createElement('button');
            button.textContent = theme.name;

            button.addEventListener('click', () => {
                const name = name_input.value.trim();

                if (!name) {
                    alert('Si us plau, introdueix el teu nom');
                    return;
                }

                sessionStorage.setItem(PLAYER_NAME_KEY, name);

                sessionStorage.setItem('selectedTheme', theme.name);

                globalThis.location.href = './quiz.html';
            });

            list.appendChild(button);
        });

        app.appendChild(title);
        app.appendChild(name_label);
        app.appendChild(name_input);
        app.appendChild(list);
    } catch (error) {
        console.error(error);
        app.textContent = `Error: ${error.message}`;
    }
}

await initThemesPage();