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


let board = [];

let player = null;

let nextPiece = null;

let holdPiece = null;

let holdUsed = false;


let score = 0;

let level = 1;

let lines = 0;

let combo = 0;


let gameRunning = false;

let paused = false;


let gameMode = "classic";

let difficulty = "normal";


let timer = 120;

let timerInterval = null;


let dropCounter = 0;

let lastTime = 0;


let particles = [];

let clearingRows = [];

let clearTimer = 0;


let soundEnabled = true;

let audioContext = null;


const DIFFICULTY = {

    normal: {
        speed: 800,
        multiplier: 1
    },

    hard: {
        speed: 560,
        multiplier: 1.5
    },

    insane: {
        speed: 350,
        multiplier: 2
    }

};


const SHAPES = [

    {
        shape: [
            [1,1,1,1]
        ],
        color: "#00e5ff"
    },

    {
        shape: [
            [1,1],
            [1,1]
        ],
        color: "#ffd000"
    },

    {
        shape: [
            [0,1,0],
            [1,1,1]
        ],
        color: "#a855f7"
    },

    {
        shape: [
            [1,0,0],
            [1,1,1]
        ],
        color: "#ff304f"
    },

    {
        shape: [
            [0,0,1],
            [1,1,1]
        ],
        color: "#ff8a00"
    },

    {
        shape: [
            [0,1,1],
            [1,1,0]
        ],
        color: "#22c55e"
    },

    {
        shape: [
            [1,1,0],
            [0,1,1]
        ],
        color: "#3b82f6"
    }

];


/* ================= STORAGE ================= */

function getBest(mode) {

    return Number(
        localStorage.getItem(
            `blockdrop_${mode}_best`
        )
    ) || 0;

}


function saveBest() {

    if (
        score >
        getBest(gameMode)
    ) {

        localStorage.setItem(
            `blockdrop_${gameMode}_best`,
            score
        );

    }

}


/* ================= MENU ================= */

document
    .querySelectorAll(".mode-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".mode-btn"
                    )
                    .forEach(
                        item =>
                            item.classList
                                .remove(
                                    "active"
                                )
                    );


                button.classList.add(
                    "active"
                );


                gameMode =
                    button.dataset.mode;


                updateMenu();

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
                    .forEach(
                        item =>
                            item.classList
                                .remove(
                                    "active"
                                )
                    );


                button.classList.add(
                    "active"
                );


                difficulty =
                    button.dataset.difficulty;

            }
        );

    });


function updateMenu() {

    document.getElementById(
        "classicBest"
    ).textContent =
        getBest("classic");


    document.getElementById(
        "timeBest"
    ).textContent =
        getBest("time");


    document.getElementById(
        "endlessBest"
    ).textContent =
        getBest("endless");

}


function showGameScreen() {

    document
        .getElementById(
            "menuScreen"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "gameScreen"
        )
        .classList.remove(
            "hidden"
        );

}


function showMenuScreen() {

    stopTimer();

    gameRunning = false;

    paused = false;


    document
        .getElementById(
            "gameScreen"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "menuScreen"
        )
        .classList.remove(
            "hidden"
        );


    updateMenu();

}


document.getElementById(
    "playBtn"
).onclick = () => {

    showGameScreen();

    startGame();

};


document.getElementById(
    "menuBtn"
).onclick =
    showMenuScreen;


document.getElementById(
    "resultMenuBtn"
).onclick =
    showMenuScreen;


/* ================= BOARD ================= */

function createBoard() {

    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(null)
    );

}


function createRandomPiece() {

    const data =
        SHAPES[
            Math.floor(
                Math.random() *
                SHAPES.length
            )
        ];


    return {

        shape:
            data.shape.map(
                row => [...row]
            ),

        color:
            data.color,

        x:
            Math.floor(
                (
                    COLS -
                    data.shape[0].length
                ) / 2
            ),

        y: 0

    };

}


/* ================= SPAWN ================= */

function spawnPlayer() {

    if (!nextPiece) {

        player =
            createRandomPiece();

        nextPiece =
            createRandomPiece();

    } else {

        player =
            nextPiece;

        nextPiece =
            createRandomPiece();

    }


    holdUsed = false;


    if (collision()) {

        endGame();

    }


    drawNext();

}


/* ================= COLLISION ================= */

function collisionAt(
    px,
    py,
    shape
) {

    for (
        let y = 0;
        y < shape.length;
        y++
    ) {

        for (
            let x = 0;
            x < shape[y].length;
            x++
        ) {

            if (!shape[y][x])
                continue;


            const bx =
                px + x;

            const by =
                py + y;


            if (
                bx < 0 ||
                bx >= COLS ||
                by >= ROWS
            ) {

                return true;

            }


            if (
                by >= 0 &&
                board[by][bx]
            ) {

                return true;

            }

        }

    }

    return false;

}


function collision() {

    return collisionAt(
        player.x,
        player.y,
        player.shape
    );

}


/* ================= DRAW ================= */

function drawBlock(
    context,
    x,
    y,
    color,
    size
) {

    context.fillStyle =
        color;


    context.fillRect(
        x * size + 2,
        y * size + 2,
        size - 4,
        size - 4
    );


    context.strokeStyle =
        "#ffffff44";


    context.strokeRect(
        x * size + 2,
        y * size + 2,
        size - 4,
        size - 4
    );

}


function drawBoard() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


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

            if (board[y][x]) {

                if (
                    !clearingRows
                        .includes(y)
                ) {

                    drawBlock(
                        ctx,
                        x,
                        y,
                        board[y][x],
                        BLOCK
                    );

                }

            } else {

                ctx.strokeStyle =
                    "#151515";


                ctx.strokeRect(
                    x * BLOCK,
                    y * BLOCK,
                    BLOCK,
                    BLOCK
                );

            }

        }

    }


    if (player) {

        drawGhost();

        drawPlayer();

    }


    drawParticles();

}


function drawPlayer() {

    player.shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (value) {

                        drawBlock(
                            ctx,
                            player.x + x,
                            player.y + y,
                            player.color,
                            BLOCK
                        );

                    }

                }
            );

        }
    );

}


function getGhostY() {

    let y =
        player.y;


    while (
        !collisionAt(
            player.x,
            y + 1,
            player.shape
        )
    ) {

        y++;

    }


    return y;

}


function drawGhost() {

    const ghost =
        getGhostY();


    player.shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (value) {

                        ctx.fillStyle =
                            player.color +
                            "25";


                        ctx.fillRect(

                            (
                                player.x +
                                x
                            ) * BLOCK + 5,

                            (
                                ghost +
                                y
                            ) * BLOCK + 5,

                            BLOCK - 10,

                            BLOCK - 10

                        );

                    }

                }
            );

        }
    );

}


/* ================= MOVEMENT ================= */

function moveLeft() {

    if (
        !gameRunning ||
        paused
    ) return;


    player.x--;


    if (collision())
        player.x++;


    drawBoard();

}


function moveRight() {

    if (
        !gameRunning ||
        paused
    ) return;


    player.x++;


    if (collision())
        player.x--;


    drawBoard();

}


function moveDown() {

    if (
        !gameRunning ||
        paused
    ) return;


    player.y++;


    if (collision()) {

        player.y--;

        lockPiece();

    }


    dropCounter = 0;

    drawBoard();

}


function rotatePlayer() {

    if (
        !gameRunning ||
        paused
    ) return;


    const old =
        player.shape;


    player.shape =
        player.shape[0].map(
            (_, index) =>
                player.shape
                    .map(
                        row =>
                            row[index]
                    )
                    .reverse()
        );


    if (collision()) {

        player.shape =
            old;

    }


    drawBoard();

}


function hardDrop() {

    if (
        !gameRunning ||
        paused
    ) return;


    const ghost =
        getGhostY();


    score +=
        (ghost - player.y) * 2;


    player.y =
        ghost;


    lockPiece();


    updateUI();

}


/* ================= LOCK ================= */

function lockPiece() {

    player.shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (value) {

                        board[
                            player.y + y
                        ][
                            player.x + x
                        ] =
                            player.color;

                    }

                }
            );

        }
    );


    const rows =
        findFullRows();


    if (
        rows.length
    ) {

        clearingRows =
            rows;


        combo++;


        awardPoints(
            rows.length
        );


        createParticles(
            rows
        );


        clearTimer =
            180;


    } else {

        combo = 0;

        spawnPlayer();

    }


    updateUI();

}


function findFullRows() {

    const rows = [];


    for (
        let y = 0;
        y < ROWS;
        y++
    ) {

        if (
            board[y].every(
                cell =>
                    cell !== null
            )
        ) {

            rows.push(y);

        }

    }


    return rows;

}


function finishLineClear() {

    clearingRows
        .sort(
            (a,b) => b-a
        )
        .forEach(
            row => {

                board.splice(
                    row,
                    1
                );


                board.unshift(
                    Array(COLS)
                        .fill(null)
                );

            }
        );


    clearingRows = [];

    clearTimer = 0;


    spawnPlayer();

}


/* ================= SCORE ================= */

function awardPoints(count) {

    const points = {

        1: 100,

        2: 300,

        3: 500,

        4: 800

    };


    let value =
        points[count] || 800;


    value *= level;


    value *=
        DIFFICULTY[
            difficulty
        ].multiplier;


    if (combo > 1) {

        value +=
            (
                combo - 1
            ) *
            100 *
            level;

    }


    if (
        gameMode === "time"
    ) {

        value *= 1.25;

    }


    score +=
        Math.floor(value);


    lines += count;


    level =
        Math.floor(
            lines / 5
        ) + 1;


    if (count === 4) {

        showMessage(
            "BLOCKDROP!"
        );

    } else if (
        combo > 1
    ) {

        showMessage(
            `COMBO x${combo}`
        );

    }


    playSound(
        550,
        0.12,
        "sine"
    );


    saveBest();

}


/* ================= HOLD ================= */

function holdCurrentPiece() {

    if (
        !gameRunning ||
        paused ||
        holdUsed
    ) return;


    holdUsed = true;


    if (!holdPiece) {

        holdPiece = {

            shape:
                player.shape.map(
                    row => [...row]
                ),

            color:
                player.color

        };


        spawnPlayer();

    } else {

        const temp =
            holdPiece;


        holdPiece = {

            shape:
                player.shape.map(
                    row => [...row]
                ),

            color:
                player.color

        };


        player = {

            shape:
                temp.shape.map(
                    row => [...row]
                ),

            color:
                temp.color,

            x:
                Math.floor(
                    (
                        COLS -
                        temp.shape[0].length
                    ) / 2
                ),

            y: 0

        };

    }


    drawHold();

    drawBoard();

}


/* ================= PREVIEWS ================= */

function drawNext() {

    nextCtx.clearRect(
        0,
        0,
        120,
        120
    );


    if (nextPiece)
        drawMini(
            nextCtx,
            nextPiece
        );

}


function drawHold() {

    holdCtx.clearRect(
        0,
        0,
        120,
        120
    );


    if (holdPiece)
        drawMini(
            holdCtx,
            holdPiece
        );

}


function drawMini(
    context,
    piece
) {

    const size = 25;


    const width =
        piece.shape[0].length *
        size;


    const height =
        piece.shape.length *
        size;


    const offsetX =
        (
            120 -
            width
        ) / 2;


    const offsetY =
        (
            120 -
            height
        ) / 2;


    piece.shape.forEach(
        (row,y) => {

            row.forEach(
                (value,x) => {

                    if (value) {

                        context.fillStyle =
                            piece.color;


                        context.fillRect(

                            offsetX +
                            x * size,

                            offsetY +
                            y * size,

                            size - 3,

                            size - 3

                        );

                    }

                }
            );

        }
    );

}


/* ================= PARTICLES ================= */

function createParticles(rows) {

    rows.forEach(
        row => {

            for (
                let x = 0;
                x < COLS;
                x++
            ) {

                for (
                    let i = 0;
                    i < 3;
                    i++
                ) {

                    particles.push({

                        x:
                            x * BLOCK +
                            BLOCK / 2,

                        y:
                            row * BLOCK +
                            BLOCK / 2,

                        vx:
                            (
                                Math.random()
                                - 0.5
                            ) * 5,

                        vy:
                            (
                                Math.random()
                                - 1
                            ) * 5,

                        life: 1,

                        size:
                            Math.random() *
                            4 + 2

                    });

                }

            }

        }
    );

}


function drawParticles() {

    particles.forEach(
        p => {

            ctx.globalAlpha =
                p.life;


            ctx.fillStyle =
                "#ff304f";


            ctx.fillRect(
                p.x,
                p.y,
                p.size,
                p.size
            );


            p.x += p.vx;

            p.y += p.vy;

            p.vy += 0.15;

            p.life -= 0.025;

        }
    );


    ctx.globalAlpha = 1;


    particles =
        particles.filter(
            p =>
                p.life > 0
        );

}


/* ================= MESSAGE ================= */

function showMessage(text) {

    const element =
        document.getElementById(
            "message"
        );


    if (!element)
        return;


    element.textContent =
        text;


    element.classList.remove(
        "show"
    );


    void element.offsetWidth;


    element.classList.add(
        "show"
    );

}


/* ================= SPEED ================= */

function getDropSpeed() {

    let speed =
        DIFFICULTY[
            difficulty
        ].speed;


    speed -=
        (
            level - 1
        ) * 60;


    if (
        gameMode === "endless"
    ) {

        speed -=
            level * 15;

    }


    return Math.max(
        80,
        speed
    );

}


/* ================= TIMER ================= */

function startTimer() {

    stopTimer();


    if (
        gameMode !== "time"
    )
        return;


    timer = 120;


    updateTimer();


    timerInterval =
        setInterval(
            () => {

                if (
                    !gameRunning ||
                    paused
                )
                    return;


                timer--;


                updateTimer();


                if (
                    timer <= 0
                ) {

                    endGame();

                }

            },
            1000
        );

}


function stopTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }

}


function updateTimer() {

    document.getElementById(
        "timer"
    ).textContent =
        timer;

}


/* ================= PAUSE ================= */

function togglePause() {

    if (!gameRunning)
        return;


    paused =
        !paused;


    document
        .getElementById(
            "pauseOverlay"
        )
        .classList.toggle(
            "hidden",
            !paused
        );


    document.getElementById(
        "pauseBtn"
    ).textContent =
        paused
            ? "RESUME"
            : "PAUSE";

}


/* ================= UI ================= */

function updateUI() {

    document.getElementById(
        "score"
    ).textContent =
        score;


    document.getElementById(
        "highScore"
    ).textContent =
        getBest(gameMode);


    document.getElementById(
        "level"
    ).textContent =
        level;


    document.getElementById(
        "lines"
    ).textContent =
        lines;


    document.getElementById(
        "combo"
    ).textContent =
        "x" + combo;


    document.getElementById(
        "modeLabel"
    ).textContent =
        gameMode
            .replace(
                "-",
                " "
            )
            .toUpperCase();


    const timerCard =
        document.getElementById(
            "timerCard"
        );


    timerCard.classList.toggle(
        "hidden",
        gameMode !== "time"
    );

}


/* ================= START ================= */

function startGame() {

    board =
        createBoard();


    score = 0;

    level = 1;

    lines = 0;

    combo = 0;


    player = null;

    nextPiece = null;

    holdPiece = null;


    particles = [];

    clearingRows = [];


    paused = false;

    gameRunning = true;


    document
        .getElementById(
            "gameOverOverlay"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "pauseOverlay"
        )
        .classList.add(
            "hidden"
        );


    document.getElementById(
        "pauseBtn"
    ).textContent =
        "PAUSE";


    updateUI();

    drawHold();

    spawnPlayer();

    drawBoard();


    startTimer();

    initAudio();

}


/* ================= GAME OVER ================= */

function endGame() {

    if (!gameRunning)
        return;


    gameRunning = false;

    paused = false;


    stopTimer();


    saveBest();


    document.getElementById(
        "finalScore"
    ).textContent =
        score;


    document.getElementById(
        "finalLines"
    ).textContent =
        lines;


    document.getElementById(
        "finalLevel"
    ).textContent =
        level;


    document.getElementById(
        "finalHighScore"
    ).textContent =
        getBest(gameMode);


    document
        .getElementById(
            "gameOverOverlay"
        )
        .classList.remove(
            "hidden"
        );


    playSound(
        100,
        0.3,
        "sawtooth"
    );


    updateMenu();

}


/* ================= AUDIO ================= */

function initAudio() {

    if (!soundEnabled)
        return;


    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }


    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();

    }

}


function playSound(
    frequency,
    duration,
    type
) {

    if (!soundEnabled)
        return;


    try {

        initAudio();


        if (!audioContext)
            return;


        const oscillator =
            audioContext
                .createOscillator();


        const gain =
            audioContext
                .createGain();


        oscillator.type =
            type;


        oscillator.frequency.value =
            frequency;


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


function toggleSound() {

    soundEnabled =
        !soundEnabled;


    document.getElementById(
        "soundBtn"
    ).textContent =
        soundEnabled
            ? "🔊"
            : "🔇";


    if (soundEnabled) {

        initAudio();

    }

}


/* ================= RESTART ================= */

function restartGame() {

    startGame();

}


/* ================= CONTROLS ================= */

document.getElementById(
    "left"
).onclick =
    moveLeft;


document.getElementById(
    "right"
).onclick =
    moveRight;


document.getElementById(
    "rotate"
).onclick =
    rotatePlayer;


document.getElementById(
    "drop"
).onclick =
    hardDrop;


document.getElementById(
    "hold"
).onclick =
    holdCurrentPiece;


document.getElementById(
    "startBtn"
).onclick =
    startGame;


document.getElementById(
    "pauseBtn"
).onclick =
    togglePause;


document.getElementById(
    "restartBtn"
).onclick =
    restartGame;


document.getElementById(
    "soundBtn"
).onclick =
    toggleSound;


/* ================= KEYBOARD ================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "ArrowLeft"
        ) {

            event.preventDefault();

            moveLeft();

        }


        if (
            event.key ===
            "ArrowRight"
        ) {

            event.preventDefault();

            moveRight();

        }


        if (
            event.key ===
            "ArrowDown"
        ) {

            event.preventDefault();

            moveDown();

        }


        if (
            event.key ===
            "ArrowUp"
        ) {

            event.preventDefault();

            rotatePlayer();

        }


        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            hardDrop();

        }


        if (
            event.key.toLowerCase()
            === "c"
        ) {

            holdCurrentPiece();

        }


        if (
            event.key.toLowerCase()
            === "p"
        ) {

            togglePause();

        }

    }
);


/* ================= LOOP ================= */

function update(time = 0) {

    if (
        gameRunning &&
        !paused
    ) {

        const delta =
            time - lastTime;


        lastTime =
            time;


        dropCounter +=
            delta;


        if (
            clearingRows.length
        ) {

            clearTimer -=
                delta;


            if (
                clearTimer <= 0
            ) {

                finishLineClear();

            }

        } else if (
            dropCounter >
            getDropSpeed()
        ) {

            moveDown();

        }

    }


    drawBoard();


    requestAnimationFrame(
        update
    );

}


/* ================= INIT ================= */

updateMenu();

board =
    createBoard();

drawBoard();

requestAnimationFrame(
    update
);