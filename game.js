"use strict";

/* =========================================
   BLOCKDROP
   COMMIT 10
   GAME MODES + DIFFICULTY SYSTEM
   ========================================= */


/* =========================================
   CANVAS
   ========================================= */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");

const nextCanvas =
    document.getElementById("nextCanvas");

const nextCtx =
    nextCanvas.getContext("2d");

const holdCanvas =
    document.getElementById("holdCanvas");

const holdCtx =
    holdCanvas.getContext("2d");


const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

canvas.width =
    COLS * BLOCK;

canvas.height =
    ROWS * BLOCK;


/* =========================================
   PIECES
   ========================================= */

const COLORS = {

    I: "#48e8ff",
    O: "#ffd84d",
    T: "#b05cff",
    S: "#48f5a4",
    Z: "#ff5577",
    J: "#5577ff",
    L: "#ff9d4d"

};


const SHAPES = {

    I: [
        [1,1,1,1]
    ],

    O: [
        [1,1],
        [1,1]
    ],

    T: [
        [0,1,0],
        [1,1,1]
    ],

    S: [
        [0,1,1],
        [1,1,0]
    ],

    Z: [
        [1,1,0],
        [0,1,1]
    ],

    J: [
        [1,0,0],
        [1,1,1]
    ],

    L: [
        [0,0,1],
        [1,1,1]
    ]

};


const PIECES =
    Object.keys(SHAPES);


/* =========================================
   DOM
   ========================================= */

const overlay =
    document.getElementById("overlay");

const startBtn =
    document.getElementById("startBtn");

const restartBtn =
    document.getElementById("restartBtn");

const resumeBtn =
    document.getElementById("resumeBtn");

const pauseBtn =
    document.getElementById("pauseBtn");

const restartGameBtn =
    document.getElementById("restartGameBtn");


const leftBtn =
    document.getElementById("leftBtn");

const rightBtn =
    document.getElementById("rightBtn");

const downBtn =
    document.getElementById("downBtn");

const rotateBtn =
    document.getElementById("rotateBtn");

const dropBtn =
    document.getElementById("dropBtn");

const holdBtn =
    document.getElementById("holdBtn");


const scoreEl =
    document.getElementById("score");

const levelEl =
    document.getElementById("level");

const linesEl =
    document.getElementById("lines");

const comboEl =
    document.getElementById("combo");


const currentModeEl =
    document.getElementById("currentMode");

const currentDifficultyEl =
    document.getElementById(
        "currentDifficulty"
    );

const timerBox =
    document.getElementById("timerBox");

const timerEl =
    document.getElementById("timer");


const highScoreEl =
    document.getElementById("highScore");

const modeBestScoreEl =
    document.getElementById(
        "modeBestScore"
    );

const gameStatusEl =
    document.getElementById(
        "gameStatus"
    );

const speedStatusEl =
    document.getElementById(
        "speedStatus"
    );


const xpBar =
    document.getElementById("xpBar");

const xpText =
    document.getElementById("xpText");


const missionBar =
    document.getElementById(
        "missionBar"
    );

const missionText =
    document.getElementById(
        "missionText"
    );

const overlayMessage =
    document.getElementById(
        "overlayMessage"
    );


/* =========================================
   MODE / DIFFICULTY
   ========================================= */

let selectedMode =
    localStorage.getItem(
        "blockdropMode"
    ) || "classic";


let selectedDifficulty =
    localStorage.getItem(
        "blockdropDifficulty"
    ) || "normal";


const DIFFICULTY_SPEED = {

    normal: 800,
    hard: 520,
    insane: 300

};


const DIFFICULTY_LABELS = {

    normal: "NORMAL",
    hard: "HARD",
    insane: "INSANE"

};


const MODE_LABELS = {

    classic: "CLASSIC",
    time: "TIME ATTACK",
    endless: "ENDLESS"

};


/* =========================================
   GAME STATE
   ========================================= */

let board = [];

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


let lastTime = 0;

let dropCounter = 0;

let animationFrame = null;


/* =========================================
   TIME ATTACK
   ========================================= */

const TIME_LIMIT = 120;

let timeRemaining =
    TIME_LIMIT;

let timerInterval = null;


/* =========================================
   XP
   ========================================= */

let playerXP =
    Number(
        localStorage.getItem(
            "blockdropXP"
        ) || 0
    );


let missionLines =
    Number(
        localStorage.getItem(
            "blockdropMissionLines"
        ) || 0
    );


/* =========================================
   BEST SCORE
   ========================================= */

function getBestScore() {

    return Number(
        localStorage.getItem(
            `blockdropBest_${selectedMode}_${selectedDifficulty}`
        ) || 0
    );

}


function saveBestScore() {

    const best =
        getBestScore();

    if (score > best) {

        localStorage.setItem(
            `blockdropBest_${selectedMode}_${selectedDifficulty}`,
            score
        );

    }

}


/* =========================================
   BOARD
   ========================================= */

function createBoard() {

    return Array.from(
        {length: ROWS},
        () => Array(COLS).fill(null)
    );

}


/* =========================================
   PIECES
   ========================================= */

function createPiece(type) {

    return {

        type,

        matrix:
            SHAPES[type].map(
                row => [...row]
            ),

        x: 0,

        y: 0

    };

}


function randomPiece() {

    const type =
        PIECES[
            Math.floor(
                Math.random() *
                PIECES.length
            )
        ];

    return createPiece(type);

}


/* =========================================
   RESET
   ========================================= */

function resetGame() {

    board =
        createBoard();

    score = 0;

    lines = 0;

    level = 1;

    combo = 0;

    canHold = true;

    holdPiece = null;

    currentPiece =
        randomPiece();

    nextPiece =
        randomPiece();


    currentPiece.x =
        Math.floor(
            (
                COLS -
                currentPiece.matrix[0].length
            ) / 2
        );

    currentPiece.y = 0;


    gameOver = false;

    gamePaused = false;

    dropCounter = 0;


    timeRemaining =
        TIME_LIMIT;


    updateUI();

    draw();

    drawPreviews();

}


/* =========================================
   START
   ========================================= */

function startGame() {

    console.log(
        "BLOCKDROP Commit 10 started"
    );

    resetGame();


    gameRunning = true;

    gamePaused = false;

    gameOver = false;


    hideOverlay();


    startBtn.classList.add(
        "hidden"
    );

    restartBtn.classList.add(
        "hidden"
    );

    resumeBtn.classList.add(
        "hidden"
    );


    pauseBtn.textContent =
        "⏸ PAUSE";


    lastTime =
        performance.now();


    startTimer();


    cancelAnimationFrame(
        animationFrame
    );


    animationFrame =
        requestAnimationFrame(
            gameLoop
        );


    updateUI();

}


/* =========================================
   TIMER
   ========================================= */

function startTimer() {

    stopTimer();


    if (selectedMode !== "time") {

        timerBox.classList.add(
            "hidden"
        );

        return;

    }


    timerBox.classList.remove(
        "hidden"
    );


    updateTimerDisplay();


    timerInterval =
        setInterval(() => {

            if (
                !gameRunning ||
                gamePaused
            ) {
                return;
            }


            timeRemaining--;


            updateTimerDisplay();


            if (
                timeRemaining <= 0
            ) {

                timeRemaining = 0;

                updateTimerDisplay();

                endGame(
                    "TIME UP"
                );

            }

        },1000);

}


function stopTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }

}


function updateTimerDisplay() {

    const minutes =
        Math.floor(
            timeRemaining / 60
        );

    const seconds =
        timeRemaining % 60;


    timerEl.textContent =
        `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;


    if (
        timeRemaining <= 20
    ) {

        timerEl.style.color =
            "#ff5577";

    } else {

        timerEl.style.color =
            "#ff9d4d";

    }

}


/* =========================================
   GAME LOOP
   ========================================= */

function gameLoop(time = 0) {

    if (!gameRunning) {

        draw();

        return;

    }


    if (gamePaused) {

        draw();

        return;

    }


    const delta =
        Math.min(
            time - lastTime,
            100
        );


    lastTime = time;


    dropCounter += delta;


    const dropSpeed =
        getDropSpeed();


    if (
        dropCounter >= dropSpeed
    ) {

        moveDown();

        dropCounter = 0;

    }


    draw();


    animationFrame =
        requestAnimationFrame(
            gameLoop
        );

}


/* =========================================
   SPEED
   ========================================= */

function getDropSpeed() {

    let base =
        DIFFICULTY_SPEED[
            selectedDifficulty
        ];


    if (
        selectedMode === "endless"
    ) {

        base -=
            (level - 1) * 30;

    } else {

        base -=
            (level - 1) * 40;

    }


    return Math.max(
        80,
        base
    );

}


/* =========================================
   COLLISION
   ========================================= */

function collision(
    piece,
    offsetX = 0,
    offsetY = 0
) {

    for (
        let y = 0;
        y < piece.matrix.length;
        y++
    ) {

        for (
            let x = 0;
            x < piece.matrix[y].length;
            x++
        ) {

            if (
                !piece.matrix[y][x]
            ) {
                continue;
            }


            const boardX =
                piece.x +
                x +
                offsetX;


            const boardY =
                piece.y +
                y +
                offsetY;


            if (
                boardX < 0 ||
                boardX >= COLS
            ) {

                return true;

            }


            if (
                boardY >= ROWS
            ) {

                return true;

            }


            if (
                boardY >= 0 &&
                board[boardY][boardX]
            ) {

                return true;

            }

        }

    }


    return false;

}


/* =========================================
   MOVEMENT
   ========================================= */

function moveLeft() {

    if (
        !gameRunning ||
        gamePaused
    ) {
        return;
    }


    if (
        !collision(
            currentPiece,
            -1,
            0
        )
    ) {

        currentPiece.x--;

    }

}


function moveRight() {

    if (
        !gameRunning ||
        gamePaused
    ) {
        return;
    }


    if (
        !collision(
            currentPiece,
            1,
            0
        )
    ) {

        currentPiece.x++;

    }

}


function moveDown() {

    if (
        !gameRunning ||
        gamePaused
    ) {
        return;
    }


    if (
        !collision(
            currentPiece,
            0,
            1
        )
    ) {

        currentPiece.y++;

        score++;

    } else {

        lockPiece();

    }


    updateUI();

}


/* =========================================
   HARD DROP
   ========================================= */

function hardDrop() {

    if (
        !gameRunning ||
        gamePaused
    ) {
        return;
    }


    let distance = 0;


    while (
        !collision(
            currentPiece,
            0,
            1
        )
    ) {

        currentPiece.y++;

        distance++;

    }


    score +=
        distance * 2;


    lockPiece();

}


/* =========================================
   ROTATION
   ========================================= */

function rotateMatrix(matrix) {

    const result = [];


    for (
        let x = 0;
        x < matrix[0].length;
        x++
    ) {

        result[x] = [];


        for (
            let y = matrix.length - 1;
            y >= 0;
            y--
        ) {

            result[x].push(
                matrix[y][x]
            );

        }

    }


    return result;

}


function rotatePiece() {

    if (
        !gameRunning ||
        gamePaused
    ) {
        return;
    }


    const oldMatrix =
        currentPiece.matrix;


    currentPiece.matrix =
        rotateMatrix(
            oldMatrix
        );


    if (
        collision(
            currentPiece
        )
    ) {

        currentPiece.x++;


        if (
            collision(
                currentPiece
            )
        ) {

            currentPiece.x -= 2;


            if (
                collision(
                    currentPiece
                )
            ) {

                currentPiece.x++;

                currentPiece.matrix =
                    oldMatrix;

            }

        }

    }

}


/* =========================================
   HOLD
   ========================================= */

function holdCurrentPiece() {

    if (
        !gameRunning ||
        gamePaused ||
        !canHold
    ) {
        return;
    }


    if (!holdPiece) {

        holdPiece =
            currentPiece.type;

        currentPiece =
            nextPiece;

        nextPiece =
            randomPiece();

    } else {

        const oldHold =
            holdPiece;

        holdPiece =
            currentPiece.type;

        currentPiece =
            createPiece(
                oldHold
            );

    }


    currentPiece.x =
        Math.floor(
            (
                COLS -
                currentPiece.matrix[0].length
            ) / 2
        );

    currentPiece.y = 0;


    canHold = false;


    drawPreviews();

}


/* =========================================
   LOCK
   ========================================= */

function lockPiece() {

    for (
        let y = 0;
        y < currentPiece.matrix.length;
        y++
    ) {

        for (
            let x = 0;
            x < currentPiece.matrix[y].length;
            x++
        ) {

            if (
                !currentPiece.matrix[y][x]
            ) {
                continue;
            }


            const boardX =
                currentPiece.x + x;

            const boardY =
                currentPiece.y + y;


            if (
                boardY < 0
            ) {

                endGame(
                    "GAME OVER"
                );

                return;

            }


            board[boardY][boardX] =
                currentPiece.type;

        }

    }


    const cleared =
        clearLines();


    if (cleared > 0) {

        combo++;


        const points = {

            1: 100,
            2: 300,
            3: 500,
            4: 800

        };


        const base =
            points[cleared] || 800;


        const comboBonus =
            combo > 1
                ? combo * 50
                : 0;


        const gained =
            (
                base +
                comboBonus
            ) * level;


        score +=
            gained;


        missionLines +=
            cleared;


        playerXP +=
            cleared * 10;


        showFloatingScore(
            `+${gained}`
        );


        if (
            combo > 1
        ) {

            showCombo(
                `COMBO x${combo}`
            );

        }


        if (
            missionLines >= 10
        ) {

            missionLines = 0;

            playerXP += 100;

            showFloatingScore(
                "+100 XP"
            );

        }

    } else {

        combo = 0;

    }


    level =
        Math.floor(
            lines / 10
        ) + 1;


    currentPiece =
        nextPiece;


    nextPiece =
        randomPiece();


    currentPiece.x =
        Math.floor(
            (
                COLS -
                currentPiece.matrix[0].length
            ) / 2
        );


    currentPiece.y = 0;


    canHold = true;


    saveData();

    updateUI();

    drawPreviews();


    if (
        collision(
            currentPiece
        )
    ) {

        endGame(
            "GAME OVER"
        );

    }

}


/* =========================================
   CLEAR LINES
   ========================================= */

function clearLines() {

    let cleared = 0;


    for (
        let y = ROWS - 1;
        y >= 0;
        y--
    ) {

        if (
            board[y].every(
                cell => cell !== null
            )
        ) {

            board.splice(
                y,
                1
            );


            board.unshift(
                Array(
                    COLS
                ).fill(null)
            );


            cleared++;

            y++;

        }

    }


    if (
        cleared > 0
    ) {

        lines +=
            cleared;

    }


    return cleared;

}


/* =========================================
   GHOST
   ========================================= */

function getGhostPiece() {

    const ghost = {

        type:
            currentPiece.type,

        matrix:
            currentPiece.matrix,

        x:
            currentPiece.x,

        y:
            currentPiece.y

    };


    while (
        !collision(
            ghost,
            0,
            1
        )
    ) {

        ghost.y++;

    }


    return ghost;

}


/* =========================================
   DRAW
   ========================================= */

function clearCanvas() {

    ctx.fillStyle =
        "#050914";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

}


function drawGrid() {

    ctx.strokeStyle =
        "rgba(255,255,255,.035)";

    ctx.lineWidth = 1;


    for (
        let x = 0;
        x <= COLS;
        x++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x * BLOCK,
            0
        );

        ctx.lineTo(
            x * BLOCK,
            canvas.height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y <= ROWS;
        y++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y * BLOCK
        );

        ctx.lineTo(
            canvas.width,
            y * BLOCK
        );

        ctx.stroke();

    }

}


function drawBlock(
    context,
    x,
    y,
    type,
    alpha = 1
) {

    context.globalAlpha =
        alpha;


    context.fillStyle =
        COLORS[type];


    context.fillRect(
        x,
        y,
        BLOCK - 2,
        BLOCK - 2
    );


    context.fillStyle =
        "rgba(255,255,255,.22)";


    context.fillRect(
        x + 3,
        y + 3,
        BLOCK - 8,
        4
    );


    context.fillStyle =
        "rgba(0,0,0,.18)";


    context.fillRect(
        x + 4,
        y + BLOCK - 8,
        BLOCK - 8,
        4
    );


    context.globalAlpha = 1;

}


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

            if (
                board[y][x]
            ) {

                drawBlock(
                    ctx,
                    x * BLOCK + 1,
                    y * BLOCK + 1,
                    board[y][x]
                );

            }

        }

    }

}


function drawPiece(
    piece,
    context = ctx,
    blockSize = BLOCK,
    alpha = 1
) {

    for (
        let y = 0;
        y < piece.matrix.length;
        y++
    ) {

        for (
            let x = 0;
        x < piece.matrix[y].length;
            x++
        ) {

            if (
                !piece.matrix[y][x]
            ) {
                continue;
            }


            drawBlock(
                context,

                (
                    piece.x + x
                ) * blockSize + 1,

                (
                    piece.y + y
                ) * blockSize + 1,

                piece.type,

                alpha
            );

        }

    }

}


function draw() {

    clearCanvas();

    drawGrid();

    drawBoard();


    if (
        currentPiece &&
        gameRunning
    ) {

        const ghost =
            getGhostPiece();


        drawPiece(
            ghost,
            ctx,
            BLOCK,
            .18
        );


        drawPiece(
            currentPiece
        );

    }

}


/* =========================================
   PREVIEWS
   ========================================= */

function drawPreview(
    context,
    pieceType
) {

    context.clearRect(
        0,
        0,
        120,
        120
    );


    context.fillStyle =
        "#080d1b";


    context.fillRect(
        0,
        0,
        120,
        120
    );


    if (!pieceType) {
        return;
    }


    const piece =
        createPiece(
            pieceType
        );


    const size = 24;


    const width =
        piece.matrix[0].length *
        size;


    const height =
        piece.matrix.length *
        size;


    const offsetX =
        (120 - width) / 2;


    const offsetY =
        (120 - height) / 2;


    for (
        let y = 0;
        y < piece.matrix.length;
        y++
    ) {

        for (
            let x = 0;
            x < piece.matrix[y].length;
            x++
        ) {

            if (
                piece.matrix[y][x]
            ) {

                drawBlock(
                    context,
                    offsetX + x * size,
                    offsetY + y * size,
                    piece.type
                );

            }

        }

    }

}


function drawPreviews() {

    drawPreview(
        nextCtx,
        nextPiece
            ? nextPiece.type
            : null
    );


    drawPreview(
        holdCtx,
        holdPiece
    );

}


/* =========================================
   UI
   ========================================= */

function updateUI() {

    scoreEl.textContent =
        score.toLocaleString();


    levelEl.textContent =
        level;


    linesEl.textContent =
        lines;


    comboEl.textContent =
        combo;


    currentModeEl.textContent =
        MODE_LABELS[
            selectedMode
        ];


    currentDifficultyEl.textContent =
        DIFFICULTY_LABELS[
            selectedDifficulty
        ];


    const best =
        getBestScore();


    highScoreEl.textContent =
        best.toLocaleString();


    modeBestScoreEl.textContent =
        best.toLocaleString();


    if (
        gameOver
    ) {

        gameStatusEl.textContent =
            "GAME OVER";

    } else if (
        gamePaused
    ) {

        gameStatusEl.textContent =
            "PAUSED";

    } else if (
        gameRunning
    ) {

        gameStatusEl.textContent =
            "PLAYING";

    } else {

        gameStatusEl.textContent =
            "READY";

    }


    const speed =
        getDropSpeed();


    if (
        speed > 550
    ) {

        speedStatusEl.textContent =
            "NORMAL";

    } else if (
        speed > 300
    ) {

        speedStatusEl.textContent =
            "FAST";

    } else {

        speedStatusEl.textContent =
            "EXTREME";

    }


    const currentXP =
        playerXP % 100;


    xpBar.style.width =
        `${currentXP}%`;


    xpText.textContent =
        `${currentXP} / 100`;


    const mission =
        Math.min(
            100,
            (
                missionLines / 10
            ) * 100
        );


    missionBar.style.width =
        `${mission}%`;


    missionText.textContent =
        `Clear ${10 - missionLines} more lines`;

}


/* =========================================
   SAVE
   ========================================= */

function saveData() {

    saveBestScore();


    localStorage.setItem(
        "blockdropXP",
        playerXP
    );


    localStorage.setItem(
        "blockdropMissionLines",
        missionLines
    );


    localStorage.setItem(
        "blockdropMode",
        selectedMode
    );


    localStorage.setItem(
        "blockdropDifficulty",
        selectedDifficulty
    );

}


/* =========================================
   OVERLAY
   ========================================= */

function showOverlay(
    title,
    message
) {

    overlay.classList.add(
        "active"
    );


    overlay.querySelector(
        ".game-logo"
    ).innerHTML =
        `<span>${title}</span>`;


    overlayMessage.textContent =
        message;

}


function hideOverlay() {

    overlay.classList.remove(
        "active"
    );

}


/* =========================================
   GAME OVER
   ========================================= */

function endGame(
    reason = "GAME OVER"
) {

    gameRunning = false;

    gamePaused = false;

    gameOver = true;


    stopTimer();


    cancelAnimationFrame(
        animationFrame
    );


    saveData();

    updateUI();


    showOverlay(
        reason,
        `Final Score: ${score.toLocaleString()}`
    );


    startBtn.classList.add(
        "hidden"
    );


    resumeBtn.classList.add(
        "hidden"
    );


    restartBtn.classList.remove(
        "hidden"
    );


    pauseBtn.textContent =
        "⏸ PAUSE";

}


/* =========================================
   PAUSE
   ========================================= */

function togglePause() {

    if (!gameRunning) {
        return;
    }


    if (gamePaused) {

        gamePaused = false;


        overlay.classList.remove(
            "active"
        );


        lastTime =
            performance.now();


        pauseBtn.textContent =
            "⏸ PAUSE";


        animationFrame =
            requestAnimationFrame(
                gameLoop
            );


    } else {

        gamePaused = true;


        showOverlay(
            "PAUSED",
            "Continue when you're ready."
        );


        startBtn.classList.add(
            "hidden"
        );


        restartBtn.classList.remove(
            "hidden"
        );


        resumeBtn.classList.remove(
            "hidden"
        );


        pauseBtn.textContent =
            "▶ RESUME";

    }


    updateUI();

}


/* =========================================
   EFFECTS
   ========================================= */

function showFloatingScore(
    text
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "float-score";


    element.textContent =
        text;


    element.style.left =
        `${window.innerWidth / 2 - 30}px`;


    element.style.top =
        `${window.innerHeight / 2}px`;


    document.body.appendChild(
        element
    );


    setTimeout(() => {

        element.remove();

    },900);

}


function showCombo(
    text
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "combo-effect";


    element.textContent =
        text;


    document.body.appendChild(
        element
    );


    document
        .querySelector(".app")
        .classList.add(
            "shake"
        );


    setTimeout(() => {

        element.remove();


        document
            .querySelector(".app")
            .classList.remove(
                "shake"
            );

    },800);

}


/* =========================================
   MODE SELECTION
   ========================================= */

document
    .querySelectorAll(
        "[data-mode]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (gameRunning) {
                    return;
                }


                selectedMode =
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


                saveData();

                updateUI();

            }
        );

    });


/* =========================================
   DIFFICULTY SELECTION
   ========================================= */

document
    .querySelectorAll(
        "[data-difficulty]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (gameRunning) {
                    return;
                }


                selectedDifficulty =
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


                saveData();

                updateUI();

            }
        );

    });


/* =========================================
   GAME BUTTONS
   ========================================= */

startBtn.addEventListener(
    "click",
    startGame
);


restartBtn.addEventListener(
    "click",
    startGame
);


restartGameBtn.addEventListener(
    "click",
    startGame
);


resumeBtn.addEventListener(
    "click",
    togglePause
);


pauseBtn.addEventListener(
    "click",
    togglePause
);


leftBtn.addEventListener(
    "click",
    moveLeft
);


rightBtn.addEventListener(
    "click",
    moveRight
);


downBtn.addEventListener(
    "click",
    moveDown
);


rotateBtn.addEventListener(
    "click",
    rotatePiece
);


dropBtn.addEventListener(
    "click",
    hardDrop
);


holdBtn.addEventListener(
    "click",
    holdCurrentPiece
);


/* =========================================
   KEYBOARD
   ========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            [
                "ArrowLeft",
                "ArrowRight",
                "ArrowDown",
                "ArrowUp",
                " "
            ].includes(
                event.key
            )
        ) {

            event.preventDefault();

        }


        switch (
            event.key
        ) {

            case "ArrowLeft":
                moveLeft();
                break;


            case "ArrowRight":
                moveRight();
                break;


            case "ArrowDown":
                moveDown();
                break;


            case "ArrowUp":
                rotatePiece();
                break;


            case " ":
                hardDrop();
                break;


            case "c":
            case "C":
                holdCurrentPiece();
                break;


            case "p":
            case "P":
                togglePause();
                break;

        }

    }
);


/* =========================================
   RESTORE SELECTION
   ========================================= */

document
    .querySelectorAll(
        "[data-mode]"
    )
    .forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.mode ===
            selectedMode
        );

    });


document
    .querySelectorAll(
        "[data-difficulty]"
    )
    .forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.difficulty ===
            selectedDifficulty
        );

    });


/* =========================================
   INITIALIZE
   ========================================= */

resetGame();

gameRunning = false;

showOverlay(
    "BLOCKDROP",
    "Choose your mode and difficulty."
);


startBtn.classList.remove(
    "hidden"
);

restartBtn.classList.add(
    "hidden"
);

resumeBtn.classList.add(
    "hidden"
);


updateUI();

draw();

drawPreviews();


console.log(
    "BLOCKDROP Commit 10 loaded successfully."
);