
    // Game state
    let gameState = {
      tiles: [],
      gridSize: 3,
      moves: 0,
      startTime: null,
      gameTimer: null,
      settings: {
        soundEnabled: true,
        animationsEnabled: true,
        autoShuffle: false,
        volume: 0.5
      },
      bestTimes: JSON.parse(localStorage.getItem('puzzleBestTimes') || '{}')
    };

    // Audio context for sound effects
    let audioContext;
    let soundEffects = {};

    // Initialize audio
    function initAudio() {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createSoundEffects();
      } catch (e) {
        console.warn('Audio not supported');
      }
    }

    // Create sound effects using Web Audio API
    function createSoundEffects() {
      soundEffects = {
        move: () => playTone(800, 0.1, 'square'),
        invalidMove: () => playTone(200, 0.2, 'sawtooth'),
        win: () => playWinSound(),
        shuffle: () => playTone(400, 0.3, 'triangle')
      };
    }

    function playTone(frequency, duration, type = 'sine') {
      if (!gameState.settings.soundEnabled || !audioContext) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1 * gameState.settings.volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    }

    function playWinSound() {
      if (!gameState.settings.soundEnabled || !audioContext) return;
      
      const notes = [523, 659, 784, 1047]; // C-E-G-C
      notes.forEach((note, i) => {
        setTimeout(() => playTone(note, 0.3, 'sine'), i * 200);
      });
    }

    // Initialize game
    function initGame() {
      const size = gameState.gridSize;
      gameState.tiles = [...Array(size * size - 1).keys()].map(n => n + 1);
      gameState.tiles.push(null);
      gameState.moves = 0;
      gameState.startTime = null;
      updateStats();
      updateGridLayout();
      render();
    }

    function updateGridLayout() {
      const container = document.getElementById('puzzle-container');
      const size = gameState.gridSize;
      const tileSize = gameState.gridSize === 3 ? 120 : gameState.gridSize === 4 ? 90 : 70;
      
      container.style.gridTemplateColumns = `repeat(${size}, ${tileSize}px)`;
      
      // Update tile sizes in CSS
      const tiles = container.querySelectorAll('.tile');
      tiles.forEach(tile => {
        tile.style.width = `${tileSize}px`;
        tile.style.height = `${tileSize}px`;
        tile.style.fontSize = `${tileSize * 0.25}px`;
      });
    }

    function render() {
      const container = document.getElementById('puzzle-container');
      const size = gameState.gridSize;
      const tileSize = size === 3 ? 120 : size === 4 ? 90 : 70;
      
      container.innerHTML = '';
      
      gameState.tiles.forEach((tile, index) => {
        const tileDiv = document.createElement('div');
        tileDiv.classList.add('tile');
        tileDiv.style.width = `${tileSize}px`;
        tileDiv.style.height = `${tileSize}px`;
        tileDiv.style.fontSize = `${tileSize * 0.25}px`;
        
        if (tile === null) {
          tileDiv.classList.add('empty');
        } else {
          tileDiv.textContent = tile;
          tileDiv.addEventListener('click', () => moveTile(index));
        }
        container.appendChild(tileDiv);
      });
    }

    function canMove(index) {
      const size = gameState.gridSize;
      const emptyIndex = gameState.tiles.indexOf(null);
      const row = Math.floor(index / size);
      const col = index % size;
      const emptyRow = Math.floor(emptyIndex / size);
      const emptyCol = emptyIndex % size;
      
      return (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
             (Math.abs(col - emptyCol) === 1 && row === emptyRow);
    }

    function moveTile(index) {
      if (!canMove(index)) {
        // Invalid move animation and sound
        if (gameState.settings.animationsEnabled) {
          const tileDiv = document.querySelectorAll('.tile')[index];
          tileDiv.classList.add('invalid-move');
          setTimeout(() => tileDiv.classList.remove('invalid-move'), 500);
        }
        soundEffects.invalidMove?.();
        return;
      }

      const emptyIndex = gameState.tiles.indexOf(null);
      
      // Start timer on first move
      if (gameState.moves === 0) {
        startTimer();
      }
      
      // Swap tiles
      [gameState.tiles[index], gameState.tiles[emptyIndex]] = 
      [gameState.tiles[emptyIndex], gameState.tiles[index]];
      
      gameState.moves++;
      updateStats();
      
      // Add moving animation
      if (gameState.settings.animationsEnabled) {
        const tileDiv = document.querySelectorAll('.tile')[emptyIndex];
        tileDiv.classList.add('moving');
        setTimeout(() => tileDiv.classList.remove('moving'), 300);
      }
      
      soundEffects.move?.();
      render();
      checkWin();
    }

    function shuffleTiles() {
      let shuffleCount = 0;
      const maxShuffles = gameState.gridSize * gameState.gridSize * 10;
      
      // Reset game state
      gameState.moves = 0;
      gameState.startTime = null;
      stopTimer();
      updateStats();
      
      const shuffleStep = () => {
        if (shuffleCount < maxShuffles) {
          const emptyIndex = gameState.tiles.indexOf(null);
          const size = gameState.gridSize;
          const validMoves = [];
          
          // Find valid adjacent positions
          const row = Math.floor(emptyIndex / size);
          const col = emptyIndex % size;
          
          if (row > 0) validMoves.push(emptyIndex - size); // up
          if (row < size - 1) validMoves.push(emptyIndex + size); // down
          if (col > 0) validMoves.push(emptyIndex - 1); // left
          if (col < size - 1) validMoves.push(emptyIndex + 1); // right
          
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          [gameState.tiles[emptyIndex], gameState.tiles[randomMove]] = 
          [gameState.tiles[randomMove], gameState.tiles[emptyIndex]];
          
          shuffleCount++;
          
          if (shuffleCount % 5 === 0) {
            render();
          }
          
          setTimeout(shuffleStep, 20);
        } else {
          render();
          soundEffects.shuffle?.();
        }
      };
      
      shuffleStep();
    }

    function checkWin() {
      const size = gameState.gridSize;
      const isWon = gameState.tiles.slice(0, -1).every((val, i) => val === i + 1) &&
                    gameState.tiles[size * size - 1] === null;
      
      if (isWon) {
        stopTimer();
        const timeString = document.getElementById('timer').textContent;
        showWinCelebration(timeString);
        updateBestTime(timeString);
        soundEffects.win?.();
        createConfetti();
      }
    }

    function showWinCelebration(time) {
      const celebration = document.getElementById('win-celebration');
      const stats = document.getElementById('win-stats');
      
      stats.innerHTML = `
        <div>🎯 Moves: ${gameState.moves}</div>
        <div>⏱️ Time: ${time}</div>
        <div>🏆 Difficulty: ${gameState.gridSize}x${gameState.gridSize}</div>
      `;
      
      celebration.style.display = 'flex';
    }

    function closeWinDialog() {
      document.getElementById('win-celebration').style.display = 'none';
      shuffleTiles();
    }

    function createConfetti() {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#ff9ff3'];
      
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          const confetti = document.createElement('div');
          confetti.className = 'confetti';
          confetti.style.left = Math.random() * 100 + 'vw';
          confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          confetti.style.animationDelay = Math.random() * 3 + 's';
          document.body.appendChild(confetti);
          
          setTimeout(() => confetti.remove(), 3000);
        }, i * 50);
      }
    }

    function startTimer() {
      gameState.startTime = Date.now();
      gameState.gameTimer = setInterval(updateTimer, 1000);
    }

    function stopTimer() {
      if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
        gameState.gameTimer = null;
      }
    }

    function updateTimer() {
      if (gameState.startTime) {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer').textContent = 
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    function updateStats() {
      document.getElementById('move-counter').textContent = gameState.moves;
      
      const difficulty = `${gameState.gridSize}x${gameState.gridSize}`;
      const bestTime = gameState.bestTimes[difficulty];
      document.getElementById('best-time').textContent = bestTime || '--:--';
    }

    function updateBestTime(timeString) {
      const difficulty = `${gameState.gridSize}x${gameState.gridSize}`;
      const currentBest = gameState.bestTimes[difficulty];
      
      if (!currentBest || timeString < currentBest) {
        gameState.bestTimes[difficulty] = timeString;
        localStorage.setItem('puzzleBestTimes', JSON.stringify(gameState.bestTimes));
        updateStats();
      }
    }

    function changeDifficulty(size) {
      stopTimer();
      gameState.gridSize = size;
      
      // Update button states
      document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');
      
      initGame();
      shuffleTiles();
    }

    function setupEventListeners() {
      // Shuffle button
      document.getElementById('shuffle').addEventListener('click', shuffleTiles);
      
      // Difficulty buttons
      document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const difficulty = e.target.dataset.difficulty;
          const size = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
          changeDifficulty(size);
        });
      });
      
      // Settings toggles
      document.getElementById('sound-toggle').addEventListener('click', (e) => {
        gameState.settings.soundEnabled = !gameState.settings.soundEnabled;
        e.target.classList.toggle('active');
      });
      
      document.getElementById('animation-toggle').addEventListener('click', (e) => {
        gameState.settings.animationsEnabled = !gameState.settings.animationsEnabled;
        e.target.classList.toggle('active');
      });
      
      document.getElementById('auto-shuffle-toggle').addEventListener('click', (e) => {
        gameState.settings.autoShuffle = !gameState.settings.autoShuffle;
        e.target.classList.toggle('active');
      });
      
      // Volume slider
      document.getElementById('volume-slider').addEventListener('input', (e) => {
        gameState.settings.volume = e.target.value / 100;
      });
      
      // Reset stats
      document.getElementById('reset-stats').addEventListener('click', () => {
        gameState.bestTimes = {};
        localStorage.removeItem('puzzleBestTimes');
        updateStats();
      });
      
      // Hint button
      document.getElementById('solve-hint').addEventListener('click', () => {
        // Simple hint: highlight a tile that can move
        const emptyIndex = gameState.tiles.indexOf(null);
        const size = gameState.gridSize;
        const validMoves = [];
        
        const row = Math.floor(emptyIndex / size);
        const col = emptyIndex % size;
        
        if (row > 0) validMoves.push(emptyIndex - size);
        if (row < size - 1) validMoves.push(emptyIndex + size);
        if (col > 0) validMoves.push(emptyIndex - 1);
        if (col < size - 1) validMoves.push(emptyIndex + 1);
        
        if (validMoves.length > 0) {
          const hintIndex = validMoves[Math.floor(Math.random() * validMoves.length)];
          const tiles = document.querySelectorAll('.tile');
          const hintTile = tiles[hintIndex];
          
          hintTile.style.border = '3px solid #feca57';
          hintTile.style.boxShadow = '0 0 20px rgba(254, 202, 87, 0.6)';
          
          setTimeout(() => {
            hintTile.style.border = '2px solid rgba(255,255,255,0.3)';
            hintTile.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
          }, 2000);
        }
      });
    }

    // Initialize everything
    document.addEventListener('DOMContentLoaded', () => {
      initAudio();
      setupEventListeners();
      initGame();
      shuffleTiles();
    });