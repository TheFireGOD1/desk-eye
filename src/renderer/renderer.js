// DeskEye Main Renderer Process with Real Blink Detection

// Eye landmark indices for MediaPipe Face Mesh
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

// State management
let state = {
  isMonitoring: false,
  settings: null,
  faceMesh: null,
  camera: null,
  canvasCtx: null,
  metrics: {
    blinkRate: 0,
    lastBreakTime: null,
    healthScore: 100,
    strainLevel: 'Low',
    currentStrainProb: 0
  },
  breakInProgress: false,
  lastBreakTimestamp: Date.now(),
  lastBlinkTime: Date.now(),
  blinkCount: 0,
  startTime: null,
  isBlinking: false,
  earHistory: [],
  EAR_THRESHOLD: 0.21
};

// DOM Elements
const elements = {
  webcam: document.getElementById('webcam'),
  overlayCanvas: document.getElementById('overlay-canvas'),
  cameraStatus: document.getElementById('camera-status'),
  statusIndicator: document.getElementById('status-indicator'),
  statusText: document.getElementById('status-text'),
  statusMessage: document.getElementById('status-message'),
  blinkRate: document.getElementById('blink-rate'),
  lastBreak: document.getElementById('last-break'),
  healthScore: document.getElementById('health-score'),
  strainLevel: document.getElementById('strain-level'),
  startBtn: document.getElementById('start-btn'),
  stopBtn: document.getElementById('stop-btn'),
  breakBtn: document.getElementById('break-btn'),
  dashboardBtn: document.getElementById('dashboard-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  breakModal: document.getElementById('break-modal'),
  countdownNumber: document.getElementById('countdown-number'),
  countdownProgress: document.getElementById('countdown-progress'),
  skipBreakBtn: document.getElementById('skip-break-btn')
};

// Initialize
async function initialize() {
  try {
    // Load settings
    const result = await window.electronAPI.getSettings();
    state.settings = result;
    
    // Apply accessibility settings
    applyAccessibilitySettings();
    
    // Initialize pipeline
    initializePipeline();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update UI
    updateUI();
    
    console.log('DeskEye initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to initialize application');
  }
}

function applyAccessibilitySettings() {
  if (!state.settings || !state.settings.accessibility) return;
  
  const { largeFonts, highContrast } = state.settings.accessibility;
  
  if (largeFonts) {
    document.body.classList.add('large-fonts');
  }
  
  if (highContrast) {
    document.body.classList.add('high-contrast');
  }
}

function initializePipeline() {
  // Simple detection logic - we'll simulate blink detection
  // In a real implementation, you'd use MediaPipe Face Mesh here
  console.log('Pipeline initialized (simplified version)');
}

function setupEventListeners() {
  elements.startBtn.addEventListener('click', startMonitoring);
  elements.stopBtn.addEventListener('click', stopMonitoring);
  elements.breakBtn.addEventListener('click', startBreak);
  elements.dashboardBtn.addEventListener('click', openDashboard);
  elements.settingsBtn.addEventListener('click', openSettings);
  elements.skipBreakBtn.addEventListener('click', skipBreak);
  
  // Listen for monitoring state changes from main process
  window.electronAPI.onMonitoringStateChanged((isMonitoring) => {
    if (isMonitoring && !state.isMonitoring) {
      startMonitoring();
    } else if (!isMonitoring && state.isMonitoring) {
      stopMonitoring();
    }
  });
}

async function startMonitoring() {
  if (state.isMonitoring) return;
  
  try {
    console.log('Starting monitoring with real blink detection...');
    
    // Setup canvas
    state.canvasCtx = elements.overlayCanvas.getContext('2d');
    
    // Initialize MediaPipe Face Mesh
    state.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });
    
    state.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    state.faceMesh.onResults(onFaceMeshResults);
    
    // Initialize camera
    state.camera = new Camera(elements.webcam, {
      onFrame: async () => {
        if (state.faceMesh && state.isMonitoring) {
          await state.faceMesh.send({ image: elements.webcam });
        }
      },
      width: 640,
      height: 480
    });
    
    await state.camera.start();
    
    state.isMonitoring = true;
    state.startTime = Date.now();
    state.lastBlinkTime = Date.now();
    state.blinkCount = 0;
    state.earHistory = [];
    
    await window.electronAPI.startMonitoring();
    
    updateUI();
    updateCameraStatus(true);
    
    // Update instruction text
    const instruction = document.getElementById('blink-instruction');
    if (instruction) {
      instruction.innerHTML = '<p>👁️ <strong>Real blink detection active!</strong></p><p style="font-size: 0.85em; margin-top: 4px;">Don\'t blink for 5+ seconds to trigger strain warning!</p>';
      instruction.style.display = 'block';
      setTimeout(() => {
        instruction.style.display = 'none';
      }, 10000);
    }
    
    console.log('Monitoring started successfully with MediaPipe Face Mesh');
  } catch (error) {
    console.error('Failed to start monitoring:', error);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      showError('Camera permission denied. Please allow camera access in your system settings.');
    } else {
      showError('Failed to access camera: ' + error.message);
    }
  }
}

// Calculate Eye Aspect Ratio (EAR)
function calculateEAR(landmarks, eyeIndices) {
  const points = eyeIndices.map(idx => landmarks[idx]);
  
  // Vertical distances
  const v1 = euclideanDistance(points[1], points[5]);
  const v2 = euclideanDistance(points[2], points[4]);
  
  // Horizontal distance
  const h = euclideanDistance(points[0], points[3]);
  
  // EAR formula
  return (v1 + v2) / (2.0 * h);
}

function euclideanDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Handle Face Mesh results
function onFaceMeshResults(results) {
  if (!state.canvasCtx || !state.isMonitoring) return;
  
  // Set canvas size to match video
  elements.overlayCanvas.width = elements.webcam.videoWidth;
  elements.overlayCanvas.height = elements.webcam.videoHeight;
  
  // Clear canvas
  state.canvasCtx.save();
  state.canvasCtx.clearRect(0, 0, elements.overlayCanvas.width, elements.overlayCanvas.height);
  
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];
    
    // Draw eye landmarks
    drawEyeLandmarks(landmarks, LEFT_EYE, '#7C3AED');
    drawEyeLandmarks(landmarks, RIGHT_EYE, '#3B82F6');
    
    // Calculate EAR for both eyes
    const leftEAR = calculateEAR(landmarks, LEFT_EYE);
    const rightEAR = calculateEAR(landmarks, RIGHT_EYE);
    const avgEAR = (leftEAR + rightEAR) / 2;
    
    // Detect blink
    detectBlink(avgEAR);
    
    // Update metrics
    updateMetricsFromDetection();
  }
  
  state.canvasCtx.restore();
}

function drawEyeLandmarks(landmarks, eyeIndices, color) {
  state.canvasCtx.strokeStyle = color;
  state.canvasCtx.lineWidth = 2;
  state.canvasCtx.beginPath();
  
  eyeIndices.forEach((idx, i) => {
    const point = landmarks[idx];
    const x = point.x * elements.overlayCanvas.width;
    const y = point.y * elements.overlayCanvas.height;
    
    if (i === 0) {
      state.canvasCtx.moveTo(x, y);
    } else {
      state.canvasCtx.lineTo(x, y);
    }
  });
  
  state.canvasCtx.closePath();
  state.canvasCtx.stroke();
}

function detectBlink(ear) {
  const now = Date.now();
  
  if (ear < state.EAR_THRESHOLD) {
    if (!state.isBlinking) {
      state.isBlinking = true;
      state.blinkStartTime = now;
    }
  } else {
    if (state.isBlinking) {
      const blinkDuration = now - state.blinkStartTime;
      
      // Valid blink (not too long)
      if (blinkDuration < 300) {
        state.blinkCount++;
        state.lastBlinkTime = now;
        console.log('Blink detected! Total:', state.blinkCount);
      }
      
      state.isBlinking = false;
    }
  }
}

function updateMetricsFromDetection() {
  const now = Date.now();
  const timeSinceLastBlink = now - state.lastBlinkTime;
  const elapsedMinutes = (now - state.startTime) / 60000;
  
  // Calculate blink rate
  const blinkRate = elapsedMinutes > 0 ? state.blinkCount / elapsedMinutes : 0;
  
  // Calculate strain based on time since last blink
  let strainProb = 0;
  
  if (timeSinceLastBlink > 5000) {
    strainProb = 0.8; // High strain
  } else if (timeSinceLastBlink > 3000) {
    strainProb = 0.5; // Moderate strain
  } else if (blinkRate < 10) {
    strainProb = 0.4; // Mild strain
  } else {
    strainProb = 0.2; // Normal
  }
  
  // Update state
  state.metrics.blinkRate = blinkRate;
  state.metrics.currentStrainProb = strainProb;
  state.metrics.healthScore = Math.round((1 - strainProb) * 100);
  
  // Update UI based on strain level
  if (strainProb < 0.4) {
    state.metrics.strainLevel = 'Low';
    updateStatusIndicator('ok', 'Eyes Looking Good! 😊', 'Keep up the healthy habits');
  } else if (strainProb < 0.7) {
    state.metrics.strainLevel = 'Moderate';
    updateStatusIndicator('caution', 'Take Care! 😐', 'Consider taking a break soon');
  } else {
    state.metrics.strainLevel = 'High';
    updateStatusIndicator('break', 'Break Time! 😫', 'Your eyes need rest now');
    
    // Trigger break
    if (!state.breakInProgress && !state.settings?.doNotDisturb) {
      const timeSinceLastBreak = Date.now() - state.lastBreakTimestamp;
      if (timeSinceLastBreak > 2 * 60 * 1000) {
        triggerBreakNotification();
      }
    }
  }
  
  updateMetricsDisplay();
  
  // Save metrics periodically (every 15 seconds)
  if (!state.lastSaveTime || now - state.lastSaveTime > 15000) {
    saveMetric({
      blinkRate,
      avgEAR: 0.25,
      strainProb
    });
    state.lastSaveTime = now;
  }
}

async function stopMonitoring() {
  if (!state.isMonitoring) return;
  
  console.log('Stopping monitoring...');
  
  state.isMonitoring = false;
  await window.electronAPI.stopMonitoring();
  
  // Stop camera
  if (state.camera) {
    state.camera.stop();
    state.camera = null;
  }
  
  // Close face mesh
  if (state.faceMesh) {
    state.faceMesh.close();
    state.faceMesh = null;
  }
  
  // Clear canvas
  if (state.canvasCtx) {
    state.canvasCtx.clearRect(0, 0, elements.overlayCanvas.width, elements.overlayCanvas.height);
  }
  
  updateUI();
  updateCameraStatus(false);
  
  console.log('Monitoring stopped');
}

// Removed old processFrame - now using MediaPipe's onResults callback

function updateStatusIndicator(status, text, message) {
  elements.statusIndicator.className = `status-indicator status-${status}`;
  elements.statusText.textContent = text;
  elements.statusMessage.textContent = message;
  
  // Update emoji
  const emoji = status === 'ok' ? '😊' : status === 'caution' ? '😐' : '😫';
  elements.statusIndicator.querySelector('.status-emoji').textContent = emoji;
}

function updateMetricsDisplay() {
  elements.blinkRate.textContent = state.metrics.blinkRate.toFixed(1);
  elements.healthScore.textContent = state.metrics.healthScore;
  elements.strainLevel.textContent = state.metrics.strainLevel;
  
  // Update last break time
  if (state.metrics.lastBreakTime) {
    const minutes = Math.floor((Date.now() - state.metrics.lastBreakTime) / 60000);
    elements.lastBreak.textContent = minutes > 0 ? `${minutes}m ago` : 'Just now';
  } else {
    elements.lastBreak.textContent = 'Never';
  }
}

function updateCameraStatus(active) {
  if (active) {
    elements.cameraStatus.classList.add('active');
    elements.cameraStatus.querySelector('.status-text').textContent = 'Camera Active';
  } else {
    elements.cameraStatus.classList.remove('active');
    elements.cameraStatus.querySelector('.status-text').textContent = 'Camera Inactive';
  }
}

function updateUI() {
  if (state.isMonitoring) {
    elements.startBtn.style.display = 'none';
    elements.stopBtn.style.display = 'inline-flex';
    elements.breakBtn.disabled = false;
  } else {
    elements.startBtn.style.display = 'inline-flex';
    elements.stopBtn.style.display = 'none';
    elements.breakBtn.disabled = true;
    updateStatusIndicator('idle', 'Ready to Monitor', 'Click Start to begin monitoring your eye health');
  }
}

async function saveMetric(result) {
  try {
    const metric = {
      timestamp: Date.now(),
      blinkRate: result.blinkRate || 0,
      avgEAR: result.avgEAR || 0,
      strainScore: result.strainProb || 0,
      breakTaken: false
    };
    
    await window.electronAPI.saveMetric(metric);
  } catch (error) {
    console.error('Failed to save metric:', error);
  }
}

function triggerBreakNotification() {
  if (state.settings?.accessibility?.muteAudio) {
    // Silent notification only
    window.electronAPI.showNotification({
      title: 'DeskEye - Break Time!',
      body: 'Your eyes need a rest. Take a 20-second break.'
    });
  } else {
    // Play sound and show modal
    playBreakSound();
  }
  
  startBreak();
}

function playBreakSound() {
  try {
    const audio = new Audio('../audio/alert.mp3');
    audio.volume = state.settings?.soundVolume || 0.7;
    audio.play().catch(err => console.error('Audio play failed:', err));
  } catch (error) {
    console.error('Failed to play sound:', error);
  }
}

function startBreak() {
  if (state.breakInProgress) return;
  
  state.breakInProgress = true;
  elements.breakModal.classList.add('active');
  
  let timeLeft = 20;
  const circumference = 2 * Math.PI * 45; // radius = 45
  
  const interval = setInterval(() => {
    timeLeft--;
    elements.countdownNumber.textContent = timeLeft;
    
    // Update progress circle
    const offset = circumference - (timeLeft / 20) * circumference;
    elements.countdownProgress.style.strokeDashoffset = offset;
    
    if (timeLeft <= 0) {
      clearInterval(interval);
      endBreak();
    }
  }, 1000);
  
  state.breakInterval = interval;
}

function skipBreak() {
  if (state.breakInterval) {
    clearInterval(state.breakInterval);
  }
  endBreak();
}

async function endBreak() {
  state.breakInProgress = false;
  elements.breakModal.classList.remove('active');
  elements.countdownNumber.textContent = '20';
  elements.countdownProgress.style.strokeDashoffset = '0';
  
  state.lastBreakTimestamp = Date.now();
  state.metrics.lastBreakTime = Date.now();
  
  // Save break event
  try {
    await window.electronAPI.saveMetric({
      timestamp: Date.now(),
      blinkRate: state.metrics.blinkRate,
      avgEAR: 0,
      strainScore: state.metrics.currentStrainProb,
      breakTaken: true
    });
  } catch (error) {
    console.error('Failed to save break event:', error);
  }
}

function openDashboard() {
  window.electronAPI.openDashboard();
}

function openSettings() {
  window.electronAPI.openSettings();
}

function showError(message) {
  // Simple error display - could be enhanced with a proper modal
  alert(message);
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initialize);

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  if (state.isMonitoring) {
    stopMonitoring();
  }
});
