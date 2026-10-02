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


/* =========================================================
   CONFIG
========================================================= */

const COLS = 10;

const ROWS = 20;

const BLOCK = 30;

let board = [];

let player = null;

let nextPiece = null;

let holdPiece = null;

let canHold = true;

let score = 0;

let bestScore = 0;

let level = 1;

let lines = 0;

let combo = 0;

let multiplier = 1;

let gameMode = "classic";

let difficulty = "normal";

let running = false;

let paused = false;

let soundEnabled = true;

let dropCounter = 0;

let lastTime = 0;

let dropInterval = 800;

let timeRemaining = 60;

let shakeAmount = 0;

let particles = [];

let clearingRows = [];

let clearTimer = 0;


/* =========================================================
   PLAYER PROFILE
========================================================= */

let playerXP =
    Number(
        localStorage.getItem(
            "blockdrop_xp"
        ) || 0
    );

let playerLevel =
    Number(
        localStorage.getItem(
            "blockdrop_player_level"
        ) || 1
    );

let achievements =
    JSON.parse(
        localStorage.getItem(
            "blockdrop_achievements"
        ) || "[]"
    );


/* =========================================================
   MISSION
========================================================= */

let missionTarget = 5;

let missionStartLines = 0;


/* =========================================================
   PIECES
========================================================= */

const PIECES = [

    {
        name: "I",

        matrix: [
            [1,1,1,1]
        ],

        color: "#00e5ff"
    },

    {
        name: "O",

        matrix: [
            [1,1],
            [1,1]
        ],

        color: "#ffe600"
    },

    {
        name: "T",

        matrix: [
            [0,1,0],
            [1,1,1]
        ],

        color: "#b000ff"
    },

    {
        name: "S",

        matrix: [
            [0,1,1],
            [1,1,0]
        ],

        color: "#00ff88"
    },

    {
        name: "Z",

        matrix: [
            [1,1,0],
            [0,1,1]
        ],

        color: "#ff1744"
    },

    {
        name: "J",

        matrix: [
            [1,0,0],
            [1,1,1]
        ],

        color: "#2979ff"
    },

    {
        name: "L",

        matrix: [
            [0,0,1],
            [1,1,1]
        ],

        color: "#ff8a00"
    }

];


/* =========================================================
   DOM
========================================================= */

const menuScreen =
    document.getElementById(
        "menuScreen"
    );

const gameScreen =
    document.getElementById(
        "gameScreen"
    );

const pauseOverlay =
    document.getElementById(
        "pauseOverlay"
    );

const startOverlay =
    document.getElementById(
        "startOverlay"
    );

const gameOverOverlay =
    document.getElementById(
        "gameOverOverlay"
    );

const countdown =
    document.getElementById(
        "countdown"
    );

const scoreEl =
    document.getElementById(
        "score"
    );

const bestEl =
    document.getElementById(
        "best"
    );

const levelEl =
    document.getElementById(
        "level"
    );

const linesEl =
    document.getElementById(
        "lines"
    );

const comboEl =
    document.getElementById(
        "combo"
    );

const multiplierEl =
    document.getElementById(
        "multiplier"
    );

const timerEl =
    document.getElementById(
        "timer"
    );

const playerLevelEl =
    document.getElementById(
        "playerLevel"
    );

const xpFill =
    document.getElementById(
        "xpFill"
    );

const xpText =
    document.getElementById(
        "xpText"
    );

const missionText =
    document.getElementById(
        "missionText"
    );

const missionFill =
    document.getElementById(
        "missionFill"
    );

const objectiveLabel =
    document.getElementById(
        "objectiveLabel"
    );

const levelFlash =
    document.getElementById(
        "levelFlash"
    );

const comboFlash =
    document.getElementById(
        "comboFlash"
    );

const achievementFlash =
    document.getElementById(
        "achievementFlash"
    );

const scorePopup =
    document.getElementById(
        "scorePopup"
    );

const clearFlash =
    document.getElementById(
        "clearFlash"
    );


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getBest(mode) {

    return Number(
        localStorage.getItem(
            `blockdrop_best_${mode}`
        ) || 0
    );

}

function saveBest(mode,value) {

    localStorage.setItem(
        `blockdrop_best_${mode}`,
        value
    );

}

function updateMenuScores() {

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


/* =========================================================
   PROFILE
========================================================= */

function updateProfileUI() {

    const requiredXP =
        playerLevel * 100;

    const percent =
        Math.min(
            100,
            (playerXP / requiredXP) * 100
        );

    playerLevelEl.textContent =
        playerLevel;

    xpFill.style.width =
        `${percent}%`;

    xpText.textContent =
        `${playerXP} / ${requiredXP} XP`;

}

function addXP(amount) {

    playerXP += amount;

    let requiredXP =
        playerLevel * 100;

    while (
        playerXP >= requiredXP
    ) {

        playerXP -= requiredXP;

        playerLevel++;

        requiredXP =
            playerLevel * 100;

        showAchievement(
            `PLAYER LEVEL ${playerLevel}`
        );

        playTone(
            700,
            .2
        );

    }

    localStorage.setItem(
        "blockdrop_xp",
        playerXP
    );

    localStorage.setItem(
        "blockdrop_player_level",
        playerLevel
    );

    updateProfileUI();

}


/* =========================================================
   ACHIEVEMENTS
========================================================= */

function unlockAchievement(
    id,
    title
) {

    if (
        achievements.includes(id)
    ) {

        return;

    }

    achievements.push(id);

    localStorage.setItem(
        "blockdrop_achievements",
        JSON.stringify(
            achievements
        )
    );

    showAchievement(title);

}

function showAchievement(title) {

    achievementFlash.textContent =
        `★ ${title}`;

    achievementFlash.classList.remove(
        "show"
    );

    void achievementFlash.offsetWidth;

    achievementFlash.classList.add(
        "show"
    );

}


/* =========================================================
   BOARD
========================================================= */

function createBoard() {

    board =
        Array.from(
            {
                length: ROWS
            },

            () =>
                Array(COLS).fill(0)
        );

}


/* =========================================================
   RANDOM PIECE
========================================================= */

function randomPiece() {

    const source =
        PIECES[
            Math.floor(
                Math.random() *
                PIECES.length
            )
        ];

    return {

        name: source.name,

        matrix:
            source.matrix.map(
                row => [...row]
            ),

        color: source.color

    };

}


/* =========================================================
   SPAWN
========================================================= */

function spawnPlayer() {

    player =
        nextPiece ||
        randomPiece();

    nextPiece =
        randomPiece();

    player.x =
        Math.floor(
            (
                COLS -
                player.matrix[0].length
            ) / 2
        );

    player.y = 0;

    canHold = true;

    if (collision()) {

        endGame();

    }

    drawPreviews();

}


/* =========================================================
   COLLISION
========================================================= */

function collision() {

    for (
        let y = 0;
        y < player.matrix.length;
        y++
    ) {

        for (
            let x = 0;
            x < player.matrix[y].length;
            x++
        ) {

            if (
                !player.matrix[y][x]
            ) continue;

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


/* =========================================================
   MOVE
========================================================= */

function movePlayer(dir) {

    if (
        !running ||
        paused
    ) return;

    player.x += dir;

    if (collision()) {

        player.x -= dir;

    }

}


/* =========================================================
   ROTATE
========================================================= */

function rotateMatrix(matrix) {

    return matrix[0].map(
        (_,index) =>
            matrix
                .map(row => row[index])
                .reverse()
    );

}

function rotatePlayer() {

    if (
        !running ||
        paused
    ) return;

    const oldMatrix =
        player.matrix;

    const oldX =
        player.x;

    player.matrix =
        rotateMatrix(
            player.matrix
        );

    if (collision()) {

        player.x++;

        if (collision()) {

            player.x =
                oldX - 1;

            if (collision()) {

                player.x =
                    oldX;

                player.matrix =
                    oldMatrix;

            }

        }

    }

    playTone(
        420,
        .05
    );

}


/* =========================================================
   DROP
========================================================= */

function dropPlayer() {

    if (
        !running ||
        paused
    ) return;

    player.y++;

    if (collision()) {

        player.y--;

        lockPiece();

    }

    dropCounter = 0;

}


/* =========================================================
   HARD DROP
========================================================= */

function hardDrop() {

    if (
        !running ||
        paused
    ) return;

    let distance = 0;

    while (!collision()) {

        player.y++;

        distance++;

    }

    player.y--;

    distance--;

    const points =
        Math.max(
            0,
            distance * 2
        );

    score += points;

    addXP(
        Math.max(
            1,
            Math.floor(
                distance / 2
            )
        )
    );

    showScorePopup(
        points
    );

    shakeAmount = 7;

    createDropParticles();

    playTone(
        90,
        .12
    );

    lockPiece();

}


/* =========================================================
   HOLD
========================================================= */

function holdCurrent() {

    if (
        !running ||
        paused ||
        !canHold
    ) return;

    if (!holdPiece) {

        holdPiece = {

            name:
                player.name,

            matrix:
                player.matrix.map(
                    row => [...row]
                ),

            color:
                player.color

        };

        spawnPlayer();

    }
    else {

        const temp =
            holdPiece;

        holdPiece = {

            name:
                player.name,

            matrix:
                player.matrix.map(
                    row => [...row]
                ),

            color:
                player.color

        };

        player = {

            name:
                temp.name,

            matrix:
                temp.matrix.map(
                    row => [...row]
                ),

            color:
                temp.color,

            x: 0,

            y: 0

        };

        player.x =
            Math.floor(
                (
                    COLS -
                    player.matrix[0].length
                ) / 2
            );

    }

    canHold = false;

    drawPreviews();

    playTone(
        260,
        .08
    );

}


/* =========================================================
   LOCK
========================================================= */

function lockPiece() {

    player.matrix.forEach(
        (row,y) => {

            row.forEach(
                (value,x) => {

                    if (!value)
                        return;

                    const boardY =
                        player.y + y;

                    const boardX =
                        player.x + x;

                    if (
                        boardY >= 0 &&
                        boardY < ROWS
                    ) {

                        board[boardY][boardX] = {

                            color:
                                player.color

                        };

                    }

                }
            );

        }
    );

    const cleared =
        clearLines();

    if (
        cleared === 0
    ) {

        combo = 0;

        multiplier = 1;

    }

    spawnPlayer();

    dropCounter = 0;

}


/* =========================================================
   CLEAR LINES
========================================================= */

function clearLines() {

    let count = 0;

    for (
        let y = ROWS - 1;
        y >= 0;
        y--
    ) {

        if (
            board[y].every(
                cell => cell
            )
        ) {

            clearingRows.push(y);

            count++;

        }

    }

    if (!count)
        return 0;


    lines += count;

    combo++;


    multiplier =
        Math.min(
            5,
            1 +
            Math.floor(
                combo / 2
            )
        );


    const base =
        [0,100,300,500,800][count] ||
        800;


    const comboBonus =
        combo > 1
            ? combo * 100
            : 0;


    const points =
        (
            base +
            comboBonus
        ) *
        level *
        multiplier;


    score += points;


    showScorePopup(
        points
    );


    addXP(
        count * 10 +
        combo * 5
    );


    if (
        count === 4
    ) {

        unlockAchievement(
            "tetris",
            "TETRIS CLEAR"
        );

    }


    if (
        combo >= 3
    ) {

        unlockAchievement(
            "combo3",
            "3X COMBO"
        );

    }


    if (
        combo >= 5
    ) {

        unlockAchievement(
            "combo5",
            "5X COMBO"
        );

    }


    if (
        board.every(
            row =>
                row.every(
                    cell =>
                        !cell
                )
        )
    ) {

        unlockAchievement(
            "perfect",
            "PERFECT CLEAR"
        );

    }


    if (
        score > bestScore
    ) {

        bestScore =
            score;

    }


    createLineParticles();


    shakeAmount =
        5 +
        count * 3;


    clearTimer = 180;


    clearFlash.classList.remove(
        "show"
    );

    void clearFlash.offsetWidth;

    clearFlash.classList.add(
        "show"
    );


    if (
        combo > 1
    ) {

        showCombo();

    }


    playTone(
        300 +
        count * 100,
        .15
    );


    const previousLevel =
        level;


    level =
        Math.floor(
            lines / 10
        ) + 1;


    if (
        level >
        previousLevel
    ) {

        showLevelUp();

        unlockAchievement(
            `level${level}`,
            `LEVEL ${level}`
        );

        playTone(
            700,
            .25
        );

    }


    updateSpeed();

    saveBest(
        gameMode,
        bestScore
    );


    updateMission();

    updateUI();


    return count;

}


/* =========================================================
   MISSION
========================================================= */

function updateMission() {

    const progress =
        Math.min(
            missionTarget,
            lines -
            missionStartLines
        );

    const percent =
        (
            progress /
            missionTarget
        ) * 100;

    missionFill.style.width =
        `${percent}%`;

    missionText.textContent =
        `CLEAR ${
            missionTarget -
            progress
        } MORE LINES`;


    if (
        progress >=
        missionTarget
    ) {

        unlockAchievement(
            "mission",
            "MISSION COMPLETE"
        );

        addXP(50);

        missionStartLines =
            lines;

        missionTarget =
            Math.min(
                20,
                missionTarget + 5
            );

    }

}


/* =========================================================
   FINISH CLEAR
========================================================= */

function finishLineClear() {

    if (
        !clearingRows.length
    ) return;

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
                    Array(COLS).fill(0)
                );

            }
        );

    clearingRows = [];

}


/* =========================================================
   SPEED
========================================================= */

function updateSpeed() {

    const baseSpeed =
        difficulty === "normal"
            ? 800
            : difficulty === "hard"
                ? 550
                : 350;

    dropInterval =
        Math.max(
            80,
            baseSpeed -
            (
                level - 1
            ) * 55
        );

}


/* =========================================================
   DRAW
========================================================= */

function drawBoard() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.save();


    if (
        shakeAmount > 0
    ) {

        ctx.translate(
            (
                Math.random() -
                .5
            ) *
            shakeAmount,

            (
                Math.random() -
                .5
            ) *
            shakeAmount
        );

        shakeAmount *= .88;

        if (
            shakeAmount < .3
        ) {

            shakeAmount = 0;

        }

    }


    drawGrid();


    board.forEach(
        (row,y) => {

            row.forEach(
                (cell,x) => {

                    if (cell) {

                        drawBlock(
                            ctx,
                            x * BLOCK,
                            y * BLOCK,
                            BLOCK,
                            cell.color
                        );

                    }

                }
            );

        }
    );


    if (player) {

        drawGhost();


        player.matrix.forEach(
            (row,y) => {

                row.forEach(
                    (value,x) => {

                        if (value) {

                            drawBlock(
                                ctx,

                                (
                                    player.x +
                                    x
                                ) *
                                BLOCK,

                                (
                                    player.y +
                                    y
                                ) *
                                BLOCK,

                                BLOCK,

                                player.color
                            );

                        }

                    }
                );

            }
        );

    }


    ctx.restore();

}


/* =========================================================
   GRID
========================================================= */

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


/* =========================================================
   BLOCK
========================================================= */

function drawBlock(
    context,
    x,
    y,
    size,
    color
) {

    context.fillStyle =
        color;

    context.shadowColor =
        color;

    context.shadowBlur =
        12;


    context.fillRect(
        x + 2,
        y + 2,
        size - 4,
        size - 4
    );


    context.shadowBlur = 0;


    context.strokeStyle =
        "rgba(255,255,255,.25)";


    context.strokeRect(
        x + 3,
        y + 3,
        size - 6,
        size - 6
    );

}


/* =========================================================
   GHOST
========================================================= */

function drawGhost() {

    const oldY =
        player.y;

    let ghostY =
        player.y;


    while (true) {

        player.y++;

        if (collision()) {

            player.y--;

            break;

        }

        ghostY =
            player.y;

    }


    player.y =
        oldY;


    ctx.globalAlpha =
        .15;


    player.matrix.forEach(
        (row,y) => {

            row.forEach(
                (value,x) => {

                    if (value) {

                        ctx.fillStyle =
                            player.color;

                        ctx.fillRect(

                            (
                                player.x +
                                x
                            ) *
                            BLOCK + 4,

                            (
                                ghostY +
                                y
                            ) *
                            BLOCK + 4,

                            BLOCK - 8,

                            BLOCK - 8

                        );

                    }

                }
            );

        }
    );


    ctx.globalAlpha = 1;

}


/* =========================================================
   PREVIEWS
========================================================= */

function drawPreviews() {

    drawPreview(
        nextCtx,
        nextCanvas,
        nextPiece
    );

    drawPreview(
        holdCtx,
        holdCanvas,
        holdPiece
    );

}


function drawPreview(
    context,
    targetCanvas,
    piece
) {

    context.clearRect(
        0,
        0,
        targetCanvas.width,
        targetCanvas.height
    );


    if (!piece)
        return;


    const size = 22;


    const width =
        piece.matrix[0].length *
        size;


    const height =
        piece.matrix.length *
        size;


    const offsetX =
        (
            targetCanvas.width -
            width
        ) / 2;


    const offsetY =
        (
            targetCanvas.height -
            height
        ) / 2;


    piece.matrix.forEach(
        (row,y) => {

            row.forEach(
                (value,x) => {

                    if (value) {

                        drawBlock(
                            context,

                            offsetX +
                            x * size,

                            offsetY +
                            y * size,

                            size,

                            piece.color
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   PARTICLES
========================================================= */

function createParticle(
    x,
    y,
    color
) {

    particles.push({

        x,

        y,

        vx:
            (
                Math.random() -
                .5
            ) * 4,

        vy:
            (
                Math.random() -
                .5
            ) * 4,

        life: 1,

        color

    });

}


function createDropParticles() {

    if (!player)
        return;


    for (
        let i = 0;
        i < 15;
        i++
    ) {

        createParticle(

            player.x *
            BLOCK,

            player.y *
            BLOCK,

            player.color

        );

    }

}


function createLineParticles() {

    clearingRows.forEach(
        row => {

            for (
                let i = 0;
                i < 25;
                i++
            ) {

                createParticle(

                    Math.random() *
                    canvas.width,

                    row *
                    BLOCK +
                    Math.random() *
                    BLOCK,

                    "#ffffff"

                );

            }

        }
    );

}


function updateParticles() {

    particles.forEach(
        particle => {

            particle.x +=
                particle.vx;

            particle.y +=
                particle.vy;

            particle.vy +=
                .08;

            particle.life -=
                .025;

        }
    );


    particles =
        particles.filter(
            particle =>
                particle.life > 0
        );

}


function drawParticles() {

    particles.forEach(
        particle => {

            ctx.globalAlpha =
                particle.life;

            ctx.fillStyle =
                particle.color;

            ctx.fillRect(
                particle.x,
                particle.y,
                3,
                3
            );

        }
    );


    ctx.globalAlpha = 1;

}


/* =========================================================
   EFFECTS
========================================================= */

function showLevelUp() {

    levelFlash.classList.remove(
        "show"
    );

    void levelFlash.offsetWidth;

    levelFlash.classList.add(
        "show"
    );

}


function showCombo() {

    comboFlash.textContent =
        `COMBO ×${combo}`;

    comboFlash.classList.remove(
        "show"
    );

    void comboFlash.offsetWidth;

    comboFlash.classList.add(
        "show"
    );

}


function showScorePopup(points) {

    if (
        !points ||
        points <= 0
    ) return;


    scorePopup.textContent =
        `+${points}`;


    scorePopup.classList.remove(
        "show"
    );

    void scorePopup.offsetWidth;

    scorePopup.classList.add(
        "show"
    );

}


/* =========================================================
   SOUND
========================================================= */

let audioContext = null;


function playTone(
    frequency,
    duration
) {

    if (!soundEnabled)
        return;


    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }


        const oscillator =
            audioContext
                .createOscillator();


        const gain =
            audioContext
                .createGain();


        oscillator.frequency.value =
            frequency;


        oscillator.type =
            "square";


        gain.gain.value =
            .04;


        oscillator.connect(
            gain
        );


        gain.connect(
            audioContext.destination
        );


        oscillator.start();


        oscillator.stop(
            audioContext.currentTime +
            duration
        );

    }
    catch(error) {

        console.log(
            "Audio unavailable"
        );

    }

}


/* =========================================================
   UI
========================================================= */

function updateUI() {

    scoreEl.textContent =
        score;

    bestEl.textContent =
        bestScore;

    levelEl.textContent =
        level;

    linesEl.textContent =
        lines;

    comboEl.textContent =
        combo;

    multiplierEl.textContent =
        `x${multiplier}`;


    if (
        gameMode === "time"
    ) {

        timerEl.textContent =
            `${Math.max(
                0,
                Math.ceil(
                    timeRemaining
                )
            )}s`;

    }
    else {

        timerEl.textContent =
            "∞";

    }


    updateMission();

}


/* =========================================================
   START
========================================================= */

function startGame() {

    menuScreen.classList.remove(
        "active"
    );

    gameScreen.classList.add(
        "active"
    );


    createBoard();


    score = 0;

    level = 1;

    lines = 0;

    combo = 0;

    multiplier = 1;


    holdPiece = null;

    nextPiece =
        randomPiece();


    bestScore =
        getBest(
            gameMode
        );


    timeRemaining =
        gameMode === "time"
            ? 60
            : Infinity;


    clearingRows = [];

    particles = [];

    shakeAmount = 0;


    missionStartLines = 0;

    missionTarget = 5;


    updateSpeed();


    running = true;

    paused = false;


    pauseOverlay.classList.remove(
        "active"
    );

    gameOverOverlay.classList.remove(
        "active"
    );


    spawnPlayer();


    updateUI();

    startCountdown();

}


/* =========================================================
   COUNTDOWN
========================================================= */

function startCountdown() {

    startOverlay.classList.add(
        "active"
    );


    let count = 3;


    countdown.textContent =
        count;


    const timer =
        setInterval(
            () => {

                count--;


                if (
                    count > 0
                ) {

                    countdown.textContent =
                        count;

                    playTone(
                        350,
                        .08
                    );

                }
                else {

                    countdown.textContent =
                        "GO";

                    playTone(
                        800,
                        .15
                    );


                    setTimeout(
                        () => {

                            startOverlay.classList.remove(
                                "active"
                            );

                        },
                        500
                    );


                    clearInterval(
                        timer
                    );

                }

            },
            700
        );

}


/* =========================================================
   PAUSE
========================================================= */

function togglePause() {

    if (!running)
        return;


    paused =
        !paused;


    pauseOverlay.classList.toggle(
        "active",
        paused
    );

}


/* =========================================================
   END GAME
========================================================= */

function endGame() {

    running = false;

    paused = false;


    if (
        score >
        getBest(gameMode)
    ) {

        saveBest(
            gameMode,
            score
        );

        unlockAchievement(
            "highscore",
            "NEW HIGH SCORE"
        );

    }


    if (
        lines >= 20
    ) {

        unlockAchievement(
            "survivor20",
            "20 LINE SURVIVOR"
        );

    }


    gameOverOverlay.classList.add(
        "active"
    );


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
        "gameOverAchievement"
    ).textContent =
        combo >= 5
            ? "★ ELITE COMBO ACHIEVED"
            : "";


    updateMenuScores();

}


/* =========================================================
   MENU
========================================================= */

function returnToMenu() {

    running = false;

    paused = false;


    pauseOverlay.classList.remove(
        "active"
    );

    gameOverOverlay.classList.remove(
        "active"
    );

    startOverlay.classList.remove(
        "active"
    );


    gameScreen.classList.remove(
        "active"
    );

    menuScreen.classList.add(
        "active"
    );


    updateMenuScores();

    updateProfileUI();

}


/* =========================================================
   GAME LOOP
========================================================= */

function update(time = 0) {

    const delta =
        time -
        lastTime;


    lastTime =
        time;


    if (
        running &&
        !paused &&
        !startOverlay.classList.contains(
            "active"
        )
    ) {

        dropCounter +=
            delta;


        if (
            dropCounter >
            dropInterval
        ) {

            dropPlayer();

        }


        if (
            gameMode === "time"
        ) {

            timeRemaining -=
                delta / 1000;


            if (
                timeRemaining <= 0
            ) {

                timeRemaining = 0;

                endGame();

            }

        }


        if (
            clearTimer > 0
        ) {

            clearTimer -=
                delta;


            if (
                clearTimer <= 0
            ) {

                finishLineClear();

            }

        }

    }


    updateParticles();

    drawBoard();

    drawParticles();

    updateUI();


    requestAnimationFrame(
        update
    );

}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.code ===
            "ArrowLeft"
        ) {

            event.preventDefault();

            movePlayer(-1);

        }


        if (
            event.code ===
            "ArrowRight"
        ) {

            event.preventDefault();

            movePlayer(1);

        }


        if (
            event.code ===
            "ArrowDown"
        ) {

            event.preventDefault();

            dropPlayer();

        }


        if (
            event.code ===
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
            event.code ===
            "KeyC"
        ) {

            holdCurrent();

        }


        if (
            event.code ===
            "KeyP"
        ) {

            togglePause();

        }

    }
);


/* =========================================================
   MODE
========================================================= */

document
    .querySelectorAll(
        ".mode-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".mode-btn"
                        )
                        .forEach(
                            btn =>
                                btn.classList.remove(
                                    "selected"
                                )
                        );


                    button.classList.add(
                        "selected"
                    );


                    gameMode =
                        button.dataset.mode;

                }
            );

        }
    );


/* =========================================================
   DIFFICULTY
========================================================= */

document
    .querySelectorAll(
        ".difficulty-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".difficulty-btn"
                        )
                        .forEach(
                            btn =>
                                btn.classList.remove(
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

        }
    );


/* =========================================================
   BUTTONS
========================================================= */

document
    .getElementById(
        "playBtn"
    )
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById(
        "pauseBtn"
    )
    .addEventListener(
        "click",
        togglePause
    );


document
    .getElementById(
        "resumeBtn"
    )
    .addEventListener(
        "click",
        togglePause
    );


document
    .getElementById(
        "menuBtn"
    )
    .addEventListener(
        "click",
        returnToMenu
    );


document
    .getElementById(
        "backMenuBtn"
    )
    .addEventListener(
        "click",
        returnToMenu
    );


document
    .getElementById(
        "restartBtn"
    )
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById(
        "soundBtn"
    )
    .addEventListener(
        "click",
        () => {

            soundEnabled =
                !soundEnabled;


            document.getElementById(
                "soundBtn"
            ).textContent =
                soundEnabled
                    ? "🔊"
                    : "🔇";

        }
    );


/* =========================================================
   MOBILE
========================================================= */

document
    .getElementById(
        "leftBtn"
    )
    .addEventListener(
        "click",
        () =>
            movePlayer(-1)
    );


document
    .getElementById(
        "rightBtn"
    )
    .addEventListener(
        "click",
        () =>
            movePlayer(1)
    );


document
    .getElementById(
        "downBtn"
    )
    .addEventListener(
        "click",
        dropPlayer
    );


document
    .getElementById(
        "rotateBtn"
    )
    .addEventListener(
        "click",
        rotatePlayer
    );


document
    .getElementById(
        "dropBtn"
    )
    .addEventListener(
        "click",
        hardDrop
    );


/* =========================================================
   TOUCH
========================================================= */

let touchStartX = 0;

let touchStartY = 0;


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
    {
        passive: true
    }
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


        if (
            Math.abs(dx) >
            Math.abs(dy)
        ) {

            if (
                Math.abs(dx) >
                25
            ) {

                movePlayer(
                    dx > 0
                        ? 1
                        : -1
                );

            }

        }
        else {

            if (
                dy > 40
            ) {

                dropPlayer();

            }
            else if (
                dy < -40
            ) {

                rotatePlayer();

            }

        }

    },
    {
        passive: true
    }
);


/* =========================================================
   INIT
========================================================= */

updateMenuScores();

updateProfileUI();

createBoard();

requestAnimationFrame(
    update
);