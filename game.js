/* =========================================================
   BLOCKDROP - GAME ENGINE
   Stable Version
========================================================= */

// ===============================
// DOM ELEMENTS
// ===============================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");
const comboEl = document.getElementById("combo");

const nextCanvas = document.getElementById("nextCanvas");
const holdCanvas = document.getElementById("holdCanvas");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");

const finalScoreEl = document.getElementById("finalScore");
const finalLinesEl = document.getElementById("finalLines");
const finalHighScoreEl = document.getElementById("finalHighScore");

const xpBar = document.getElementById("xpBar");
const xpText = document.getElementById("xpText");
const playerLevelEl = document.getElementById("playerLevel");


// ===============================
// CANVAS SETTINGS
// ===============================

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

if (canvas) {
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
}


// ===============================
// GAME STATE
// ===============================

let board = createBoard();

let currentPiece = null;
let nextPiece = null;
let holdPiece = null;

let canHold = true;

let score = 0;
let lines = 0;
let level = 1;
let combo = 0;

let gameRunning = false;
let gamePaused = false;
let gameOver = false;

let gameMode = "classic";
let difficulty = "normal";

let dropCounter = 0;
let lastTime = 0;

let gameTimer = 0;
let timerInterval = null;

let animationFrame = null;


// ===============================
// PLAYER DATA
// ===============================

let playerData = JSON.parse(
    localStorage.getItem("blockdropPlayer")
) || {
    xp: 0,
    level: 1,
    totalGames: 0,
    totalScore: 0,
    totalLines: 0,
    bestScore: 0,
    perfectClears: 0
};


// ===============================
// MISSIONS
// ===============================

let missions = JSON.parse(
    localStorage.getItem("blockdropMissions")
) || {
    lines: 0,
    score: 0,
    games: 0
};


// ===============================
// SETTINGS
// ===============================

let settings = JSON.parse(
    localStorage.getItem("blockdropSettings")
) || {
    sound: true,
    shake: true,
    reducedMotion: false
};


// ===============================
// TETROMINOES
// ===============================

const PIECES = {
    I: {
        color: "#00e5ff",
        shape: [
            [1, 1, 1, 1]
        ]
    },

    O: {
        color: "#ffd600",
        shape: [
            [1, 1],
            [1, 1]
        ]
    },

    T: {
        color: "#b44cff",
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ]
    },

    S: {
        color: "#00e676",
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ]
    },

    Z: {
        color: "#ff3d71",
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ]
    },

    J: {
        color: "#2979ff",
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ]
    },

    L: {
        color: "#ff9100",
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ]
    }
};

const PIECE_KEYS = Object.keys(PIECES);


// ===============================
// BOARD
// ===============================

function createBoard() {
    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(0)
    );
}


// ===============================
// RANDOM PIECE
// ===============================

function randomPiece() {

    const key =
        PIECE_KEYS[
            Math.floor(Math.random() * PIECE_KEYS.length)
        ];

    const data = PIECES[key];

    return {
        key,
        color: data.color,
        shape: data.shape.map(row => [...row]),
        x: Math.floor(
            (COLS - data.shape[0].length) / 2
        ),
        y: 0
    };
}


// ===============================
// START GAME
// ===============================

function startGame(mode = gameMode, diff = difficulty) {

    gameMode = mode;
    difficulty = diff;

    board = createBoard();

    currentPiece = randomPiece();
    nextPiece = randomPiece();
    holdPiece = null;

    canHold = true;

    score = 0;
    lines = 0;
    level = 1;
    combo = 0;

    gameTimer = 0;

    gameRunning = true;
    gamePaused = false;
    gameOver = false;

    playerData.totalGames++;

    missions.games++;

    savePlayerData();
    saveMissions();

    updateUI();
    updateNextPreview();
    updateHoldPreview();

    hideOverlay();

    clearInterval(timerInterval);

    if (gameMode === "time") {

        timerInterval = setInterval(() => {

            if (!gameRunning || gamePaused) return;

            gameTimer++;

            if (gameTimer >= 180) {
                endGame();
            }

        }, 1000);
    }

    lastTime = performance.now();

    cancelAnimationFrame(animationFrame);

    animationFrame =
        requestAnimationFrame(gameLoop);
}


// ===============================
// GAME LOOP
// ===============================

function gameLoop(time = 0) {

    if (!gameRunning) return;

    const delta =
        time - lastTime;

    lastTime = time;

    if (!gamePaused) {

        dropCounter += delta;

        const speed = getDropSpeed();

        if (dropCounter >= speed) {

            moveDown();

            dropCounter = 0;
        }

        draw();
    }

    animationFrame =
        requestAnimationFrame(gameLoop);
}


// ===============================
// DROP SPEED
// ===============================

function getDropSpeed() {

    let base = 800;

    if (difficulty === "hard") {
        base = 550;
    }

    if (difficulty === "insane") {
        base = 350;
    }

    return Math.max(
        80,
        base - (level - 1) * 55
    );
}


// ===============================
// COLLISION
// ===============================

function collision(piece, boardData) {

    for (
        let y = 0;
        y < piece.shape.length;
        y++
    ) {

        for (
            let x = 0;
            x < piece.shape[y].length;
            x++
        ) {

            if (!piece.shape[y][x]) continue;

            const boardX =
                piece.x + x;

            const boardY =
                piece.y + y;

            if (
                boardX < 0 ||
                boardX >= COLS ||
                boardY >= ROWS
            ) {
                return true;
            }

            if (
                boardY >= 0 &&
                boardData[boardY][boardX]
            ) {
                return true;
            }
        }
    }

    return false;
}


// ===============================
// MERGE PIECE
// ===============================

function mergePiece() {

    currentPiece.shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (value) {

                        const boardY =
                            currentPiece.y + y;

                        const boardX =
                            currentPiece.x + x;

                        if (
                            boardY >= 0 &&
                            boardY < ROWS &&
                            boardX >= 0 &&
                            boardX < COLS
                        ) {

                            board[boardY][boardX] =
                                currentPiece.color;
                        }
                    }
                }
            );
        }
    );
}


// ===============================
// MOVE DOWN
// ===============================

function moveDown() {

    if (!gameRunning || gamePaused) return;

    currentPiece.y++;

    if (
        collision(
            currentPiece,
            board
        )
    ) {

        currentPiece.y--;

        mergePiece();

        clearLines();

        spawnNextPiece();
    }
}


// ===============================
// HARD DROP
// ===============================

function hardDrop() {

    if (!gameRunning || gamePaused) return;

    let distance = 0;

    while (true) {

        currentPiece.y++;

        if (
            collision(
                currentPiece,
                board
            )
        ) {

            currentPiece.y--;

            break;
        }

        distance++;
    }

    score += distance * 2;

    mergePiece();

    clearLines();

    spawnNextPiece();

    playSound(180, 0.06);
}


// ===============================
// MOVE LEFT
// ===============================

function moveLeft() {

    if (!gameRunning || gamePaused) return;

    currentPiece.x--;

    if (
        collision(
            currentPiece,
            board
        )
    ) {
        currentPiece.x++;
    }

    draw();
}


// ===============================
// MOVE RIGHT
// ===============================

function moveRight() {

    if (!gameRunning || gamePaused) return;

    currentPiece.x++;

    if (
        collision(
            currentPiece,
            board
        )
    ) {
        currentPiece.x--;
    }

    draw();
}


// ===============================
// ROTATE
// ===============================

function rotatePiece() {

    if (!gameRunning || gamePaused) return;

    const oldShape =
        currentPiece.shape.map(
            row => [...row]
        );

    const rotated =
        currentPiece.shape[0]
            .map(
                (_, index) =>
                    currentPiece.shape
                        .map(row => row[index])
                        .reverse()
            );

    currentPiece.shape = rotated;

    if (
        collision(
            currentPiece,
            board
        )
    ) {

        currentPiece.shape = oldShape;

        // simple wall kick
        currentPiece.x++;

        if (
            collision(
                currentPiece,
                board
            )
        ) {

            currentPiece.x -= 2;

            if (
                collision(
                    currentPiece,
                    board
                )
            ) {

                currentPiece.x++;

                currentPiece.shape =
                    oldShape;
            }
        }
    }

    draw();
}


// ===============================
// HOLD PIECE
// ===============================

function holdCurrentPiece() {

    if (
        !gameRunning ||
        gamePaused ||
        !canHold
    ) return;

    if (!holdPiece) {

        holdPiece = {
            ...currentPiece,
            shape: currentPiece.shape.map(
                row => [...row]
            )
        };

        currentPiece = nextPiece;

        currentPiece.x =
            Math.floor(
                (COLS -
                    currentPiece.shape[0].length) / 2
            );

        currentPiece.y = 0;

        nextPiece = randomPiece();

    } else {

        const temp = holdPiece;

        holdPiece = {
            ...currentPiece,
            shape: currentPiece.shape.map(
                row => [...row]
            )
        };

        currentPiece = {
            ...temp,
            shape: temp.shape.map(
                row => [...row]
            )
        };

        currentPiece.x =
            Math.floor(
                (COLS -
                    currentPiece.shape[0].length) / 2
            );

        currentPiece.y = 0;
    }

    canHold = false;

    updateHoldPreview();
    updateNextPreview();

    draw();
}


// ===============================
// SPAWN NEXT PIECE
// ===============================

function spawnNextPiece() {

    currentPiece = nextPiece;

    currentPiece.x =
        Math.floor(
            (COLS -
                currentPiece.shape[0].length) / 2
        );

    currentPiece.y = 0;

    nextPiece = randomPiece();

    canHold = true;

    updateNextPreview();
    updateHoldPreview();

    if (
        collision(
            currentPiece,
            board
        )
    ) {
        endGame();
    }
}


// ===============================
// CLEAR LINES
// ===============================

function clearLines() {

    let cleared = 0;

    for (
        let y = ROWS - 1;
        y >= 0;
        y--
    ) {

        if (
            board[y].every(
                cell => cell !== 0
            )
        ) {

            board.splice(y, 1);

            board.unshift(
                Array(COLS).fill(0)
            );

            cleared++;

            y++;
        }
    }

    if (cleared > 0) {

        combo++;

        lines += cleared;

        const lineScores = {
            1: 100,
            2: 300,
            3: 500,
            4: 800
        };

        let gained =
            lineScores[cleared] ||
            cleared * 250;

        gained *= level;

        if (combo > 1) {
            gained += combo * 50;
        }

        score += gained;

        playerData.totalScore += gained;
        playerData.totalLines += cleared;

        missions.lines += cleared;
        missions.score += gained;

        const newLevel =
            Math.floor(lines / 10) + 1;

        if (newLevel > level) {

            level = newLevel;

            addXP(100);

            showLevelUp();
        }

        addXP(
            cleared * 25 +
            combo * 10
        );

        playSound(
            500 + cleared * 100,
            0.1
        );

    } else {

        combo = 0;
    }

    updateMissions();

    savePlayerData();
    saveMissions();

    updateUI();
}


// ===============================
// GHOST PIECE
// ===============================

function getGhostPiece() {

    if (!currentPiece) return null;

    const ghost = {
        ...currentPiece,
        shape: currentPiece.shape.map(
            row => [...row]
        )
    };

    while (true) {

        ghost.y++;

        if (
            collision(
                ghost,
                board
            )
        ) {

            ghost.y--;

            break;
        }
    }

    return ghost;
}


// ===============================
// DRAW GAME
// ===============================

function draw() {

    if (!ctx) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawBoard();

    if (currentPiece) {

        const ghost =
            getGhostPiece();

        if (ghost) {
            drawPiece(
                ghost,
                true
            );
        }

        drawPiece(
            currentPiece,
            false
        );
    }
}


// ===============================
// DRAW BOARD
// ===============================

function drawBoard() {

    for (
        let y = 0;
        y < ROWS;
        y++
    ) {

        for (
            let x = 0;
            x < COLS;
            x++
        ) {

            const value =
                board[y][x];

            if (value) {

                drawBlock(
                    x,
                    y,
                    value
                );
            } else {

                ctx.strokeStyle =
                    "rgba(255,255,255,0.035)";

                ctx.strokeRect(
                    x * BLOCK_SIZE,
                    y * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
            }
        }
    }
}


// ===============================
// DRAW PIECE
// ===============================

function drawPiece(
    piece,
    ghost = false
) {

    piece.shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (!value) return;

                    const px =
                        piece.x + x;

                    const py =
                        piece.y + y;

                    if (py < 0) return;

                    if (ghost) {

                        ctx.fillStyle =
                            "rgba(255,255,255,0.08)";

                        ctx.strokeStyle =
                            "rgba(255,255,255,0.35)";

                        ctx.strokeRect(
                            px * BLOCK_SIZE + 2,
                            py * BLOCK_SIZE + 2,
                            BLOCK_SIZE - 4,
                            BLOCK_SIZE - 4
                        );

                        return;
                    }

                    drawBlock(
                        px,
                        py,
                        piece.color
                    );
                }
            );
        }
    );
}


// ===============================
// DRAW BLOCK
// ===============================

function drawBlock(
    x,
    y,
    color
) {

    const px =
        x * BLOCK_SIZE;

    const py =
        y * BLOCK_SIZE;

    ctx.fillStyle = color;

    ctx.fillRect(
        px + 2,
        py + 2,
        BLOCK_SIZE - 4,
        BLOCK_SIZE - 4
    );

    ctx.fillStyle =
        "rgba(255,255,255,0.25)";

    ctx.fillRect(
        px + 4,
        py + 4,
        BLOCK_SIZE - 8,
        4
    );

    ctx.strokeStyle =
        "rgba(255,255,255,0.35)";

    ctx.strokeRect(
        px + 2,
        py + 2,
        BLOCK_SIZE - 4,
        BLOCK_SIZE - 4
    );
}


// ===============================
// PREVIEW
// ===============================

function drawPreview(
    previewCanvas,
    piece
) {

    if (!previewCanvas) return;

    const previewCtx =
        previewCanvas.getContext("2d");

    previewCtx.clearRect(
        0,
        0,
        previewCanvas.width,
        previewCanvas.height
    );

    if (!piece) return;

    const size = 24;

    const width =
        piece.shape[0].length * size;

    const height =
        piece.shape.length * size;

    const offsetX =
        (previewCanvas.width - width) / 2;

    const offsetY =
        (previewCanvas.height - height) / 2;

    piece.shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (!value) return;

                    previewCtx.fillStyle =
                        piece.color;

                    previewCtx.fillRect(
                        offsetX +
                            x * size +
                            2,
                        offsetY +
                            y * size +
                            2,
                        size - 4,
                        size - 4
                    );
                }
            );
        }
    );
}


function updateNextPreview() {

    drawPreview(
        nextCanvas,
        nextPiece
    );
}


function updateHoldPreview() {

    drawPreview(
        holdCanvas,
        holdPiece
    );
}


// ===============================
// SCORE / UI
// ===============================

function updateUI() {

    if (scoreEl)
        scoreEl.textContent =
            score.toLocaleString();

    if (linesEl)
        linesEl.textContent =
            lines;

    if (levelEl)
        levelEl.textContent =
            level;

    if (comboEl)
        comboEl.textContent =
            combo;

    updateXPUI();
}


// ===============================
// XP SYSTEM
// ===============================

function addXP(amount) {

    if (amount <= 0) return;

    playerData.xp += amount;

    while (
        playerData.xp >=
        getXPRequired(playerData.level)
    ) {

        playerData.xp -=
            getXPRequired(
                playerData.level
            );

        playerData.level++;

        showLevelUp();
    }

    savePlayerData();
    updateXPUI();
}


function getXPRequired(playerLevel) {

    return 500 +
        (playerLevel - 1) * 250;
}


function updateXPUI() {

    if (!xpBar && !xpText) return;

    const required =
        getXPRequired(
            playerData.level
        );

    const percent =
        Math.min(
            100,
            (playerData.xp / required) * 100
        );

    if (xpBar) {
        xpBar.style.width =
            `${percent}%`;
    }

    if (xpText) {
        xpText.textContent =
            `${playerData.xp} / ${required} XP`;
    }

    if (playerLevelEl) {
        playerLevelEl.textContent =
            playerData.level;
    }
}


// ===============================
// MISSIONS
// ===============================

function updateMissions() {

    let completed = false;

    if (
        missions.lines >= 50
    ) {
        completed = true;
    }

    if (
        missions.score >= 10000
    ) {
        completed = true;
    }

    if (
        missions.games >= 10
    ) {
        completed = true;
    }

    if (completed) {

        addXP(200);

        missions.lines = 0;
        missions.score = 0;
        missions.games = 0;

        saveMissions();

        showAchievement(
            "MISSION COMPLETE",
            "You completed a mission!"
        );
    }
}


function saveMissions() {

    localStorage.setItem(
        "blockdropMissions",
        JSON.stringify(missions)
    );
}


// ===============================
// PLAYER STORAGE
// ===============================

function savePlayerData() {

    playerData.bestScore =
        Math.max(
            playerData.bestScore,
            score
        );

    localStorage.setItem(
        "blockdropPlayer",
        JSON.stringify(playerData)
    );
}


// ===============================
// BEST SCORE
// ===============================

function getBest(mode) {

    return Number(
        localStorage.getItem(
            `blockdropBest_${mode}`
        )
    ) || 0;
}


function saveBest(mode, value) {

    const oldBest =
        getBest(mode);

    if (value > oldBest) {

        localStorage.setItem(
            `blockdropBest_${mode}`,
            value
        );

        return value;
    }

    return oldBest;
}


// ===============================
// END GAME
// ===============================

function endGame() {

    if (!gameRunning) return;

    gameRunning = false;
    gameOver = true;

    clearInterval(timerInterval);

    animationFrame =
        cancelAnimationFrame(
            animationFrame
        );

    const best =
        saveBest(
            gameMode,
            score
        );

    playerData.bestScore =
        Math.max(
            playerData.bestScore,
            score
        );

    playerData.totalScore += score;

    addXP(
        Math.max(
            25,
            Math.floor(score / 10)
        )
    );

    savePlayerData();

    if (finalScoreEl) {
        finalScoreEl.textContent =
            score.toLocaleString();
    }

    if (finalLinesEl) {
        finalLinesEl.textContent =
            lines;
    }

    if (finalHighScoreEl) {
        finalHighScoreEl.textContent =
            best.toLocaleString();
    }

    if (overlayTitle) {
        overlayTitle.textContent =
            "GAME OVER";
    }

    if (overlayMessage) {
        overlayMessage.textContent =
            `Score: ${score.toLocaleString()} • Best: ${best.toLocaleString()}`;
    }

    showOverlay();

    updateUI();
}


// ===============================
// PAUSE
// ===============================

function togglePause() {

    if (
        !gameRunning ||
        gameOver
    ) return;

    gamePaused =
        !gamePaused;

    if (gamePaused) {

        if (overlayTitle)
            overlayTitle.textContent =
                "PAUSED";

        if (overlayMessage)
            overlayMessage.textContent =
                "Press P or Resume to continue.";

        showOverlay();

    } else {

        hideOverlay();
    }
}


// ===============================
// OVERLAY
// ===============================

function showOverlay() {

    if (!overlay) return;

    overlay.classList.add("active");
}


function hideOverlay() {

    if (!overlay) return;

    overlay.classList.remove("active");
}


// ===============================
// LEVEL UP
// ===============================

function showLevelUp() {

    showAchievement(
        "LEVEL UP!",
        `You reached Level ${playerData.level}`
    );

    playSound(
        700,
        0.15
    );
}


// ===============================
// ACHIEVEMENT MESSAGE
// ===============================

function showAchievement(
    title,
    message
) {

    let toast =
        document.getElementById(
            "achievementToast"
        );

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id =
            "achievementToast";

        toast.style.position =
            "fixed";

        toast.style.top =
            "30px";

        toast.style.left =
            "50%";

        toast.style.transform =
            "translateX(-50%)";

        toast.style.padding =
            "14px 22px";

        toast.style.borderRadius =
            "14px";

        toast.style.background =
            "rgba(10,15,30,.95)";

        toast.style.border =
            "1px solid rgba(0,229,255,.5)";

        toast.style.color =
            "#fff";

        toast.style.zIndex =
            "9999";

        toast.style.textAlign =
            "center";

        toast.style.boxShadow =
            "0 15px 50px rgba(0,0,0,.45)";

        document.body.appendChild(
            toast
        );
    }

    toast.innerHTML =
        `<strong>${title}</strong><br>
         <small>${message}</small>`;

    toast.style.display =
        "block";

    clearTimeout(
        toast._timer
    );

    toast._timer =
        setTimeout(() => {

            toast.style.display =
                "none";

        }, 2500);
}


// ===============================
// SOUND
// ===============================

let audioContext = null;

function playSound(
    frequency = 440,
    duration = 0.08
) {

    if (!settings.sound) return;

    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();
        }

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.frequency.value =
            frequency;

        oscillator.type =
            "sine";

        gain.gain.setValueAtTime(
            0.08,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime +
                duration
        );

        oscillator.connect(gain);
        gain.connect(
            audioContext.destination
        );

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime +
                duration
        );

    } catch (error) {

        console.log(
            "Audio unavailable"
        );
    }
}


// ===============================
// KEYBOARD CONTROLS
// ===============================

document.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();

        if (
            [
                "arrowleft",
                "arrowright",
                "arrowdown",
                " ",
                "z",
                "x",
                "c"
            ].includes(key)
        ) {
            event.preventDefault();
        }

        if (key === "arrowleft") {
            moveLeft();
        }

        if (key === "arrowright") {
            moveRight();
        }

        if (key === "arrowdown") {
            moveDown();
        }

        if (key === " ") {
            hardDrop();
        }

        if (key === "x") {
            rotatePiece();
        }

        if (key === "z") {
            rotatePiece();
        }

        if (key === "c") {
            holdCurrentPiece();
        }

        if (key === "p") {
            togglePause();
        }

        if (key === "escape") {
            togglePause();
        }
    }
);


// ===============================
// BUTTON CONNECTIONS
// ===============================

function connectButton(
    id,
    callback
) {

    const button =
        document.getElementById(id);

    if (button) {

        button.addEventListener(
            "click",
            callback
        );
    }
}


// Start / restart buttons

connectButton(
    "startBtn",
    () => startGame()
);

connectButton(
    "restartBtn",
    () => startGame()
);

connectButton(
    "resumeBtn",
    () => {

        if (gamePaused) {
            togglePause();
        }
    }
);

connectButton(
    "pauseBtn",
    togglePause
);

connectButton(
    "menuBtn",
    () => {

        gameRunning = false;

        clearInterval(
            timerInterval
        );

        hideOverlay();
    }
);


// Mobile controls

connectButton(
    "leftBtn",
    moveLeft
);

connectButton(
    "rightBtn",
    moveRight
);

connectButton(
    "downBtn",
    moveDown
);

connectButton(
    "rotateBtn",
    rotatePiece
);

connectButton(
    "dropBtn",
    hardDrop
);

connectButton(
    "holdBtn",
    holdCurrentPiece
);


// ===============================
// MODE BUTTONS
// ===============================

document
    .querySelectorAll(
        "[data-mode]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                gameMode =
                    button.dataset.mode;

                document
                    .querySelectorAll(
                        "[data-mode]"
                    )
                    .forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );

                button.classList.add(
                    "active"
                );
            }
        );
    });


// ===============================
// DIFFICULTY BUTTONS
// ===============================

document
    .querySelectorAll(
        "[data-difficulty]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                difficulty =
                    button.dataset.difficulty;

                document
                    .querySelectorAll(
                        "[data-difficulty]"
                    )
                    .forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );

                button.classList.add(
                    "active"
                );
            }
        );
    });


// ===============================
// TOUCH SUPPORT
// ===============================

let touchStartX = 0;
let touchStartY = 0;

if (canvas) {

    canvas.addEventListener(
        "touchstart",
        event => {

            const touch =
                event.touches[0];

            touchStartX =
                touch.clientX;

            touchStartY =
                touch.clientY;
        },
        { passive: true }
    );


    canvas.addEventListener(
        "touchend",
        event => {

            const touch =
                event.changedTouches[0];

            const dx =
                touch.clientX -
                touchStartX;

            const dy =
                touch.clientY -
                touchStartY;

            const minSwipe = 30;

            if (
                Math.abs(dx) >
                Math.abs(dy)
            ) {

                if (dx > minSwipe) {
                    moveRight();
                }

                if (dx < -minSwipe) {
                    moveLeft();
                }

            } else {

                if (dy > minSwipe) {
                    moveDown();
                }

                if (dy < -minSwipe) {
                    rotatePiece();
                }
            }
        },
        { passive: true }
    );
}


// ===============================
// INITIAL UI
// ===============================

updateUI();

updateNextPreview();

updateHoldPreview();

console.log(
    "BLOCKDROP game engine loaded successfully."
);