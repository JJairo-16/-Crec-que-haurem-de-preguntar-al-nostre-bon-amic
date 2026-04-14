// GESTIÓ DE PANTALLA DE INICI SENSE CAP IMPLEMENTACIO PREGUNTES, ENCARA HI HA QUE IMPLEMENTAR COSES


document.addEventListener('DOMContentLoaded', () => {
    
    
    const btnEnter = document.getElementById('btn-enter');
    const userNameInput = document.getElementById('user-name');
    const sectionNameInput = document.getElementById('section-name-input');
    const sectionCategorySelect = document.getElementById('section-category-select');
    const displayName = document.getElementById('display-name');

    

   
    btnEnter.addEventListener('click', () => {
        console.log('Button clicked');
        const userName = userNameInput.value.trim();
        console.log('Username entered:', userName);

        // Validar que el nom no estigui vuit
        if (userName === '') {
            alert('Siusplau, ingresa el teu nom');
            return;
        }

        
        window.playerName = userName;

        displayName.textContent = userName;
        sectionNameInput.style.display = 'none';
        sectionCategorySelect.style.display = 'block';
    });

    // Permitir Enter en el input
    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnEnter.click();
        }
    });
});
