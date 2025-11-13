# 👁️ DeskEye - Cross-Platform Eye Strain Monitor

**DeskEye** is a privacy-first desktop application that monitors your eyes in real-time using your webcam to detect eye strain and remind you to take breaks. Built for students and professionals who spend long hours at their computers.

## 🎯 What to Demo

1. **Real-time Eye Monitoring** - Show live webcam feed with eye landmark detection and status indicator changing colors
2. **Break Reminders** - Trigger a strain condition to demonstrate the 20-second guided break modal with countdown
3. **Dashboard Analytics** - Display historical charts showing blink rate trends and health scores over time
4. **Privacy Features** - Highlight that no raw video is saved (check Settings → Privacy section)
5. **Pipeline Switching** - Toggle between Feature-based (fast) and TFJS (accurate) detection pipelines

## ✨ Features

- **Real-time Eye Strain Detection** using webcam and computer vision
- **Two Detection Pipelines**:
  - Feature-based (MediaPipe Face Mesh) - Fast, lightweight, recommended
  - TensorFlow.js - More accurate, heavier on resources
- **Privacy-First Design** - All processing happens locally, no data uploaded
- **Smart Break Reminders** - Guided 20-second breaks with countdown timer
- **Health Dashboard** - Track your eye health metrics over time with interactive charts
- **System Tray Integration** - Runs in background, accessible from system tray
- **Accessibility Options** - Large fonts, high contrast mode, audio muting
- **Cross-Platform** - Works on Windows 10/11 and macOS (Intel & Apple Silicon)

## 🔒 Privacy & Consent

**Your privacy is our priority.** DeskEye processes all video locally on your device. No raw video or images are uploaded to any server. Only aggregated metrics (blink rate, strain scores) are stored locally in a database on your computer.

### For Minors (Under 18)

**Parental/guardian consent required for minors:** This app accesses your webcam to analyze eye features (blink rate and eye openness) for the purpose of detecting eye strain. No raw video is stored or uploaded by default. If you are under 18, you must have a parent or guardian review and sign the consent form before testing.

See [docs/parental_consent.txt](docs/parental_consent.txt) for the full consent form.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Webcam
- Windows 10/11 or macOS 10.14+

### Installation & Running

```bash
# Clone the repository
git clone https://github.com/yourusername/desk-eye.git
cd desk-eye

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Building Installers

```bash
# Build for Windows (x64)
npm run build:win

# Build for macOS (Intel & Apple Silicon)
npm run build:mac

# Build for both platforms
npm run build:all
```

Installers will be created in the `dist/` directory.

## 📊 How It Works

### Detection Pipeline

1. **Video Capture** - Accesses your webcam at 6-15 FPS (configurable)
2. **Face Detection** - Uses MediaPipe Face Mesh to detect 468 facial landmarks
3. **Eye Analysis** - Calculates Eye Aspect Ratio (EAR) and tracks blink rate
4. **Strain Detection** - Aggregates metrics over a rolling window (default 15s)
5. **Status Updates** - Updates UI with color-coded status (Green/Yellow/Red)
6. **Break Triggers** - Automatically suggests breaks when strain is detected

### Eye Aspect Ratio (EAR)

EAR is calculated using the formula:

```
EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
```

Where p1-p6 are eye landmark points. Lower EAR indicates eye closure or strain.

### Strain Probability

Combines multiple factors:
- **Blink Rate** - Normal: 15-20 blinks/min, Low rate indicates strain
- **Average EAR** - Normal: 0.25-0.30, Lower values indicate tired eyes
- **Time Since Break** - Longer periods increase strain probability

## 🎨 User Interface

### Main Window
- Live webcam preview with eye landmark overlay
- Large status indicator (Green = OK, Yellow = Caution, Red = Break)
- Real-time metrics: Blink rate, Last break, Health score, Strain level
- Start/Stop monitoring controls
- Quick access to Dashboard and Settings

### Dashboard
- Time-range selector (Today, Week, Month, All Time)
- Summary statistics cards
- Interactive charts (Chart.js):
  - Blink rate over time
  - Eye strain score trends
  - Health score progression
  - Daily activity heatmap
- CSV export for aggregated data

### Settings
- Pipeline selection (Feature-based / TFJS)
- Frame rate adjustment (6-15 FPS)
- Detection thresholds customization
- Privacy controls (save raw images toggle with warning)
- Audio & notification preferences
- Accessibility options (large fonts, high contrast)
- Auto-start on login

## 🧪 Testing

### Run Unit Tests

```bash
npm test
```

### Generate Synthetic Test Data

```bash
node src/utils/synthetic_data_generator.js
```

This creates test datasets in `test_data/` directory:
- EAR sequences (normal, strained, mixed conditions)
- Metrics datasets
- Sample landmarks

### Manual Testing Checklist

1. ✅ Camera permission granted on first launch
2. ✅ Face detection works with various lighting conditions
3. ✅ Blink detection responds to actual blinks
4. ✅ Status indicator changes based on strain level
5. ✅ Break modal appears when strain is high
6. ✅ Dashboard displays historical data correctly
7. ✅ Settings persist after app restart
8. ✅ CSV export generates valid file
9. ✅ System tray icon works (minimize to tray)
10. ✅ App runs on fresh user account without admin rights

## 📁 Project Structure

```
desk-eye/
├── src/
│   ├── main.js                 # Electron main process
│   ├── preload.js              # IPC bridge
│   ├── db.js                   # SQLite database wrapper
│   ├── renderer/               # UI files
│   │   ├── index.html          # Main window
│   │   ├── dashboard.html      # Analytics dashboard
│   │   ├── settings.html       # Settings page
│   │   ├── styles.css          # Global styles
│   │   ├── renderer.js         # Main window logic
│   │   ├── dashboard.js        # Dashboard logic
│   │   └── settings.js         # Settings logic
│   ├── pipelines/              # Detection pipelines
│   │   ├── feature_pipeline.js # MediaPipe-based (default)
│   │   └── tfjs_pipeline.js    # TensorFlow.js-based
│   ├── audio/                  # Alert sounds
│   │   └── alert.mp3           # Break reminder sound
│   └── utils/                  # Utilities
│       └── synthetic_data_generator.js
├── tests/
│   └── test_features.test.js   # Jest unit tests
├── docs/                       # Documentation
│   ├── privacy_and_consent.md
│   ├── parental_consent.txt
│   ├── demo_checklist.md
│   ├── how_to_build.md
│   └── camera_placement.md
├── config/
│   └── defaults.json           # Default settings
├── scripts/                    # Build scripts
│   ├── build_win.sh
│   ├── build_mac.sh
│   └── dev_start.sh
├── package.json
└── README.md
```

## 🔧 Configuration

Default settings are in `config/defaults.json`:

```json
{
  "pipeline": "feature",
  "framerate": 10,
  "windowSize": 15,
  "thresholds": {
    "ok": 0.4,
    "caution": 0.7
  },
  "saveRawImages": false,
  "soundVolume": 0.7
}
```

## 🎓 Training Your Own TFJS Model

1. **Collect Data** - Use the app with `saveRawImages: true` to collect eye images
2. **Label Data** - Manually label images as "strained" or "normal"
3. **Train Model** - Use TensorFlow/Keras to train a MobileNet-based classifier
4. **Convert to TFJS** - Use `tensorflowjs_converter` to convert model
5. **Deploy** - Place `model.json` and weight files in `src/models/eye_strain_model/`

See [docs/model_training.md](docs/model_training.md) for detailed instructions.

## 📸 Camera Placement Tips

For best results:
- Position camera 40-60 cm from your face
- Ensure even lighting (avoid backlighting)
- Camera should be at eye level or slightly above
- Keep face centered in frame
- Avoid wearing reflective glasses if possible

See [docs/camera_placement.md](docs/camera_placement.md) for more details.

## 🐛 Troubleshooting

### Camera Not Working
- Check system permissions (Settings → Privacy → Camera)
- Ensure no other app is using the webcam
- Try restarting the application

### High CPU Usage
- Lower frame rate in Settings (try 6-8 FPS)
- Switch to Feature-based pipeline if using TFJS
- Close other resource-intensive applications

### Detection Not Accurate
- Improve lighting conditions
- Adjust camera position
- Calibrate thresholds in Settings
- Try the TFJS pipeline for better accuracy

## 🤝 Contributing

This is a student project for Samsung Solve for Tomorrow. Contributions, suggestions, and feedback are welcome!

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🏆 Samsung Solve for Tomorrow

DeskEye was created as part of the Samsung Solve for Tomorrow competition to address the growing problem of digital eye strain among students and young professionals.

### Impact Statements

1. **Preventing Digital Eye Strain** - Helps students maintain eye health during long study sessions
2. **Privacy-First Health Tech** - Demonstrates that health monitoring can be done without compromising privacy
3. **Accessible Technology** - Free, open-source tool available to all students regardless of economic background
4. **Behavioral Change** - Encourages healthy screen time habits through gentle reminders
5. **Cross-Platform Solution** - Works on both Windows and Mac, reaching maximum number of students

## 📞 Support

For issues, questions, or feedback:
- Open an issue on GitHub
- Email: deskeye@example.com
- Documentation: [docs/](docs/)

---

**Made with ❤️ by students, for students**
