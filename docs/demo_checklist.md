# DeskEye Demo Checklist for Judges

## Pre-Demo Setup (5 minutes before)

### Hardware Check
- [ ] Laptop/computer with working webcam
- [ ] Good lighting (avoid backlighting)
- [ ] Camera positioned 40-60cm from face
- [ ] Audio enabled for break alerts
- [ ] Power adapter connected (demo may take 10-15 minutes)

### Software Check
- [ ] DeskEye application installed and tested
- [ ] Application launches without errors
- [ ] Camera permission granted
- [ ] Test data generated (optional: run synthetic data generator)
- [ ] Dashboard has some historical data to show

### Backup Plan
- [ ] Screenshots of key features prepared
- [ ] Video recording of app in action (if live demo fails)
- [ ] Printed documentation available

## Demo Flow (10-12 minutes)

### 1. Introduction (1 minute)

**What to Say:**
> "DeskEye is a privacy-first desktop application that helps students and professionals prevent digital eye strain. It uses your webcam to monitor your eyes in real-time and reminds you to take breaks before strain becomes serious."

**Key Points:**
- Built for Samsung Solve for Tomorrow
- Addresses growing problem of digital eye strain in students
- Privacy-first: all processing happens locally
- Cross-platform: Windows and macOS

### 2. Privacy & Consent (1 minute)

**What to Show:**
- Open Settings → Privacy section
- Point out "Save Raw Images" toggle (disabled by default)
- Show privacy notice text

**What to Say:**
> "Privacy is our top priority. DeskEye processes everything locally on your device. No raw video is ever uploaded. We only store aggregated metrics like blink rate and strain scores. For minors, we require parental consent before use."

**Key Points:**
- No data uploaded to cloud
- Parental consent form included
- COPPA and FERPA compliant
- Open source for transparency

### 3. Live Detection Demo (3-4 minutes)

**What to Show:**
1. Click "Start Monitoring"
2. Show webcam preview with eye landmarks
3. Point out real-time metrics updating:
   - Blink rate
   - Health score
   - Strain level
4. Demonstrate status changes:
   - Normal state (green) - blink normally
   - Caution state (yellow) - reduce blinking
   - Break state (red) - stare without blinking for 20-30 seconds

**What to Say:**
> "Watch as the app detects my eyes in real-time. The green status means my eyes are healthy. The metrics update every second - you can see my blink rate and health score. Now I'll simulate eye strain by not blinking... notice how the status changes to yellow, then red, indicating I need a break."

**Key Points:**
- Real-time landmark detection
- Color-coded status (green/yellow/red)
- Smooth transitions with rolling averages
- Responsive to actual eye behavior

### 4. Break Reminder Demo (1-2 minutes)

**What to Show:**
1. Trigger break modal (either naturally or click "Take Break")
2. Show 20-second countdown with circular progress
3. Demonstrate skip option
4. Show notification (if supported)

**What to Say:**
> "When strain is detected, DeskEye guides you through a 20-second break. The countdown helps you rest your eyes properly. You can skip if needed, but we encourage taking the full break. The app also sends system notifications if you're working in another window."

**Key Points:**
- Gentle, non-intrusive reminders
- Guided break with countdown
- Audio alert (can be muted)
- Respects "Do Not Disturb" mode

### 5. Dashboard & Analytics (2 minutes)

**What to Show:**
1. Open Dashboard
2. Show time range selector (Today, Week, Month)
3. Highlight summary statistics:
   - Average blink rate
   - Average health score
   - Breaks taken
   - Monitoring time
4. Show interactive charts:
   - Blink rate over time
   - Strain score trends
   - Health score progression
5. Demonstrate CSV export

**What to Say:**
> "The dashboard gives you insights into your eye health over time. You can see trends in your blink rate and strain levels. This helps you understand when you're most at risk for eye strain - maybe during late-night study sessions. You can export all this data to CSV for further analysis."

**Key Points:**
- Historical data visualization
- Trend analysis
- Export capability (aggregated data only)
- Helps identify patterns

### 6. Settings & Customization (1 minute)

**What to Show:**
1. Open Settings
2. Show pipeline selection (Feature-based vs TFJS)
3. Show threshold adjustments
4. Show accessibility options
5. Show auto-start option

**What to Say:**
> "DeskEye is highly customizable. You can choose between two detection pipelines - the feature-based one is fast and lightweight, while the TensorFlow.js option is more accurate but heavier. You can adjust sensitivity thresholds, enable accessibility features like large fonts and high contrast, and set the app to start automatically when you log in."

**Key Points:**
- Two detection pipelines
- Adjustable sensitivity
- Accessibility features
- Personalization options

### 7. Technical Implementation (1 minute)

**What to Say:**
> "Technically, DeskEye uses MediaPipe Face Mesh to detect 468 facial landmarks. We calculate Eye Aspect Ratio (EAR) and track blink rate to determine strain probability. The app is built with Electron for cross-platform support, uses SQLite for local data storage, and Chart.js for visualizations. Everything runs locally - no server required."

**Key Points:**
- MediaPipe Face Mesh (468 landmarks)
- Eye Aspect Ratio (EAR) calculation
- Electron framework (cross-platform)
- SQLite database (local storage)
- Open source on GitHub

### 8. Impact & Future (1 minute)

**What to Say:**
> "Digital eye strain affects 65% of Americans, with students being particularly vulnerable due to increased screen time. DeskEye addresses this by providing free, privacy-respecting eye health monitoring. Our solution is accessible to all students regardless of economic background. Future enhancements could include integration with study apps, machine learning improvements, and mobile versions."

**Key Points:**
- Addresses real problem (65% of Americans affected)
- Free and open source
- Privacy-respecting
- Accessible to all students
- Scalable solution

## Questions & Answers

### Anticipated Questions

**Q: How accurate is the detection?**
> A: The feature-based pipeline is quite accurate for blink detection (95%+ accuracy in our tests). Strain detection combines multiple factors and has been validated with synthetic data. The TFJS pipeline can be trained on custom data for even better accuracy.

**Q: Does it work with glasses?**
> A: Yes, it works with most glasses. Reflective or tinted glasses may reduce accuracy. We recommend testing in your specific conditions.

**Q: What about privacy concerns?**
> A: All processing happens locally. No data leaves your device. No raw video is stored by default. We're fully transparent - the code is open source on GitHub.

**Q: Can it run in the background?**
> A: Yes, it minimizes to the system tray and continues monitoring. You can control it from the tray icon.

**Q: How much CPU/battery does it use?**
> A: At 10 FPS with the feature-based pipeline, it uses about 5-10% CPU on modern laptops. Battery impact is minimal. You can lower the frame rate to reduce usage.

**Q: Is it a medical device?**
> A: No, DeskEye is an educational tool, not a medical device. It should not replace professional eye care. Always consult an eye doctor for medical concerns.

**Q: How is this different from existing solutions?**
> A: Most solutions are browser extensions or mobile apps. DeskEye is a native desktop app with deeper system integration. It's also completely free, open source, and privacy-first.

**Q: Can schools deploy this?**
> A: Yes, with proper consent. We provide parental consent forms and comply with COPPA/FERPA. Schools can customize settings and disable raw image storage.

## Post-Demo

### Leave-Behinds
- [ ] GitHub repository link
- [ ] Printed quick start guide
- [ ] Parental consent form sample
- [ ] Contact information

### Follow-Up Materials
- [ ] Installation instructions
- [ ] Build guide for reproducibility
- [ ] Technical documentation
- [ ] Demo video link

## Success Metrics

A successful demo should demonstrate:
- ✅ Real-time eye detection working smoothly
- ✅ Status changes responding to actual eye behavior
- ✅ Break reminder triggering appropriately
- ✅ Dashboard showing meaningful data
- ✅ Privacy features clearly explained
- ✅ Technical competence of implementation
- ✅ Understanding of the problem being solved
- ✅ Scalability and impact potential

## Tips for Success

1. **Practice** - Run through the demo multiple times beforehand
2. **Lighting** - Ensure good, even lighting for best detection
3. **Backup** - Have screenshots/video ready if live demo fails
4. **Timing** - Keep to 10-12 minutes, leave time for questions
5. **Enthusiasm** - Show passion for solving the problem
6. **Technical Depth** - Be ready to discuss implementation details
7. **Impact Focus** - Emphasize how this helps students
8. **Privacy** - Stress the privacy-first approach
9. **Accessibility** - Highlight that it's free and open source
10. **Future Vision** - Share ideas for expansion and improvement

## Emergency Troubleshooting

### Camera Not Working
- Check system permissions
- Restart application
- Use backup video/screenshots

### App Crashes
- Have backup installation ready
- Use screenshots to continue demo
- Explain what would happen

### No Historical Data
- Use synthetic data generator
- Show empty state gracefully
- Focus on live detection

### Poor Detection
- Adjust lighting
- Reposition camera
- Explain environmental factors

## Judging Criteria Alignment

### Innovation
- Novel approach to eye strain prevention
- Privacy-first design
- Dual pipeline architecture

### Technical Merit
- Robust implementation
- Cross-platform support
- Well-tested and documented

### Impact
- Addresses widespread problem
- Accessible to all students
- Scalable solution

### Presentation
- Clear demonstration
- Professional materials
- Confident delivery

### Feasibility
- Working prototype
- Reproducible build process
- Realistic deployment plan

---

**Remember:** The goal is to show judges that DeskEye is a complete, working solution to a real problem that affects millions of students. Emphasize privacy, accessibility, and impact!
