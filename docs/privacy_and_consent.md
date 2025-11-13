# Privacy Policy & Consent Information

## DeskEye Privacy Policy

**Last Updated:** November 2024

### Our Commitment to Privacy

DeskEye is designed with privacy as a core principle. We believe that health monitoring should never compromise your personal privacy.

### What Data We Collect

DeskEye collects and stores the following data **locally on your device only**:

1. **Aggregated Eye Metrics**
   - Blink rate (blinks per minute)
   - Average Eye Aspect Ratio (EAR)
   - Calculated strain probability scores
   - Timestamps of measurements
   - Break events (when you took breaks)

2. **Application Settings**
   - Your preferences (pipeline choice, thresholds, etc.)
   - Accessibility settings
   - Audio preferences

### What Data We DO NOT Collect

- ❌ Raw webcam video or images (unless explicitly enabled by you)
- ❌ Your identity or personal information
- ❌ Your location
- ❌ Your browsing history or other app usage
- ❌ Any data from your computer beyond the app itself

### Data Storage

All data is stored locally on your computer in:
- SQLite database: `~/.config/deskeye/deskeye.db` (Linux/Mac) or `%APPDATA%/deskeye/deskeye.db` (Windows)
- Settings file: Managed by electron-store in the same directory

**No data is ever uploaded to any server or cloud service.**

### Optional Raw Image Storage

By default, DeskEye does **NOT** save raw webcam images. However, you can enable this feature in Settings for debugging or model training purposes.

⚠️ **Warning:** If you enable "Save Raw Images":
- Webcam frames will be saved to your local storage
- These images will contain your face and surroundings
- Images are stored in: `~/.config/deskeye/raw_images/`
- You can set automatic deletion after a retention period
- This feature is disabled by default and requires explicit opt-in

### Data Retention

- Aggregated metrics are kept for 90 days by default
- You can export your data to CSV at any time
- You can delete all data by uninstalling the application
- Raw images (if enabled) can be set to auto-delete after 1-30 days

### Your Rights

You have the right to:
- ✅ Access all your stored data (via Dashboard and CSV export)
- ✅ Delete your data at any time (uninstall or clear database)
- ✅ Disable monitoring at any time
- ✅ Control what data is collected (via Settings)
- ✅ Use the app completely offline

### Third-Party Services

DeskEye uses the following third-party libraries for processing:
- **MediaPipe Face Mesh** - Loaded from CDN for face landmark detection
- **TensorFlow.js** - Optional, for ML-based detection
- **Chart.js** - Loaded from CDN for data visualization

These libraries run entirely in your browser/app and do not send data to external servers.

### Changes to Privacy Policy

We may update this privacy policy from time to time. Any changes will be reflected in the app and documentation.

### Contact

For privacy concerns or questions:
- GitHub Issues: [github.com/yourusername/desk-eye/issues](https://github.com/yourusername/desk-eye/issues)
- Email: privacy@deskeye.example.com

---

## Informed Consent for Research/Testing

### For Adult Users (18+)

By using DeskEye, you acknowledge that:
1. The app accesses your webcam for eye monitoring
2. All processing happens locally on your device
3. No raw video is stored unless you explicitly enable it
4. The app is provided "as-is" for educational and personal use
5. You can stop using the app at any time

### For Minor Users (Under 18)

**Parental/Guardian Consent Required**

If you are under 18 years old, you must have a parent or legal guardian read and agree to the following before using DeskEye:

---

## Parental/Guardian Consent Form

**Purpose:** DeskEye is an educational project designed to help students monitor and reduce eye strain from computer use.

**What the app does:**
- Accesses the device's webcam to monitor eye movements
- Analyzes eye features (blink rate, eye openness) to detect signs of eye strain
- Provides reminders to take breaks when strain is detected
- Stores only aggregated health metrics (no raw video by default)

**Data Collection:**
- Aggregated metrics only (blink rate, strain scores, timestamps)
- No personally identifiable information
- No raw video or images (unless explicitly enabled)
- All data stored locally on the device

**Risks:**
- Minimal risk - similar to using any webcam application
- Potential for false positives/negatives in strain detection
- App is not a medical device and should not replace professional eye care

**Benefits:**
- May help reduce digital eye strain
- Encourages healthy screen time habits
- Educational tool for understanding eye health

**Voluntary Participation:**
- Use of this app is completely voluntary
- You or your child can stop using it at any time
- No penalty for not participating or discontinuing use

**Privacy:**
- All data remains on the local device
- No data is shared with third parties
- No data is uploaded to any server

**Questions:**
- Contact the development team via GitHub or email

---

### Consent Statement

I, _________________________ (parent/guardian name), give permission for my child, _________________________ (child's name), to use the DeskEye application.

I have read and understood:
- The purpose of the application
- What data is collected and how it is stored
- The privacy protections in place
- That participation is voluntary

**Signature:** _________________________

**Date:** _________________________

**Relationship to Minor:** _________________________

---

## For Educators and School Use

If you plan to use DeskEye in a classroom or school setting:

1. **Obtain Consent:** Collect signed consent forms from all parents/guardians
2. **Review Privacy:** Ensure compliance with school privacy policies (FERPA, COPPA, etc.)
3. **Supervise Use:** Monitor student use of the application
4. **Disable Raw Images:** Ensure "Save Raw Images" is disabled in Settings
5. **Data Management:** Establish clear policies for data retention and deletion

### COPPA Compliance

For users under 13 in the United States:
- DeskEye does not collect personal information as defined by COPPA
- No data is transmitted to operators
- Parental consent is still recommended as a best practice

### FERPA Compliance

For educational institutions:
- DeskEye data is stored locally on student devices
- No education records are created or transmitted
- Schools should still follow their privacy policies

---

## Research Use

If you plan to use DeskEye data for research purposes:

1. **IRB Approval:** Obtain Institutional Review Board approval
2. **Informed Consent:** Use appropriate consent forms for your institution
3. **Data Anonymization:** Ensure any shared data is properly anonymized
4. **Ethical Guidelines:** Follow all applicable research ethics guidelines

---

## Questions or Concerns?

If you have any questions about privacy, consent, or data handling:
- Read the full documentation in the `docs/` folder
- Open an issue on GitHub
- Contact the development team

**Remember:** Your privacy and safety are our top priorities. If you're ever uncomfortable with how the app works, please don't hesitate to stop using it and reach out with your concerns.
