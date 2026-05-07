# Crec que haurem de preguntar al nostre bon amic

![Status](https://img.shields.io/badge/Status-Development-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ▌Què és?

**Crec que haurem de preguntar al nostre bon amic** és un joc de preguntes de diversos temes on els usuaris poden posar a prova els seus coneixements en diferents àrees.

L’objectiu és oferir una experiència interactiva i dinàmica que combini entreteniment i aprenentatge.

---

## ▌Objectiu del Projecte

El projecte busca:

- Fomentar l’aprenentatge general  
- Posar a prova coneixements diversos  
- Crear una experiència interactiva  
- Promoure la participació entre usuaris  

---

## ▌Funcionalitats Implementades

### Pantalla d'Inici
- **Introducció de nom**: L'usuari entra al joc amb el seu nom personalitzat
- **Validació d'entrada**: Verificació de nom correcte i feedback visual d'errors

### Selecció de Temes
- **Carga dinàmica de categorias**: Sistema modular que carrega temes des de fitxers JSON
- **Interfície visual atractiva**: Cada tema té imatge (mascota), nom i gradient de color personalitzat
- **Temes disponibles actuals**: 
  - **Cine**
  - **Esports**
- **Capacitat de cambiar Nom**: Et torna a la web principal per poder cambiar el nom

### Pantalla de Resultats
- **Visualització de puntuació**: Mostra el percentatge de preguntes acertades amb gradient visual
- **Mascota temàtica**: Apareix la mascota del tema seleccionat amb animació
- **Opcions de continuació**: 
  - **"Tornar a jugar"**: Permet jugar novament amb el mateix tema (neteja la sessió anterior)
  - **"Sortir"**: Retorna a la selecció de temes
- **Estilos animats**: Transicions suaus i efectes de bounce per a millor experiència

### Gestió de Sesions i Persistència
- **Recuperació automàtica de sesions**: Si l'usuari tanca accidentalment el navegador, la sessió es recupera per al mateixa categoria
- **Persistència de timer**: L'estat del timer es guarda i recupera correctament entre recarregues
- **Emmagatzematge modular**: Sistema adapter (`storage-adapter.js`) que permet canviar entre SessionStorage, localStorage o emmagatzematge en memòria
- **Gestió d'estat avançada**: Control complet del estat del joc inclòs:
  - Preguntes respondides
  - Respostes seleccionades
  - Puntuació actual
  - Índex de pregunta actual
  - Temps restant del timer

### Opcions de Navegació
- **Botó "Abandonar quiz"**: Permet sortir del quiz en qualsevol moment (retorna a selecció de temes)
- **Canvi de nom**: Els usuaris poden tornar a la pantalla inicial per canviar de nom sense perdre la sessió del quiz (si volen reprendre-la)
- **Gestió de navegació clara**: Controls ben definits entre les tres pantalles principals (Nom → Temes → Quiz → Resultats)
### Sistema de Preguntes

Els usuaris participen responent preguntes de diferents categories:

Característiques:

- **Selecció dinàmica de preguntes**: Carrega des de fitxers JSON específics per cada tema
- **Barreja aleatòria**: Les preguntes es mostren en ordre aleatori (algoritme Fisher-Yates)
- **Validació de respostes en temps real**: Feedback immediat de correctesa
- **Canvi de resposta**: L'usuari pot canviar de resposta mentre no hagi anat a la següent pregunta
- **Progressió basada en encerts**: Seguiment del rendiment durant la sessió
- **15 preguntes per sessió**: Nombre configurable de preguntes
- **Interfície del Quiz mejorada**: Pantalla dedicada amb estilos moderns i responsiva
- **Feedback visual**: Les respostes es mostren amb colors:
  - **Blau**: Resposta seleccionada per l'usuari
  - **Verd**: Resposta correcta (revelada després de responder)
  - **Roig**: Resposta incorrecta (si l'usuari es va equivocar)
- **Últim botó personalitzat**: El botó de navegació canvia a "Finalitzar test" en l'última pregunta
- **Sistema de Timer**: 20 segons per pregunta amb visualització en temps real
  - Barra de progres visual del temps restant
  - Canvi a roig quan quedan ≤5 segons
  - Auto-envio de resposta si s'agota el temps (compte com a incorrecta)
  - Persistència del temps restant si es tanca accidentalment la sessió
- **Contador de progres amb porcentatge**: Mostra pregunta actual, total i percentatge de progres
- **Puntuació en temps real**: Display de la puntuació actual durant el quiz

---

## ▌Arquitectura Tècnica

### Stack Tecnològic
- **Frontend**: HTML5, CSS3, JavaScript (ES Modules)
- **Dades**: JSON per a temes i preguntes
- **Emmagatzematge**: SessionStorage per a persistència de sessió
- **Arquitectura**: Modular amb librerías especializadas
- **Estilos**: CSS3 amb animacions, gradients i transicions suaves

### Librerías Implementades
- **`quiz-service.js`**: Gestor de sessions de quiz amb control d'estat del joc
- **`themes-loader.js`**: Carga dinàmica de temes i preguntes, barreja aleatòria
- **`storage-adapter.js`**: Sistema adapter per a emmagatzematge en memòria i sessionStorage
### Sistema de Emmagatzematge Adaptable
- **Arquitectura adapter**: Permet canviar la implementació del almacenamiento sense canviar el codi que l'utilitza
- **SessionStorage integrat**: Per defecte usa SessionStorage per a persistència dins de la mateixa sessió del navegador
- **Extensible**: Pot estendre's fàcilment per suportar localStorage, IndexedDB o altres sistemes d'emmagatzematge
- **Mètodes principals**:
  - `get(key)`: Recupera un valor (parseado de JSON si necessari)
  - `set(key, value)`: Guarda un valor (serialitzat a JSON automàticament)
  - `remove(key)`: Elimina una clau
- **Gestió segura de dades**: Includes type checking i manejo d'errors per a accesos segurs
### Característiques CSS Implementades
- **Classe `.selected`**: Estil visual en color azul per a respostes seleccionades
- **Classe `.correct`**: Estil visual en color verd per a respostes correctes
- **Classe `.wrong`**: Estil visual en color roig per a respostes incorrectes
- **Classe `.answered`**: Estil per a la grid de respostes quan ja s'ha contestat
- **Classe `.timer-danger`**: Estil (roig/alarma) quan quedan ≤5 segons
- **Animacions**: Transicions suaus (ease-out-soft, ease-spring) per a tots els elements
- **Efectes hover**: Levantament visual i efectes de brillantesa en botons
- **Pantalla de resultats**: Estilos completes amb gradients, animacions bounce i layout flexible
- **Display del timer**: Barra de progres visual dinàmica que es actualitza en temps real
- **Contador de progres**: Barra de progres visual i text amb porcentatge
- **Responsivitat**: Media queries per a dispositius petits (620px, 380px)
### Característiques de Desenvolupament
- Modularització amb ES6 Modules
- Cache en memòria per optimitzar carregues
- Copia defensiva de dades per evitar mutacions externes
- Validació i gestió d'errors
- Control d'estat per a permitir canvi de resposta sense afectar puntuació
- Flag `answeredCurrentQuestion` per a gestionar una sola actualització de punts per pregunta
- Dinàmica de botons amb text condicional (Següent pregunta / Finalitzar test)
- **Sistema de Timer avançat**: 
  - Ús de `requestAnimationFrame` per a precisió temporal
  - Càlcul de delta entre frames per a precisió independent de la frame rate
  - Persistència del temps restant en SessionStorage
  - Auto-envio de resposta quan s'agota el temps
  - Recuperació del timer si es tanca accidentalment la finestra
- **Snapshot de preguntes**: Cópia de la pregunta actual per evitar mutacions
- **Gestió inteligent de sesions**: 
  - Validació de sesions guardades antes de reutilitzar-les
  - Verificació de tipus i estructura de dades
  - Descart de sesions incompatibles o corruptes
- **Manejo de timeout automàtic**: Selecciona una resposta incorrecta random si s'agota el temps
---

## ▌Sistema de Puntuació

Cada resposta correcta genera punts segons:

- Dificultat de la pregunta  
- Rapidesa en la resposta  
- Consistència de l’usuari  

Els punts permeten:

- Classificacions entre usuaris  
- Seguiment del rendiment personal  
- Progressió dins del joc  

---

## ▌Estructura del Projecte

```
.
├── public/                    # Carpeta pública amb els recursos del joc
│   ├── index.html            # Pantalla d'inici i selecció de categorias
│   ├── quiz.html             # Pantalla del quiz i resultats
│   ├── css/
│   │   └── style.css         # Estilos principals de l'aplicació
│   ├── data/
│   │   ├── themes.json       # Definició de temes disponibles
│   │   ├── cine.json         # Preguntes de Cine
│   │   └── sports.json       # Preguntes de Esports
│   ├── img/                  # Imatges i mascotes
│   └── js/
│       ├── main.js           # Script principal de l'aplicació
│       ├── quiz.js           # Lógica del quiz
│       └── libs/
│           ├── quiz-service.js     # Servei de gestió de sesions
│           ├── themes-loader.js    # Cargador dinàmic de temes
│           └── storage-adapter.js  # Adapter de emmagatzematge
├── README.md                 # Aquest fitxer
└── LICENSE                   # Llicència MIT
```

---

## ▌Interfície del Quiz - Elementi de Pantalla

### Pantalla del Quiz
La interfície del quiz consta dels següents elements:

- **Tema actual**: Mostra el nom del tema seleccionat
- **Contador de pregunta**: Mostra "Pregunta X de Y (Z%)"
- **Display de puntuació**: Mostra la puntuació actual en temps real
- **Display del timer**: 
  - Text del temps restant ("20s", "19s", etc.)
  - Barra visual de progres del timer que es rellena de dreta a esquerra
  - Canvia a roig quan quedan 5 segons o menys
- **Barra de progres general**: Mostra visualment el progres del test
- **Caixa de pregunta**: Contè el text de la pregunta actual
- **Grid de respostes**: 4 botons amb les opcions de resposta (A, B, C, D)
  - Dinàmicament oculta opcions si la pregunta n'te menys de 4
  - Feedback visual immediat al fer clic
- **Botons de navegació**:
  - **"Enviar"**: Envia la resposta seleccionada (inicialment desabilitat)
  - **"Següent pregunta"**: Carrega la següent pregunta (mostrat després de contestar)
  - **"Finalitzar test"**: En l'última pregunta, canvia el text del botó per indicar fi del test
  - **"Abandonar quiz"**: Permet sortir del quiz en qualsevol moment

---


El sistema inclou elements de joc:

- Rankings entre usuaris  
- Progressió personal  
- Sistema de puntuació dinàmic  
- Incentius per constància  

---

## ▌Com Executar el Projecte

### Requisits
- Navegador web modern (Chrome, Firefox, Safari, Edge)
- No es requereix cap dependència externa ni servidor

### Inici Ràpid
1. Clona o descarrega el repositori
2. Obri `public/index.html` al navegador
3. Introduïeix el teu nom i comença a jugar!

### Desenvolupament
El projecte utilitza **ES6 Modules**, per la qual cosa és recomanable executar-lo amb un servidor local:

- **Live Server**: Executar index.html amb extensió de visual *Live Server* **instalada** (clickdret[Obrir amb liveServer])

---

## ▌Estat del Projecte

Aquest projecte es troba en desenvolupament actiu.

Algunes funcionalitats poden no estar disponibles o poden canviar en futures versions.

---

## ▌Equip de Desenvolupament

- [Jairo Linares](https://www.github.com/JJairo-16)
- [Gerard Pedrosa](https://www.github.com/gerardpedrosa)
- [Ivan Carrasco](https://www.github.com/ByEevee)

---

## ▌Llicència

Aquest projecte està sota la llicència [MIT](LICENSE).