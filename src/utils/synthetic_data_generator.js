/**
 * Synthetic Data Generator for DeskEye
 * Generates synthetic eye landmark sequences and metrics for testing
 * without requiring a real webcam or human subjects
 */

const fs = require('fs');
const path = require('path');

class SyntheticDataGenerator {
  constructor() {
    // Normal eye parameters
    this.normalEAR = 0.27;
    this.normalBlinkRate = 17; // blinks per minute
    this.normalBlinkDuration = 150; // milliseconds
    
    // Strained eye parameters
    this.strainedEAR = 0.20;
    this.strainedBlinkRate = 8;
    this.strainedBlinkDuration = 200;
  }

  /**
   * Generate synthetic EAR (Eye Aspect Ratio) sequence
   * @param {number} duration - Duration in seconds
   * @param {string} condition - 'normal', 'strained', or 'mixed'
   * @param {number} fps - Frames per second
   */
  generateEARSequence(duration = 60, condition = 'normal', fps = 10) {
    const totalFrames = duration * fps;
    const sequence = [];
    
    let baseEAR, blinkRate, blinkDuration;
    
    if (condition === 'normal') {
      baseEAR = this.normalEAR;
      blinkRate = this.normalBlinkRate;
      blinkDuration = this.normalBlinkDuration;
    } else if (condition === 'strained') {
      baseEAR = this.strainedEAR;
      blinkRate = this.strainedBlinkRate;
      blinkDuration = this.strainedBlinkDuration;
    } else {
      // Mixed: start normal, gradually become strained
      baseEAR = this.normalEAR;
      blinkRate = this.normalBlinkRate;
      blinkDuration = this.normalBlinkDuration;
    }
    
    // Calculate blink intervals
    const blinkInterval = (60 / blinkRate) * fps; // frames between blinks
    let framesSinceLastBlink = 0;
    let inBlink = false;
    let blinkFramesRemaining = 0;
    
    for (let frame = 0; frame < totalFrames; frame++) {
      const timestamp = (frame / fps) * 1000; // milliseconds
      
      // For mixed condition, gradually decrease EAR and blink rate
      if (condition === 'mixed') {
        const progress = frame / totalFrames;
        baseEAR = this.normalEAR - (this.normalEAR - this.strainedEAR) * progress;
        blinkRate = this.normalBlinkRate - (this.normalBlinkRate - this.strainedBlinkRate) * progress;
        blinkDuration = this.normalBlinkDuration + (this.strainedBlinkDuration - this.normalBlinkDuration) * progress;
      }
      
      // Determine if this frame should be a blink
      if (!inBlink && framesSinceLastBlink >= blinkInterval) {
        // Start a blink
        inBlink = true;
        blinkFramesRemaining = Math.round((blinkDuration / 1000) * fps);
        framesSinceLastBlink = 0;
      }
      
      let ear;
      if (inBlink) {
        // During blink, EAR drops significantly
        ear = baseEAR * 0.3 + this.randomNoise(0.02);
        blinkFramesRemaining--;
        
        if (blinkFramesRemaining <= 0) {
          inBlink = false;
        }
      } else {
        // Normal state with slight random variation
        ear = baseEAR + this.randomNoise(0.03);
        framesSinceLastBlink++;
      }
      
      sequence.push({
        frame,
        timestamp,
        ear: Math.max(0.1, Math.min(0.4, ear)), // Clamp to reasonable range
        leftEAR: ear + this.randomNoise(0.01),
        rightEAR: ear + this.randomNoise(0.01),
        isBlink: inBlink
      });
    }
    
    return sequence;
  }

  /**
   * Generate synthetic face landmarks
   * Simplified version with just eye landmarks
   */
  generateLandmarks(ear = 0.27) {
    const landmarks = [];
    
    // Generate 468 landmarks (MediaPipe Face Mesh format)
    // We'll only properly generate eye landmarks, rest are placeholders
    
    for (let i = 0; i < 468; i++) {
      landmarks.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random() * 0.1
      });
    }
    
    // Left eye indices: [33, 160, 158, 133, 153, 144]
    // Right eye indices: [362, 385, 387, 263, 373, 380]
    
    // Generate realistic eye landmarks based on EAR
    this.generateEyeLandmarks(landmarks, [33, 160, 158, 133, 153, 144], 0.3, 0.3, ear);
    this.generateEyeLandmarks(landmarks, [362, 385, 387, 263, 373, 380], 0.7, 0.3, ear);
    
    return landmarks;
  }

  /**
   * Generate eye landmarks for a specific eye
   */
  generateEyeLandmarks(landmarks, indices, centerX, centerY, ear) {
    const eyeWidth = 0.08;
    const eyeHeight = eyeWidth * ear * 2; // EAR affects vertical distance
    
    // Approximate eye shape
    const positions = [
      { x: -0.5, y: 0 },    // Left corner
      { x: -0.25, y: 0.5 },  // Top left
      { x: 0, y: 0.5 },      // Top center
      { x: 0.5, y: 0 },      // Right corner
      { x: 0, y: -0.5 },     // Bottom center
      { x: -0.25, y: -0.5 }  // Bottom left
    ];
    
    indices.forEach((idx, i) => {
      const pos = positions[i];
      landmarks[idx] = {
        x: centerX + pos.x * eyeWidth,
        y: centerY + pos.y * eyeHeight,
        z: Math.random() * 0.01
      };
    });
  }

  /**
   * Generate synthetic metrics dataset
   */
  generateMetricsDataset(numRecords = 1000, condition = 'mixed') {
    const metrics = [];
    const startTime = Date.now() - (numRecords * 15000); // 15 seconds per record
    
    for (let i = 0; i < numRecords; i++) {
      const timestamp = startTime + (i * 15000);
      const progress = i / numRecords;
      
      let blinkRate, ear, strainScore;
      
      if (condition === 'normal') {
        blinkRate = this.normalBlinkRate + this.randomNoise(3);
        ear = this.normalEAR + this.randomNoise(0.02);
        strainScore = 0.1 + this.randomNoise(0.1);
      } else if (condition === 'strained') {
        blinkRate = this.strainedBlinkRate + this.randomNoise(2);
        ear = this.strainedEAR + this.randomNoise(0.02);
        strainScore = 0.7 + this.randomNoise(0.15);
      } else {
        // Mixed: gradually increase strain
        blinkRate = this.normalBlinkRate - (this.normalBlinkRate - this.strainedBlinkRate) * progress + this.randomNoise(2);
        ear = this.normalEAR - (this.normalEAR - this.strainedEAR) * progress + this.randomNoise(0.02);
        strainScore = 0.1 + 0.7 * progress + this.randomNoise(0.1);
      }
      
      // Randomly add breaks
      const breakTaken = Math.random() < 0.05; // 5% chance of break
      
      metrics.push({
        timestamp,
        blinkRate: Math.max(5, Math.min(25, blinkRate)),
        avgEAR: Math.max(0.15, Math.min(0.35, ear)),
        strainScore: Math.max(0, Math.min(1, strainScore)),
        breakTaken
      });
    }
    
    return metrics;
  }

  /**
   * Generate random noise
   */
  randomNoise(scale = 1) {
    return (Math.random() - 0.5) * 2 * scale;
  }

  /**
   * Save synthetic data to file
   */
  saveToFile(data, filename) {
    const outputDir = path.join(__dirname, '../../test_data');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log(`Synthetic data saved to: ${filepath}`);
    return filepath;
  }

  /**
   * Generate complete test dataset
   */
  generateTestDataset() {
    console.log('Generating synthetic test dataset...');
    
    // Generate EAR sequences
    const normalSequence = this.generateEARSequence(60, 'normal', 10);
    const strainedSequence = this.generateEARSequence(60, 'strained', 10);
    const mixedSequence = this.generateEARSequence(120, 'mixed', 10);
    
    this.saveToFile(normalSequence, 'ear_sequence_normal.json');
    this.saveToFile(strainedSequence, 'ear_sequence_strained.json');
    this.saveToFile(mixedSequence, 'ear_sequence_mixed.json');
    
    // Generate metrics datasets
    const normalMetrics = this.generateMetricsDataset(100, 'normal');
    const strainedMetrics = this.generateMetricsDataset(100, 'strained');
    const mixedMetrics = this.generateMetricsDataset(500, 'mixed');
    
    this.saveToFile(normalMetrics, 'metrics_normal.json');
    this.saveToFile(strainedMetrics, 'metrics_strained.json');
    this.saveToFile(mixedMetrics, 'metrics_mixed.json');
    
    // Generate sample landmarks
    const sampleLandmarks = {
      normal: this.generateLandmarks(0.27),
      strained: this.generateLandmarks(0.20),
      blinking: this.generateLandmarks(0.10)
    };
    
    this.saveToFile(sampleLandmarks, 'sample_landmarks.json');
    
    console.log('Test dataset generation complete!');
    
    return {
      sequences: {
        normal: normalSequence,
        strained: strainedSequence,
        mixed: mixedSequence
      },
      metrics: {
        normal: normalMetrics,
        strained: strainedMetrics,
        mixed: mixedMetrics
      },
      landmarks: sampleLandmarks
    };
  }
}

// CLI usage
if (require.main === module) {
  const generator = new SyntheticDataGenerator();
  generator.generateTestDataset();
}

module.exports = SyntheticDataGenerator;
