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
// Move Xs further down to make more space for weather message
xDisplay.style.position = 'absolute';
xDisplay.style.top = '92px'; // moved further down
xDisplay.style.left = '50%';
xDisplay.style.transform = 'translateX(-50%)';
xDisplay.style.fontSize = '2rem';
xDisplay.style.color = '#f5402c';
xDisplay.style.zIndex = '20';
gameScreen && gameScreen.appendChild(xDisplay);

// --- 2. GAME STATE VARIABLES ---

// Set a shorter game time for a prototype (90 seconds)
let timeLeft = 90; // 1.5 minutes for a quick prototype game
let timerInterval;
let rainInterval;
let weatherInterval;

let gameActive = false;
let score = 0;
let misses = 0;

// Make rain a bit faster and more frequent as levels go up
let rainSpeed = 2200;      // How fast drops fall (ms)
let rainFrequency = 1100;  // How often drops appear (ms)
let pointsToWin = 25; // Game ends at 25 points
let level = 1;
let combo = 0;

// Set different combo thresholds for each boost
const comboTimeBoost = 4;    // Every 4 in a row: time boost
const comboPointsBoost = 7;  // Every 7 in a row: points boost
const comboXBoost = 10;      // Every 10 in a row: remove X

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
  timerDisplay.textContent = '1:30';
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      clearInterval(rainInterval);
      timerDisplay.textContent = '0:00';
      // You can add more logic here for when the timer ends
    }
    timeLeft--;
  }, 1000);
}

function startGameTimerAndRain() {
  timeLeft = 90;
  timerDisplay.textContent = '1:30';
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
  // Weather changes a bit more often as level increases, but not too fast
  let weatherChangeInterval = Math.max(3500, 9000 - level * 800);
  weatherInterval = setInterval(() => {
    const weatherTypes = ['normal', 'storm', 'sunny', 'random'];
    let newWeatherType;
    do {
      newWeatherType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    } while (newWeatherType === currentWeatherType);
    currentWeatherType = newWeatherType;
    updateWeatherBackground(currentWeatherType);

    // --- Adjust rain speed based on weather ---
    // If weather is not normal, make rain fall a little faster (but not too hard)
    if (currentWeatherType !== 'normal') {
      // Subtract 120ms for a small challenge, but keep it playable for beginners
      rainSpeed = Math.max(900, 2200 - (level - 1) * 200 - 120);
    } else {
      // Normal speed for the current level
      rainSpeed = Math.max(900, 2200 - (level - 1) * 200);
    }

    // --- Show a weather message at the top of the game screen ---
    // Remove any previous weather message
    let oldMsg = document.getElementById('weather-message');
    if (oldMsg) oldMsg.remove();

    // Pick a message based on the weather type
    let weatherMsg = '';
    if (currentWeatherType === 'storm') {
      weatherMsg = 'Warning: Thunder Storm! Watch out for tricky drops!';
    } else if (currentWeatherType === 'sunny') {
      weatherMsg = 'Sunny skies! Clean water is easier to spot!';
    } else if (currentWeatherType === 'random') {
      weatherMsg = 'Surprise Weather! Anything can happen!';
    } else {
      weatherMsg = 'Normal weather. Stay focused!';
    }

    // Create and show the weather message
    const msgDiv = document.createElement('div');
    msgDiv.id = 'weather-message';
    msgDiv.textContent = weatherMsg;
    // Place weather message at the very top
    msgDiv.style.position = 'absolute';
    msgDiv.style.top = '12px';
    msgDiv.style.left = '50%';
    msgDiv.style.transform = 'translateX(-50%)';
    msgDiv.style.fontSize = '1.55rem';
    msgDiv.style.fontWeight = 'bold';
    msgDiv.style.color = '#fff';
    msgDiv.style.background = 'rgba(44, 62, 80, 0.88)';
    msgDiv.style.borderRadius = '12px';
    msgDiv.style.padding = '12px 28px';
    msgDiv.style.zIndex = '100';
    msgDiv.style.boxShadow = '0 2px 8px #0002';
    msgDiv.style.letterSpacing = '0.5px';
    msgDiv.style.textAlign = 'center';
    msgDiv.style.fontFamily = 'Segoe UI, Arial, sans-serif';
    msgDiv.style.pointerEvents = 'none';
    msgDiv.style.maxWidth = '92vw';
    msgDiv.style.opacity = '0.98';
    if (window.innerWidth < 600) {
      msgDiv.style.fontSize = '1.18rem';
      msgDiv.style.padding = '8px 10px';
      msgDiv.style.top = '6px';
    }
    setTimeout(() => {
      msgDiv.remove();
    }, 4000);
    gameScreen.appendChild(msgDiv);

    // Only change rain drops if the weather is NOT normal
    if (currentWeatherType !== 'normal') {
      const drops = document.querySelectorAll('.rain-drop');
      drops.forEach(drop => {
        if (Math.random() < 0.5) {
          // Get the new type for this drop
          const currentType = drop.dataset.type;
          // Pick a new type different from the current one
          const possibleTypes = rainTypes.filter(rt => rt.type !== currentType);
          const newTypeObj = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
          drop.dataset.type = newTypeObj.type;

          // Set the correct color for the new type
          const newColor = getRainDropColor(newTypeObj.type);

          // --- Add a simple detail (like a stripe or dot) based on type ---
          let detailSvg = '';
          if (newTypeObj.type === 'clean') {
            // Clean: white highlight stripe
            detailSvg = `<rect x="22" y="10" width="6" height="22" rx="3" fill="#fff" fill-opacity="0.5" />`;
          } else if (newTypeObj.type === 'dirty') {
            // Dirty: brown dot
            detailSvg = `<circle cx="24" cy="28" r="4" fill="#8d6e4a" fill-opacity="0.7" />`;
          } else if (newTypeObj.type === 'unknown') {
            // Unknown: gray swirl
            detailSvg = `<path d="M18 24 Q22 28 18 32 Q14 36 18 40" stroke="#b0b7c6" stroke-width="2" fill="none" />`;
          }

          // Update the SVG to match the new type and detail
          const svgDiv = drop.children[1];
          if (svgDiv) {
            svgDiv.innerHTML = `
              <svg width="60" height="80" viewBox="0 0 36 48" style="display:block; pointer-events:none;">
                <path d="M18 4
                  C18 4, 4 24, 4 34
                  a14 14 0 0 0 28 0
                  C32 24, 18 4, 18 4
                  Z"
                  fill="${newColor}" stroke="#1a1a1a" stroke-width="2"/>
                <ellipse cx="13" cy="20" rx="5" ry="13" fill="#fff" fill-opacity="0.35" />
                ${detailSvg}
              </svg>
            `;
          }
          // Update the glow color as well
          const glowDiv = drop.children[0];
          if (glowDiv) {
            glowDiv.style.background = newColor;
          }
        }
      });
    }

    // Randomly shuffle the meaning of rain drop types (color mapping)
    const types = ['clean', 'dirty', 'unknown'];
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    const numToChange = Math.random() < 0.5 ? 1 : 2;
    const toChange = types.slice(0, numToChange);

    let newMap = { ...rainColorMap };
    toChange.forEach(type => {
      const otherColors = types.filter(t => t !== rainColorMap[type]);
      newMap[type] = otherColors[Math.floor(Math.random() * otherColors.length)];
    });

    const colorSet = new Set(Object.values(newMap));
    if (colorSet.size === 3) {
      rainColorMap = newMap;
      // No combo message here, weather message is shown instead
    }
    // else: no message, just weather message
  }, weatherChangeInterval);
}

// --- Make sure drops are reset properly when the game is reset ---
function resetGame() {
  // Reset score and timer for a new game
  // Reset for prototype values
  score = 0;
  misses = 0;
  combo = 0;
  level = 1;
  weather = 'normal';
  timeLeft = 90;
  pointsToWin = 25;
  rainSpeed = 2200;
  rainFrequency = 1100;
  updateScore();
  updateMisses();
  if (scoreDisplay) scoreDisplay.textContent = '0';
  if (timerDisplay) timerDisplay.textContent = '1:30';
  // Set background to normal while charity message is on display
  updateWeatherBackground('normal');
  document.querySelectorAll('.rain-drop').forEach(drop => drop.remove());

  // Always reset rainColorMap to default (no color switching)
  rainColorMap = {
    clean: 'clean',
    dirty: 'dirty',
    unknown: 'unknown'
  };
  // Set currentWeatherType to normal so drops don't switch colors
  currentWeatherType = 'normal';
  // Remove all rain drops from the screen
  document.querySelectorAll('.rain-drop').forEach(drop => drop.remove());
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
  // Add a simple visual detail for each type
  let detailSvg = '';
  if (rainType.type === 'clean') {
    // Clean: white highlight stripe
    detailSvg = `<rect x="22" y="10" width="6" height="22" rx="3" fill="#fff" fill-opacity="0.5" />`;
  } else if (rainType.type === 'dirty') {
    // Dirty: brown dot
    detailSvg = `<circle cx="24" cy="28" r="4" fill="#8d6e4a" fill-opacity="0.7" />`;
  } else if (rainType.type === 'unknown') {
    // Unknown: gray swirl
    detailSvg = `<path d="M18 24 Q22 28 18 32 Q14 36 18 40" stroke="#b0b7c6" stroke-width="2" fill="none" />`;
  }
  svg.innerHTML = `
    <svg width="60" height="80" viewBox="0 0 36 48" style="display:block; pointer-events:none;">
      <path d="M18 4
        C18 4, 4 24, 4 34
        a14 14 0 0 0 28 0
        C32 24, 18 4, 18 4
        Z"
        fill="${color}" stroke="#1a1a1a" stroke-width="2"/>
      <ellipse cx="13" cy="20" rx="5" ry="13" fill="#fff" fill-opacity="0.35" />
      ${detailSvg}
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
  // Make rain drops fall a bit faster and more often as level increases
  // (for challenge, but not impossible)
  let speed = Math.max(900, rainSpeed - (level - 1) * 200);
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

    // Only count as missed if the drop reaches the ground and was NOT dropped by the player
    if (percent < 1) {
      drop._falling = requestAnimationFrame(fall);
    } else {
      drop._falling = null;
      // Only call dropMissed if the drop is still in the DOM (not already removed by drag/drop)
      if (document.body.contains(drop)) {
        // Only count as missed if the drop is NOT inside a bucket or on a name tag
        // We'll check if the drop overlaps any bucket at the end of its fall
        let missed = true;
        const buckets = document.querySelectorAll('.game-screen .bucket');
        const dropRect = drop.getBoundingClientRect();
        buckets.forEach(bucket => {
          const rect = bucket.getBoundingClientRect();
          if (
            dropRect.left + dropRect.width / 2 > rect.left &&
            dropRect.left + dropRect.width / 2 < rect.right &&
            dropRect.top + dropRect.height / 2 > rect.top &&
            dropRect.top + dropRect.height / 2 < rect.bottom
          ) {
            missed = false;
          }
        });
        // Also check for name tag (sign)
        const sign = document.querySelector('.sign');
        if (sign) {
          const signRect = sign.getBoundingClientRect();
          if (
            dropRect.left + dropRect.width / 2 > signRect.left &&
            dropRect.left + dropRect.width / 2 < signRect.right &&
            dropRect.top + dropRect.height / 2 > signRect.top &&
            dropRect.top + dropRect.height / 2 < signRect.bottom
          ) {
            missed = false;
          }
        }
        // Only call dropMissed if not over a bucket or sign
        if (missed) {
          dropMissed(drop);
        } else {
          // If it lands on a bucket or sign, just remove it (no penalty)
          drop.remove();
        }
      }
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
      // Only check for bucket drop, do not call dropMissed here
      checkDropInBucket(drop, true);
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
      checkDropInBucket(drop, true);
    };
  };

  drop.onclick = function() {
    // For beginners: show a message when clicked
    // alert(`You clicked a ${drop.dataset.type} drop! Try dragging it to a bucket.`);
    // You can show a message in the UI instead, or just do nothing.
  };
}

// Only allow scoring if the drop is actually inside a bucket when released by the player
function checkDropInBucket(drop, isPlayerDrop) {
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
  // Only count as missed if the drop was not placed in a bucket and was dropped by the player
  if (!placed && isPlayerDrop) {
    dropMissed(drop);
  }
}

// --- 9. SOUND EFFECTS ---

// Use royalty-free audio that does not return 403 errors.
// These are short, simple sounds from public domain sources.
const buzzerAudio = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b6e6e7.mp3'); // Short error beep
const bellAudio = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b6e6e8.mp3');   // Short bell sound

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
  // Combo boosts: each has its own threshold
  if (combo > 0 && combo % comboTimeBoost === 0) {
    addTimeBoost();
  } else if (combo > 0 && combo % comboPointsBoost === 0) {
    addPointsBoost();
  } else if (combo > 0 && combo % comboXBoost === 0) {
    removeXBoost();
  }

  drop.remove();
  // End the game when the player reaches the prototype win score
  if (score >= pointsToWin) {
    endGame(true);
  }
}

function addTimeBoost() {
  // Get the timer before the boost
  let timerText = document.getElementById('game-timer').textContent;
  let parts = timerText.split(':');
  let seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);

  // Remove any previous time boost visual
  let oldBoost = document.getElementById('timer-boost-visual');
  if (oldBoost) oldBoost.remove();

  // Place time boost visual below weather message
  const boostDiv = document.createElement('span');
  boostDiv.id = 'timer-boost-visual';
  boostDiv.style.position = 'absolute';
  boostDiv.style.top = '60px';
  boostDiv.style.left = '50%';
  boostDiv.style.transform = 'translateX(-50%)';
  boostDiv.style.fontSize = '2.1rem';
  boostDiv.style.fontWeight = 'bold';
  boostDiv.style.color = '#159A48';
  boostDiv.style.display = 'inline-flex';
  boostDiv.style.alignItems = 'center';
  boostDiv.style.transition = 'opacity 0.3s';
  boostDiv.style.background = 'rgba(255,255,255,0.92)';
  boostDiv.style.borderRadius = '16px';
  boostDiv.style.padding = '10px 22px';
  boostDiv.style.boxShadow = '0 2px 12px #0002';
  boostDiv.style.zIndex = '99';

  // --- Adjust vertical position if other boosts are visible ---
  if (document.getElementById('bonus-points-visual')) {
    boostDiv.style.top = '30px';
  }
  if (document.getElementById('x-boost-visual')) {
    boostDiv.style.top = '0px';
  }

  boostDiv.innerHTML = `
    <span style="font-size:2.2rem; margin-right:8px;">⏱️</span>
    <span style="margin-right:8px;">+3</span>
    <span id="timer-boost-math" style="margin-left:8px; color:#222; font-size:1.2rem;"></span>
    <span style="margin-left:12px; font-size:1rem; color:#555;">(Time Boost!)</span>
  `;

  gameScreen.appendChild(boostDiv);

  // Show the math: current time + 3, then update to new time
  const mathSpan = boostDiv.querySelector('#timer-boost-math');
  if (mathSpan) {
    let min = Math.floor(seconds / 60);
    let sec = seconds % 60;
    mathSpan.textContent = `(${min}:${sec < 10 ? '0' : ''}${sec} + 3)`;
  }

  // After 1.2 seconds, add the 3 seconds and update the timer visually
  setTimeout(() => {
    let newSeconds = seconds + 3;
    let minutes = Math.floor(newSeconds / 60);
    let secs = newSeconds % 60;
    timerDisplay.textContent = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    if (mathSpan) {
      mathSpan.textContent = `= ${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
    // Fade out the visual after a short delay
    setTimeout(() => {
      boostDiv.style.opacity = '0';
      setTimeout(() => {
        boostDiv.remove();
      }, 400);
    }, 900);
  }, 1200);
}

function addPointsBoost() {
  // Find the score tracker (where the score is displayed)
  const scoreTracker = document.querySelector('.score-tracker');
  if (!scoreTracker) return;

  // Remove any previous bonus visual if it exists
  let oldBonus = document.getElementById('bonus-points-visual');
  if (oldBonus) oldBonus.remove();

  // Place points boost visual below time boost
  const bonusDiv = document.createElement('span');
  bonusDiv.id = 'bonus-points-visual';
  bonusDiv.style.position = 'absolute';
  bonusDiv.style.top = '110px';
  bonusDiv.style.left = '50%';
  bonusDiv.style.transform = 'translateX(-50%)';
  bonusDiv.style.fontSize = '2.1rem';
  bonusDiv.style.fontWeight = 'bold';
  bonusDiv.style.color = '#2E9DF7';
  bonusDiv.style.display = 'inline-flex';
  bonusDiv.style.alignItems = 'center';
  bonusDiv.style.transition = 'opacity 0.3s';
  bonusDiv.style.background = 'rgba(255,255,255,0.92)';
  bonusDiv.style.borderRadius = '16px';
  bonusDiv.style.padding = '10px 22px';
  bonusDiv.style.boxShadow = '0 2px 12px #0002';
  bonusDiv.style.zIndex = '98';

  // --- Adjust vertical position if other boosts are visible ---
  if (document.getElementById('timer-boost-visual')) {
    bonusDiv.style.top = '110px';
  }
  if (document.getElementById('x-boost-visual')) {
    bonusDiv.style.top = '140px';
  }

  bonusDiv.innerHTML = `
    <svg width="32" height="40" viewBox="0 0 28 36" style="margin-right:8px;">
      <path d="M14 2 C14 2, 2 18, 2 26 a12 12 0 0 0 24 0 C26 18, 14 2, 14 2 Z"
        fill="#4fc3f7" stroke="#1a1a1a" stroke-width="1.5"/>
      <ellipse cx="10" cy="15" rx="3" ry="7" fill="#fff" fill-opacity="0.35" />
    </svg>
    <span style="margin-right:8px;">+5</span>
    <span id="bonus-score-math" style="margin-left:8px; color:#222; font-size:1.2rem;"></span>
    <span style="margin-left:12px; font-size:1rem; color:#555;">(Bonus Combo!)</span>
  `;

  gameScreen.appendChild(bonusDiv);

  const mathSpan = bonusDiv.querySelector('#bonus-score-math');
  if (mathSpan) {
    mathSpan.textContent = `(${score} + 5)`;
  }

  // After 1.2 seconds, add the 5 points and update the score visually
  setTimeout(() => {
    score += 5;
    updateScore();
    if (mathSpan) {
      mathSpan.textContent = `= ${score}`;
    }
    setTimeout(() => {
      bonusDiv.style.opacity = '0';
      setTimeout(() => {
        bonusDiv.remove();
      }, 400);
    }, 900);
  }, 1200);
}

function removeXBoost() {
  const xDisplay = document.getElementById('misses-display');
  if (!xDisplay) return;

  let oldX = document.getElementById('x-boost-visual');
  if (oldX) oldX.remove();

  // Place X boost visual below points boost
  const xDiv = document.createElement('span');
  xDiv.id = 'x-boost-visual';
  xDiv.style.position = 'absolute';
  xDiv.style.top = '160px';
  xDiv.style.left = '50%';
  xDiv.style.transform = 'translateX(-50%)';
  xDiv.style.fontSize = '2.1rem';
  xDiv.style.fontWeight = 'bold';
  xDiv.style.color = '#F5402C';
  xDiv.style.display = 'inline-flex';
  xDiv.style.alignItems = 'center';
  xDiv.style.transition = 'opacity 0.3s';
  xDiv.style.background = 'rgba(255,255,255,0.92)';
  xDiv.style.borderRadius = '16px';
  xDiv.style.padding = '10px 22px';
  xDiv.style.boxShadow = '0 2px 12px #0002';
  xDiv.style.zIndex = '97';

  // --- Adjust vertical position if other boosts are visible ---
  if (document.getElementById('timer-boost-visual') && document.getElementById('bonus-points-visual')) {
    xDiv.style.top = '200px';
  } else if (document.getElementById('timer-boost-visual') || document.getElementById('bonus-points-visual')) {
    xDiv.style.top = '180px';
  }

  xDiv.innerHTML = `
    <span style="font-size:2.2rem; margin-right:8px;">❌</span>
    <span style="margin-right:8px;">-1</span>
    <span style="margin-left:8px; color:#222; font-size:1.2rem;">(Mistake Removed!)</span>
  `;

  gameScreen.appendChild(xDiv);

  // After 1.2 seconds, remove an X if the player has any,
  // but do NOT end the game here even if misses drops below 3.
  setTimeout(() => {
    if (misses > 0) {
      misses--; // Actually remove an X
      updateMisses();
    }
    setTimeout(() => {
      xDiv.style.opacity = '0';
      setTimeout(() => {
        xDiv.remove();
      }, 400);
    }, 900);
  }, 1200);
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
      xDisplay.style.top = '102px'; // was 120px, now a bit lower
    } else {
      xDisplay.style.left = '50%';
      xDisplay.style.transform = 'translateX(-50%)';
      xDisplay.style.fontSize = '2rem';
      xDisplay.style.top = '92px'; // was 80px/68px, now a bit lower
    }
  }
}

// --- 14. GAME LOOP & LEVEL ---

function startRain() {
  gameActive = true;
  // As level increases, more drops and faster
  let freq = Math.max(400, rainFrequency - (level - 1) * 100);
  rainInterval = setInterval(() => {
    // More drops per interval as level increases
    let numDrops = Math.min(5, 2 + Math.floor(level / 2));
    for (let i = 0; i < numDrops; i++) {
      createRainDrop();
    }
  }, freq);
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

  // Show overlay if player wins
  if (win) {
    let winOverlay = document.getElementById('win-overlay');
    if (!winOverlay) {
      winOverlay = document.createElement('div');
      winOverlay.id = 'win-overlay';
      winOverlay.style.position = 'fixed';
      winOverlay.style.top = '0';
      winOverlay.style.left = '0';
      winOverlay.style.width = '100vw';
      winOverlay.style.height = '100vh';
      winOverlay.style.background = 'rgba(179,224,252,0.92)';
      winOverlay.style.display = 'flex';
      winOverlay.style.flexDirection = 'column';
      winOverlay.style.alignItems = 'center';
      winOverlay.style.justifyContent = 'center';
      winOverlay.style.zIndex = '200';
      winOverlay.innerHTML = `
        <div style="background:#fffbe9; border-radius:22px; max-width:500px; min-width:320px; min-height:440px; padding:38px 32px 38px 32px; box-shadow:0 8px 32px #0003; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; border: 4px solid #4fc3f7;">
          <h2 style="color:#159A48; font-size:2.2rem; margin-bottom:10px; margin-top:0; letter-spacing:1px; text-align:center;">Congratulations!</h2>
          <div style="font-size:1.45rem; color:#2E9DF7; font-weight:bold; margin-bottom:28px; margin-top:0; text-align:center;">Thx 4 playing</div>
          <img src="img/charity_water_logo_white2.jpg" alt="charity: water logo" style="height:54px; margin-bottom:28px; margin-top:0; background:#222; border-radius:8px;">
          <div style="font-size:1.13rem; color:#159A48; margin-bottom:36px; margin-top:0; line-height:1.5;">
            "Every drop brings hope. When we care for others, we help the world shine a little brighter.<br><br>
            Thank you for showing empathy and making a difference with charity: water."
          </div>
          <div style="display:flex; flex-direction:row; justify-content:center; gap:32px; margin-top:10px;">
            <button id="play-again-btn" style="font-size:1.2rem; padding:12px 36px; border-radius:22px; border:none; background:#2E9DF7; color:#fff; font-weight:bold; cursor:pointer; box-shadow:0 2px 8px #2E9DF766;">Play Again</button>
            <button id="quit-btn" style="font-size:1.1rem; padding:12px 36px; border-radius:22px; border:none; background:#F5402C; color:#fff; font-weight:bold; cursor:pointer; box-shadow:0 2px 8px #F5402C66;">Quit</button>
          </div>
        </div>
      `;
      document.body.appendChild(winOverlay);
    } else {
      winOverlay.style.display = 'flex';
    }
    document.getElementById('play-again-btn').onclick = function() {
      winOverlay.style.display = 'none';
      resetGame();
      setLevel(level);
      startWeatherChanges();
      startGameTimerAndRain();
      document.getElementById('game-screen').classList.remove('hidden');
      document.getElementById('starter-screen').classList.add('hidden');
    };
    document.getElementById('quit-btn').onclick = function() {
      winOverlay.style.display = 'none';
      resetGame();
      document.getElementById('starter-screen').classList.remove('hidden');
      document.getElementById('game-screen').classList.add('hidden');
    };
    return;
  }

  // Show overlay if player loses (gets 3 Xs)
  if (!win) {
    let loseOverlay = document.getElementById('lose-overlay');
    if (!loseOverlay) {
      loseOverlay = document.createElement('div');
      loseOverlay.id = 'lose-overlay';
      loseOverlay.style.position = 'fixed';
      loseOverlay.style.top = '0';
      loseOverlay.style.left = '0';
      loseOverlay.style.width = '100vw';
      loseOverlay.style.height = '100vh';
      loseOverlay.style.background = 'rgba(179,224,252,0.92)';
      loseOverlay.style.display = 'flex';
      loseOverlay.style.flexDirection = 'column';
      loseOverlay.style.alignItems = 'center';
      loseOverlay.style.justifyContent = 'center';
      loseOverlay.style.zIndex = '200';
      loseOverlay.innerHTML = `
        <div style="background:#fffbe9; border-radius:22px; max-width:500px; min-width:320px; min-height:440px; padding:38px 32px 38px 32px; box-shadow:0 8px 32px #0003; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; border: 4px solid #4fc3f7;">
          <h2 style="color:#F5402C; font-size:2.2rem; margin-bottom:10px; margin-top:0; letter-spacing:1px; text-align:center;">Try again?</h2>
          <img src="img/charity_water_logo_white2.jpg" alt="charity: water logo" style="height:54px; margin-bottom:28px; margin-top:18px; background:#222; border-radius:8px;">
          <div style="font-size:1.13rem; color:#159A48; margin-bottom:36px; margin-top:0; line-height:1.5;">
            "Don't give up! Every try brings us closer to a world where everyone has clean water.<br><br>
            Your empathy and hope can change lives. Let's make a difference together!"
          </div>
          <div style="display:flex; flex-direction:row; justify-content:center; gap:32px; margin-top:10px;">
            <button id="play-again-btn-lose" style="font-size:1.2rem; padding:12px 36px; border-radius:22px; border:none; background:#2E9DF7; color:#fff; font-weight:bold; cursor:pointer; box-shadow:0 2px 8px #2E9DF766;">Play Again</button>
            <button id="quit-btn-lose" style="font-size:1.1rem; padding:12px 36px; border-radius:22px; border:none; background:#F5402C; color:#fff; font-weight:bold; cursor:pointer; box-shadow:0 2px 8px #F5402C66;">Quit</button>
          </div>
        </div>
      `;
      document.body.appendChild(loseOverlay);
    } else {
      loseOverlay.style.display = 'flex';
    }
    document.getElementById('play-again-btn-lose').onclick = function() {
      loseOverlay.style.display = 'none';
      resetGame();
      setLevel(level);
      startWeatherChanges();
      startGameTimerAndRain();
      document.getElementById('game-screen').classList.remove('hidden');
      document.getElementById('starter-screen').classList.add('hidden');
    };
    document.getElementById('quit-btn-lose').onclick = function() {
      loseOverlay.style.display = 'none';
      resetGame();
      document.getElementById('starter-screen').classList.remove('hidden');
      document.getElementById('game-screen').classList.add('hidden');
    };
    return;
  }

  // Reset the game after a short delay
  setTimeout(() => {
    resetGame();
    document.getElementById('starter-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
  }, 2000);
}

// --- 16. GAME START HANDLING ---

function startGameAfterMessage() {
  // Always reset game state and background before starting a new game
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
    // --- Reset game state and background while overlay is visible ---
    resetGame();
    // Wait 15 seconds, then hide the message and start the game
    setTimeout(function() {
      // Hide the message overlay (but keep its content for next time)
      messageOverlay.classList.add('hidden');
      // Set game screen background to normal at game start
      currentWeatherType = 'normal';
      updateWeatherBackground(currentWeatherType);
      // Always reset game state and background before starting
      resetGame();
      startGameAfterMessage();
    }, 15000); // 15000 milliseconds = 15 seconds
  };
}
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
    // --- Reset game state and background while overlay is visible ---
    resetGame();
    // Wait 15 seconds, then hide the message and start the game
    setTimeout(function() {
      // Hide the message overlay (but keep its content for next time)
      messageOverlay.classList.add('hidden');
      // Set game screen background to normal at game start
      currentWeatherType = 'normal';
      updateWeatherBackground(currentWeatherType);
      // Always reset game state and background before starting
      resetGame();
      startGameAfterMessage();
    }, 15000); // 15000 milliseconds = 15 seconds
  };
}
