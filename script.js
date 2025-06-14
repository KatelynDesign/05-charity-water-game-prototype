// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');

// Get the start button and message overlay elements
const startBtn = document.getElementById('start-btn');
const messageOverlay = document.getElementById('charity-message-overlay');
const gameScreen = document.getElementById('game-screen');



// Get the timer display element from the page
const timerDisplay = document.getElementById('game-timer');

// Set the starting time (in seconds)
let timeLeft = 120; // 2 minutes

// This variable will hold the interval ID so we can stop the timer later
let timerInterval;

// Function to start the timer
function startGameTimer() {
  // Show the starting time
  timerDisplay.textContent = '2:00';

  // Clear any previous timer
  clearInterval(timerInterval);

  // Start the countdown
  timerInterval = setInterval(() => {
    // Calculate minutes and seconds
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // Format the time as MM:SS
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // When time runs out, stop the timer
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerDisplay.textContent = '0:00';
      // You can add more logic here for when the timer ends
    }

    // Decrease the time left by 1 second
    timeLeft--;
  }, 1000); // 1000 milliseconds = 1 second
}

// Function to start the timer and rain at the same time
function startGameTimerAndRain() {
  // Reset timeLeft to 2 minutes (120 seconds) at the start of each game
  timeLeft = 120;
  // Show the starting time
  timerDisplay.textContent = '2:00';

  // Clear any previous timer and rain intervals
  clearInterval(timerInterval);
  clearInterval(rainInterval);

  // Start the rain drops at the same time as the timer
  gameActive = true; // Make sure game is active so drops appear
  rainInterval = setInterval(() => {
    createRainDrop();
  }, rainFrequency);

  // Start the countdown timer
  timerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      clearInterval(rainInterval); // Stop rain when timer ends
      timerDisplay.textContent = '0:00';
      // You can add more logic here for when the timer ends
    }

    timeLeft--;
  }, 1000);
}

// --- GAME LOGIC FOR RAIN DROPS ---

// Game state variables
let gameActive = false;
let score = 0;
let misses = 0;
let rainInterval;
let rainSpeed = 2500; // ms, how fast drops fall
let rainFrequency = 1200; // ms, how often drops appear
let pointsToWin = 15; // Points needed to win (increase for higher levels)
let level = 1;
let combo = 0;
let comboThreshold = 5; // Combo boost every 5 correct
let weather = 'normal'; // 'normal', 'storm', 'sunny', 'random'
let weatherInterval;
const maxMisses = 3;

// Realistic water colors (these never change)
const realisticColors = {
  clean: '#4fc3f7',   // light blue for clean water
  dirty: '#bfa97a',   // muddy brown for dirty water
  unknown: '#b0b7c6'  // grayish for unknown water
};

// This object will map drop types to colors, and will be changed by weather
let rainColorMap = {
  clean: 'clean',
  dirty: 'dirty',
  unknown: 'unknown'
};

// Add a variable to track the current weather type for background
let currentWeatherType = 'normal';

// Helper to update the game screen background based on weather type
function updateWeatherBackground(type) {
  // Only update the game screen background, not the starter screen
  const gameSky = document.querySelector('#game-screen .sky-background');
  let bg = '';
  if (type === 'storm') {
    // Stormy: dark blue/gray
    bg = 'linear-gradient(to bottom, #5a7ca7 0%, #b3c6d6 100%)';
  } else if (type === 'sunny') {
    // Sunny: bright blue and yellow
    bg = 'linear-gradient(to bottom, #87ceeb 0%, #fffde4 100%)';
  } else if (type === 'random') {
    // Random: purple-pink
    bg = 'linear-gradient(to bottom, #c471f5 0%, #fa71cd 100%)';
  } else {
    // Normal: default blue sky
    bg = 'linear-gradient(to bottom, #b3e0fc 0%, #e3f6fd 100%)';
  }
  if (gameSky) {
    gameSky.style.background = bg;
  }
}

// --- WEATHER LOGIC ---
// Weather changes every so often, sometimes changes drop colors for some types
function startWeatherChanges() {
  // Weather changes more frequently as level increases, but not too fast
  let weatherChangeInterval = Math.max(4000, 12000 - level * 1500);
  weatherInterval = setInterval(() => {
    // Pick a random weather type for the game screen background
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

// Helper to get the color for a drop type (based on current mapping)
function getRainDropColor(type) {
  // type is 'clean', 'dirty', or 'unknown'
  // rainColorMap[type] tells us which color to use
  return realisticColors[rainColorMap[type]];
}

// Helper to get the *current* correct bucket for a drop type
function getCurrentBucket(type) {
  // The goal is always to put the drop in the bucket matching its type
  // (the label on the drop, not the color)
  return type;
}

// Rain drop types and their correct buckets
const rainTypes = [
  { type: 'clean', icon: '💧' },
  { type: 'dirty', icon: '🦠' },
  { type: 'unknown', icon: '❓' }
];

// DOM elements for score and misses
const scoreDisplay = document.getElementById('game-score');
// gameScreen already defined above

// Show Xs for misses (top display, still used for total count)
let xDisplay = document.createElement('div');
xDisplay.id = 'misses-display';
// Center the Xs at the top by default
xDisplay.style.position = 'absolute';
xDisplay.style.top = '80px';
xDisplay.style.left = '50%';
xDisplay.style.transform = 'translateX(-50%)';
xDisplay.style.fontSize = '2rem';
xDisplay.style.color = '#f5402c';
xDisplay.style.zIndex = '20';
gameScreen && gameScreen.appendChild(xDisplay);

// Helper to get a random rain type
function getRandomRainType() {
  return rainTypes[Math.floor(Math.random() * rainTypes.length)];
}

// Helper to get a random X position (spread out, but only over the buckets area)
// This keeps drops above the buckets so players can easily tap and drag them
function getRandomX() {
  // Find the left and right edges of the buckets row
  const bucketsRow = document.querySelector('.game-screen .buckets-row') || document.querySelector('.buckets-row');
  if (bucketsRow) {
    const rowRect = bucketsRow.getBoundingClientRect();
    // Add a little padding so drops don't go off the edge
    const min = rowRect.left + 10;
    const max = rowRect.right - 70; // 60px drop + 10px padding
    // Pick a random X within this range
    return Math.floor(Math.random() * (max - min)) + min;
  } else {
    // Fallback: use most of the screen width
    const min = 40;
    const max = window.innerWidth - 100;
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

// Helper to shuffle the mapping of types to colors
function shuffleRainColorMap() {
  // Make an array of the types
  const types = ['clean', 'dirty', 'unknown'];
  // Shuffle the array
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  // Assign shuffled types to color meanings
  rainColorMap.clean = types[0];
  rainColorMap.dirty = types[1];
  rainColorMap.unknown = types[2];
}

// Create a rain drop DOM element
function createRainDrop() {
  if (!gameActive) return;
  // Pick rain type and color
  let rainType = getRandomRainType();
  let color = getRainDropColor(rainType.type);

  // Make the drop a bit bigger: width 60px, height 80px, SVG scaled up
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
  drop.style.transition = 'box-shadow 0.2s';
  drop.style.display = 'block';
  drop.style.userSelect = 'none';
  drop.style.pointerEvents = 'auto';
  drop.style.border = 'none';
  drop.style.boxShadow = 'none';

  // SVG is now 60x80 viewBox, scaled up from before
  drop.innerHTML = `
    <svg width="60" height="80" viewBox="0 0 36 48" style="display:block; pointer-events:none;">
      <!-- Main raindrop shape -->
      <path d="M18 4
        C18 4, 4 24, 4 34
        a14 14 0 0 0 28 0
        C32 24, 18 4, 18 4
        Z"
        fill="${color}" stroke="#1a1a1a" stroke-width="2"/>
      <!-- Cartoon highlight -->
      <ellipse cx="13" cy="20" rx="5" ry="13" fill="#fff" fill-opacity="0.35" />
      <!-- Icon in the center -->
      <text x="18" y="34" text-anchor="middle" font-size="22" fill="#fff" stroke="#0008" stroke-width="1" dy="0.35em" font-family="Segoe UI, Arial, sans-serif">${rainType.icon}</text>
    </svg>
  `;

  // Make draggable
  makeDraggable(drop);

  // Animate falling (make it look more like rain)
  animateRainDropRainy(drop, rainSpeed);

  // Add to game screen
  gameScreen.appendChild(drop);
}

// Animate the rain drop falling down like real rain (straight down, random X above buckets)
function animateRainDropRainy(drop, speed) {
  let start = Date.now();
  let from = -80; // Start above the screen
  let to = window.innerHeight - 200; // Stop above ground/buckets

  // Give each drop a slight random horizontal drift for realism
  const origLeft = parseInt(drop.style.left, 10);
  // Drift direction: left or right
  const driftDir = Math.random() > 0.5 ? 1 : -1;
  // Drift amount: up to 30px left or right (smaller for easier play)
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

// Make a rain drop draggable (mouse/touch)
// This lets the player click (or tap) and drag the drop to a bucket
function makeDraggable(drop) {
  let offsetX = 0, offsetY = 0, dragging = false;

  // Mouse events for desktop
  drop.onmousedown = function(e) {
    e.preventDefault(); // Prevent text selection
    if (!gameActive) return; // Only allow dragging if game is active
    dragging = true;
    drop.style.cursor = 'grabbing';
    drop.style.boxShadow = '0 8px 32px #2228';
    offsetX = e.clientX - drop.offsetLeft;
    offsetY = e.clientY - drop.offsetTop;

    document.onmousemove = function(e) {
      if (!dragging) return;
      drop.style.left = `${e.clientX - offsetX}px`;
      drop.style.top = `${e.clientY - offsetY}px`;
    };

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

  // Touch events for mobile/tablet
  drop.ontouchstart = function(e) {
    e.preventDefault();
    if (!gameActive) return;
    dragging = true;
    const touch = e.touches[0];
    offsetX = touch.clientX - drop.offsetLeft;
    offsetY = touch.clientY - drop.offsetTop;
    drop.style.cursor = 'grabbing';
    drop.style.boxShadow = '0 8px 32px #2228';

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
}

// Check if drop is in a bucket when released
function checkDropInBucket(drop) {
  if (!gameActive) return; // Only check if game is active
  // Reset styles after dragging
  drop.style.transition = 'box-shadow 0.2s';
  drop.style.zIndex = '12'; // Reset z-index after dragging
  drop.style.pointerEvents = 'auto'; // Re-enable pointer events after dragging
  drop.style.userSelect = 'auto'; // Re-enable text selection after dragging
  drop.style.display = 'block'; // Ensure drop is visible after dragging
  // Get bucket elements
  const buckets = document.querySelectorAll('.game-screen .bucket');
  let placed = false;
  buckets.forEach(bucket => {
    const rect = bucket.getBoundingClientRect();
    const dropRect = drop.getBoundingClientRect();
    // Check overlap
    if (
      dropRect.left + dropRect.width / 2 > rect.left &&
      dropRect.left + dropRect.width / 2 < rect.right &&
      dropRect.top + dropRect.height / 2 > rect.top &&
      dropRect.top + dropRect.height / 2 < rect.bottom
    ) {
      // Check if correct bucket (goal: match drop type to bucket label)
      if (bucket.classList.contains(`bucket-${getCurrentBucket(drop.dataset.type)}`)) {
        // Correct!
        scorePoint(drop);
      } else {
        // Wrong bucket
        dropWrong(drop);
      }
      placed = true;
    }
  });
  if (!placed) {
    // If not placed in any bucket, let it keep falling or count as miss if on ground
    if (parseInt(drop.style.top, 10) > window.innerHeight - 220) {
      dropMissed(drop);
    }
  }
}

// --- SOUND EFFECTS ---
// Create simple audio elements for buzzer and bell
const buzzerAudio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae2e2.mp3'); // Free buzzer sound
const bellAudio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae2e2.mp3'); // Free bell sound (replace with a bell if you want)

// For a real bell, you can use a different sound, e.g.:
// const bellAudio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae2e2.mp3');

// Score a point for correct drop
function scorePoint(drop) {
  score++;
  combo++;
  updateScore();

  // Play bell sound and highlight the correct bucket
  // Find the correct bucket for this drop
  const buckets = document.querySelectorAll('.game-screen .bucket');
  buckets.forEach(bucket => {
    if (bucket.classList.contains(`bucket-${getCurrentBucket(drop.dataset.type)}`)) {
      // Change bucket color to green
      const originalBg = bucket.style.backgroundColor;
      bucket.style.backgroundColor = '#4FCB53'; // Green
      bellAudio.currentTime = 0;
      bellAudio.play();
      // After bell sound, return bucket to original color
      setTimeout(() => {
        bucket.style.backgroundColor = '';
      }, 700); // 0.7 seconds is enough for the bell
    }
  });

  // Combo boost logic
  if (combo > 0 && combo % comboThreshold === 0) {
    // Randomly pick a boost: time, points, or X remover
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
  // Check win (must reach points before timer runs out)
  if (score >= pointsToWin) {
    endGame(true);
  }
}

// Add time boost for combo
function addTimeBoost() {
  // Add 10 seconds to timer
  let timerText = document.getElementById('game-timer').textContent;
  let parts = timerText.split(':');
  let seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]) + 10;
  let minutes = Math.floor(seconds / 60);
  let secs = seconds % 60;
  document.getElementById('game-timer').textContent = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  showComboMessage('Time Boost! +10s');
}

// Add points boost for combo
function addPointsBoost() {
  score += 3;
  showComboMessage('Bonus! +3 Points');
  updateScore();
}

// Remove an X for combo
function removeXBoost() {
  if (misses > 0) {
    misses--;
    showComboMessage('Mistake Removed!');
    updateMisses();
  } else {
    showComboMessage('No X to remove!');
  }
}

// Show combo message
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

// Show an X on the bucket when a drop is dragged to the wrong bucket
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
  setTimeout(() => xMark.remove(), 1200); // Remove after 1.2 seconds
}

// Show an X at the spot where a drop was missed (fell to the ground)
function showXAtDrop(drop) {
  const xMark = document.createElement('div');
  xMark.textContent = '❌';
  xMark.style.position = 'absolute';
  // Place X at the bottom of the drop's last position
  xMark.style.left = drop.style.left;
  xMark.style.top = `${window.innerHeight - 180}px`; // Near ground
  xMark.style.fontSize = '2.5rem';
  xMark.style.color = '#f5402c';
  xMark.style.pointerEvents = 'none';
  xMark.style.zIndex = '50';
  gameScreen.appendChild(xMark);
  setTimeout(() => xMark.remove(), 1200); // Remove after 1.2 seconds
}

// Handle wrong bucket
function dropWrong(drop) {
  misses++;
  combo = 0;
  updateMisses();
  // Play buzzer sound
  buzzerAudio.currentTime = 0;
  buzzerAudio.play();
  // Show X on the wrong bucket
  // Find which bucket this drop was dropped on
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

// Handle missed drop (hit ground)
function dropMissed(drop) {
  misses++;
  combo = 0;
  updateMisses();
  // Play buzzer sound
  buzzerAudio.currentTime = 0;
  buzzerAudio.play();
  // Show X at the spot where the drop fell
  showXAtDrop(drop);
  drop.remove();
  if (misses >= maxMisses) {
    endGame(false);
  }
}

// Update score display
function updateScore() {
  if (scoreDisplay) scoreDisplay.textContent = score;
}

// Update Xs for misses
function updateMisses() {
  if (xDisplay) {
    xDisplay.textContent = '❌'.repeat(misses);
    // If player has 3 or more Xs, center the Xs more visually
    if (misses >= 3) {
      xDisplay.style.left = '50%';
      xDisplay.style.transform = 'translateX(-50%)';
      xDisplay.style.fontSize = '2.5rem';
      xDisplay.style.top = '120px';
    } else {
      // Reset to default position and style for fewer than 3 Xs
      xDisplay.style.left = '50%';
      xDisplay.style.transform = 'translateX(-50%)';
      xDisplay.style.fontSize = '2rem';
      xDisplay.style.top = '80px';
    }
  }
}

// --- GAME LOOP ---

// Start the rain with several drops at a time, but not too many
function startRain() {
  gameActive = true;
  // Instead of just one drop per interval, drop 2-4 at a time
  rainInterval = setInterval(() => {
    // Pick a random number of drops each interval (2, 3, or 4)
    const numDrops = Math.floor(Math.random() * 3) + 2; // 2 to 4 drops
    for (let i = 0; i < numDrops; i++) {
      createRainDrop();
    }
  }, rainFrequency);
}

// Stop all rain drops and intervals
function stopRain() {
  clearInterval(rainInterval);
  clearInterval(weatherInterval);
  gameActive = false;
  // Remove all rain drops
  document.querySelectorAll('.rain-drop').forEach(drop => drop.remove());
}

// --- LEVEL/DIFFICULTY LOGIC ---
function setLevel(lvl) {
  level = lvl;
  // Rain falls faster as level increases, but not too fast
  rainSpeed = Math.max(900, 2500 - level * 250); // Minimum 900ms
  // Drops appear more frequently as level increases, but not too fast
  rainFrequency = Math.max(400, 1200 - level * 120); // Minimum 400ms
  pointsToWin = 15 + level * 5; // More points needed for higher levels
}

// --- END GAME LOGIC ---
function endGame(win) {
  stopRain();
  clearInterval(timerInterval);
  clearInterval(weatherInterval);
  // Show message overlay
  messageOverlay.classList.remove('hidden');
  messageOverlay.style.backgroundColor = win ? 'rgba(76,203,83,0.85)' : 'rgba(245,64,44,0.85)';
  messageOverlay.textContent = win
    ? `🎉 You Win! Score: ${score}`
    : `Game Over! You got ${misses} X's.`;
  setTimeout(() => {
    // Reset game after 3 seconds
    messageOverlay.classList.add('hidden');
    resetGame();
  }, 3000);
}

// --- RESET GAME ---
function resetGame() {
  score = 0;
  misses = 0;
  combo = 0;
  level = 1;
  weather = 'normal';
  updateScore();
  updateMisses();
  if (scoreDisplay) scoreDisplay.textContent = '0';
  // Remove all rain drops
  document.querySelectorAll('.rain-drop').forEach(drop => drop.remove());
}

// --- START GAME AFTER CHARITY WATER MESSAGE DISAPPEARS ---
function startGameAfterMessage() {
  resetGame();
  setLevel(level); // Start at current level
  startWeatherChanges();
  startGameTimerAndRain(); // Start timer and rain together
}

// When the start button is clicked, show the game screen and the message overlay
if (startBtn && messageOverlay) {
  startBtn.onclick = function() {
    // Hide the starter screen
    document.getElementById('starter-screen').classList.add('hidden');
    // Show the game screen
    document.getElementById('game-screen').classList.remove('hidden');
    // Show the message overlay on the game screen
    messageOverlay.classList.remove('hidden');

    // Wait 15 seconds, then hide the message and start the game
    setTimeout(function() {
      // Hide the message overlay
      messageOverlay.textContent = '';
      messageOverlay.style.backgroundColor = 'transparent';
      messageOverlay.classList.add('hidden');
      // Now the game can start!
      console.log('Game started!');
      // Start the game timer
      startGameTimer();
      // Set game screen background to normal at game start
      currentWeatherType = 'normal';
      updateWeatherBackground(currentWeatherType);
      // Start the timer and rain drop game after the charity message disappears
      startGameAfterMessage();
    }, 15000); // 15000 milliseconds = 15 seconds
  };
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
  // Remove all rain drops
  document.querySelectorAll('.rain-drop').forEach(drop => drop.remove());
}

// --- START GAME AFTER CHARITY WATER MESSAGE DISAPPEARS ---
function startGameAfterMessage() {
  resetGame();
  setLevel(level); // Start at current level
  startWeatherChanges();
  startGameTimerAndRain(); // Start timer and rain together
}

// When the start button is clicked, show the game screen and the message overlay
if (startBtn && messageOverlay) {
  startBtn.onclick = function()  
  {
    // Hide the starter screen
    document.getElementById('starter-screen').classList.add('hidden');
    // Show the game screen
    document.getElementById('game-screen').classList.remove('hidden');
    // Show the message overlay on the game screen
    messageOverlay.classList.remove('hidden');

    // Wait 15 seconds, then hide the message and start the game
    setTimeout(function() {
      // Hide the message overlay
      //this hides the message overlay after 15 seconds
      messageOverlay.textContent = ''; //clear any text in the overlay
      messageOverlay.style.backgroundColor = 'transparent';//make the background transparent
      messageOverlay.classList.add('hidden');
      // Now the game can start!
      // For beginners, you might just log to the console:
      console.log('Game started!');
      // Start the game timer
      startGameTimer();
      // Example: show a message on the page
      const message = document.createElement('div');
      message.textContent = 'The game has started';
      document.body.appendChild(message);

      // Set game screen background to normal at game start
      currentWeatherType = 'normal';
      updateWeatherBackground(currentWeatherType);

      // Start the timer and rain drop game after the charity message disappears
      startGameAfterMessage();
    }, 15000); // 15000 milliseconds = 15 seconds
  };
}
