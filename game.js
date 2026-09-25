const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

let board = [];
let score = 0;
let level = 1;
let lines = 0;

let gameRunning = false;
let gameOverState = false;

let dropCounter = 0;
let lastTime = 0;

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

let player = null;


// -------------------------
// BOARD
// -------------------------

function createBoard() {

    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(null)
    );
}


// -------------------------
// RANDOM PIECE
// -------------------------

function createRandomPiece() {

    const randomIndex =
        Math.floor(Math.random() * SHAPES.length);

    const selected =
        SHAPES[randomIndex];

    return {
        shape: selected.shape.map(row => [...row]),
        color: selected.color,

        x: Math.floor(
            (COLS - selected.shape[0].length) / 2
        ),

        y: 0
    };
}


// -------------------------
// DRAW BOARD
// -------------------------

function drawBoard() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    for (let y = 0; y < ROWS; y++) {

        for (let x = 0; x < COLS; x++) {

            if (board[y][x]) {

                drawBlock(
                    x,
                    y,
                    board[y][x]
                );

            } else {

                drawGrid(x, y);

            }
        }
    }

    if (player) {

        drawPlayer();

    }
}


// -------------------------
// GRID
// -------------------------

function drawGrid(x, y) {

    ctx.strokeStyle = "#151515";

    ctx.strokeRect(
        x * BLOCK,
        y * BLOCK,
        BLOCK,
        BLOCK
    );
}


// -------------------------
// BLOCK
// -------------------------

function drawBlock(x, y, color) {

    ctx.fillStyle = color;

    ctx.fillRect(
        x * BLOCK + 2,
        y * BLOCK + 2,
        BLOCK - 4,
        BLOCK - 4
    );

    ctx.strokeStyle = "#ffffff44";

    ctx.strokeRect(
        x * BLOCK + 2,
        y * BLOCK + 2,
        BLOCK - 4,
        BLOCK - 4
    );
}


// -------------------------
// PLAYER
// -------------------------

function drawPlayer() {

    player.shape.forEach((row, y) => {

        row.forEach((value, x) => {

            if (value) {

                drawBlock(
                    player.x + x,
                    player.y + y,
                    player.color
                );

            }

        });

    });
}


// -------------------------
// COLLISION
// -------------------------

function collision() {

    for (
        let y = 0;
        y < player.shape.length;
        y++
    ) {

        for (
            let x = 0;
            x < player.shape[y].length;
            x++
        ) {

            if (!player.shape[y][x]) {

                continue;

            }

            const boardX =
                player.x + x;

            const boardY =
                player.y + y;


            if (
                boardX < 0 ||
                boardX >= COLS ||
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


// -------------------------
// MERGE PIECE
// -------------------------

function mergePlayer() {

    player.shape.forEach((row, y) => {

        row.forEach((value, x) => {

            if (value) {

                board[
                    player.y + y
                ][
                    player.x + x
                ] = player.color;

            }

        });

    });
}


// -------------------------
// MOVE DOWN
// -------------------------

function moveDown() {

    if (!gameRunning) {

        return;

    }

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


// -------------------------
// MOVE LEFT
// -------------------------

function moveLeft() {

    if (!gameRunning) {

        return;

    }

    player.x--;

    if (collision()) {

        player.x++;

    }

    drawBoard();
}


// -------------------------
// MOVE RIGHT
// -------------------------

function moveRight() {

    if (!gameRunning) {

        return;

    }

    player.x++;

    if (collision()) {

        player.x--;

    }

    drawBoard();
}


// -------------------------
// ROTATION
// -------------------------

function rotatePlayer() {

    if (!gameRunning) {

        return;

    }

    const oldShape = player.shape;

    player.shape =
        player.shape[0].map(
            (_, index) =>
                player.shape
                    .map(row => row[index])
                    .reverse()
        );

    if (collision()) {

        player.shape = oldShape;

    }

    drawBoard();
}


// -------------------------
// HARD DROP
// -------------------------

function hardDrop() {

    if (!gameRunning) {

        return;

    }

    while (!collision()) {

        player.y++;

    }

    player.y--;

    mergePlayer();

    clearLines();

    spawnPlayer();

    drawBoard();
}


// -------------------------
// SPAWN
// -------------------------

function spawnPlayer() {

    player = createRandomPiece();

    if (collision()) {

        endGame();

    }
}


// -------------------------
// CLEAR LINES
// -------------------------

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

        lines += cleared;

        score +=
            cleared *
            100 *
            level;

        level =
            Math.floor(lines / 5) + 1;

        updateUI();

    }
}


// -------------------------
// SPEED
// -------------------------

function getDropSpeed() {

    return Math.max(
        120,
        800 - ((level - 1) * 70)
    );

}


// -------------------------
// GAME LOOP
// -------------------------

function update(time = 0) {

    if (!gameRunning) {

        requestAnimationFrame(update);

        return;

    }

    const deltaTime =
        time - lastTime;

    lastTime = time;

    dropCounter += deltaTime;


    if (
        dropCounter >
        getDropSpeed()
    ) {

        moveDown();

    }

    requestAnimationFrame(update);

}


// -------------------------
// UI
// -------------------------

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


// -------------------------
// START GAME
// -------------------------

function startGame() {

    board = createBoard();

    score = 0;
    level = 1;
    lines = 0;

    gameOverState = false;

    gameRunning = true;

    updateUI();

    spawnPlayer();

    drawBoard();

}


// -------------------------
// GAME OVER
// -------------------------

function endGame() {

    gameRunning = false;

    gameOverState = true;

    setTimeout(() => {

        alert(
            "GAME OVER!\n\n" +
            "Score: " + score +
            "\nLevel: " + level +
            "\nLines: " + lines
        );

    }, 100);

}


// -------------------------
// KEYBOARD CONTROLS
// -------------------------

document.addEventListener(
    "keydown",
    event => {

        if (!gameRunning) {

            return;

        }


        if (
            event.key === "ArrowLeft"
        ) {

            moveLeft();

        }


        if (
            event.key === "ArrowRight"
        ) {

            moveRight();

        }


        if (
            event.key === "ArrowDown"
        ) {

            moveDown();

        }


        if (
            event.key === "ArrowUp"
        ) {

            rotatePlayer();

        }


        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            hardDrop();

        }

    }
);


// -------------------------
// MOBILE CONTROLS
// -------------------------

document.getElementById(
    "left"
).onclick = moveLeft;

document.getElementById(
    "right"
).onclick = moveRight;

document.getElementById(
    "rotate"
).onclick = rotatePlayer;

document.getElementById(
    "drop"
).onclick = hardDrop;

document.getElementById(
    "startBtn"
).onclick = startGame;


// -------------------------
// INITIALIZE
// -------------------------

board = createBoard();

drawBoard();

requestAnimationFrame(update);