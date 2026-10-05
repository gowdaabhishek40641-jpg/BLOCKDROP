/* =========================================================
   BLOCKDROP
   Commit 7
   Achievements + Statistics + Settings
========================================================= */

const ROWS = 20;
const COLS = 10;


/* =========================================================
   DOM
========================================================= */

const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");

const gameBoard = document.getElementById("gameBoard");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");
const comboEl = document.getElementById("combo");
const timerEl = document.getElementById("timer");

const nextPieceEl = document.getElementById("nextPiece");
const holdPieceEl = document.getElementById("holdPiece");

const modeLabel = document.getElementById("modeLabel");
const difficultyLabel = document.getElementById("difficultyLabel");

const gameOverOverlay = document.getElementById("gameOverOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
const countdownOverlay = document.getElementById("countdownOverlay");

const settingsOverlay = document.getElementById("settingsOverlay");
const achievementToast = document.getElementById("achievementToast");

const lineFlash = document.getElementById("lineFlash");
const messageEl = document.getElementById("message");


/* =========================================================
   PIECES
========================================================= */

const PIECES = {

    I: {
        color: "#49eaff",
        shape: [
            [1,1,1,1]
        ]
    },

    O: {
        color: "#ffd95a",
        shape: [
            [1,1],
            [1,1]
        ]
    },

    T: {
        color: "#9b6cff",
        shape: [
            [0,1,0],
            [1,1,1]
        ]
    },

    S: {
        color: "#53f5a5",
        shape: [
            [0,1,1],
            [1,1,0]
        ]
    },

    Z: {
        color: "#ff5577",
        shape: [
            [1,1,0],
            [0,1,1]
        ]
    },

    J: {
        color: "#5c8cff",
        shape: [
            [1,0,0],
            [1,1,1]
        ]
    },

    L: {
        color: "#ff9c55",
        shape: [
            [0,0,1],
            [1,1,1]
        ]
    }

};

const PIECE_KEYS = Object.keys(PIECES);


/* =========================================================
   GAME STATE
========================================================= */

let board = [];

let currentPiece = null;
let nextPiece = null;
let holdPiece = null;

let canHold = true;

let score = 0;
let level = 1;
let lines = 0;
let combo = 0;
let bestComboSession = 0;

let gameMode = "classic";
let difficulty = "normal";

let gameRunning = false;
let paused = false;

let dropTimer = null;
let timeTimer = null;

let timeRemaining = 0;

let clearingRows = [];
let clearTimer = null;


/* =========================================================
   SETTINGS
========================================================= */

let settings = JSON.parse(
    localStorage.getItem("blockdropSettings")
) || {

    sound: true,
    shake: true,
    reducedMotion: false

};

function saveSettings() {

    localStorage.setItem(
        "blockdropSettings",
        JSON.stringify(settings)
    );

}


/* =========================================================
   GLOBAL STATISTICS
========================================================= */

let statistics = JSON.parse(
    localStorage.getItem("blockdropStatistics")
) || {

    totalGames: 0,
    totalScore: 0,
    totalLines: 0,
    bestCombo: 0,
    perfectClears: 0

};

function saveStatistics() {

    localStorage.setItem(
        "blockdropStatistics",
        JSON.stringify(statistics)
    );

}


/* =========================================================
   ACHIEVEMENTS
========================================================= */

const ACHIEVEMENTS = {

    FIRST_DROP: {
        title: "FIRST DROP",
        description: "Start your first game."
    },

    COMBO_5: {
        title: "COMBO MASTER",
        description: "Reach a 5x combo."
    },

    LINE_MASTER: {
        title: "LINE MASTER",
        description: "Clear 100 lines."
    },

    SCORE_10K: {
        title: "10K CLUB",
        description: "Reach 10,000 points."
    },

    PERFECT_CLEAR: {
        title: "PERFECT CLEAR",
        description: "Clear the entire board."
    }

};

let unlockedAchievements = JSON.parse(
    localStorage.getItem("blockdropAchievements")
) || {};


function unlockAchievement(id) {

    if (unlockedAchievements[id]) {
        return;
    }

    unlockedAchievements[id] = true;

    localStorage.setItem(
        "blockdropAchievements",
        JSON.stringify(unlockedAchievements)
    );

    showAchievement(
        ACHIEVEMENTS[id].title
    );

}


function showAchievement(title) {

    const titleEl =
        document.getElementById("achievementTitle");

    titleEl.textContent = title;

    achievementToast.classList.add("show");

    playSound("achievement");

    setTimeout(() => {

        achievementToast.classList.remove("show");

    }, 3000);

}


/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;

function getAudioContext() {

    if (!audioContext) {

        audioContext =
            new (window.AudioContext ||
            window.webkitAudioContext)();

    }

    return audioContext;

}


function playSound(type) {

    if (!settings.sound) {
        return;
    }

    try {

        const ctx = getAudioContext();

        const oscillator =
            ctx.createOscillator();

        const gain =
            ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        const sounds = {

            move: [180, 0.04],
            rotate: [280, 0.05],
            drop: [100, 0.08],
            clear: [500, 0.12],
            combo: [700, 0.15],
            level: [900, 0.2],
            achievement: [1000, 0.3],
            gameover: [80, 0.3]

        };

        const [frequency, duration] =
            sounds[type] || sounds.move;

        oscillator.frequency.setValueAtTime(
            frequency,
            now
        );

        oscillator.type = "sine";

        gain.gain.setValueAtTime(
            0.001,
            now
        );

        gain.gain.exponentialRampToValueAtTime(
            0.08,
            now + 0.01
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + duration
        );

        oscillator.start(now);
        oscillator.stop(now + duration);

    } catch (error) {

        console.log("Audio unavailable.");

    }

}


/* =========================================================
   BOARD
========================================================= */

function createEmptyBoard() {

    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(null)
    );

}


function buildBoardDOM() {

    gameBoard.innerHTML = "";

    for (let i = 0; i < ROWS * COLS; i++) {

        const cell =
            document.createElement("div");

        cell.className = "cell";

        gameBoard.appendChild(cell);

    }

}


function renderBoard() {

    const cells =
        gameBoard.children;

    for (let r = 0; r < ROWS; r++) {

        for (let c = 0; c < COLS; c++) {

            const index =
                r * COLS + c;

            const cell =
                cells[index];

            cell.className = "cell";
            cell.style.removeProperty(
                "--piece-color"
            );

            if (board[r][c]) {

                cell.classList.add("filled");

                cell.style.setProperty(
                    "--piece-color",
                    board[r][c]
                );

            }

        }

    }

    renderCurrentPiece();
    renderGhostPiece();

}


/* =========================================================
   PIECES
========================================================= */

function randomPiece() {

    const key =
        PIECE_KEYS[
            Math.floor(
                Math.random() * PIECE_KEYS.length
            )
        ];

    const source = PIECES[key];

    return {

        type: key,

        color: source.color,

        shape: source.shape.map(
            row => [...row]
        ),

        row: 0,

        col:
            Math.floor(
                (COLS - source.shape[0].length) / 2
            )

    };

}


function spawnPiece() {

    currentPiece =
        nextPiece || randomPiece();

    nextPiece =
        randomPiece();

    currentPiece.row = 0;

    currentPiece.col =
        Math.floor(
            (COLS -
                currentPiece.shape[0].length) / 2
        );

    canHold = true;

    if (
        collision(
            currentPiece,
            0,
            0,
            currentPiece.shape
        )
    ) {

        endGame();

    }

    renderNext();
    renderHold();

}


/* =========================================================
   COLLISION
========================================================= */

function collision(
    piece,
    rowOffset = 0,
    colOffset = 0,
    shape = piece.shape
) {

    for (let r = 0; r < shape.length; r++) {

        for (let c = 0; c < shape[r].length; c++) {

            if (!shape[r][c]) {
                continue;
            }

            const row =
                piece.row + r + rowOffset;

            const col =
                piece.col + c + colOffset;

            if (col < 0 || col >= COLS) {
                return true;
            }

            if (row >= ROWS) {
                return true;
            }

            if (
                row >= 0 &&
                board[row][col]
            ) {

                return true;

            }

        }

    }

    return false;

}


/* =========================================================
   MOVEMENT
========================================================= */

function movePiece(direction) {

    if (!gameRunning || paused || clearingRows.length) {
        return;
    }

    if (
        !collision(
            currentPiece,
            0,
            direction
        )
    ) {

        currentPiece.col += direction;

        playSound("move");

        renderBoard();

    }

}


function moveDown() {

    if (!gameRunning || paused || clearingRows.length) {
        return;
    }

    if (
        !collision(
            currentPiece,
            1,
            0
        )
    ) {

        currentPiece.row++;

    } else {

        lockPiece();

    }

    renderBoard();

}


function hardDrop() {

    if (!gameRunning || paused || clearingRows.length) {
        return;
    }

    let distance = 0;

    while (
        !collision(
            currentPiece,
            distance + 1,
            0
        )
    ) {

        distance++;

    }

    currentPiece.row += distance;

    score += distance * 2;

    updateUI();

    playSound("drop");

    lockPiece();

    renderBoard();

}


/* =========================================================
   ROTATION
========================================================= */

function rotateMatrix(matrix) {

    return matrix[0].map(
        (_, index) =>
            matrix
                .map(row => row[index])
                .reverse()
    );

}


function rotatePiece() {

    if (!gameRunning || paused || clearingRows.length) {
        return;
    }

    const rotated =
        rotateMatrix(
            currentPiece.shape
        );

    const kicks =
        [0, -1, 1, -2, 2];

    for (const offset of kicks) {

        if (
            !collision(
                currentPiece,
                0,
                offset,
                rotated
            )
        ) {

            currentPiece.shape = rotated;
            currentPiece.col += offset;

            playSound("rotate");

            renderBoard();

            return;

        }

    }

}


/* =========================================================
   HOLD
========================================================= */

function holdCurrentPiece() {

    if (
        !gameRunning ||
        paused ||
        !canHold ||
        clearingRows.length
    ) {
        return;
    }

    const stored = currentPiece.type;

    if (!holdPiece) {

        holdPiece = stored;

        spawnPiece();

    } else {

        const swap =
            holdPiece;

        holdPiece = stored;

        const source =
            PIECES[swap];

        currentPiece = {

            type: swap,

            color: source.color,

            shape: source.shape.map(
                row => [...row]
            ),

            row: 0,

            col:
                Math.floor(
                    (COLS -
                        source.shape[0].length) / 2
                )

        };

    }

    canHold = false;

    playSound("rotate");

    renderHold();
    renderBoard();

}


/* =========================================================
   LOCK PIECE
========================================================= */

function lockPiece() {

    for (
        let r = 0;
        r < currentPiece.shape.length;
        r++
    ) {

        for (
            let c = 0;
            c < currentPiece.shape[r].length;
            c++
        ) {

            if (!currentPiece.shape[r][c]) {
                continue;
            }

            const row =
                currentPiece.row + r;

            const col =
                currentPiece.col + c;

            if (
                row >= 0 &&
                row < ROWS &&
                col >= 0 &&
                col < COLS
            ) {

                board[row][col] =
                    currentPiece.color;

            }

        }

    }

    unlockAchievement("FIRST_DROP");

    checkLines();

}


/* =========================================================
   LINE CLEAR
========================================================= */

function checkLines() {

    clearingRows = [];

    for (let r = 0; r < ROWS; r++) {

        if (
            board[r].every(cell => cell)
        ) {

            clearingRows.push(r);

        }

    }

    if (!clearingRows.length) {

        combo = 0;

        spawnPiece();

        renderBoard();

        return;

    }

    combo++;

    bestComboSession =
        Math.max(
            bestComboSession,
            combo
        );

    statistics.totalLines +=
        clearingRows.length;

    lines += clearingRows.length;

    const count =
        clearingRows.length;

    const baseScore = {

        1: 100,
        2: 300,
        3: 500,
        4: 800

    }[count] || 800;

    const comboBonus =
        combo > 1
            ? combo * 50
            : 0;

    score +=
        (baseScore + comboBonus) *
        level;

    lineFlash.classList.remove("active");

    void lineFlash.offsetWidth;

    lineFlash.classList.add("active");

    showMessage(
        count === 4
            ? "TETRIS!"
            : combo > 1
                ? `${combo}X COMBO`
                : `+${count} LINE`
    );

    playSound(
        combo > 1
            ? "combo"
            : "clear"
    );

    if (settings.shake) {

        document.body.classList.remove("shake");

        void document.body.offsetWidth;

        document.body.classList.add("shake");

    }

    if (combo >= 5) {

        unlockAchievement("COMBO_5");

    }

    if (lines >= 100) {

        unlockAchievement("LINE_MASTER");

    }

    if (score >= 10000) {

        unlockAchievement("SCORE_10K");

    }

    clearingRows.forEach(row => {

        for (let c = 0; c < COLS; c++) {

            board[row][c] = null;

        }

    });

    clearTimer = setTimeout(() => {

        removeClearedRows();

    }, 180);

    updateLevel();

    updateUI();

}


function removeClearedRows() {

    board =
        board.filter(
            (_, index) =>
                !clearingRows.includes(index)
        );

    while (board.length < ROWS) {

        board.unshift(
            Array(COLS).fill(null)
        );

    }

    const isPerfectClear =
        board.every(
            row =>
                row.every(
                    cell => !cell
                )
        );

    if (isPerfectClear) {

        score += 2000 * level;

        statistics.perfectClears++;

        unlockAchievement("PERFECT_CLEAR");

        showMessage("PERFECT CLEAR!");

    }

    clearingRows = [];

    spawnPiece();

    renderBoard();

    updateUI();

}


/* =========================================================
   LEVEL
========================================================= */

function updateLevel() {

    const newLevel =
        Math.floor(lines / 10) + 1;

    if (newLevel > level) {

        level = newLevel;

        playSound("level");

        showMessage(
            `LEVEL ${level}`
        );

        startDropTimer();

    }

}


/* =========================================================
   SPEED
========================================================= */

function getDropSpeed() {

    const difficultyMultiplier = {

        normal: 1,
        hard: 0.72,
        insane: 0.48

    }[difficulty];

    const base =
        Math.max(
            100,
            850 -
            (level - 1) * 65
        );

    return base * difficultyMultiplier;

}


function startDropTimer() {

    clearInterval(dropTimer);

    dropTimer =
        setInterval(
            moveDown,
            getDropSpeed()
        );

}


/* =========================================================
   TIMER
========================================================= */

function startTimeAttack() {

    clearInterval(timeTimer);

    timeRemaining = 180;

    updateTimer();

    timeTimer =
        setInterval(() => {

            if (!gameRunning || paused) {
                return;
            }

            timeRemaining--;

            updateTimer();

            if (timeRemaining <= 0) {

                endGame();

            }

        }, 1000);

}


function updateTimer() {

    if (gameMode !== "time") {

        timerEl.textContent = "∞";

        return;

    }

    const minutes =
        Math.floor(
            timeRemaining / 60
        );

    const seconds =
        timeRemaining % 60;

    timerEl.textContent =
        `${minutes}:${String(seconds).padStart(2,"0")}`;

}


/* =========================================================
   PREVIEWS
========================================================= */

function renderPreview(
    container,
    pieceType
) {

    container.innerHTML = "";

    if (!pieceType) {
        return;
    }

    const source =
        PIECES[pieceType];

    for (let r = 0; r < 16; r++) {

        const cell =
            document.createElement("div");

        cell.className =
            "preview-cell";

        const row =
            Math.floor(r / 4);

        const col =
            r % 4;

        if (
            source.shape[row] &&
            source.shape[row][col]
        ) {

            cell.classList.add("active");

            cell.style.setProperty(
                "--piece-color",
                source.color
            );

        }

        container.appendChild(cell);

    }

}


function renderNext() {

    renderPreview(
        nextPieceEl,
        nextPiece?.type
    );

}


function renderHold() {

    renderPreview(
        holdPieceEl,
        holdPiece
    );

}


/* =========================================================
   CURRENT / GHOST RENDER
========================================================= */

function renderCurrentPiece() {

    if (!currentPiece) {
        return;
    }

    const cells =
        gameBoard.children;

    for (
        let r = 0;
        r < currentPiece.shape.length;
        r++
    ) {

        for (
            let c = 0;
            c < currentPiece.shape[r].length;
            c++
        ) {

            if (!currentPiece.shape[r][c]) {
                continue;
            }

            const row =
                currentPiece.row + r;

            const col =
                currentPiece.col + c;

            if (
                row >= 0 &&
                row < ROWS &&
                col >= 0 &&
                col < COLS
            ) {

                const cell =
                    cells[row * COLS + col];

                cell.classList.add("filled");

                cell.style.setProperty(
                    "--piece-color",
                    currentPiece.color
                );

            }

        }

    }

}


function renderGhostPiece() {

    if (!currentPiece) {
        return;
    }

    let distance = 0;

    while (
        !collision(
            currentPiece,
            distance + 1,
            0
        )
    ) {

        distance++;

    }

    const cells =
        gameBoard.children;

    for (
        let r = 0;
        r < currentPiece.shape.length;
        r++
    ) {

        for (
            let c = 0;
            c < currentPiece.shape[r].length;
            c++
        ) {

            if (!currentPiece.shape[r][c]) {
                continue;
            }

            const row =
                currentPiece.row +
                r +
                distance;

            const col =
                currentPiece.col + c;

            if (
                row >= 0 &&
                row < ROWS &&
                col >= 0 &&
                col < COLS
            ) {

                const cell =
                    cells[row * COLS + col];

                if (!cell.classList.contains("filled")) {

                    cell.classList.add("ghost");

                }

            }

        }

    }

}


/* =========================================================
   UI
========================================================= */

function updateUI() {

    scoreEl.textContent =
        score.toLocaleString();

    levelEl.textContent =
        level;

    linesEl.textContent =
        lines;

    comboEl.textContent =
        combo;

    updateTimer();

    updateMenuStats();

}


function showMessage(text) {

    messageEl.textContent = text;

    messageEl.classList.remove("show");

    void messageEl.offsetWidth;

    messageEl.classList.add("show");

}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    clearInterval(dropTimer);
    clearInterval(timeTimer);

    board =
        createEmptyBoard();

    score = 0;
    level = 1;
    lines = 0;
    combo = 0;
    bestComboSession = 0;

    holdPiece = null;
    nextPiece = null;
    canHold = true;

    gameRunning = true;
    paused = false;

    gameOverOverlay.classList.remove("active");
    pauseOverlay.classList.remove("active");

    menuScreen.classList.remove("active");
    gameScreen.classList.add("active");

    modeLabel.textContent =
        gameMode.toUpperCase();

    difficultyLabel.textContent =
        difficulty.toUpperCase();

    buildBoardDOM();

    nextPiece =
        randomPiece();

    spawnPiece();

    renderBoard();

    updateUI();

    startDropTimer();

    statistics.totalGames++;

    saveStatistics();

    if (gameMode === "time") {

        startTimeAttack();

    }

}


/* =========================================================
   PAUSE
========================================================= */

function togglePause() {

    if (!gameRunning) {
        return;
    }

    paused = !paused;

    pauseOverlay.classList.toggle(
        "active",
        paused
    );

}


/* =========================================================
   END GAME
========================================================= */

function endGame() {

    if (!gameRunning) {
        return;
    }

    gameRunning = false;
    paused = false;

    clearInterval(dropTimer);
    clearInterval(timeTimer);

    if (clearTimer) {
        clearTimeout(clearTimer);
    }

    statistics.totalScore += score;

    statistics.bestCombo =
        Math.max(
            statistics.bestCombo,
            bestComboSession
        );

    saveStatistics();

    const best =
        getBest(gameMode);

    if (score > best) {

        localStorage.setItem(
            `blockdropBest_${gameMode}`,
            score
        );

    }

    document.getElementById(
        "finalScore"
    ).textContent =
        score.toLocaleString();

    document.getElementById(
        "finalHighScore"
    ).textContent =
        getBest(gameMode).toLocaleString();

    document.getElementById(
        "finalLevel"
    ).textContent =
        level;

    document.getElementById(
        "finalLines"
    ).textContent =
        lines;

    document.getElementById(
        "finalCombo"
    ).textContent =
        bestComboSession;

    gameOverOverlay.classList.add("active");

    playSound("gameover");

    updateStatisticsUI();

}


/* =========================================================
   BEST SCORE
========================================================= */

function getBest(mode) {

    return Number(
        localStorage.getItem(
            `blockdropBest_${mode}`
        ) || 0
    );

}


/* =========================================================
   MENU
========================================================= */

function goToMenu() {

    gameRunning = false;
    paused = false;

    clearInterval(dropTimer);
    clearInterval(timeTimer);

    gameOverOverlay.classList.remove("active");
    pauseOverlay.classList.remove("active");

    gameScreen.classList.remove("active");
    menuScreen.classList.add("active");

    updateMenuStats();

}


function updateMenuStats() {

    const best =
        getBest(gameMode);

    document.getElementById(
        "menuBestScore"
    ).textContent =
        best.toLocaleString();

    document.getElementById(
        "menuBestCombo"
    ).textContent =
        statistics.bestCombo;

    document.getElementById(
        "menuLines"
    ).textContent =
        statistics.totalLines;

}


/* =========================================================
   SETTINGS UI
========================================================= */

function updateSettingsUI() {

    document
        .querySelectorAll(".toggle")
        .forEach(toggle => {

            const setting =
                toggle.dataset.setting;

            toggle.classList.toggle(
                "active",
                Boolean(settings[setting])
            );

        });

    document.body.classList.toggle(
        "reduced-motion",
        settings.reducedMotion
    );

}


function openSettings() {

    updateSettingsUI();

    settingsOverlay.classList.add("active");

}


function closeSettings() {

    settingsOverlay.classList.remove(
        "active"
    );

}


/* =========================================================
   STATISTICS UI
========================================================= */

function updateStatisticsUI() {

    document.getElementById(
        "totalGames"
    ).textContent =
        statistics.totalGames;

    document.getElementById(
        "totalScore"
    ).textContent =
        statistics.totalScore.toLocaleString();

    document.getElementById(
        "totalLines"
    ).textContent =
        statistics.totalLines;

    document.getElementById(
        "totalBestCombo"
    ).textContent =
        statistics.bestCombo;

    document.getElementById(
        "totalPerfectClears"
    ).textContent =
        statistics.perfectClears;

    const unlocked =
        Object.keys(unlockedAchievements)
            .filter(
                key =>
                    unlockedAchievements[key]
            ).length;

    document.getElementById(
        "achievementCount"
    ).textContent =
        `${unlocked}/5`;

}


/* =========================================================
   MODE / DIFFICULTY
========================================================= */

document
    .querySelectorAll(".mode-card")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".mode-card")
                    .forEach(item =>
                        item.classList.remove(
                            "selected"
                        )
                    );

                button.classList.add(
                    "selected"
                );

                gameMode =
                    button.dataset.mode;

                updateMenuStats();

            }
        );

    });


document
    .querySelectorAll(".difficulty-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".difficulty-btn"
                    )
                    .forEach(item =>
                        item.classList.remove(
                            "selected"
                        )
                    );

                button.classList.add(
                    "selected"
                );

                difficulty =
                    button.dataset.difficulty;

            }
        );

    });


/* =========================================================
   BUTTON EVENTS
========================================================= */

document
    .getElementById("startBtn")
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById("pauseBtn")
    .addEventListener(
        "click",
        togglePause
    );


document
    .getElementById("resumeBtn")
    .addEventListener(
        "click",
        togglePause
    );


document
    .getElementById("restartBtn")
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById("menuBtn")
    .addEventListener(
        "click",
        goToMenu
    );


document
    .getElementById("gameOverMenuBtn")
    .addEventListener(
        "click",
        goToMenu
    );


document
    .getElementById("playAgainBtn")
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById("settingsBtn")
    .addEventListener(
        "click",
        openSettings
    );


document
    .getElementById("closeSettings")
    .addEventListener(
        "click",
        closeSettings
    );


document
    .getElementById("soundBtn")
    .addEventListener(
        "click",
        () => {

            settings.sound =
                !settings.sound;

            saveSettings();
            updateSettingsUI();

        }
    );


document
    .querySelectorAll(".toggle")
    .forEach(toggle => {

        toggle.addEventListener(
            "click",
            () => {

                const setting =
                    toggle.dataset.setting;

                settings[setting] =
                    !settings[setting];

                saveSettings();

                updateSettingsUI();

            }
        );

    });


document
    .getElementById("resetStatsBtn")
    .addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "Reset all BLOCKDROP statistics and achievements?"
                );

            if (!confirmed) {
                return;
            }

            statistics = {

                totalGames: 0,
                totalScore: 0,
                totalLines: 0,
                bestCombo: 0,
                perfectClears: 0

            };

            unlockedAchievements = {};

            localStorage.removeItem(
                "blockdropStatistics"
            );

            localStorage.removeItem(
                "blockdropAchievements"
            );

            saveStatistics();

            updateStatisticsUI();
            updateMenuStats();

            alert(
                "Statistics reset successfully."
            );

        }
    );


/* =========================================================
   KEYBOARD CONTROLS
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.target.tagName === "INPUT" ||
            event.target.tagName === "TEXTAREA"
        ) {
            return;
        }

        switch (event.code) {

            case "ArrowLeft":
                event.preventDefault();
                movePiece(-1);
                break;

            case "ArrowRight":
                event.preventDefault();
                movePiece(1);
                break;

            case "ArrowDown":
                event.preventDefault();
                moveDown();
                break;

            case "ArrowUp":
                event.preventDefault();
                rotatePiece();
                break;

            case "Space":
                event.preventDefault();
                hardDrop();
                break;

            case "KeyC":
                holdCurrentPiece();
                break;

            case "KeyP":
                togglePause();
                break;

            case "Escape":

                if (
                    settingsOverlay.classList.contains(
                        "active"
                    )
                ) {

                    closeSettings();

                } else if (gameRunning) {

                    togglePause();

                }

                break;

        }

    }
);


/* =========================================================
   MOBILE CONTROLS
========================================================= */

document
    .querySelectorAll(
        ".mobile-controls button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.action;

                if (action === "left") {
                    movePiece(-1);
                }

                if (action === "right") {
                    movePiece(1);
                }

                if (action === "rotate") {
                    rotatePiece();
                }

                if (action === "down") {
                    moveDown();
                }

                if (action === "drop") {
                    hardDrop();
                }

            }
        );

    });


/* =========================================================
   INITIALIZE
========================================================= */

buildBoardDOM();

updateSettingsUI();

updateStatisticsUI();

updateMenuStats();

menuScreen.classList.add("active");

console.log(
    "BLOCKDROP Commit 7 loaded successfully."
);