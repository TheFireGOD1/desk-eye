// DeskEye Settings
let currentSettings = null;

const DEFAULT_SETTINGS = {
  pipeline: 'feature',
  framerate: 10,
  windowSize: 15,
  thresholds: {
    ok: 0.4,
    caution: 0.7
  },
  saveRawImages: false,
  soundVolume: 0.7,
  autoStartLogin: false,
  doNotDisturb: false,
  accessibility: {
    largeFonts: false,
    highContrast: false,
    muteAudio: false
  }
};

// Initialize
async function initialize() {
  await loadSettings();
  setupEventListeners();
  updateUI();
}

async function loadSettings() {
  try {
    currentSettings = await window.electronAPI.getSettings();
    console.log('Settings loaded:', currentSettings);
  } catch (error) {
    console.error('Failed to load settings:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

function setupEventListeners() {
  // Pipeline
  document.getElementById('pipeline-select').addEventListener('change', (e) => {
    currentSettings.pipeline = e.target.value;
  });
  
  // Framerate
  const framerateInput = document.getElementById('framerate-input');
  const framerateValue = document.getElementById('framerate-value');
  framerateInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    currentSettings.framerate = value;
    framerateValue.textContent = `${value} FPS`;
  });
  
  // Window size
  document.getElementById('window-size-input').addEventListener('change', (e) => {
    currentSettings.windowSize = parseInt(e.target.value);
  });
  
  // Thresholds
  const thresholdOkInput = document.getElementById('threshold-ok-input');
  const thresholdOkValue = document.getElementById('threshold-ok-value');
  thresholdOkInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    currentSettings.thresholds.ok = value;
    thresholdOkValue.textContent = value.toFixed(2);
  });
  
  const thresholdCautionInput = document.getElementById('threshold-caution-input');
  const thresholdCautionValue = document.getElementById('threshold-caution-value');
  thresholdCautionInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    currentSettings.thresholds.caution = value;
    thresholdCautionValue.textContent = value.toFixed(2);
  });
  
  // Save raw images
  const saveRawImagesInput = document.getElementById('save-raw-images');
  const rawImagesWarning = document.getElementById('raw-images-warning');
  saveRawImagesInput.addEventListener('change', (e) => {
    currentSettings.saveRawImages = e.target.checked;
    rawImagesWarning.style.display = e.target.checked ? 'block' : 'none';
  });
  
  // Volume
  const volumeInput = document.getElementById('volume-input');
  const volumeValue = document.getElementById('volume-value');
  volumeInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    currentSettings.soundVolume = value;
    volumeValue.textContent = `${Math.round(value * 100)}%`;
  });
  
  // Mute audio
  document.getElementById('mute-audio').addEventListener('change', (e) => {
    currentSettings.accessibility.muteAudio = e.target.checked;
  });
  
  // Do not disturb
  document.getElementById('do-not-disturb').addEventListener('change', (e) => {
    currentSettings.doNotDisturb = e.target.checked;
  });
  
  // Large fonts
  document.getElementById('large-fonts').addEventListener('change', (e) => {
    currentSettings.accessibility.largeFonts = e.target.checked;
  });
  
  // High contrast
  document.getElementById('high-contrast').addEventListener('change', (e) => {
    currentSettings.accessibility.highContrast = e.target.checked;
  });
  
  // Auto-start
  document.getElementById('auto-start').addEventListener('change', async (e) => {
    currentSettings.autoStartLogin = e.target.checked;
    try {
      await window.electronAPI.setAutoStart(e.target.checked);
    } catch (error) {
      console.error('Failed to set auto-start:', error);
    }
  });
  
  // Save button
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  
  // Reset button
  document.getElementById('reset-btn').addEventListener('click', resetSettings);
}

function updateUI() {
  // Pipeline
  document.getElementById('pipeline-select').value = currentSettings.pipeline || 'feature';
  
  // Framerate
  const framerate = currentSettings.framerate || 10;
  document.getElementById('framerate-input').value = framerate;
  document.getElementById('framerate-value').textContent = `${framerate} FPS`;
  
  // Window size
  document.getElementById('window-size-input').value = currentSettings.windowSize || 15;
  
  // Thresholds
  const thresholdOk = currentSettings.thresholds?.ok || 0.4;
  const thresholdCaution = currentSettings.thresholds?.caution || 0.7;
  document.getElementById('threshold-ok-input').value = thresholdOk;
  document.getElementById('threshold-ok-value').textContent = thresholdOk.toFixed(2);
  document.getElementById('threshold-caution-input').value = thresholdCaution;
  document.getElementById('threshold-caution-value').textContent = thresholdCaution.toFixed(2);
  
  // Save raw images
  const saveRawImages = currentSettings.saveRawImages || false;
  document.getElementById('save-raw-images').checked = saveRawImages;
  document.getElementById('raw-images-warning').style.display = saveRawImages ? 'block' : 'none';
  
  // Volume
  const volume = currentSettings.soundVolume || 0.7;
  document.getElementById('volume-input').value = volume;
  document.getElementById('volume-value').textContent = `${Math.round(volume * 100)}%`;
  
  // Accessibility
  const accessibility = currentSettings.accessibility || {};
  document.getElementById('mute-audio').checked = accessibility.muteAudio || false;
  document.getElementById('large-fonts').checked = accessibility.largeFonts || false;
  document.getElementById('high-contrast').checked = accessibility.highContrast || false;
  
  // Do not disturb
  document.getElementById('do-not-disturb').checked = currentSettings.doNotDisturb || false;
  
  // Auto-start
  loadAutoStartSetting();
}

async function loadAutoStartSetting() {
  try {
    const result = await window.electronAPI.getAutoStart();
    document.getElementById('auto-start').checked = result.enabled || false;
    currentSettings.autoStartLogin = result.enabled || false;
  } catch (error) {
    console.error('Failed to load auto-start setting:', error);
  }
}

async function saveSettings() {
  try {
    const saveBtn = document.getElementById('save-btn');
    const saveStatus = document.getElementById('save-status');
    
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    const result = await window.electronAPI.saveSettings(currentSettings);
    
    if (result.success) {
      saveStatus.textContent = '✅ Settings saved successfully!';
      saveStatus.style.color = 'var(--color-success)';
      
      setTimeout(() => {
        saveStatus.textContent = '';
      }, 3000);
    } else {
      throw new Error('Save failed');
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    const saveStatus = document.getElementById('save-status');
    saveStatus.textContent = '❌ Failed to save settings';
    saveStatus.style.color = 'var(--color-danger)';
  } finally {
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Settings';
  }
}

async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    currentSettings = { ...DEFAULT_SETTINGS };
    updateUI();
    await saveSettings();
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initialize);
