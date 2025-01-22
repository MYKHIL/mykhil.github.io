// Snake Game Implementation
let snake = [];
let food = { x: 0, y: 0 };
let dx = 10;
let dy = 0;
let score = 0;
let snakeGameLoop;
let isPaused = false;

function initSnake() {
    const snakeCanvas = document.getElementById('snakeCanvas');
    if (!snakeCanvas) return;

    const snakeCtx = snakeCanvas.getContext('2d');
    snakeCanvas.width = 400;
    snakeCanvas.height = 400;
    
    snake = [
        { x: 200, y: 200 },
        { x: 190, y: 200 },
        { x: 180, y: 200 },
    ];
    dx = 10;
    dy = 0;
    generateFood();
    score = 0;
    document.getElementById('snakeScore').textContent = score;
}

function generateFood() {
    const snakeCanvas = document.getElementById('snakeCanvas');
    if (!snakeCanvas) return;

    food.x = Math.floor(Math.random() * (snakeCanvas.width / 10)) * 10;
    food.y = Math.floor(Math.random() * (snakeCanvas.height / 10)) * 10;
}

function drawSnake() {
    const snakeCanvas = document.getElementById('snakeCanvas');
    if (!snakeCanvas) return;

    const snakeCtx = snakeCanvas.getContext('2d');
    snake.forEach((segment) => {
        snakeCtx.fillStyle = '#4CAF50';
        snakeCtx.fillRect(segment.x, segment.y, 10, 10);
    });
}

function drawFood() {
    const snakeCanvas = document.getElementById('snakeCanvas');
    if (!snakeCanvas) return;

    const snakeCtx = snakeCanvas.getContext('2d');
    snakeCtx.fillStyle = '#FF5252';
    snakeCtx.fillRect(food.x, food.y, 10, 10);
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('snakeScore').textContent = score;
        generateFood();
    } else {
        snake.pop();
    }
}

function checkCollision() {
    const snakeCanvas = document.getElementById('snakeCanvas');
    if (!snakeCanvas) return true;

    const head = snake[0];
    return (
        head.x < 0 ||
        head.x >= snakeCanvas.width ||
        head.y < 0 ||
        head.y >= snakeCanvas.height ||
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
    );
}

function updateSnakeGame() {
    if (isPaused) return;
    
    const snakeCanvas = document.getElementById('snakeCanvas');
    if (!snakeCanvas) return;

    const snakeCtx = snakeCanvas.getContext('2d');
    snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    moveSnake();
    
    if (checkCollision()) {
        alert('Game Over! Score: ' + score);
        startSnakeGame();
        return;
    }
    
    drawFood();
    drawSnake();
}

function startSnakeGame() {
    clearInterval(snakeGameLoop);
    initSnake();
    isPaused = false;
    snakeGameLoop = setInterval(updateSnakeGame, 100);
}

function pauseSnakeGame() {
    isPaused = !isPaused;
}

// Checkers Game Implementation
let board = [];
let selectedPiece = null;
let currentPlayer = 1;
let moveHistory = [];

function initCheckers() {
    const checkersCanvas = document.getElementById('checkersCanvas');
    if (!checkersCanvas) return;

    checkersCanvas.width = 400;
    checkersCanvas.height = 400;
    board = Array(8).fill().map(() => Array(8).fill(0));
    
    // Set up initial pieces
    for (let i = 0; i < 3; i++) {
        for (let j = (i % 2); j < 8; j += 2) {
            board[i][j] = 1; // Player 1 pieces
            board[7-i][7-j] = 2; // Player 2 pieces
        }
    }
    drawCheckersBoard();
}

function drawCheckersBoard() {
    const checkersCanvas = document.getElementById('checkersCanvas');
    if (!checkersCanvas) return;

    const checkersCtx = checkersCanvas.getContext('2d');
    const squareSize = checkersCanvas.width / 8;
    
    // Draw board
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            checkersCtx.fillStyle = (i + j) % 2 === 0 ? '#fff' : '#2a2a2a';
            checkersCtx.fillRect(j * squareSize, i * squareSize, squareSize, squareSize);
            
            // Draw pieces
            if (board[i][j] !== 0) {
                checkersCtx.beginPath();
                checkersCtx.arc(
                    j * squareSize + squareSize/2,
                    i * squareSize + squareSize/2,
                    squareSize/3,
                    0,
                    2 * Math.PI
                );
                checkersCtx.fillStyle = board[i][j] === 1 ? '#ff4444' : '#4444ff';
                checkersCtx.fill();
            }
        }
    }
}

function startCheckersGame() {
    initCheckers();
}

function undoMove() {
    if (moveHistory.length > 0) {
        const lastMove = moveHistory.pop();
        board = lastMove.boardState.map(row => [...row]);
        currentPlayer = lastMove.player;
        drawCheckersBoard();
    }
}

function isValidMove(from, to) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    
    if (rowDiff === 1 && colDiff === 1) {
        return board[to.row][to.col] === 0;
    }
    
    if (rowDiff === 2 && colDiff === 2) {
        const jumpedRow = (from.row + to.row) / 2;
        const jumpedCol = (from.col + to.col) / 2;
        return board[to.row][to.col] === 0 && 
               board[jumpedRow][jumpedCol] === (currentPlayer === 1 ? 2 : 1);
    }
    
    return false;
}

function makeMove(from, to) {
    moveHistory.push({
        boardState: board.map(row => [...row]),
        player: currentPlayer
    });

    board[to.row][to.col] = board[from.row][from.col];
    board[from.row][from.col] = 0;
    
    if (Math.abs(to.row - from.row) === 2) {
        const jumpedRow = (from.row + to.row) / 2;
        const jumpedCol = (from.col + to.col) / 2;
        board[jumpedRow][jumpedCol] = 0;
    }
}

// Memory Card Game Implementation
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;
let memoryMoves = 0;
let canFlip = true;

const cardSymbols = ['♠', '♣', '♥', '♦', '★', '♪', '♫', '☀'];

function createMemoryCard(symbol) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front"></div>
            <div class="card-back">${symbol}</div>
        </div>
    `;
    return card;
}

function shuffleCards() {
    const symbols = [...cardSymbols, ...cardSymbols];
    return symbols.sort(() => Math.random() - 0.5);
}

function startMemoryGame() {
    const memoryGame = document.getElementById('memoryGame');
    if (!memoryGame) return;

    memoryGame.innerHTML = '';
    memoryCards = [];
    flippedCards = [];
    matchedPairs = 0;
    memoryMoves = 0;
    canFlip = true;
    document.getElementById('memoryMoves').textContent = memoryMoves;
    
    const shuffledSymbols = shuffleCards();
    
    shuffledSymbols.forEach((symbol) => {
        const card = createMemoryCard(symbol);
        memoryCards.push(card);
        memoryGame.appendChild(card);
        
        card.addEventListener('click', () => flipCard(card, symbol));
    });
}

function flipCard(card, symbol) {
    if (!canFlip || flippedCards.includes(card) || card.classList.contains('matched')) return;
    
    card.classList.add('flipped');
    flippedCards.push({ card, symbol });
    
    if (flippedCards.length === 2) {
        memoryMoves++;
        document.getElementById('memoryMoves').textContent = memoryMoves;
        canFlip = false;
        
        if (flippedCards[0].symbol === flippedCards[1].symbol) {
            flippedCards.forEach(({ card }) => card.classList.add('matched'));
            matchedPairs++;
            flippedCards = [];
            canFlip = true;
            
            if (matchedPairs === cardSymbols.length) {
                setTimeout(() => {
                    alert('Congratulations! You won in ' + memoryMoves + ' moves!');
                    startMemoryGame();
                }, 500);
            }
        } else {
            setTimeout(() => {
                flippedCards.forEach(({ card }) => card.classList.remove('flipped'));
                flippedCards = [];
                canFlip = true;
            }, 1000);
        }
    }
}

// Initialize games when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Snake Game
    if (document.getElementById('snakeCanvas')) {
        initSnake();
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -10; }
            else if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 10; }
            else if (e.key === 'ArrowLeft' && dx === 0) { dx = -10; dy = 0; }
            else if (e.key === 'ArrowRight' && dx === 0) { dx = 10; dy = 0; }
        });
    }

    // Initialize Checkers Game
    if (document.getElementById('checkersCanvas')) {
        initCheckers();
        const checkersCanvas = document.getElementById('checkersCanvas');
        checkersCanvas.addEventListener('click', (e) => {
            const rect = checkersCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const squareSize = checkersCanvas.width / 8;
            const row = Math.floor(y / squareSize);
            const col = Math.floor(x / squareSize);
            
            if (!selectedPiece) {
                if (board[row][col] === currentPlayer) {
                    selectedPiece = { row, col };
                    const ctx = checkersCanvas.getContext('2d');
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(col * squareSize, row * squareSize, squareSize, squareSize);
                }
            } else {
                if (isValidMove(selectedPiece, { row, col })) {
                    makeMove(selectedPiece, { row, col });
                    currentPlayer = currentPlayer === 1 ? 2 : 1;
                }
                selectedPiece = null;
                drawCheckersBoard();
            }
        });
    }

    // Initialize Memory Game
    if (document.getElementById('memoryGame')) {
        startMemoryGame();
    }
});
