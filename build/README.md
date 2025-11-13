# Build Assets

This directory contains assets needed for building installers.

## Required Files

### Windows
- **icon.ico** - Application icon (256x256 pixels, .ico format)

### macOS
- **icon.icns** - Application icon (multiple sizes, .icns format)
- **entitlements.mac.plist** - Entitlements for code signing

## Creating Icons

### From PNG (256x256)

**Using electron-icon-maker:**
```bash
npm install -g electron-icon-maker
electron-icon-maker --input=icon.png --output=./build
```

**Manual Creation:**
- Windows: Use online converter or GIMP to create .ico
- macOS: Use `iconutil` or online converter to create .icns

### Icon Requirements

**Windows (.ico):**
- Sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- Format: ICO
- Color depth: 32-bit with alpha channel

**macOS (.icns):**
- Sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- Format: ICNS
- Retina versions: @2x for each size

## Entitlements (macOS)

Create `entitlements.mac.plist` for camera access:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.device.camera</key>
    <true/>
</dict>
</plist>
```

## Placeholder Icons

Until you create proper icons, electron-builder will use default icons.
For production, create custom icons that represent your app.

## Icon Design Tips

- Use simple, recognizable design
- Eye-related imagery (for DeskEye)
- Works well at small sizes (16x16)
- High contrast for visibility
- Consistent with app branding
