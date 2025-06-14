// --- 1. INITIAL SETUP & DOM ELEMENTS ---

// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');

// Get main DOM elements
const startBtn = document.getElementById('start-btn');
const messageOverlay = document.getElementById('charity-message-overlay');
const gameScreen = document.getElementById('game-screen');
const timerDisplay = document.getElementById('game-timer');
const scoreDisplay = document.getElementById('game-score');

// Show Xs for misses (top display)
let xDisplay = document.createElement('div');
xDisplay.id = 'misses-display';
xDisplay.style.position = 'absolute';
xDisplay.style.top = '80px';
xDisplay.style.left = '50%';
xDisplay.style.transform = 'translateX(-50%)';
xDisplay.style.fontSize = '2rem';
xDisplay.style.color = '#f5402c';
xDisplay.style.zIndex = '20';
gameScreen && gameScreen.appendChild(xDisplay);

// --- 2. GAME STATE VARIABLES ---

let timeLeft = 120; // 2 minutes
let timerInterval;
let rainInterval;
let weatherInterval;

let gameActive = false;
let score = 0;
let misses = 0;
let rainSpeed = 2500;
let rainFrequency = 1200;
let pointsToWin = 15;
let level = 1;
let combo = 0;
let comboThreshold = 5;
let weather = 'normal';
const maxMisses = 3;
let currentWeatherType = 'normal';

// --- 3. CONSTANTS FOR COLORS & TYPES ---

const realisticColors = {
  clean: '#4fc3f7',
  dirty: '#bfa97a',
  unknown: '#b0b7c6'
};

let rainColorMap = {
  clean: 'clean',
  dirty: 'dirty',
  unknown: 'unknown'
};

const rainTypes = [
  { type: 'clean', icon: '💧' },
  { type: 'dirty', icon: '🦠' },
  { type: 'unknown', icon: '❓' }
];

// --- 4. TIMER FUNCTIONS ---

function startGameTimer() {
  timerDisplay.textContent = '2:00';
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    // Format the time as MM:SS
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // When time runs out, stop the timer
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      clearInterval(rainInterval); // Stop rain when timer ends
      timerDisplay.textContent = '0:00';
      // You can add more logic here for when the timer ends
    }

    timeLeft--;
  }, 1000);
}

function startGameTimerAndRain() {
  timeLeft = 120;
  timerDisplay.textContent = '2:00';
  clearInterval(timerInterval);
  clearInterval(rainInterval);
  gameActive = true;
  rainInterval = setInterval(() => {
    createRainDrop();
  }, rainFrequency);
  timerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      clearInterval(rainInterval);
      timerDisplay.textContent = '0:00';
      // Add more logic here for when the timer ends
    }
    timeLeft--;
  }, 1000);
}

// --- 5. WEATHER FUNCTIONS ---

function updateWeatherBackground(type) {
  // Only update the game screen background color, not the starter screen
  const gameScreenDiv = document.getElementById('game-screen');
  const gameSky = document.querySelector('#game-screen .sky-background');
  // Pick a single color for each weather type
  let bgColor = '';
  if (type === 'storm') {
    bgColor = '#5a7ca7'; // Stormy blue-gray
  } else if (type === 'sunny') {
    bgColor = '#87ceeb'; // Bright blue
  } else if (type === 'random') {
    bgColor = '#c471f5'; // Fun purple
  } else {
    bgColor = '#b3e0fc'; // Normal sky blue
  }
  // Set the same solid color for both the sky and the whole game screen
  if (gameSky) {
    gameSky.style.background = bgColor;
  }
  if (gameScreenDiv) {
    gameScreenDiv.style.background = bgColor;
  }
}

function startWeatherChanges() {
  let weatherChangeInterval = Math.max(4000, 12000 - level * 1500);
  weatherInterval = setInterval(() => {
    const weatherTypes = ['normal', 'storm', 'sunny', 'random'];
    let newWeatherType;
    do {
      newWeatherType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    } while (newWeatherType === currentWeatherType);
    currentWeatherType = newWeatherType;
    updateWeatherBackground(currentWeatherType);

    // Switch the color meanings for some (not all) rain drop types
    const types = ['clean', 'dirty', 'unknown'];
    // Shuffle types
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    // Pick 1 or 2 types to change
    const numToChange = Math.random() < 0.5 ? 1 : 2;
    const toChange = types.slice(0, numToChange);

    // Make a copy of the current mapping
    let newMap = { ...rainColorMap };
    // For each type to change, pick a new color (not its current one)
    toChange.forEach(type => {
      const otherColors = types.filter(t => t !== rainColorMap[type]);
      newMap[type] = otherColors[Math.floor(Math.random() * otherColors.length)];
    });

    // Make sure no two types have the same color
    const colorSet = new Set(Object.values(newMap));
    if (colorSet.size === 3) {
      rainColorMap = newMap;
      showComboMessage('Weather changed! Some drop colors changed meaning!');
    } else {
      showComboMessage('Weather changed! (No big changes this time)');
    }
  }, weatherChangeInterval);
}

// --- 6. HELPERS FOR DROPS & BUCKETS ---

function getRainDropColor(type) {
  return realisticColors[rainColorMap[type]];
}

function getCurrentBucket(type) {
  return type;
}

function getRandomRainType() {
  return rainTypes[Math.floor(Math.random() * rainTypes.length)];
}

function getRandomX() {
  const bucketsRow = document.querySelector('.game-screen .buckets-row') || document.querySelector('.buckets-row');
  if (bucketsRow) {
    const rowRect = bucketsRow.getBoundingClientRect();
    const min = rowRect.left + 10;
    const max = rowRect.right - 70;
    return Math.floor(Math.random() * (max - min)) + min;
  } else {
    const min = 40;
    const max = window.innerWidth - 100;
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

function shuffleRainColorMap() {
  const types = ['clean', 'dirty', 'unknown'];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  rainColorMap.clean = types[0];
  rainColorMap.dirty = types[1];
  rainColorMap.unknown = types[2];
}

// --- 7. RAIN DROP CREATION & ANIMATION ---

function createRainDrop() {
  // Debug: Check if the game is active before creating a drop
  console.log('createRainDrop called. gameActive:', gameActive);
  if (!gameActive) return;

  let rainType = getRandomRainType();
  let color = getRainDropColor(rainType.type);

  // Create the rain drop container
  const drop = document.createElement('div');
  drop.className = `rain-drop rain-${rainType.type}`;
  drop.dataset.type = rainType.type;
  drop.style.position = 'absolute';
  drop.style.top = '-40px';
  drop.style.left = `${getRandomX()}px`;
  drop.style.width = '60px';
  drop.style.height = '80px';
  drop.style.background = 'transparent';
  drop.style.cursor = 'grab';
  drop.style.zIndex = '12';
  drop.style.display = 'block';
  drop.style.userSelect = 'none';
  drop.style.pointerEvents = 'auto';
  drop.style.border = 'none';
  drop.style.boxShadow = 'none';

  // --- Add a circular glow element (hidden by default) ---
  const glow = document.createElement('div');
  glow.className = 'rain-glow';
  glow.style.position = 'absolute';
  glow.style.top = '-15px';
  glow.style.left = '-15px';
  glow.style.width = '90px';
  glow.style.height = '110px';
  glow.style.borderRadius = '50%';
  glow.style.background = `${color}`;
  glow.style.opacity = '0.35';
  glow.style.filter = `blur(12px)`;
  glow.style.pointerEvents = 'none';
  glow.style.zIndex = '1';
  glow.style.display = 'none'; // Only show on hover/click

  // --- Add the SVG for the drop (SVG has pointer-events: none) ---
  const svg = document.createElement('div');
  svg.innerHTML = `
    <svg width="60" height="80" viewBox="0 0 36 48" style="display:block; pointer-events:none;">
      <path d="M18 4
        C18 4, 4 24, 4 34
        a14 14 0 0 0 28 0
        C32 24, 18 4, 18 4
        Z"
        fill="${color}" stroke="#1a1a1a" stroke-width="2"/>
      <ellipse cx="13" cy="20" rx="5" ry="13" fill="#fff" fill-opacity="0.35" />
      <text x="18" y="34" text-anchor="middle" font-size="22" fill="#fff" stroke="#0008" stroke-width="1" dy="0.35em" font-family="Segoe UI, Arial, sans-serif">${rainType.icon}</text>
    </svg>
  `;
  svg.style.position = 'relative';
  svg.style.zIndex = '2';

  // --- Show the glow on hover or click ---
  drop.addEventListener('mouseenter', function() {
    glow.style.display = 'block';
  });
  drop.addEventListener('mouseleave', function() {
    glow.style.display = 'none';
  });
  drop.addEventListener('mousedown', function() {
    glow.style.display = 'block';
    // Hide the glow after 200ms if not dragging
    setTimeout(() => {
      if (!drop.style.cursor.includes('grabbing')) {
        glow.style.display = 'none';
      }
    }, 200);
  });

  // --- Compose the drop: glow behind, SVG in front ---
  drop.appendChild(glow);
  drop.appendChild(svg);

  // Make the drop draggable
  makeDraggable(drop);

  // Animate the drop falling
  animateRainDropRainy(drop, rainSpeed);

  // Add the drop to the game screen
  gameScreen.appendChild(drop);

  // Debug: Log to confirm drop was added
  console.log('Rain drop added to DOM:', drop);
}

function animateRainDropRainy(drop, speed) {
  let start = Date.now();
  let from = -80;
  let to = window.innerHeight - 200;
  const origLeft = parseInt(drop.style.left, 10);
  const driftDir = Math.random() > 0.5 ? 1 : -1;
  const driftAmount = Math.random() * 30;
  function fall() {
    if (!gameActive) {
      drop.remove();
      return;
    }
    let now = Date.now();
    let elapsed = now - start;
    let percent = elapsed / speed;
    let y = from + (to - from) * percent;
    drop.style.top = `${y}px`;
    // Drift a little as it falls, but mostly straight down
    let drift = Math.sin(percent * Math.PI) * driftAmount * driftDir;
    drop.style.left = `${origLeft + drift}px`;

    if (percent < 1) {
      drop._falling = requestAnimationFrame(fall);
    } else {
      drop._falling = null;
      // If not caught, count as miss
      dropMissed(drop);
    }
  }
  drop._falling = requestAnimationFrame(fall);
}

// --- 8. DRAG & DROP LOGIC ---

function makeDraggable(drop) {
  // Variables to track dragging state
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;

  // When mouse is pressed down on the drop
  drop.onmousedown = function(e) {
    e.preventDefault();
    if (!gameActive) return;

    dragging = true;
    // Bring the drop to the front
    drop.style.zIndex = '100';
    drop.style.cursor = 'grabbing';

    // *** Stop the falling animation when dragging starts ***
    if (drop._falling) {
      cancelAnimationFrame(drop._falling);
      drop._falling = null;
    }

    // Calculate the offset between mouse and drop's top-left corner
    offsetX = e.clientX - drop.offsetLeft;
    offsetY = e.clientY - drop.offsetTop;

    // Listen for mouse movement on the whole document
    document.onmousemove = function(e) {
      if (!dragging) return;
      // Move the drop to follow the mouse
      drop.style.left = `${e.clientX - offsetX}px`;
      drop.style.top = `${e.clientY - offsetY}px`;
    };

    // When mouse is released
    document.onmouseup = function(e) {
      if (!dragging) return;
      dragging = false;
      drop.style.cursor = 'grab';
      drop.style.boxShadow = `0 4px 16px ${drop.style.background}88`;
      document.onmousemove = null;
      document.onmouseup = null;
      checkDropInBucket(drop);
    };
  };

  // Optional: Touch support for mobile
  drop.ontouchstart = function(e) {
    e.preventDefault();
    if (!gameActive) return;

    dragging = true;
    drop.style.zIndex = '100';
    drop.style.cursor = 'grabbing';

    // *** Stop the falling animation when dragging starts (touch) ***
    if (drop._falling) {
      cancelAnimationFrame(drop._falling);
      drop._falling = null;
    }

    const touch = e.touches[0];
    offsetX = touch.clientX - drop.offsetLeft;
    offsetY = touch.clientY - drop.offsetTop;

    document.ontouchmove = function(e) {
      if (!dragging) return;
      const touch = e.touches[0];
      drop.style.left = `${touch.clientX - offsetX}px`;
      drop.style.top = `${touch.clientY - offsetY}px`;
    };

    document.ontouchend = function(e) {
      if (!dragging) return;
      dragging = false;
      drop.style.cursor = 'grab';
      drop.style.boxShadow = `0 4px 16px ${drop.style.background}88`;
      document.ontouchmove = null;
      document.ontouchend = null;
      checkDropInBucket(drop);
    };
  };

  drop.onclick = function() {
    // For beginners: show a message when clicked
    // alert(`You clicked a ${drop.dataset.type} drop! Try dragging it to a bucket.`);
    // You can show a message in the UI instead, or just do nothing.
  };
}

function checkDropInBucket(drop) {
  if (!gameActive) return;
  drop.style.transition = 'box-shadow 0.2s';
  drop.style.zIndex = '12';
  drop.style.pointerEvents = 'auto';
  drop.style.userSelect = 'auto';
  drop.style.display = 'block';
  const buckets = document.querySelectorAll('.game-screen .bucket');
  let placed = false;
  buckets.forEach(bucket => {
    const rect = bucket.getBoundingClientRect();
    const dropRect = drop.getBoundingClientRect();
    if (
      dropRect.left + dropRect.width / 2 > rect.left &&
      dropRect.left + dropRect.width / 2 < rect.right &&
      dropRect.top + dropRect.height / 2 > rect.top &&
      dropRect.top + dropRect.height / 2 < rect.bottom
    ) {
      if (bucket.classList.contains(`bucket-${getCurrentBucket(drop.dataset.type)}`)) {
        scorePoint(drop);
      } else {
        dropWrong(drop);
      }
      placed = true;
    }
  });
  if (!placed) {
    if (parseInt(drop.style.top, 10) > window.innerHeight - 220) {
      dropMissed(drop);
    }
  }
}

// --- 9. SOUND EFFECTS ---

const buzzerAudio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae2e2.mp3');
const bellAudio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae2e2.mp3');

// --- 10. SCORING, BOOSTS, AND MISTAKES ---

function scorePoint(drop) {
  score++;
  combo++;
  updateScore();
  const buckets = document.querySelectorAll('.game-screen .bucket');
  buckets.forEach(bucket => {
    if (bucket.classList.contains(`bucket-${getCurrentBucket(drop.dataset.type)}`)) {
      const originalBg = bucket.style.backgroundColor;
      bucket.style.backgroundColor = '#4FCB53';
      bellAudio.currentTime = 0;
      bellAudio.play();
      setTimeout(() => {
        bucket.style.backgroundColor = '';
      }, 700);
    }
  });
  if (combo > 0 && combo % comboThreshold === 0) {
    const boostType = Math.floor(Math.random() * 3);
    if (boostType === 0) {
      addTimeBoost();
    } else if (boostType === 1) {
      addPointsBoost();
    } else {
      removeXBoost();
    }
  }
  drop.remove();
  if (score >= pointsToWin) {
    endGame(true);
  }
}

function addTimeBoost() {
  let timerText = document.getElementById('game-timer').textContent;
  let parts = timerText.split(':');
  let seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]) + 10;
  let minutes = Math.floor(seconds / 60);
  let secs = seconds % 60;
  document.getElementById('game-timer').textContent = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  showComboMessage('Time Boost! +10s');
}

function addPointsBoost() {
  score += 3;
  showComboMessage('Bonus! +3 Points');
  updateScore();
}

function removeXBoost() {
  if (misses > 0) {
    misses--;
    showComboMessage('Mistake Removed!');
    updateMisses();
  } else {
    showComboMessage('No X to remove!');
  }
}

// --- 11. UI FEEDBACK (COMBO, X, ETC) ---

function showComboMessage(msg) {
  const comboMsg = document.createElement('div');
  comboMsg.textContent = msg;
  comboMsg.style.position = 'absolute';
  comboMsg.style.top = '120px';
  comboMsg.style.left = '50%';
  comboMsg.style.transform = 'translateX(-50%)';
  comboMsg.style.fontSize = '2rem';
  comboMsg.style.color = '#4FCB53';
  comboMsg.style.background = '#fff8';
  comboMsg.style.borderRadius = '12px';
  comboMsg.style.padding = '8px 24px';
  comboMsg.style.zIndex = '30';
  gameScreen.appendChild(comboMsg);
  setTimeout(() => comboMsg.remove(), 1200);
}

function showXOnBucket(bucket) {
  const xMark = document.createElement('div');
  xMark.textContent = '❌';
  xMark.style.position = 'absolute';
  xMark.style.top = '10px';
  xMark.style.left = '50%';
  xMark.style.transform = 'translateX(-50%)';
  xMark.style.fontSize = '2.5rem';
  xMark.style.color = '#f5402c';
  xMark.style.pointerEvents = 'none';
  xMark.style.zIndex = '50';
  bucket.appendChild(xMark);
  setTimeout(() => xMark.remove(), 1200);
}

function showXAtDrop(drop) {
  const xMark = document.createElement('div');
  xMark.textContent = '❌';
  xMark.style.position = 'absolute';
  xMark.style.left = drop.style.left;
  xMark.style.top = `${window.innerHeight - 180}px`;
  xMark.style.fontSize = '2.5rem';
  xMark.style.color = '#f5402c';
  xMark.style.pointerEvents = 'none';
  xMark.style.zIndex = '50';
  gameScreen.appendChild(xMark);
  setTimeout(() => xMark.remove(), 1200);
}

// --- 12. DROP OUTCOMES ---

function dropWrong(drop) {
  misses++;
  combo = 0;
  updateMisses();
  buzzerAudio.currentTime = 0;
  buzzerAudio.play();
  const buckets = document.querySelectorAll('.game-screen .bucket');
  buckets.forEach(bucket => {
    const rect = bucket.getBoundingClientRect();
    const dropRect = drop.getBoundingClientRect();
    if (
      dropRect.left + dropRect.width / 2 > rect.left &&
      dropRect.left + dropRect.width / 2 < rect.right &&
      dropRect.top + dropRect.height / 2 > rect.top &&
      dropRect.top + dropRect.height / 2 < rect.bottom
    ) {
      showXOnBucket(bucket);
    }
  });
  drop.remove();
  if (misses >= maxMisses) {
    endGame(false);
  }
}

function dropMissed(drop) {
  misses++;
  combo = 0;
  updateMisses();
  buzzerAudio.currentTime = 0;
  buzzerAudio.play();
  showXAtDrop(drop);
  drop.remove();
  if (misses >= maxMisses) {
    endGame(false);
  }
}

// --- 13. SCORE & MISTAKE DISPLAY ---

function updateScore() {
  if (scoreDisplay) scoreDisplay.textContent = score;
}

function updateMisses() {
  if (xDisplay) {
    xDisplay.textContent = '❌'.repeat(misses);
    if (misses >= 3) {
      xDisplay.style.left = '50%';
      xDisplay.style.transform = 'translateX(-50%)';
      xDisplay.style.fontSize = '2.5rem';
      xDisplay.style.top = '120px';
    } else {
      xDisplay.style.left = '50%';
      xDisplay.style.transform = 'translateX(-50%)';
      xDisplay.style.fontSize = '2rem';
      xDisplay.style.top = '80px';
    }
  }
}

// --- 14. GAME LOOP & LEVEL ---

function startRain() {
  gameActive = true;
  rainInterval = setInterval(() => {
    const numDrops = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < numDrops; i++) {
      createRainDrop();
    }
  }, rainFrequency);
}

function stopRain() {
  clearInterval(rainInterval);
  clearInterval(weatherInterval);
  gameActive = false;
  document.querySelectorAll('.rain-drop').forEach(drop => drop.remove());
}

function setLevel(lvl) {
  level = lvl;
  rainSpeed = Math.max(900, 2500 - level * 250);
  rainFrequency = Math.max(400, 1200 - level * 120);
  pointsToWin = 15 + level * 5;
}

// --- 15. END GAME & RESET ---

function endGame(win) {
  // Stop rain and timers
  stopRain();
  clearInterval(timerInterval);
  clearInterval(weatherInterval);

  // Do NOT show any alert or overlay message for win or lose

  if (!win) {
    // If the player lost, show 3 Xs at the top center for 2 seconds
    if (xDisplay) {
      xDisplay.textContent = '❌❌❌';
      xDisplay.style.left = '50%';
      xDisplay.style.transform = 'translateX(-50%)';
      xDisplay.style.fontSize = '2.5rem';
      xDisplay.style.top = '120px';
      xDisplay.style.display = 'block';
      // Hide the Xs after 2 seconds
      setTimeout(() => {
        xDisplay.textContent = '';
        xDisplay.style.display = '';
      }, 2000);
    }
  }

  // Reset the game after a short delay
  setTimeout(() => {
    resetGame();
    // Show the starter screen again
    document.getElementById('starter-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
  }, 2000);
}

function resetGame() {
  score = 0;
  misses = 0;
  combo = 0;
  level = 1;
  weather = 'normal';
  updateScore();
  updateMisses();
  if (scoreDisplay) scoreDisplay.textContent = '0';
  document.querySelectorAll('.rain-drop').forEach(drop => drop.remove());
}

// --- 16. GAME START HANDLING ---

function startGameAfterMessage() {
  // Reset game state and start everything needed for a new game
  resetGame();
  setLevel(level);
  startWeatherChanges();
  startGameTimerAndRain();
}

// When the start button is clicked, show the game screen and the message overlay
if (startBtn && messageOverlay) {
  startBtn.onclick = function() {
    // Hide the starter screen
    document.getElementById('starter-screen').classList.add('hidden');
    // Show the game screen
    document.getElementById('game-screen').classList.remove('hidden');
    // Show the charity: water message overlay (with logo and message)
    messageOverlay.classList.remove('hidden');
    // Make sure the overlay is visible and not transparent
    messageOverlay.style.backgroundColor = 'rgba(0,0,0,0.65)';
    // Do NOT change messageOverlay.innerHTML or textContent here!

    // Wait 15 seconds, then hide the message and start the game
    setTimeout(function() {
      // Hide the message overlay (but keep its content for next time)
      messageOverlay.classList.add('hidden');
      // Set game screen background to normal at game start
      currentWeatherType = 'normal';
      updateWeatherBackground(currentWeatherType);
      // Start the timer and rain drop game after the charity message disappears
      startGameAfterMessage();
    }, 15000); // 15000 milliseconds = 15 seconds
  };
}
