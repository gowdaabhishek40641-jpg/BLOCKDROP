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


let highScore =
    Number(
        localStorage.getItem(
            "blockdropHighScore"
        )
    ) || 0;


let gameRunning = false;

let paused = false;

let soundEnabled = true;


let dropCounter = 0;

let lastTime = 0;


let particles = [];

let clearingRows = [];

let clearTimer = 0;


let audioContext = null;


const SHAPES = [

    {
        shape: [
            [1, 1, 1, 1]
        ],
        color: "#00e5ff"
    },

    {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: "#ffd000"
    },

    {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: "#a855f7"
    },

    {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: "#ff304f"
    },

    {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: "#ff8a00"
    },

    {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: "#22c55e"
    },

    {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: "#3b82f6"
    }

];


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
                (COLS -
                data.shape[0].length) / 2
            ),

        y: 0

    };

}


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

            if (!shape[y][x]) continue;


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


function drawBlock(
    context,
    x,
    y,
    color,
    size
) {

    context.fillStyle = color;

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
                    !clearingRows.includes(y)
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

    let ghostY =
        player.y;


    while (
        !collisionAt(
            player.x,
            ghostY + 1,
            player.shape
        )
    ) {

        ghostY++;

    }


    return ghostY;

}


function drawGhost() {

    const ghostY =
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

                            (player.x + x)
                            * BLOCK + 5,

                            (ghostY + y)
                            * BLOCK + 5,

                            BLOCK - 10,

                            BLOCK - 10

                        );

                    }

                }
            );

        }
    );

}


function moveLeft() {

    if (
        !gameRunning ||
        paused
    ) return;


    player.x--;


    if (collision()) {

        player.x++;

    }


    drawBoard();

}


function moveRight() {

    if (
        !gameRunning ||
        paused
    ) return;


    player.x++;


    if (collision()) {

        player.x--;

    }


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


    playSound(
        150,
        0.05,
        "square"
    );


    const cleared =
        findFullRows();


    if (cleared.length > 0) {

        clearingRows =
            cleared;

        createParticles(
            cleared
        );

        combo++;

        awardPoints(
            cleared.length
        );

        playSound(
            500,
            0.12,
            "sine"
        );


        clearTimer = 180;

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
                cell => cell !== null
            )
        ) {

            rows.push(y);

        }

    }


    return rows;

}


function finishLineClear() {

    if (
        clearingRows.length === 0
    ) return;


    clearingRows
        .sort(
            (a, b) => b - a
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


function awardPoints(
    count
) {

    const basePoints = {

        1: 100,

        2: 300,

        3: 500,

        4: 800

    };


    let points =
        (basePoints[count] || 800)
        * level;


    if (combo > 1) {

        points +=
            (combo - 1)
            * 100
            * level;

        showMessage(
            `COMBO x${combo}`
        );

    }


    if (count === 4) {

        points +=
            1000 * level;

        showMessage(
            "BLOCKDROP!"
        );

    }


    score += points;

    lines += count;


    level =
        Math.floor(
            lines / 5
        ) + 1;


    if (
        score > highScore
    ) {

        highScore =
            score;

        localStorage.setItem(
            "blockdropHighScore",
            highScore
        );

    }


    updateUI();

}


function rotatePlayer() {

    if (
        !gameRunning ||
        paused
    ) return;


    const oldShape =
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
            oldShape;

    } else {

        playSound(
            350,
            0.04,
            "square"
        );

    }


    drawBoard();

}


function hardDrop() {

    if (
        !gameRunning ||
        paused
    ) return;


    const ghostY =
        getGhostY();


    const distance =
        ghostY - player.y;


    score +=
        distance * 2;


    player.y =
        ghostY;


    lockPiece();

    updateUI();

}


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


    playSound(
        250,
        0.05,
        "triangle"
    );


    drawHold();

    drawBoard();

}


function drawNext() {

    nextCtx.clearRect(
        0,
        0,
        120,
        120
    );


    if (nextPiece) {

        drawMiniPiece(
            nextCtx,
            nextPiece
        );

    }

}


function drawHold() {

    holdCtx.clearRect(
        0,
        0,
        120,
        120
    );


    if (holdPiece) {

        drawMiniPiece(
            holdCtx,
            holdPiece
        );

    }

}


function drawMiniPiece(
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
        (120 - width) / 2;


    const offsetY =
        (120 - height) / 2;


    piece.shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

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
                            (Math.random() - 0.5)
                            * 5,

                        vy:
                            (Math.random() - 1)
                            * 5,

                        life: 1,

                        size:
                            Math.random() * 4 + 2

                    });

                }

            }

        }
    );

}


function drawParticles() {

    particles.forEach(
        particle => {

            ctx.globalAlpha =
                particle.life;


            ctx.fillStyle =
                "#ff304f";


            ctx.fillRect(

                particle.x,

                particle.y,

                particle.size,

                particle.size

            );


            particle.x +=
                particle.vx;


            particle.y +=
                particle.vy;


            particle.vy +=
                0.15;


            particle.life -=
                0.025;

        }
    );


    ctx.globalAlpha = 1;


    particles =
        particles.filter(
            p => p.life > 0
        );

}


function showMessage(text) {

    const message =
        document.getElementById(
            "message"
        );


    message.textContent =
        text;


    message.classList.remove(
        "show"
    );


    void message.offsetWidth;


    message.classList.add(
        "show"
    );

}


function getDropSpeed() {

    return Math.max(
        100,
        800 -
        ((level - 1) * 70)
    );

}


function updateUI() {

    document.getElementById(
        "score"
    ).textContent =
        score;


    document.getElementById(
        "highScore"
    ).textContent =
        highScore;


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

}


function togglePause() {

    if (!gameRunning) return;


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


    initAudio();

}


function endGame() {

    gameRunning = false;

    paused = false;


    playSound(
        100,
        0.3,
        "sawtooth"
    );


    document.getElementById(
        "finalScore"
    ).textContent =
        score;


    document.getElementById(
        "finalHighScore"
    ).textContent =
        highScore;


    document
        .getElementById(
            "gameOverOverlay"
        )
        .classList.remove(
            "hidden"
        );

}


function initAudio() {

    if (!soundEnabled) return;


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

    if (!soundEnabled) return;


    try {

        initAudio();


        if (!audioContext) return;


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

        playSound(
            500,
            0.1,
            "sine"
        );

    }

}


function restartGame() {

    startGame();

}


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
            event.key.toLowerCase() ===
            "c"
        ) {

            holdCurrentPiece();

        }


        if (
            event.key.toLowerCase() ===
            "p"
        ) {

            togglePause();

        }

    }
);


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
            clearingRows.length > 0
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


board =
    createBoard();


updateUI();

drawBoard();

requestAnimationFrame(
    update
);