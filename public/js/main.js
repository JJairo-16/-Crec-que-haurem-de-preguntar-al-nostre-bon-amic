import { loadThemes } from './themes-loader.js';

async function initThemesPage() {
    const app = document.getElementById('app');

    try {
        const themes = await loadThemes();

        const title = document.createElement('h1');
        title.textContent = 'Selecciona un tema';

        const list = document.createElement('div');

        themes.forEach(theme => {
            const button = document.createElement('button');
            button.textContent = theme.name;

            button.addEventListener('click', () => {
                sessionStorage.setItem('selectedTheme', theme.name);
                globalThis.location.href = './quiz.html';
            });

            list.appendChild(button);
        });

        app.appendChild(title);
        app.appendChild(list);
    } catch (error) {
        console.error(error);
        app.textContent = `Error: ${error.message}`;
    }
}

initThemesPage();