# Camera Placement & Setup Guide

Optimal camera placement and environmental setup for best DeskEye performance.

## Quick Setup Checklist

- [ ] Camera 40-60 cm (16-24 inches) from face
- [ ] Camera at eye level or slightly above
- [ ] Face centered in frame
- [ ] Even, front-facing lighting
- [ ] No backlighting (windows behind you)
- [ ] Clean camera lens
- [ ] Stable camera position (not wobbling)

## Optimal Distance

### Recommended: 40-60 cm (16-24 inches)

**Why this distance?**
- Face fills 30-50% of frame
- Eye landmarks clearly visible
- Natural working distance for most desks
- Reduces false positives from movement

**Too Close (< 30 cm):**
- ❌ Face too large, may cut off
- ❌ Distortion from wide-angle lens
- ❌ Uncomfortable working position

**Too Far (> 80 cm):**
- ❌ Eyes too small for accurate detection
- ❌ Landmarks may be missed
- ❌ Lower detection confidence

### Testing Your Distance

1. Start DeskEye monitoring
2. Check webcam preview
3. Your face should occupy 30-50% of the frame
4. Both eyes should be clearly visible
5. Adjust distance if needed

## Camera Angle

### Recommended: Eye Level or Slightly Above

**Ideal Setup:**
```
        📷 Camera (slightly above eye level)
         |
         |
    👀 Your Eyes (looking straight ahead)
```

**Why this angle?**
- Natural head position
- Clear view of both eyes
- Minimal head tilt required
- Comfortable for long sessions

**Avoid:**
- ❌ Camera below eye level (looking up at you)
  - Distorts facial landmarks
  - Uncomfortable neck position
- ❌ Camera far above (looking down)
  - May miss eye details
  - Unnatural posture

### Laptop Users

**Built-in Webcam:**
- Laptop screen should be at eye level
- Use laptop stand if needed
- External keyboard/mouse recommended for ergonomics

**External Webcam:**
- Mount on top of monitor
- Adjust angle to point at face
- Ensure stable mounting

### Desktop Users

**Monitor-Mounted Webcam:**
- Center of monitor, top edge
- Tilt slightly downward
- Monitor at arm's length

**Separate Webcam:**
- Use tripod or desk mount
- Position at eye level
- Angle toward face

## Lighting Conditions

### Optimal Lighting

**Best Setup:**
```
    💡 Light Source
     |
     ↓
   😊 You
     ↑
     |
    📷 Camera
```

**Key Principles:**
1. **Front Lighting** - Light source in front of you
2. **Even Illumination** - No harsh shadows on face
3. **Soft Light** - Diffused, not direct spotlight
4. **Adequate Brightness** - Not too dim, not too bright

### Good Lighting Sources

✅ **Natural Light (Indirect)**
- Window to your side or front
- Curtains/blinds to diffuse
- Avoid direct sunlight

✅ **Desk Lamp**
- Positioned in front, slightly to side
- Warm white LED (3000-4000K)
- Adjustable brightness

✅ **Ceiling Light**
- Even overhead lighting
- Not directly above (creates shadows)

✅ **Ring Light**
- Ideal for consistent lighting
- Adjustable brightness
- Reduces shadows

### Lighting to Avoid

❌ **Backlighting**
- Window behind you
- Bright light behind you
- Creates silhouette effect
- Face appears dark

❌ **Side Lighting (Strong)**
- One side of face too bright
- Other side in shadow
- Uneven landmark detection

❌ **Overhead Only**
- Creates shadows under eyes
- Nose shadow on face
- Reduces detection accuracy

❌ **Too Dim**
- Camera struggles to see details
- Grainy image
- Poor landmark detection

❌ **Too Bright**
- Overexposed image
- Washed out features
- Glare on glasses

### Testing Your Lighting

1. Start DeskEye monitoring
2. Check webcam preview
3. Your face should be:
   - Clearly visible
   - Evenly lit
   - No harsh shadows
   - Natural skin tones
4. Adjust lighting if needed

## Glasses Considerations

### Regular Glasses

✅ **Usually Work Fine**
- Clear lenses: No issues
- Light tint: Usually okay
- Anti-reflective coating: Best

⚠️ **May Cause Issues**
- Strong reflections
- Thick frames covering eyes
- Very dark tint

**Tips:**
- Adjust lighting to reduce glare
- Tilt glasses slightly if reflective
- Clean lenses regularly

### Sunglasses / Tinted Glasses

❌ **Not Recommended**
- Eyes not visible
- Landmarks cannot be detected
- Remove for monitoring

### Blue Light Glasses

✅ **Usually Fine**
- Light tint: No issues
- Clear lenses with coating: Perfect

## Environmental Factors

### Stable Setup

✅ **Good:**
- Camera mounted securely
- Desk against wall
- Stable chair
- Minimal vibration

❌ **Avoid:**
- Wobbly desk
- Unstable camera mount
- High-traffic area (people walking by)
- Near vibration sources

### Background

**Doesn't Matter Much:**
- DeskEye focuses on your face
- Background is ignored
- Any background works

**For Best Performance:**
- Uncluttered background
- Contrasting with your face
- Not too busy/distracting

### Room Conditions

✅ **Ideal:**
- Quiet (for focus)
- Comfortable temperature
- Good air circulation
- Minimal distractions

## Troubleshooting Detection Issues

### Face Not Detected

**Possible Causes:**
1. Too far from camera
2. Face not centered
3. Poor lighting
4. Camera blocked/dirty

**Solutions:**
- Move closer (40-60 cm)
- Center face in frame
- Improve lighting
- Clean camera lens

### Eyes Not Detected

**Possible Causes:**
1. Eyes closed/squinting
2. Glasses glare
3. Hair covering eyes
4. Looking away from camera

**Solutions:**
- Open eyes normally
- Adjust glasses angle
- Move hair away from eyes
- Look toward camera

### Inaccurate Blink Detection

**Possible Causes:**
1. Lighting too dim/bright
2. Camera angle too steep
3. Glasses reflections
4. Rapid head movement

**Solutions:**
- Adjust lighting
- Reposition camera
- Reduce glare
- Keep head relatively still

### Status Flickering

**Possible Causes:**
1. Borderline lighting
2. Unstable camera
3. Rapid eye movements
4. Threshold too sensitive

**Solutions:**
- Improve lighting consistency
- Stabilize camera
- Adjust thresholds in Settings
- Increase window size in Settings

## Optimal Desk Setup

### Ergonomic Arrangement

```
                    💡 Overhead Light
                     |
    💡 Desk Lamp     |
     |               |
     ↓               ↓
   😊 You ←-------- 📷 Camera (on monitor)
     ↑
     |
   🖥️ Monitor (eye level)
     |
   ⌨️ Keyboard
```

**Key Points:**
1. Monitor at arm's length
2. Top of screen at eye level
3. Camera centered on monitor
4. Desk lamp to side/front
5. Chair at proper height

### Laptop Setup

```
    💡 Light Source
     |
     ↓
   😊 You
     ↑
     |
   📷 Laptop (on stand)
     |
   ⌨️ External Keyboard
```

**Key Points:**
1. Laptop on stand (screen at eye level)
2. External keyboard/mouse
3. Camera at top of screen
4. Light source in front

## Testing Your Setup

### Quick Test Procedure

1. **Start DeskEye**
   ```bash
   npm run dev
   ```

2. **Check Preview**
   - Face visible and centered?
   - Eyes clearly visible?
   - Lighting even?

3. **Test Detection**
   - Click "Start Monitoring"
   - Blink normally
   - Check if blinks detected
   - Verify metrics updating

4. **Test Strain Detection**
   - Stare without blinking for 30 seconds
   - Status should change to yellow/red
   - Break modal should appear

5. **Adjust as Needed**
   - Move camera if needed
   - Adjust lighting
   - Retest

### Validation Checklist

- [ ] Face detection: Consistent green outline
- [ ] Eye landmarks: Visible on both eyes
- [ ] Blink detection: Responds to actual blinks
- [ ] Metrics: Blink rate 10-25 blinks/min
- [ ] Status: Changes appropriately
- [ ] No flickering or jumping
- [ ] Comfortable working position

## Advanced Tips

### Multiple Monitors

- Place camera on center monitor
- Face center monitor when working
- Consider camera on adjustable arm

### Standing Desk

- Adjust camera height when changing desk height
- Consider camera on separate stand
- Test at both sitting and standing heights

### Shared Workspace

- Use privacy screen if concerned
- Position camera to minimize background
- Consider headphones for audio alerts

### Low-Light Environments

- Use desk lamp with adjustable brightness
- Consider USB-powered LED light
- Increase camera exposure in settings (if available)

### High-Light Environments

- Use curtains/blinds to control light
- Position desk perpendicular to windows
- Reduce camera exposure if too bright

## Recommended Products

### Webcams (if upgrading)

- **Budget:** Logitech C270 ($30)
- **Mid-Range:** Logitech C920 ($70)
- **Premium:** Logitech Brio 4K ($200)

**Features to Look For:**
- 720p or higher resolution
- 30 FPS or higher
- Auto-focus
- Good low-light performance

### Lighting

- **Budget:** Clip-on desk lamp ($15)
- **Mid-Range:** Adjustable LED desk lamp ($40)
- **Premium:** Ring light with stand ($80)

### Mounts

- **Laptop Stand:** Adjustable aluminum stand ($30)
- **Monitor Mount:** Clip-on webcam mount ($15)
- **Tripod:** Small desktop tripod ($20)

## Summary

**Quick Setup:**
1. Camera 40-60 cm from face
2. Eye level or slightly above
3. Front lighting, no backlighting
4. Face centered in frame
5. Test and adjust

**Common Issues:**
- Too far → Move closer
- Poor lighting → Add front light
- Glare on glasses → Adjust angle
- Flickering → Stabilize camera

**Best Results:**
- Consistent setup
- Good lighting
- Stable camera
- Comfortable position

For more help, see [README.md](../README.md) or open an issue on GitHub.
