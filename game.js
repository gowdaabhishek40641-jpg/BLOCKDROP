const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

let board;
let score = 0;
let level = 1;
let lines = 0;

let gameRunning = false;

let player = {
    x: 4,
    y: 0,
    shape: [
        [1, 1],
        [1, 1]
    ]
};

function createBoard() {

    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(0)
    );

}

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
                    "#ff304f"
                );

            } else {

                ctx.strokeStyle = "#151515";

                ctx.strokeRect(
                    x * BLOCK,
                    y * BLOCK,
                    BLOCK,
                    BLOCK
                );
            }
        }
    }

    drawPlayer();
}

function drawBlock(x, y, color) {

    ctx.fillStyle = color;

    ctx.fillRect(
        x * BLOCK + 2,
        y * BLOCK + 2,
        BLOCK - 4,
        BLOCK - 4
    );

    ctx.strokeStyle = "#ffffff33";

    ctx.strokeRect(
        x * BLOCK + 2,
        y * BLOCK + 2,
        BLOCK - 4,
        BLOCK - 4
    );
}

function drawPlayer() {

    player.shape.forEach((row, y) => {

        row.forEach((value, x) => {

            if (value) {

                drawBlock(
                    player.x + x,
                    player.y + y,
                    "#00e5ff"
                );

            }

        });

    });
}

function collision() {

    for (let y = 0; y < player.shape.length; y++) {

        for (let x = 0; x < player.shape[y].length; x++) {

            if (!player.shape[y][x]) continue;

            const boardX = player.x + x;
            const boardY = player.y + y;

            if (
                boardX < 0 ||
                boardX >= COLS ||
                boardY >= ROWS ||
                (boardY >= 0 && board[boardY][boardX])
            ) {
                return true;
            }
        }
    }

    return false;
}

function mergePlayer() {

    player.shape.forEach((row, y) => {

        row.forEach((value, x) => {

            if (value) {

                board[player.y + y][player.x + x] = 1;

            }

        });

    });
}

function clearLines() {

    let cleared = 0;

    for (let y = ROWS - 1; y >= 0; y--) {

        if (board[y].every(cell => cell === 1)) {

            board.splice(y, 1);

            board.unshift(
                Array(COLS).fill(0)
            );

            cleared++;
            y++;
        }
    }

    if (cleared > 0) {

        lines += cleared;

        score += cleared * 100 * level;

        level =
            Math.floor(lines / 5) + 1;

        updateUI();
    }
}

function resetPlayer() {

    player = {

        x: 4,
        y: 0,

        shape: [
            [1, 1],
            [1, 1]
        ]

    };

    if (collision()) {

        gameOver();

    }
}

function moveDown() {

    player.y++;

    if (collision()) {

        player.y--;

        mergePlayer();

        clearLines();

        resetPlayer();
    }

    drawBoard();
}

function moveLeft() {

    player.x--;

    if (collision()) {

        player.x++;

    }

    drawBoard();
}

function moveRight() {

    player.x++;

    if (collision()) {

        player.x--;

    }

    drawBoard();
}

function rotate() {

    const oldShape = player.shape;

    player.shape = player.shape[0].map(
        (_, index) =>
            player.shape.map(row => row[index]).reverse()
    );

    if (collision()) {

        player.shape = oldShape;

    }

    drawBoard();
}

function hardDrop() {

    while (!collision()) {

        player.y++;

    }

    player.y--;

    mergePlayer();

    clearLines();

    resetPlayer();

    drawBoard();
}

function updateUI() {

    document.getElementById("score").textContent =
        score;

    document.getElementById("level").textContent =
        level;

    document.getElementById("lines").textContent =
        lines;
}

function startGame() {

    board = createBoard();

    score = 0;
    level = 1;
    lines = 0;

    gameRunning = true;

    resetPlayer();

    updateUI();
    drawBoard();

}

function gameOver() {

    gameRunning = false;

    setTimeout(() => {

        alert(
            "GAME OVER\n\nScore: " + score
        );

    }, 100);
}

document.addEventListener("keydown", event => {

    if (!gameRunning) return;

    if (event.key === "ArrowLeft") {

        moveLeft();

    }

    if (event.key === "ArrowRight") {

        moveRight();

    }

    if (event.key === "ArrowDown") {

        moveDown();

    }

    if (event.key === "ArrowUp") {

        rotate();

    }

    if (event.code === "Space") {

        hardDrop();

    }

});

document.getElementById("left")
    .onclick = moveLeft;

document.getElementById("right")
    .onclick = moveRight;

document.getElementById("rotate")
    .onclick = rotate;

document.getElementById("drop")
    .onclick = hardDrop;

document.getElementById("startBtn")
    .onclick = startGame;

board = createBoard();
drawBoard();
