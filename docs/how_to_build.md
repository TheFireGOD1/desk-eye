# DeskEye Build Guide

Complete instructions for building DeskEye installers for Windows and macOS.

## Prerequisites

### All Platforms
- **Node.js** 16.x or higher ([download](https://nodejs.org/))
- **npm** 8.x or higher (comes with Node.js)
- **Git** for cloning the repository
- **Webcam** for testing

### Windows-Specific
- Windows 10 or 11 (x64)
- No additional tools required (electron-builder handles everything)

### macOS-Specific
- macOS 10.14 (Mojave) or higher
- Xcode Command Line Tools: `xcode-select --install`
- For code signing (optional): Apple Developer account

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/desk-eye.git
cd desk-eye

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Development Mode

### Starting the App

```bash
npm run dev
# or
npm start
```

This launches Electron in development mode with:
- Hot reload (restart app to see changes)
- DevTools enabled
- Console logging visible

### Development Tips

1. **Reload the App**: Press `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac) in the main window
2. **Open DevTools**: Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
3. **Check Logs**: Look at the terminal where you ran `npm run dev`

## Building Installers

### Build for Current Platform

```bash
npm run build
```

This builds an installer for your current operating system.

### Build for Windows (from any platform)

```bash
npm run build:win
```

**Output:**
- `dist/DeskEye Setup 1.0.0.exe` - NSIS installer
- `dist/win-unpacked/` - Unpacked application files

**Installer Features:**
- One-click or custom installation directory
- Desktop shortcut creation
- Start menu shortcut
- Uninstaller included

### Build for macOS (from macOS only)

```bash
npm run build:mac
```

**Output:**
- `dist/DeskEye-1.0.0.dmg` - DMG installer
- `dist/DeskEye-1.0.0-arm64.dmg` - Apple Silicon version
- `dist/mac/DeskEye.app` - Application bundle

**Note:** Building for macOS from Windows/Linux is not supported by electron-builder.

### Build for All Platforms

```bash
npm run build:all
```

Builds for both Windows and macOS (must run on macOS).

## Build Configuration

### package.json Build Section

```json
{
  "build": {
    "appId": "com.deskeye.app",
    "productName": "DeskEye",
    "directories": {
      "output": "dist",
      "buildResources": "build"
    },
    "files": [
      "src/**/*",
      "config/**/*",
      "package.json"
    ],
    "win": {
      "target": ["nsis"],
      "icon": "build/icon.ico"
    },
    "mac": {
      "target": ["dmg"],
      "category": "public.app-category.healthcare-fitness",
      "icon": "build/icon.icns"
    }
  }
}
```

### Customizing the Build

Edit `package.json` to customize:
- App name and ID
- Icon files
- Target formats (NSIS, MSI, DMG, PKG, etc.)
- File associations
- Auto-update settings

## Icons

### Required Icon Files

Place in `build/` directory:

**Windows:**
- `icon.ico` - 256x256 pixels, .ico format

**macOS:**
- `icon.icns` - Multiple sizes, .icns format

### Creating Icons

**From PNG (256x256):**

```bash
# Install icon converter
npm install -g electron-icon-maker

# Generate icons
electron-icon-maker --input=icon.png --output=./build
```

**Manual Creation:**
- Windows: Use online converter or GIMP to create .ico
- macOS: Use `iconutil` or online converter to create .icns

## Code Signing (Optional but Recommended)

### Windows Code Signing

**Requirements:**
- Code signing certificate (.pfx or .p12 file)
- Certificate password

**Setup:**

1. Obtain a code signing certificate from a CA (e.g., DigiCert, Sectigo)
2. Set environment variables:

```bash
# Windows
set CSC_LINK=path\to\certificate.pfx
set CSC_KEY_PASSWORD=your_password

# macOS/Linux
export CSC_LINK=path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password
```

3. Build:

```bash
npm run build:win
```

### macOS Code Signing & Notarization

**Requirements:**
- Apple Developer account ($99/year)
- Developer ID Application certificate
- App-specific password for notarization

**Setup:**

1. Install certificate in Keychain Access
2. Create app-specific password at appleid.apple.com
3. Set environment variables:

```bash
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app-specific-password
export APPLE_TEAM_ID=your-team-id
```

4. Create `build/entitlements.mac.plist`:

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

5. Build:

```bash
npm run build:mac
```

**Note:** Notarization can take 5-30 minutes. Check status with:

```bash
xcrun altool --notarization-history 0 -u your@email.com -p app-specific-password
```

## Testing the Build

### Windows

1. Locate installer: `dist/DeskEye Setup 1.0.0.exe`
2. Run installer
3. Test on a fresh user account (non-admin)
4. Verify:
   - App launches
   - Camera permission requested
   - Settings persist
   - Uninstaller works

### macOS

1. Locate DMG: `dist/DeskEye-1.0.0.dmg`
2. Open DMG and drag app to Applications
3. First launch: Right-click → Open (to bypass Gatekeeper if unsigned)
4. Verify:
   - App launches
   - Camera permission requested
   - Settings persist
   - App can be deleted cleanly

## Troubleshooting

### Build Fails with "Cannot find module"

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Windows Build Fails

- Ensure you have write permissions to `dist/` directory
- Disable antivirus temporarily (may block electron-builder)
- Run as administrator if needed

### macOS Build Fails

- Install Xcode Command Line Tools: `xcode-select --install`
- Accept Xcode license: `sudo xcodebuild -license accept`
- Check disk space (builds require ~500MB)

### "Electron failed to install correctly"

```bash
# Rebuild native modules
npm rebuild
# or
./node_modules/.bin/electron-rebuild
```

### Camera Not Working in Built App

- Check `build/entitlements.mac.plist` includes camera permission (macOS)
- Verify app is signed (unsigned apps may have permission issues)
- Test on a different machine

## Distribution

### Windows

**Options:**
1. **Direct Download** - Host .exe on website
2. **Microsoft Store** - Submit via Partner Center
3. **Chocolatey** - Create package for Chocolatey
4. **Winget** - Submit to Windows Package Manager

**Recommended:** Direct download with code signing

### macOS

**Options:**
1. **Direct Download** - Host .dmg on website
2. **Mac App Store** - Submit via App Store Connect (requires additional setup)
3. **Homebrew Cask** - Create cask formula

**Recommended:** Direct download with notarization

### GitHub Releases

```bash
# Create release
git tag v1.0.0
git push origin v1.0.0

# Upload installers to GitHub Releases
# Use GitHub web interface or gh CLI
gh release create v1.0.0 dist/*.exe dist/*.dmg
```

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - run: npm install
      - run: npm run build:win
      - uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: dist/*.exe

  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - run: npm install
      - run: npm run build:mac
      - uses: actions/upload-artifact@v3
        with:
          name: mac-installer
          path: dist/*.dmg
```

## Build Scripts

### Custom Build Scripts

Located in `scripts/` directory:

**scripts/build_win.sh** (Git Bash on Windows):
```bash
#!/bin/bash
echo "Building for Windows..."
npm run build:win
echo "Build complete! Installer: dist/DeskEye Setup 1.0.0.exe"
```

**scripts/build_mac.sh** (macOS/Linux):
```bash
#!/bin/bash
echo "Building for macOS..."
npm run build:mac
echo "Build complete! Installer: dist/DeskEye-1.0.0.dmg"
```

**scripts/dev_start.sh** (Development):
```bash
#!/bin/bash
echo "Starting DeskEye in development mode..."
npm run dev
```

Make executable:
```bash
chmod +x scripts/*.sh
```

## Performance Optimization

### Reducing Build Size

1. **Remove dev dependencies from build:**
   - Already configured in `package.json` files section

2. **Compress with UPX (Windows):**
```json
{
  "build": {
    "win": {
      "target": {
        "target": "nsis",
        "arch": ["x64"]
      },
      "compression": "maximum"
    }
  }
}
```

3. **Exclude unnecessary files:**
```json
{
  "build": {
    "files": [
      "src/**/*",
      "config/**/*",
      "!**/*.md",
      "!tests/**/*"
    ]
  }
}
```

## Version Management

### Updating Version

1. Update `package.json`:
```json
{
  "version": "1.0.1"
}
```

2. Update `src/renderer/index.html` (if version displayed)

3. Commit and tag:
```bash
git commit -am "Bump version to 1.0.1"
git tag v1.0.1
git push origin main --tags
```

## Support

### Build Issues

- Check [electron-builder docs](https://www.electron.build/)
- Search [GitHub issues](https://github.com/electron-userland/electron-builder/issues)
- Ask in project discussions

### Platform-Specific Help

- **Windows:** [NSIS documentation](https://nsis.sourceforge.io/Docs/)
- **macOS:** [Apple Developer docs](https://developer.apple.com/documentation/)

---

## Summary

**Quick Build Commands:**
```bash
npm install          # Install dependencies
npm run dev          # Development mode
npm run build        # Build for current platform
npm run build:win    # Build for Windows
npm run build:mac    # Build for macOS
npm test             # Run tests
```

**Output Locations:**
- Windows: `dist/DeskEye Setup 1.0.0.exe`
- macOS: `dist/DeskEye-1.0.0.dmg`

**Next Steps:**
1. Test installer on clean system
2. Sign code (recommended)
3. Create GitHub release
4. Distribute to users

For questions or issues, see the main [README.md](../README.md) or open an issue on GitHub.
