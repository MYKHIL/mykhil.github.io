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
    
    // Make canvas a perfect square to ensure consistent movement in all directions
    const containerWidth = snakeCanvas.clientWidth;
    snakeCanvas.width = containerWidth;
    snakeCanvas.height = containerWidth; // Make it square just like checkers
    
    // Adjust snake size based on canvas dimensions
    const cellSize = Math.floor(containerWidth / 40);
    
    snake = [
        { x: Math.floor(snakeCanvas.width / 2), y: Math.floor(snakeCanvas.height / 2) },
        { x: Math.floor(snakeCanvas.width / 2) - cellSize, y: Math.floor(snakeCanvas.height / 2) },
        { x: Math.floor(snakeCanvas.width / 2) - cellSize * 2, y: Math.floor(snakeCanvas.height / 2) },
    ];
    dx = cellSize;
    dy = 0;
    generateFood(cellSize);
    score = 0;
    document.getElementById('snakeScore').textContent = score;
    console.log('Snake Game initialized');
    drawSnake(cellSize);
    drawFood(cellSize);
}

function generateFood(cellSize = 10) {
    const snakeCanvas = document.getElementById('snakeCanvas');
    if (!snakeCanvas) return;

    // Ensure food aligns with grid
    const cols = Math.floor(snakeCanvas.width / cellSize);
    const rows = Math.floor(snakeCanvas.height / cellSize);
    
    food.x = Math.floor(Math.random() * cols) * cellSize;
    food.y = Math.floor(Math.random() * rows) * cellSize;
}

function drawSnake(cellSize = 10) {
    const snakeCanvas = document.getElementById('snakeCanvas');
    if (!snakeCanvas) return;

    const snakeCtx = snakeCanvas.getContext('2d');
    snake.forEach((segment) => {
        snakeCtx.fillStyle = '#4CAF50';
        snakeCtx.fillRect(segment.x, segment.y, cellSize, cellSize);
    });
}

function drawFood(cellSize = 10) {
    const snakeCanvas = document.getElementById('snakeCanvas');
    if (!snakeCanvas) return;

    const snakeCtx = snakeCanvas.getContext('2d');
    snakeCtx.fillStyle = '#FF5252';
    snakeCtx.fillRect(food.x, food.y, cellSize, cellSize);
}

function moveSnake(cellSize = 10) {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    
    // Check if head collides with food by checking if they overlap, not exact position
    const distanceX = Math.abs(head.x - food.x);
    const distanceY = Math.abs(head.y - food.y);
    
    if (distanceX < cellSize && distanceY < cellSize) {
        score += 10;
        document.getElementById('snakeScore').textContent = score;
        generateFood(cellSize);
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
    const cellSize = Math.floor(snakeCanvas.width / 40);
    
    snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    moveSnake(cellSize);
    
    if (checkCollision()) {
        alert('Game Over! Score: ' + score);
        startSnakeGame();
        return;
    }
    
    drawFood(cellSize);
    drawSnake(cellSize);
}

function startSnakeGame() {
    clearInterval(snakeGameLoop);
    initSnake();
    isPaused = false;
    
    // Adjust game speed based on screen size to keep consistent feel
    const snakeCanvas = document.getElementById('snakeCanvas');
    const gameSpeed = snakeCanvas ? Math.max(80, Math.min(150, Math.floor(snakeCanvas.width / 4))) : 100;
    
    snakeGameLoop = setInterval(updateSnakeGame, gameSpeed);
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

    // Make canvas properly sized based on its container - use square dimensions
    const containerWidth = checkersCanvas.clientWidth;
    checkersCanvas.width = containerWidth;
    checkersCanvas.height = containerWidth; // Make it square
    
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
    
    // Calculate square size based on canvas width
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
        ctx.font = (checkersCanvas.width * 0.06) + 'px Arial';
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

function getValidMoves(row, col, captureOnly = false) {
    const moves = [];
    const piece = board[row][col];
    
    if (piece === EMPTY) return moves;
    
    // If we must jump from a specific piece, only return moves for that piece
    if (mustJumpFrom && (row !== mustJumpFrom.row || col !== mustJumpFrom.col)) {
        return moves;
    }
    
    // Kings can move in all directions, regular pieces can capture backwards
    const directions = isKing(piece) ? [-1, 1] : (captureOnly ? [-1, 1] : [piece === PLAYER_PIECE ? -1 : 1]);
    
    // First, check for all possible jumps (these are mandatory)
    const jumpMoves = findAllJumpSequences(row, col, [], piece);
    
    // If not looking for captures only and no jumps available, check regular moves
    if (!captureOnly && jumpMoves.length === 0) {
        for (let dRow of directions) {
            for (let dCol of [-1, 1]) {
                const newRow = row + dRow;
                const newCol = col + dCol;
                
                if (isValidPosition(newRow, newCol) && board[newRow][newCol] === EMPTY) {
                    moves.push({ row: newRow, col: newCol, captures: [] });
                }
            }
        }
    }
    
    return jumpMoves.length > 0 ? jumpMoves : moves;
}

function isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function findAllJumpSequences(row, col, capturedPieces = [], piece) {
    const sequences = [];
    const directions = [-1, 1]; // All pieces can jump in all directions
    
    for (let dRow of directions) {
        for (let dCol of [-1, 1]) {
            const jumpRow = row + dRow * 2;
            const jumpCol = col + dCol * 2;
            const captureRow = row + dRow;
            const captureCol = col + dCol;
            
            if (isValidPosition(jumpRow, jumpCol) && board[jumpRow][jumpCol] === EMPTY) {
                const capturedPiece = board[captureRow][captureCol];
                
                // Check if we can capture an opponent's piece
                if ((isPlayerPiece(piece) && isAIPiece(capturedPiece)) ||
                    (isAIPiece(piece) && isPlayerPiece(capturedPiece))) {
                    
                    // Make sure we haven't already captured this piece in this sequence
                    const alreadyCaptured = capturedPieces.some(pos => 
                        pos.row === captureRow && pos.col === captureCol);
                    
                    if (!alreadyCaptured) {
                        // Try the capture
                        const newCaptured = [...capturedPieces, {row: captureRow, col: captureCol}];
                        
                        // Add this jump as a valid move
                        sequences.push({
                            row: jumpRow,
                            col: jumpCol,
                            captures: newCaptured
                        });
                        
                        // Recursively find additional jumps from the new position
                        const subsequences = findAllJumpSequences(jumpRow, jumpCol, newCaptured, piece);
                        
                        // If there are longer sequences possible, add them
                        subsequences.forEach(subseq => {
                            if (subseq.captures.length > sequences[sequences.length - 1].captures.length) {
                                sequences.push(subseq);
                            }
                        });
                    }
                }
            }
        }
    }
    
    // Return only the sequences with the maximum number of captures
    if (sequences.length > 0) {
        const maxCaptures = Math.max(...sequences.map(seq => seq.captures.length));
        return sequences.filter(seq => seq.captures.length === maxCaptures);
    }
    
    return sequences;
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
                // Base score for pieces
                score -= (board[row][col] === PLAYER_KING ? 5 : 1);
                
                // Position bonus for regular pieces (encourage forward movement)
                if (board[row][col] === PLAYER_PIECE) {
                    score -= (7 - row) * 0.1; // More points for being closer to king row
                }
                
                // Center control bonus
                if (col >= 2 && col <= 5) {
                    score -= 0.2;
                }
                
                // Protected piece bonus (against back row or another piece)
                if (row === 7 || (row < 7 && (
                    (col > 0 && isPlayerPiece(board[row+1][col-1])) ||
                    (col < 7 && isPlayerPiece(board[row+1][col+1]))
                ))) {
                    score -= 0.3;
                }
            } else if (isAIPiece(board[row][col])) {
                // Base score for pieces
                score += (board[row][col] === AI_KING ? 5 : 1);
                
                // Position bonus for regular pieces
                if (board[row][col] === AI_PIECE) {
                    score += row * 0.1; // More points for being closer to king row
                }
                
                // Center control bonus
                if (col >= 2 && col <= 5) {
                    score += 0.2;
                }
                
                // Protected piece bonus
                if (row === 0 || (row > 0 && (
                    (col > 0 && isAIPiece(board[row-1][col-1])) ||
                    (col < 7 && isAIPiece(board[row-1][col+1]))
                ))) {
                    score += 0.3;
                }
            }
        }
    }
    return score;
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
    card.style.width = '100%';
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
    
    // Make sure the container is properly sized
    const container = memoryGame.parentElement;
    const computedStyle = window.getComputedStyle(memoryGame);
    const containerWidth = memoryGame.clientWidth;
    
    const shuffledSymbols = shuffleCards();
    
    shuffledSymbols.forEach((symbol) => {
        const card = createMemoryCard(symbol);
        memoryCards.push(card);
        memoryGame.appendChild(card);
        
        card.addEventListener('click', () => flipCard(card, symbol));
    });
    
    // Resize observer to handle responsive resizing
    const resizeObserver = new ResizeObserver(() => {
        updateMemoryCardStyles();
    });
    
    resizeObserver.observe(memoryGame);
    updateMemoryCardStyles();
}

function updateMemoryCardStyles() {
    const memoryGame = document.getElementById('memoryGame');
    if (!memoryGame) return;
    
    // Update card styles if needed
    const gameWidth = memoryGame.clientWidth;
    memoryCards.forEach(card => {
        card.style.fontSize = (gameWidth / 16) + 'px';
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
        
        // Get cell size for movement
        const getCellSize = () => Math.floor(snakeCanvas.width / 40);
        
        document.addEventListener('keydown', (e) => {
            // Prevent arrow keys from scrolling the page
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.key)) {
                e.preventDefault();
            }
            
            const cellSize = getCellSize();
            if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -cellSize; }
            else if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = cellSize; }
            else if (e.key === 'ArrowLeft' && dx === 0) { dx = -cellSize; dy = 0; }
            else if (e.key === 'ArrowRight' && dx === 0) { dx = cellSize; dy = 0; }
            // Add spacebar to pause/resume the game
            else if (e.key === ' ' || e.key === 'Space') { pauseSnakeGame(); }
        });
        
        // Add touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        snakeCanvas.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            e.preventDefault();
        }, { passive: false });
        
        snakeCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        snakeCanvas.addEventListener('touchend', (e) => {
            const cellSize = getCellSize();
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal swipe
                if (diffX > 0 && dy !== 0) { dx = cellSize; dy = 0; }
                else if (diffX < 0 && dy !== 0) { dx = -cellSize; dy = 0; }
            } else {
                // Vertical swipe
                if (diffY > 0 && dx !== 0) { dx = 0; dy = cellSize; }
                else if (diffY < 0 && dx !== 0) { dx = 0; dy = -cellSize; }
            }
            
            e.preventDefault();
        }, { passive: false });
        
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
    
    // Handle window resize for all games
    window.addEventListener('resize', () => {
        if (snakeCanvas) {
            const containerWidth = snakeCanvas.clientWidth;
            snakeCanvas.width = containerWidth;
            snakeCanvas.height = containerWidth; // Keep it square like checkers
        }
        
        if (checkersCanvas) {
            const containerWidth = checkersCanvas.clientWidth;
            checkersCanvas.width = containerWidth;
            checkersCanvas.height = containerWidth; // Keep it square
            drawCheckersBoard();
        }
        
        if (memoryGame) {
            updateMemoryCardStyles();
        }
    });
});
