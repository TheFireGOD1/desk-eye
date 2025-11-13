// DeskEye Main Renderer Process
const FeaturePipeline = require('../pipelines/feature_pipeline');
const TFJSPipeline = require('../pipelines/tfjs_pipeline');

// State management
let state = {
  isMonitoring: false,
  currentPipeline: null,
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
  lastBreakTimestamp: Date.now()
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
  const pipelineType = state.settings?.pipeline || 'feature';
  
  if (pipelineType === 'tfjs') {
    state.currentPipeline = new TFJSPipeline(state.settings);
  } else {
    state.currentPipeline = new FeaturePipeline(state.settings);
  }
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
    
    // Initialize pipeline
    await state.currentPipeline.initialize(elements.webcam, elements.overlayCanvas);
    
    state.isMonitoring = true;
    await window.electronAPI.startMonitoring();
    
    // Start processing loop
    processFrame();
    
    updateUI();
    updateCameraStatus(true);
    
    console.log('Monitoring started');
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
  }
  
  // Cleanup pipeline
  if (state.currentPipeline) {
    state.currentPipeline.cleanup();
  }
  
  updateUI();
  updateCameraStatus(false);
  
  console.log('Monitoring stopped');
}

async function processFrame() {
  if (!state.isMonitoring) return;
  
  try {
    // Run detection pipeline
    const result = await state.currentPipeline.process();
    
    if (result) {
      // Update metrics
      state.metrics.blinkRate = result.blinkRate || 0;
      state.metrics.currentStrainProb = result.strainProb || 0;
      
      // Calculate health score (inverse of strain)
      state.metrics.healthScore = Math.round((1 - result.strainProb) * 100);
      
      // Determine strain level
      if (result.strainProb < state.settings.thresholds.ok) {
        state.metrics.strainLevel = 'Low';
        updateStatusIndicator('ok', 'Eyes Looking Good! 😊', 'Keep up the healthy habits');
      } else if (result.strainProb < state.settings.thresholds.caution) {
        state.metrics.strainLevel = 'Moderate';
        updateStatusIndicator('caution', 'Take Care! 😐', 'Consider taking a break soon');
      } else {
        state.metrics.strainLevel = 'High';
        updateStatusIndicator('break', 'Break Time! 😫', 'Your eyes need rest now');
        
        // Trigger break if not already in progress
        if (!state.breakInProgress && !state.settings.doNotDisturb) {
          const timeSinceLastBreak = Date.now() - state.lastBreakTimestamp;
          // Only trigger if at least 5 minutes since last break
          if (timeSinceLastBreak > 5 * 60 * 1000) {
            triggerBreakNotification();
          }
        }
      }
      
      // Update UI
      updateMetricsDisplay();
      
      // Save metric to database (throttled - every 15 seconds)
      if (!state.lastSaveTime || Date.now() - state.lastSaveTime > 15000) {
        await saveMetric(result);
        state.lastSaveTime = Date.now();
      }
    }
  } catch (error) {
    console.error('Frame processing error:', error);
  }
  
  // Schedule next frame based on framerate setting
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
