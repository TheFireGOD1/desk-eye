/**
 * Feature-based Eye Strain Detection Pipeline
 * Uses MediaPipe Face Mesh for landmark detection and computes Eye Aspect Ratio (EAR)
 * Lightweight and fast - recommended for most users
 */

const { FaceMesh } = require('@mediapipe/face_mesh');
const { Camera } = require('@mediapipe/camera_utils');

// Eye landmark indices for MediaPipe Face Mesh (468 landmarks)
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

class FeaturePipeline {
  constructor(settings = {}) {
    this.settings = settings;
    this.faceMesh = null;
    this.camera = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;
    
    // Metrics tracking
    this.blinkHistory = [];
    this.earHistory = [];
    this.lastBlinkTime = Date.now();
    this.blinkCount = 0;
    this.isBlinking = false;
    this.windowSize = (settings.windowSize || 15) * 1000; // Convert to ms
    
    // Thresholds
    this.EAR_THRESHOLD = 0.21; // Below this is considered a blink
    this.BLINK_DURATION_THRESHOLD = 300; // Max blink duration in ms
  }

  /**
   * Initialize the pipeline with video and canvas elements
   */
  async initialize(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement.getContext('2d');
    
    // Set canvas size to match video
    this.canvasElement.width = videoElement.videoWidth || 640;
    this.canvasElement.height = videoElement.videoHeight || 480;
    
    // Initialize MediaPipe Face Mesh
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });
    
    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    this.faceMesh.onResults(this.onResults.bind(this));
    
    // Initialize camera
    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        if (this.faceMesh) {
          await this.faceMesh.send({ image: this.videoElement });
        }
      },
      width: 640,
      height: 480
    });
    
    await this.camera.start();
    
    console.log('Feature pipeline initialized');
  }

  /**
   * Process results from MediaPipe Face Mesh
   */
  onResults(results) {
    if (!this.canvasCtx) return;
    
    // Clear canvas
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      // Draw face mesh (optional, for visualization)
      this.drawLandmarks(landmarks);
      
      // Calculate EAR for both eyes
      const leftEAR = this.calculateEAR(landmarks, LEFT_EYE_INDICES);
      const rightEAR = this.calculateEAR(landmarks, RIGHT_EYE_INDICES);
      const avgEAR = (leftEAR + rightEAR) / 2;
      
      // Store EAR in history
      this.earHistory.push({
        timestamp: Date.now(),
        ear: avgEAR
      });
      
      // Detect blinks
      this.detectBlink(avgEAR);
      
      // Clean old data
      this.cleanOldData();
      
      // Store latest result
      this.latestResult = {
        ear: avgEAR,
        leftEAR,
        rightEAR,
        landmarks
      };
    }
    
    this.canvasCtx.restore();
  }

  /**
   * Calculate Eye Aspect Ratio (EAR)
   * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
   */
  calculateEAR(landmarks, eyeIndices) {
    const points = eyeIndices.map(idx => landmarks[idx]);
    
    // Vertical distances
    const v1 = this.euclideanDistance(points[1], points[5]);
    const v2 = this.euclideanDistance(points[2], points[4]);
    
    // Horizontal distance
    const h = this.euclideanDistance(points[0], points[3]);
    
    // EAR formula
    const ear = (v1 + v2) / (2.0 * h);
    
    return ear;
  }

  /**
   * Calculate Euclidean distance between two points
   */
  euclideanDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Detect blinks based on EAR threshold
   */
  detectBlink(ear) {
    const now = Date.now();
    
    if (ear < this.EAR_THRESHOLD) {
      if (!this.isBlinking) {
        // Blink started
        this.isBlinking = true;
        this.blinkStartTime = now;
      }
    } else {
      if (this.isBlinking) {
        // Blink ended
        const blinkDuration = now - this.blinkStartTime;
        
        // Only count as valid blink if duration is reasonable
        if (blinkDuration < this.BLINK_DURATION_THRESHOLD) {
          this.blinkCount++;
          this.blinkHistory.push({
            timestamp: now,
            duration: blinkDuration
          });
        }
        
        this.isBlinking = false;
      }
    }
  }

  /**
   * Clean old data outside the window
   */
  cleanOldData() {
    const now = Date.now();
    const cutoff = now - this.windowSize;
    
    this.earHistory = this.earHistory.filter(item => item.timestamp > cutoff);
    this.blinkHistory = this.blinkHistory.filter(item => item.timestamp > cutoff);
  }

  /**
   * Calculate blink rate (blinks per minute)
   */
  calculateBlinkRate() {
    if (this.blinkHistory.length === 0) return 0;
    
    const now = Date.now();
    const windowStart = now - this.windowSize;
    const blinksInWindow = this.blinkHistory.filter(b => b.timestamp > windowStart).length;
    
    // Convert to blinks per minute
    const windowMinutes = this.windowSize / 60000;
    return blinksInWindow / windowMinutes;
  }

  /**
   * Calculate average EAR
   */
  calculateAvgEAR() {
    if (this.earHistory.length === 0) return 0;
    
    const sum = this.earHistory.reduce((acc, item) => acc + item.ear, 0);
    return sum / this.earHistory.length;
  }

  /**
   * Calculate strain probability based on features
   * Lower blink rate and lower EAR indicate higher strain
   */
  calculateStrainProbability() {
    const blinkRate = this.calculateBlinkRate();
    const avgEAR = this.calculateAvgEAR();
    
    // Normal blink rate is 15-20 blinks/min
    // Lower blink rate indicates strain
    const normalBlinkRate = 17;
    const blinkRateFactor = Math.max(0, 1 - (blinkRate / normalBlinkRate));
    
    // Normal EAR is around 0.25-0.30
    // Lower EAR indicates tired/strained eyes
    const normalEAR = 0.27;
    const earFactor = Math.max(0, 1 - (avgEAR / normalEAR));
    
    // Weighted combination
    const strainProb = (blinkRateFactor * 0.6) + (earFactor * 0.4);
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, strainProb));
  }

  /**
   * Process current frame and return metrics
   */
  async process() {
    // MediaPipe processes frames automatically via camera
    // Just return current metrics
    
    const blinkRate = this.calculateBlinkRate();
    const avgEAR = this.calculateAvgEAR();
    const strainProb = this.calculateStrainProbability();
    
    return {
      blinkRate,
      avgEAR,
      strainProb,
      blinkCount: this.blinkCount,
      earHistory: this.earHistory.slice(-10) // Last 10 values for debugging
    };
  }

  /**
   * Draw landmarks on canvas for visualization
   */
  drawLandmarks(landmarks) {
    // Draw eye regions
    this.drawEyeRegion(landmarks, LEFT_EYE_INDICES, '#00FF00');
    this.drawEyeRegion(landmarks, RIGHT_EYE_INDICES, '#00FF00');
  }

  /**
   * Draw eye region outline
   */
  drawEyeRegion(landmarks, indices, color) {
    this.canvasCtx.strokeStyle = color;
    this.canvasCtx.lineWidth = 2;
    this.canvasCtx.beginPath();
    
    indices.forEach((idx, i) => {
      const point = landmarks[idx];
      const x = point.x * this.canvasElement.width;
      const y = point.y * this.canvasElement.height;
      
      if (i === 0) {
        this.canvasCtx.moveTo(x, y);
      } else {
        this.canvasCtx.lineTo(x, y);
      }
    });
    
    this.canvasCtx.closePath();
    this.canvasCtx.stroke();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    
    if (this.faceMesh) {
      this.faceMesh.close();
      this.faceMesh = null;
    }
    
    if (this.canvasCtx) {
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
    
    console.log('Feature pipeline cleaned up');
  }
}

// Export for use in renderer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeaturePipeline;
}
