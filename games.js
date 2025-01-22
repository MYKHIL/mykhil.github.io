// Snake Game Implementation
let snake = [];
let food = { x: 0, y: 0 };
let dx = 10;
let dy = 0;
let score = 0;
let snakeGameLoop;
let isPaused = false;

function initSnake() {
    console.log('Initializing Snake Game');
    const snakeCanvas = document.getElementById('snakeCanvas');
    if (!snakeCanvas) {
        console.error('Snake canvas not found');
        return;
    }

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
    console.log('Snake Game initialized');
    drawSnake();
    drawFood();
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
let currentPlayer = 1; // 1 = human (red), 2 = AI (blue)
let moveHistory = [];
let isThinking = false;
let mustJumpFrom = null; // Track piece that must continue jumping

const EMPTY = 0;
const PLAYER_PIECE = 1;
const AI_PIECE = 2;
const PLAYER_KING = 3;
const AI_KING = 4;

function initCheckers() {
    console.log('Initializing Checkers Game');
    const checkersCanvas = document.getElementById('checkersCanvas');
    if (!checkersCanvas) {
        console.error('Checkers canvas not found');
        return;
    }

    checkersCanvas.width = 400;
    checkersCanvas.height = 400;
    board = Array(8).fill().map(() => Array(8).fill(EMPTY));
    
    // Set up initial pieces
    for (let row = 0; row < 3; row++) {
        for (let col = (row % 2); col < 8; col += 2) {
            board[row][col] = AI_PIECE;
            board[7-row][7-col] = PLAYER_PIECE;
        }
    }
    
    currentPlayer = 1;
    moveHistory = [];
    selectedPiece = null;
    isThinking = false;
    mustJumpFrom = null;
    drawCheckersBoard();

    // Add click event listener
    checkersCanvas.addEventListener('click', handleCheckersClick);
}

function handleCheckersClick(event) {
    if (currentPlayer !== 1 || isThinking) return; // Only allow clicks during player's turn

    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const squareSize = canvas.width / 8;
    const row = Math.floor(y / squareSize);
    const col = Math.floor(x / squareSize);

    console.log('Click at row:', row, 'col:', col);

    if (!selectedPiece) {
        // Selecting a piece
        if (isPlayerPiece(board[row][col])) {
            const moves = getValidMoves(row, col);
            if (moves.length > 0) {
                selectedPiece = { row, col };
                console.log('Selected piece at:', row, col);
                drawCheckersBoard();
            }
        }
    } else {
        // Moving a piece
        const validMoves = getValidMoves(selectedPiece.row, selectedPiece.col);
        const move = validMoves.find(m => m.row === row && m.col === col);
        
        if (move) {
            console.log('Moving piece to:', row, col);
            makeMove(selectedPiece, move, move.captures);
            
            // Check for additional jumps
            if (move.captures.length > 0) {
                const additionalJumps = getValidMoves(move.row, move.col);
                if (additionalJumps.length > 0 && additionalJumps[0].captures.length > 0) {
                    // More jumps available, keep the same player's turn
                    mustJumpFrom = { row: move.row, col: move.col };
                    selectedPiece = mustJumpFrom;
                    drawCheckersBoard();
                    return;
                }
            }
            
            // End turn
            selectedPiece = null;
            mustJumpFrom = null;
            currentPlayer = 2;
            drawCheckersBoard();
            
            // AI's turn
            makeAIMove();
        } else {
            // Invalid move, deselect piece if not in middle of multiple jumps
            if (!mustJumpFrom) {
                selectedPiece = null;
                drawCheckersBoard();
            }
        }
    }
}

function drawCheckersBoard() {
    const checkersCanvas = document.getElementById('checkersCanvas');
    if (!checkersCanvas) return;

    const ctx = checkersCanvas.getContext('2d');
    const squareSize = checkersCanvas.width / 8;
    
    // Draw board
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#fff' : '#2a2a2a';
            ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
            
            // Draw pieces
            if (board[row][col] !== EMPTY) {
                ctx.beginPath();
                ctx.arc(
                    col * squareSize + squareSize/2,
                    row * squareSize + squareSize/2,
                    squareSize/3,
                    0,
                    2 * Math.PI
                );
                
                // Set color based on piece type
                if (board[row][col] === PLAYER_PIECE || board[row][col] === PLAYER_KING) {
                    ctx.fillStyle = '#ff4444';
                } else {
                    ctx.fillStyle = '#4444ff';
                }
                ctx.fill();
                
                // Draw crown for king pieces
                if (board[row][col] === PLAYER_KING || board[row][col] === AI_KING) {
                    ctx.beginPath();
                    ctx.fillStyle = '#ffd700';
                    const crownSize = squareSize/6;
                    ctx.arc(
                        col * squareSize + squareSize/2,
                        row * squareSize + squareSize/2,
                        crownSize,
                        0,
                        2 * Math.PI
                    );
                    ctx.fill();
                }
            }
        }
    }
    
    // Highlight selected piece and must-jump piece
    if (selectedPiece) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            selectedPiece.col * squareSize,
            selectedPiece.row * squareSize,
            squareSize,
            squareSize
        );
        
        // Highlight valid moves
        const validMoves = getValidMoves(selectedPiece.row, selectedPiece.col);
        validMoves.forEach(move => {
            ctx.beginPath();
            ctx.arc(
                move.col * squareSize + squareSize/2,
                move.row * squareSize + squareSize/2,
                squareSize/6,
                0,
                2 * Math.PI
            );
            ctx.fillStyle = move.captures.length > 0 ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 215, 0, 0.5)';
            ctx.fill();
        });
    }
    
    // Show "thinking" indicator
    if (isThinking) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, checkersCanvas.width, checkersCanvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AI is thinking...', checkersCanvas.width/2, checkersCanvas.height/2);
    }
}

function isPlayerPiece(piece) {
    return piece === PLAYER_PIECE || piece === PLAYER_KING;
}

function isAIPiece(piece) {
    return piece === AI_PIECE || piece === AI_KING;
}

function isKing(piece) {
    return piece === PLAYER_KING || piece === AI_KING;
}

function getValidMoves(row, col) {
    const moves = [];
    const piece = board[row][col];
    
    if (piece === EMPTY) return moves;
    
    // If we must jump from a specific piece, only return moves for that piece
    if (mustJumpFrom && (row !== mustJumpFrom.row || col !== mustJumpFrom.col)) {
        return moves;
    }
    
    const directions = isKing(piece) ? [-1, 1] : [piece === PLAYER_PIECE ? -1 : 1];
    const jumpMoves = [];
    
    // Check all possible directions
    for (let dRow of directions) {
        for (let dCol of [-1, 1]) {
            // Single move (only if not in middle of multiple jumps)
            if (!mustJumpFrom) {
                const newRow = row + dRow;
                const newCol = col + dCol;
                
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    if (board[newRow][newCol] === EMPTY) {
                        moves.push({ row: newRow, col: newCol, captures: [] });
                    }
                }
            }
            
            // Jump move
            const jumpRow = row + dRow * 2;
            const jumpCol = col + dCol * 2;
            const captureRow = row + dRow;
            const captureCol = col + dCol;
            
            if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 &&
                board[jumpRow][jumpCol] === EMPTY) {
                if ((isPlayerPiece(piece) && isAIPiece(board[captureRow][captureCol])) ||
                    (isAIPiece(piece) && isPlayerPiece(board[captureRow][captureCol]))) {
                    jumpMoves.push({
                        row: jumpRow,
                        col: jumpCol,
                        captures: [{row: captureRow, col: captureCol}]
                    });
                }
            }
        }
    }
    
    // If there are jump moves available, they are mandatory
    return jumpMoves.length > 0 ? jumpMoves : (!mustJumpFrom ? moves : []);
}

function getAllValidMoves(player) {
    const moves = [];
    const jumpMoves = [];
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((player === 1 && isPlayerPiece(board[row][col])) ||
                (player === 2 && isAIPiece(board[row][col]))) {
                const pieceMoves = getValidMoves(row, col);
                pieceMoves.forEach(move => {
                    if (move.captures.length > 0) {
                        jumpMoves.push({
                            from: { row, col },
                            to: move,
                        });
                    } else {
                        moves.push({
                            from: { row, col },
                            to: move,
                        });
                    }
                });
            }
        }
    }
    
    return jumpMoves.length > 0 ? jumpMoves : moves;
}

function makeMove(from, to, captures) {
    // Save the current state before making the move
    const currentState = {
        boardState: board.map(row => [...row]),
        player: currentPlayer,
        selectedPiece: selectedPiece,
        mustJumpFrom: mustJumpFrom
    };
    moveHistory.push(currentState);

    // Move piece
    board[to.row][to.col] = board[from.row][from.col];
    board[from.row][from.col] = EMPTY;
    
    // Remove captured pieces
    captures.forEach(capture => {
        board[capture.row][capture.col] = EMPTY;
    });
    
    // King promotion
    if (board[to.row][to.col] === PLAYER_PIECE && to.row === 0) {
        board[to.row][to.col] = PLAYER_KING;
    } else if (board[to.row][to.col] === AI_PIECE && to.row === 7) {
        board[to.row][to.col] = AI_KING;
    }
}

function undoMove() {
    if (moveHistory.length > 0) {
        const lastState = moveHistory.pop();
        board = lastState.boardState;
        currentPlayer = lastState.player;
        selectedPiece = lastState.selectedPiece;
        mustJumpFrom = lastState.mustJumpFrom;
        drawCheckersBoard();
    }
}

async function makeAIMove() {
    if (currentPlayer !== 2) return; // Not AI's turn
    
    isThinking = true;
    drawCheckersBoard();
    
    // Add a small delay to show "thinking" state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let move = findBestMove();
    let madeMove = false;
    
    while (move) {
        console.log('AI making move:', move);
        makeMove(move.from, move.to, move.to.captures);
        madeMove = true;
        
        // Check for additional jumps
        if (move.to.captures.length > 0) {
            const additionalJumps = getValidMoves(move.to.row, move.to.col);
            if (additionalJumps.length > 0 && additionalJumps[0].captures.length > 0) {
                // Simulate finding best move from this position only
                move = {
                    from: { row: move.to.row, col: move.to.col },
                    to: additionalJumps[0]
                };
                continue;
            }
        }
        break;
    }
    
    if (madeMove) {
        currentPlayer = 1;
    } else {
        const playerMoves = getAllValidMoves(1);
        if (playerMoves.length === 0) {
            alert('Game Over! AI wins!');
        } else {
            alert('Game Over! You win!');
        }
        startCheckersGame();
    }
    
    isThinking = false;
    mustJumpFrom = null;
    drawCheckersBoard();
}

function findBestMove() {
    const moves = getAllValidMoves(2);
    if (moves.length === 0) return null;
    
    let bestMove = moves[0];
    let bestValue = -Infinity;
    
    for (const move of moves) {
        // Save current board state
        const oldBoard = board.map(row => [...row]);
        
        // Try the move
        makeMove(move.from, move.to, move.to.captures);
        const moveValue = minimax(3, -Infinity, Infinity, false);
        
        // Restore board state
        board = oldBoard;
        
        if (moveValue > bestValue) {
            bestValue = moveValue;
            bestMove = move;
        }
    }
    
    console.log('AI chose move:', bestMove, 'with value:', bestValue);
    return bestMove;
}

function minimax(depth, alpha, beta, maximizingPlayer) {
    if (depth === 0) {
        return evaluateBoard();
    }
    
    const moves = getAllValidMoves(maximizingPlayer ? 2 : 1);
    if (moves.length === 0) {
        return maximizingPlayer ? -1000 : 1000;
    }
    
    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const oldBoard = board.map(row => [...row]);
            makeMove(move.from, move.to, move.to.captures);
            const eval = minimax(depth - 1, alpha, beta, false);
            board = oldBoard;
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const oldBoard = board.map(row => [...row]);
            makeMove(move.from, move.to, move.to.captures);
            const eval = minimax(depth - 1, alpha, beta, true);
            board = oldBoard;
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluateBoard() {
    let score = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (isPlayerPiece(board[row][col])) {
                score -= (board[row][col] === PLAYER_KING ? 3 : 1);
            } else if (isAIPiece(board[row][col])) {
                score += (board[row][col] === AI_KING ? 3 : 1);
            }
        }
    }
    return score;
}

function startCheckersGame() {
    // Remove old event listener if it exists
    const canvas = document.getElementById('checkersCanvas');
    if (canvas) {
        canvas.removeEventListener('click', handleCheckersClick);
    }
    
    // Reset game state
    board = Array(8).fill().map(() => Array(8).fill(EMPTY));
    currentPlayer = 1;
    selectedPiece = null;
    mustJumpFrom = null;
    moveHistory = [];
    isThinking = false;
    
    // Initialize board
    for (let row = 0; row < 3; row++) {
        for (let col = (row % 2); col < 8; col += 2) {
            board[row][col] = AI_PIECE;
            board[7-row][7-col] = PLAYER_PIECE;
        }
    }
    
    // Add click handler and draw board
    if (canvas) {
        canvas.addEventListener('click', handleCheckersClick);
        drawCheckersBoard();
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
window.addEventListener('load', () => {
    console.log('Page loaded, initializing games');
    
    // Initialize Snake Game
    const snakeCanvas = document.getElementById('snakeCanvas');
    if (snakeCanvas) {
        console.log('Found snake canvas, initializing');
        initSnake();
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -10; }
            else if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 10; }
            else if (e.key === 'ArrowLeft' && dx === 0) { dx = -10; dy = 0; }
            else if (e.key === 'ArrowRight' && dx === 0) { dx = 10; dy = 0; }
        });
    } else {
        console.error('Snake canvas not found');
    }

    // Initialize Checkers Game
    const checkersCanvas = document.getElementById('checkersCanvas');
    if (checkersCanvas) {
        console.log('Found checkers canvas, initializing');
        initCheckers();
    } else {
        console.error('Checkers canvas not found');
    }

    // Initialize Memory Game
    const memoryGame = document.getElementById('memoryGame');
    if (memoryGame) {
        console.log('Found memory game container, initializing');
        startMemoryGame();
    } else {
        console.error('Memory game container not found');
    }
});
