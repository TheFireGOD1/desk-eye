// DeskEye Main Renderer Process
// Note: We can't use require() in renderer with contextIsolation
// So we'll implement the detection logic directly here

// State management
let state = {
  isMonitoring: false,
  settings: null,
  webcamStream: null,
  animationFrameId: null,
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
  startTime: null
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
  
  // Simulate blink detection with spacebar or click
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && state.isMonitoring) {
      e.preventDefault();
      simulateBlink();
    }
  });
  
  // Also detect blinks on video click
  elements.webcam.addEventListener('click', () => {
    if (state.isMonitoring) {
      simulateBlink();
    }
  });
  
  // Listen for monitoring state changes from main process
  window.electronAPI.onMonitoringStateChanged((isMonitoring) => {
    if (isMonitoring && !state.isMonitoring) {
      startMonitoring();
    } else if (!isMonitoring && state.isMonitoring) {
      stopMonitoring();
    }
  });
}

function simulateBlink() {
  state.lastBlinkTime = Date.now();
  state.blinkCount++;
  console.log('Blink detected! Total:', state.blinkCount);
  
  // Visual feedback
  elements.overlayCanvas.style.opacity = '0.5';
  setTimeout(() => {
    elements.overlayCanvas.style.opacity = '1';
  }, 100);
}

async function startMonitoring() {
  if (state.isMonitoring) return;
  
  try {
    console.log('Starting monitoring...');
    
    // Request camera access
    state.webcamStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });
    
    elements.webcam.srcObject = state.webcamStream;
    
    // Wait for video to be ready
    await new Promise((resolve) => {
      elements.webcam.onloadedmetadata = resolve;
    });
    
    state.isMonitoring = true;
    state.startTime = Date.now();
    state.lastBlinkTime = Date.now();
    state.blinkCount = 0;
    
    await window.electronAPI.startMonitoring();
    
    // Start processing loop
    processFrame();
    
    updateUI();
    updateCameraStatus(true);
    
    // Show instruction overlay
    const instruction = document.getElementById('blink-instruction');
    if (instruction) {
      instruction.style.display = 'block';
      // Hide after 10 seconds
      setTimeout(() => {
        instruction.style.display = 'none';
      }, 10000);
    }
    
    console.log('Monitoring started successfully');
  } catch (error) {
    console.error('Failed to start monitoring:', error);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      showError('Camera permission denied. Please allow camera access in your system settings.');
    } else {
      showError('Failed to access camera: ' + error.message);
    }
  }
}

async function stopMonitoring() {
  if (!state.isMonitoring) return;
  
  console.log('Stopping monitoring...');
  
  state.isMonitoring = false;
  await window.electronAPI.stopMonitoring();
  
  // Stop animation loop
  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }
  
  // Stop webcam
  if (state.webcamStream) {
    state.webcamStream.getTracks().forEach(track => track.stop());
    state.webcamStream = null;
    elements.webcam.srcObject = null;
  }
  
  updateUI();
  updateCameraStatus(false);
  
  console.log('Monitoring stopped');
}

async function processFrame() {
  if (!state.isMonitoring) return;
  
  try {
    const now = Date.now();
    const timeSinceLastBlink = now - state.lastBlinkTime;
    const elapsedMinutes = (now - state.startTime) / 60000;
    
    // Calculate blink rate (blinks per minute)
    const blinkRate = elapsedMinutes > 0 ? state.blinkCount / elapsedMinutes : 0;
    
    // Detect strain based on time since last blink
    // If no blink for 5+ seconds, trigger strain warning
    let strainProb = 0;
    
    if (timeSinceLastBlink > 5000) {
      // No blink for 5+ seconds = HIGH STRAIN
      strainProb = 0.8;
    } else if (timeSinceLastBlink > 3000) {
      // No blink for 3-5 seconds = MODERATE STRAIN
      strainProb = 0.5;
    } else if (blinkRate < 10) {
      // Low blink rate = MILD STRAIN
      strainProb = 0.4;
    } else {
      // Normal
      strainProb = 0.2;
    }
    
    // Update metrics
    state.metrics.blinkRate = blinkRate;
    state.metrics.currentStrainProb = strainProb;
    state.metrics.healthScore = Math.round((1 - strainProb) * 100);
    
    // Determine strain level and update UI
    if (strainProb < 0.4) {
      state.metrics.strainLevel = 'Low';
      updateStatusIndicator('ok', 'Eyes Looking Good! 😊', 'Keep up the healthy habits');
    } else if (strainProb < 0.7) {
      state.metrics.strainLevel = 'Moderate';
      updateStatusIndicator('caution', 'Take Care! 😐', 'Consider taking a break soon');
    } else {
      state.metrics.strainLevel = 'High';
      updateStatusIndicator('break', 'Break Time! 😫', 'Your eyes need rest now');
      
      // Trigger break if not already in progress
      if (!state.breakInProgress && !state.settings?.doNotDisturb) {
        const timeSinceLastBreak = Date.now() - state.lastBreakTimestamp;
        // Only trigger if at least 2 minutes since last break
        if (timeSinceLastBreak > 2 * 60 * 1000) {
          triggerBreakNotification();
        }
      }
    }
    
    // Update UI
    updateMetricsDisplay();
    
    // Save metric to database (throttled - every 15 seconds)
    if (!state.lastSaveTime || Date.now() - state.lastSaveTime > 15000) {
      await saveMetric({
        blinkRate,
        avgEAR: 0.25,
        strainProb
      });
      state.lastSaveTime = Date.now();
    }
  } catch (error) {
    console.error('Frame processing error:', error);
  }
  
  // Schedule next frame
  const framerate = state.settings?.framerate || 10;
  const delay = 1000 / framerate;
  
  setTimeout(() => {
    state.animationFrameId = requestAnimationFrame(processFrame);
  }, delay);
}

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
