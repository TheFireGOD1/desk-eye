/**
 * TensorFlow.js-based Eye Strain Detection Pipeline
 * Uses a pre-trained TFJS model for image classification
 * More accurate but heavier on CPU/GPU - optional pipeline
 */

const tf = require('@tensorflow/tfjs');

class TFJSPipeline {
  constructor(settings = {}) {
    this.settings = settings;
    this.model = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;
    
    // Model configuration
    this.modelPath = './models/eye_strain_model/model.json';
    this.inputSize = 224; // Standard input size for MobileNet-based models
    
    // Metrics tracking
    this.predictionHistory = [];
    this.windowSize = (settings.windowSize || 15) * 1000;
    
    // Fallback to feature-based metrics
    this.blinkHistory = [];
    this.earHistory = [];
  }

  /**
   * Initialize the pipeline
   */
  async initialize(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement.getContext('2d');
    
    // Set canvas size
    this.canvasElement.width = videoElement.videoWidth || 640;
    this.canvasElement.height = videoElement.videoHeight || 480;
    
    try {
      // Try to load the model
      await this.loadModel();
      console.log('TFJS pipeline initialized with model');
    } catch (error) {
      console.warn('Failed to load TFJS model, using fallback:', error);
      // Fallback to simple feature extraction
      this.useFallback = true;
    }
  }

  /**
   * Load the TensorFlow.js model
   */
  async loadModel() {
    try {
      // Check if model file exists
      this.model = await tf.loadLayersModel(this.modelPath);
      console.log('TFJS model loaded successfully');
      
      // Warm up the model with a dummy prediction
      const dummyInput = tf.zeros([1, this.inputSize, this.inputSize, 3]);
      await this.model.predict(dummyInput);
      dummyInput.dispose();
      
    } catch (error) {
      console.error('Model loading failed:', error);
      throw new Error('TFJS model not found. Please train and export a model first.');
    }
  }

  /**
   * Preprocess video frame for model input
   */
  preprocessFrame() {
    return tf.tidy(() => {
      // Capture current video frame
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.inputSize;
      tempCanvas.height = this.inputSize;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Draw and resize video frame
      tempCtx.drawImage(
        this.videoElement,
        0, 0,
        this.videoElement.videoWidth,
        this.videoElement.videoHeight,
        0, 0,
        this.inputSize,
        this.inputSize
      );
      
      // Convert to tensor
      const imageTensor = tf.browser.fromPixels(tempCanvas);
      
      // Normalize to [0, 1]
      const normalized = imageTensor.div(255.0);
      
      // Add batch dimension
      const batched = normalized.expandDims(0);
      
      return batched;
    });
  }

  /**
   * Run inference on current frame
   */
  async runInference() {
    if (!this.model || this.useFallback) {
      return this.fallbackInference();
    }
    
    try {
      const inputTensor = this.preprocessFrame();
      
      // Run prediction
      const prediction = await this.model.predict(inputTensor);
      const strainProb = await prediction.data();
      
      // Cleanup tensors
      inputTensor.dispose();
      prediction.dispose();
      
      // Store in history
      this.predictionHistory.push({
        timestamp: Date.now(),
        strainProb: strainProb[0]
      });
      
      // Clean old data
      this.cleanOldData();
      
      return strainProb[0];
      
    } catch (error) {
      console.error('Inference error:', error);
      return this.fallbackInference();
    }
  }

  /**
   * Fallback inference using simple heuristics
   * Used when model is not available
   */
  fallbackInference() {
    // Simple brightness-based heuristic
    // Darker eye regions might indicate tiredness
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 160;
    tempCanvas.height = 120;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.drawImage(
      this.videoElement,
      0, 0,
      this.videoElement.videoWidth,
      this.videoElement.videoHeight,
      0, 0,
      160,
      120
    );
    
    const imageData = tempCtx.getImageData(0, 0, 160, 120);
    const data = imageData.data;
    
    // Calculate average brightness
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
    }
    
    const avgBrightness = totalBrightness / (data.length / 4);
    
    // Lower brightness might indicate strain (squinting, tired eyes)
    // This is a very rough heuristic
    const strainProb = Math.max(0, Math.min(1, 1 - (avgBrightness / 200)));
    
    this.predictionHistory.push({
      timestamp: Date.now(),
      strainProb
    });
    
    this.cleanOldData();
    
    return strainProb;
  }

  /**
   * Clean old data outside the window
   */
  cleanOldData() {
    const now = Date.now();
    const cutoff = now - this.windowSize;
    
    this.predictionHistory = this.predictionHistory.filter(
      item => item.timestamp > cutoff
    );
  }

  /**
   * Calculate smoothed strain probability
   */
  calculateSmoothedStrainProb() {
    if (this.predictionHistory.length === 0) return 0;
    
    // Use exponential moving average for smoothing
    const alpha = 0.3; // Smoothing factor
    let smoothed = this.predictionHistory[0].strainProb;
    
    for (let i = 1; i < this.predictionHistory.length; i++) {
      smoothed = alpha * this.predictionHistory[i].strainProb + (1 - alpha) * smoothed;
    }
    
    return smoothed;
  }

  /**
   * Estimate blink rate (fallback metric)
   */
  estimateBlinkRate() {
    // TFJS pipeline doesn't directly measure blinks
    // Return a reasonable default or use variance in predictions
    
    if (this.predictionHistory.length < 2) return 15; // Default normal rate
    
    // Use variance in strain predictions as proxy for eye movement
    const values = this.predictionHistory.map(p => p.strainProb);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    // Higher variance might indicate more eye movement/blinking
    // This is a rough approximation
    const estimatedRate = 10 + (variance * 50);
    return Math.max(5, Math.min(25, estimatedRate));
  }

  /**
   * Process current frame and return metrics
   */
  async process() {
    const strainProb = await this.runInference();
    const smoothedStrainProb = this.calculateSmoothedStrainProb();
    const blinkRate = this.estimateBlinkRate();
    
    // Draw visualization
    this.drawVisualization(smoothedStrainProb);
    
    return {
      blinkRate,
      avgEAR: 0.25, // Not measured in TFJS pipeline
      strainProb: smoothedStrainProb,
      rawStrainProb: strainProb,
      predictionCount: this.predictionHistory.length
    };
  }

  /**
   * Draw visualization overlay
   */
  drawVisualization(strainProb) {
    if (!this.canvasCtx) return;
    
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // Draw strain indicator
    const barWidth = 200;
    const barHeight = 20;
    const x = this.canvasElement.width - barWidth - 20;
    const y = 20;
    
    // Background
    this.canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.canvasCtx.fillRect(x - 5, y - 5, barWidth + 10, barHeight + 10);
    
    // Strain bar
    const color = strainProb < 0.4 ? '#4CAF50' : strainProb < 0.7 ? '#FFC107' : '#F44336';
    this.canvasCtx.fillStyle = color;
    this.canvasCtx.fillRect(x, y, barWidth * strainProb, barHeight);
    
    // Border
    this.canvasCtx.strokeStyle = '#ffffff';
    this.canvasCtx.lineWidth = 2;
    this.canvasCtx.strokeRect(x, y, barWidth, barHeight);
    
    // Label
    this.canvasCtx.fillStyle = '#ffffff';
    this.canvasCtx.font = '14px Arial';
    this.canvasCtx.fillText('Strain Level', x, y - 10);
    this.canvasCtx.fillText(`${Math.round(strainProb * 100)}%`, x + barWidth + 10, y + 15);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    
    // Cleanup any remaining tensors
    if (tf.memory().numTensors > 0) {
      console.log('Cleaning up tensors:', tf.memory().numTensors);
    }
    
    if (this.canvasCtx) {
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
    
    console.log('TFJS pipeline cleaned up');
  }
}

// Export for use in renderer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TFJSPipeline;
}
