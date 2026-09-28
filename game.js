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

let score = 0;

let level = 1;

let lines = 0;


let player = null;

let nextPiece = null;

let holdPiece = null;

let holdUsed = false;


let gameRunning = false;

let paused = false;


let dropCounter = 0;

let lastTime = 0;


/* PIECES */

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


/* BOARD */

function createBoard() {

    return Array.from(

        { length: ROWS },

        () => Array(COLS).fill(null)

    );

}


/* RANDOM PIECE */

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


/* PLAYER */

function spawnPlayer() {

    if (nextPiece === null) {

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


/* DRAW GAME */

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

                drawBlock(
                    ctx,
                    x,
                    y,
                    board[y][x],
                    BLOCK
                );

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


    drawGhost();

    drawPlayer();

}


/* BLOCK */

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


/* PLAYER */

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


/* GHOST PIECE */

function getGhostY() {

    let ghostY =
        player.y;

    while (true) {

        ghostY++;

        if (
            collisionAt(
                player.x,
                ghostY,
                player.shape
            )
        ) {

            return ghostY - 1;

        }

    }

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
                            player.color + "25";

                        ctx.fillRect(
                            (player.x + x) *
                                BLOCK + 5,

                            (ghostY + y) *
                                BLOCK + 5,

                            BLOCK - 10,

                            BLOCK - 10
                        );

                    }

                }
            );

        }
    );

}


/* COLLISION */

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

            if (!shape[y][x]) {

                continue;

            }


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


/* MERGE */

function mergePlayer() {

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

}


/* MOVE */

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

        mergePlayer();

        clearLines();

        spawnPlayer();

    }

    dropCounter = 0;

    drawBoard();

}


/* ROTATE */

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

    }


    drawBoard();

}


/* HARD DROP */

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


    mergePlayer();

    clearLines();

    spawnPlayer();

    updateUI();

    drawBoard();

}


/* HOLD */

function holdCurrentPiece() {

    if (
        !gameRunning ||
        paused ||
        holdUsed
    ) return;


    holdUsed = true;


    if (holdPiece === null) {

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
                    (COLS -
                    temp.shape[0].length) / 2
                ),

            y: 0

        };

    }


    drawHold();

    drawBoard();

}


/* CLEAR LINES */

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

            board.splice(y, 1);

            board.unshift(
                Array(COLS).fill(null)
            );

            cleared++;

            y++;

        }

    }


    if (cleared > 0) {

        const points = [
            0,
            100,
            300,
            500,
            800
        ];


        score +=
            (points[cleared] || 800)
            * level;


        lines += cleared;


        level =
            Math.floor(
                lines / 5
            ) + 1;


        updateUI();

    }

}


/* SPEED */

function getDropSpeed() {

    return Math.max(
        100,
        800 -
        ((level - 1) * 70)
    );

}


/* NEXT PREVIEW */

function drawNext() {

    nextCtx.clearRect(
        0,
        0,
        nextCanvas.width,
        nextCanvas.height
    );


    if (!nextPiece) return;


    drawMiniPiece(
        nextCtx,
        nextPiece
    );

}


/* HOLD PREVIEW */

function drawHold() {

    holdCtx.clearRect(
        0,
        0,
        holdCanvas.width,
        holdCanvas.height
    );


    if (!holdPiece) return;


    drawMiniPiece(
        holdCtx,
        holdPiece
    );

}


/* MINI PIECE */

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


/* UI */

function updateUI() {

    document.getElementById(
        "score"
    ).textContent = score;


    document.getElementById(
        "level"
    ).textContent = level;


    document.getElementById(
        "lines"
    ).textContent = lines;

}


/* PAUSE */

function togglePause() {

    if (!gameRunning) return;


    paused = !paused;


    const overlay =
        document.getElementById(
            "pauseOverlay"
        );


    const button =
        document.getElementById(
            "pauseBtn"
        );


    if (paused) {

        overlay.classList.remove(
            "hidden"
        );

        button.textContent =
            "RESUME";

    } else {

        overlay.classList.add(
            "hidden"
        );

        button.textContent =
            "PAUSE";

    }

}


/* START */

function startGame() {

    board =
        createBoard();


    score = 0;

    level = 1;

    lines = 0;


    holdPiece = null;

    nextPiece = null;

    holdUsed = false;


    paused = false;

    gameRunning = true;


    document.getElementById(
        "gameOverOverlay"
    ).classList.add(
        "hidden"
    );


    document.getElementById(
        "pauseOverlay"
    ).classList.add(
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

}


/* GAME OVER */

function endGame() {

    gameRunning = false;

    paused = false;


    document.getElementById(
        "finalScore"
    ).textContent =
        score;


    document.getElementById(
        "gameOverOverlay"
    ).classList.remove(
        "hidden"
    );

}


/* RESTART */

function restartGame() {

    startGame();

}


/* GAME LOOP */

function update(time = 0) {

    if (
        gameRunning &&
        !paused
    ) {

        const deltaTime =
            time - lastTime;


        lastTime = time;


        dropCounter +=
            deltaTime;


        if (
            dropCounter >
            getDropSpeed()
        ) {

            moveDown();

        }

    }


    requestAnimationFrame(
        update
    );

}


/* KEYBOARD */

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


/* BUTTONS */

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


/* INITIAL */

board =
    createBoard();

drawBoard();

requestAnimationFrame(
    update
);100