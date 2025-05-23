const WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]            
];

document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    const resetBtn = document.getElementById('reset-btn');
    const currentPlayerDisplay = document.getElementById('current-player');
    const playFriendsBtn = document.getElementById('play-friends');
    const playComputerBtn = document.getElementById('play-computer');
    const fireworksContainer = document.getElementById('fireworks-container');
    const winnerBanner = document.getElementById('winner-banner');
    const winnerText = document.getElementById('winner-text');
    const timeTaken = document.getElementById('time-taken');
    const playAgainBtn = document.getElementById('play-again-btn');
    
    let currentPlayer = 'X';
    let gameActive = true;
    let gameWon = false; 
    let moveHistory = [];
    let playerMoves = {
        'X': 0,
        'O': 0
    };
    let gameMode = 'friends'; // default 
    let gameStartTime = null;
    
    // Initialize the game
    function initGame() {
        cells.forEach(cell => {
            cell.classList.remove('x', 'o', 'fading', 'fading-oldest', 'win');
            cell.removeAttribute('data-timestamp');
            cell.removeAttribute('data-player');
        });
        
        currentPlayer = 'X';
        gameActive = true;
        gameWon = false; 
        moveHistory = [];
        playerMoves = { 'X': 0, 'O': 0 };
        gameStartTime = Date.now();
        
        // Hide winner banner if visible
        winnerBanner.classList.remove('show');
        
        updateDisplay();
        highlightOldestMove();
    }
    
    function updateDisplay() {
        currentPlayerDisplay.textContent = currentPlayer;
        currentPlayerDisplay.classList.remove('current-x', 'current-o');
        if (currentPlayer === 'X') {
            currentPlayerDisplay.classList.add('current-x');
        } else {
            currentPlayerDisplay.classList.add('current-o');
        }
    }
    
    function highlightOldestMove() {
        // Don't highlight any moves if game won
        if (gameWon) return;
        
        // Remove previous faded highlights
        cells.forEach(cell => cell.classList.remove('fading-oldest'));

        //logic for highlighting the oldest move current player ka
        if (playerMoves[currentPlayer] >= 3) {
            const oldestMove = moveHistory
                .filter(move => move.player === currentPlayer)
                .sort((a, b) => a.timestamp - b.timestamp)[0];
                
            if (oldestMove) {
                const oldCell = document.querySelector(`.cell[data-index="${oldestMove.index}"]`);
                oldCell.classList.add('fading-oldest');
            }
        }
    }
    
    function handleCellClick(e) {
        if (!gameActive) return;
        
        const cell = e.target;
        if (cell.classList.contains('x') || cell.classList.contains('o')) return;

        if (gameMode === 'friends') {
            playerMove(cell);
        } else if (gameMode === 'computer' && currentPlayer === 'X') {
            playerMove(cell);
            if (gameActive && !gameWon) {
                setTimeout(computerMove, 500);
            }
        }
    }
    
    function playerMove(cell) {
        // Start timing on first move if not already started
        if (gameStartTime === null) {
            gameStartTime = Date.now();
        }
        
        if (!gameActive || cell.classList.contains('x') || cell.classList.contains('o')) return;

        // Don't remove any moves if the game is won
        if (!gameWon && playerMoves[currentPlayer] >= 3) {
            const oldestMove = moveHistory
                .filter(move => move.player === currentPlayer)
                .sort((a, b) => a.timestamp - b.timestamp)[0];
                
            if (oldestMove) {
                const oldCell = document.querySelector(`.cell[data-index="${oldestMove.index}"]`);
                oldCell.classList.remove('fading-oldest');
                oldCell.classList.add('fading');
                
                setTimeout(() => {
                    // Only remove classes if the game hasn't been won since
                    if (!gameWon) {
                        oldCell.classList.remove('x', 'o', 'fading');
                        oldCell.removeAttribute('data-player');
                    }
                }, 500);
                
                // Remove the oldest move from history
                moveHistory = moveHistory.filter(move => 
                    !(move.index === oldestMove.index && move.player === oldestMove.player)
                );
                
                playerMoves[currentPlayer]--;
            }
        }
        
        // Make the new move
        cell.classList.add(currentPlayer.toLowerCase());
        cell.setAttribute('data-player', currentPlayer);
        
        const timestamp = Date.now();
        cell.setAttribute('data-timestamp', timestamp);
        
        moveHistory.push({
            index: cell.getAttribute('data-index'),
            player: currentPlayer,
            timestamp: timestamp
        });
        
        playerMoves[currentPlayer]++;
        
        // Check for win
        if (checkWin()) {
            gameActive = false;
            gameWon = true; // Set the win flag
            
            // Ensure winning cells don't have fading classes
            cells.forEach(cell => {
                if (cell.classList.contains('win')) {
                    cell.classList.remove('fading-oldest', 'fading');
                }
            });
            
            // Calculate time taken
            const gameEndTime = Date.now();
            const timeTakenInSeconds = Math.floor((gameEndTime - gameStartTime) / 1000);
            
            // Show winner banner
            showWinnerBanner(currentPlayer, timeTakenInSeconds);
            
            createFireworks();
            return;
        }
        
        // Check for draw
        if (!checkForAvailableMoves()) {
            gameActive = false;
            
            // Calculate time taken
            const gameEndTime = Date.now();
            const timeTakenInSeconds = Math.floor((gameEndTime - gameStartTime) / 1000);
            
            // Show draw banner
            showDrawBanner(timeTakenInSeconds);
            return;
        }
        
        // Switch player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateDisplay();
        
        // Highlight the next piece that will disappear for the new current player
        if (!gameWon) {
            highlightOldestMove();
        }
    }
    
    function checkForAvailableMoves() {
        const board = getBoardState();
        return board.includes(null);
    }
    
    function showWinnerBanner(winner, timeTakenInSeconds) {
        let winnerMessage = '';
        
        if (gameMode === 'friends') {
            winnerMessage = `Player ${winner} Wins!`;
        } else {
            winnerMessage = winner === 'X' ? 'You Win!' : 'Computer Wins!';
        }
        
        winnerText.textContent = winnerMessage;
        timeTaken.textContent = `Time: ${timeTakenInSeconds} seconds`;
        winnerBanner.classList.add('show');
    }
    
    function showDrawBanner(timeTakenInSeconds) {
        winnerText.textContent = "It's a Draw!";
        timeTaken.textContent = `Time: ${timeTakenInSeconds} seconds`;
        winnerBanner.classList.add('show');
    }
    
    function computerMove() {
        if (gameWon) return;
        const board = getBoardState();
        const bestMove = findBestMove(board);
        
        if (bestMove !== -1) {
            playerMove(document.querySelector(`.cell[data-index="${bestMove}"]`));
        }
    }
    
    function getBoardState() {
        const boardState = Array(9).fill(null);
        cells.forEach(cell => {
            const index = parseInt(cell.getAttribute('data-index'));
            const player = cell.getAttribute('data-player');
            if (player) boardState[index] = player;
        });
        return boardState;
    }
    
    function findBestMove(board) {
        let bestScore = -Infinity;
        let bestMove = -1;
        
        for (let i = 0; i < 9; i++) {
            if (!board[i]) {
                board[i] = 'O';
                const score = minimax(board, 0, false);
                board[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return bestMove;
    }
    
    function minimax(board, depth, isMaximizing) {
        const result = checkWinningState(board);
        
        if (result !== null) {
            return result === 'O' ? 10 - depth : result === 'X' ? depth - 10 : 0;
        }
        
        if (!board.includes(null)) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (!board[i]) {
                    board[i] = 'O';
                    bestScore = Math.max(bestScore, minimax(board, depth + 1, false));
                    board[i] = null;
                }
            }
            return bestScore;
        }
        
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (!board[i]) {
                board[i] = 'X';
                bestScore = Math.min(bestScore, minimax(board, depth + 1, true));
                board[i] = null;
            }
        }
        return bestScore;
    }
    
    function checkWinningState(board) {
        for (const [a, b, c] of WIN_PATTERNS) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }
    
    function checkWin() {
        for (const [a, b, c] of WIN_PATTERNS) {
            const cellA = document.querySelector(`.cell[data-index="${a}"]`);
            const cellB = document.querySelector(`.cell[data-index="${b}"]`);
            const cellC = document.querySelector(`.cell[data-index="${c}"]`);
            
            if (cellA.getAttribute('data-player') && 
                cellA.getAttribute('data-player') === cellB.getAttribute('data-player') && 
                cellA.getAttribute('data-player') === cellC.getAttribute('data-player')) {
                
                [cellA, cellB, cellC].forEach(cell => {
                    cell.classList.add('win');
                    cell.classList.remove('fading-oldest', 'fading');
                });
                
                return true;
            }
        }
        return false;
    }
    
    function createFireworks() {
        // Create multiple fireworks
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                createSingleFirework();
            }, i * 300);
        }
    }
    
    function createSingleFirework() {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        
        // Random position
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.5;
        
        // Create firework base
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = `${x}px`;
        firework.style.top = `${y}px`;
        firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        fireworksContainer.appendChild(firework);
        
        // Create sparks
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const spark = document.createElement('div');
                spark.className = 'spark';
                spark.style.left = `${x}px`;
                spark.style.top = `${y}px`;
                spark.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                
                // Random direction
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 100 + 50;
                const xMove = Math.cos(angle) * distance;
                const yMove = Math.sin(angle) * distance;
                
                spark.style.setProperty('--x', `${xMove}px`);
                spark.style.setProperty('--y', `${yMove}px`);
                
                fireworksContainer.appendChild(spark);
                
                // Remove spark after animation
                setTimeout(() => {
                    fireworksContainer.removeChild(spark);
                }, 1000);
            }, i * 20);
        }
        
        // Remove firework after animation
        setTimeout(() => {
            fireworksContainer.removeChild(firework);
        }, 1000);
    }
    
    // Game mode ka event listeners
    playFriendsBtn.addEventListener('click', () => {
        gameMode = 'friends';
        playFriendsBtn.classList.add('active');
        playComputerBtn.classList.remove('active');
        initGame();
    });
    
    playComputerBtn.addEventListener('click', () => {
        gameMode = 'computer';
        playComputerBtn.classList.add('active');
        playFriendsBtn.classList.remove('active');
        initGame();
    });
    
    // Play again button event listener
    playAgainBtn.addEventListener('click', initGame);
    
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    resetBtn.addEventListener('click', initGame);
    
    // Initialize the game
    initGame();
});
