# 🔐 Encrypted Notes

A privacy-focused, offline-first note-taking app with client-side encryption. Your notes, your device, your privacy.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.79-61dafb.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~53.0-000020.svg)](https://expo.dev/)

---

## ✨ Features

### 🔒 Privacy & Security First
- **100% Offline** - No data ever leaves your device
- **Client-Side Encryption** - Password-protected notes using ChaCha20-Poly1305
- **No Data Collection** - Zero telemetry, analytics, or tracking
- **No Cloud Storage** - Everything stays on your device
- **Open Source** - Transparent and auditable code

### 📝 Powerful Note-Taking
- **Rich Text Editor** - Format your notes with a full-featured toolbar
- **Checklists** - Create and manage to-do lists within notes
- **Attachments** - Add images, videos, and audio recordings
- **Links** - Save important URLs with descriptions
- **Tags** - Organize notes with custom tags
- **Color Coding** - Assign colors to notes for visual organization
- **Pin Notes** - Keep important notes at the top

### 🎨 User Experience
- **Multiple Themes** - Light, Dark, and Dusk modes
- **Multilingual** - German, English, and Russian support
- **App-Wide PIN** - Optional PIN lock for the entire app
- **Search** - Quickly find notes by title or content
- **Backup & Restore** - Export and import your notes as JSON

---

## 🔐 Security Details

### Encryption
- **Algorithm**: ChaCha20-Poly1305 (AEAD cipher)
- **Key Derivation**: Scrypt (N=2^9, r=8, p=1)
- **Key Length**: 256-bit
- **Random Nonce**: 96-bit per encryption

### Data Storage
- **Local Database**: SQLite with encrypted fields for protected notes
- **Encrypted Attachments**: Media files are encrypted when the note is locked
- **No Password Storage**: Passwords are never stored - lost passwords cannot be recovered

### Privacy Guarantees
- ✅ No internet permissions required
- ✅ No external API calls
- ✅ No third-party services
- ✅ No advertisements
- ✅ No user tracking

---

## 📱 Download

### Google Play Store
*Coming soon*

### Build from Source
See [Development Setup](#-development-setup) below.

---

## 🛠️ Technology Stack

- **Framework**: [React Native](https://reactnative.dev/) 0.79
- **Platform**: [Expo](https://expo.dev/) ~53.0
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Encryption**: [@noble/ciphers](https://github.com/paulmillr/noble-ciphers), [@noble/hashes](https://github.com/paulmillr/noble-hashes)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Rich Text**: [react-native-pell-rich-editor](https://github.com/wxik/react-native-rich-editor)
- **Media**: expo-image-picker, expo-av, expo-media-library
- **UI**: React Native core components with custom theming

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/seljak-solutions/encrypted-notes.git
   cd encrypted-notes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on a device/emulator**
   - Press `a` for Android
   - Press `i` for iOS (macOS only)
   - Scan QR code with Expo Go app

### Running on Specific Port
```bash
npx expo start --port 8081
```

---

## 📦 Building for Production

### Android APK/AAB

Using EAS Build (recommended):
```bash
npm install -g eas-cli
eas login
eas build --platform android
```

### iOS IPA

```bash
eas build --platform ios
```

For more details, see [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/).

---

## 📂 Project Structure

```
encrypted-notes/
├── app/                      # Expo Router pages (file-based routing)
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx        # Notes list screen
│   │   └── settings.tsx     # Settings screen
│   ├── note/[id].tsx        # Note detail/edit screen
│   └── _layout.tsx          # Root layout
├── src/
│   ├── components/          # Reusable UI components
│   ├── db/                  # SQLite database setup and schema
│   ├── features/            # Feature modules
│   │   ├── backup/          # Backup/restore logic
│   │   ├── media/           # Media attachment handling
│   │   ├── notes/           # Note repository and types
│   │   └── security/        # PIN and encryption
│   ├── hooks/               # Custom React hooks
│   ├── i18n/                # Internationalization (DE/EN/RU)
│   ├── stores/              # Zustand state stores
│   ├── theme/               # Theme definitions and colors
│   └── utils/               # Utility functions (encryption, etc.)
├── assets/                  # Images, fonts, icons
├── app.config.ts            # Expo configuration
├── eas.json                 # EAS Build configuration
└── package.json             # Dependencies
```

---

## 🌍 Localization

The app supports three languages:
- **German (DE)** - Primary language
- **English (EN)** - Secondary language
- **Russian (RU)** - Additional language

Language can be changed in Settings. All UI strings are defined in `src/i18n/translations.ts`.

---

## 🔧 Configuration

### App Configuration
Main configuration is in `app.config.ts`:
- App name and bundle ID
- Permissions (media, audio recording)
- Theme and icons
- Platform-specific settings

### Build Configuration
EAS Build settings are in `eas.json`:
- Development, preview, and production profiles
- Platform-specific build options

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for type safety
- Follow existing code formatting
- Add comments for complex logic
- Update translations for new UI strings

---

## 🐛 Bug Reports & Feature Requests

Please use [GitHub Issues](https://github.com/seljak-solutions/encrypted-notes/issues) to report bugs or request features.

**When reporting bugs, please include:**
- Device model and OS version
- App version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

---

## 📄 Privacy Policy

Our privacy policy is simple: **We don't collect any data.**

- No analytics
- No crash reporting
- No user tracking
- No cloud storage
- No external API calls

Read the full privacy policy: [privacy.html](https://github.com/seljak-solutions/encrypted-notes/blob/master/privacy.html)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Lukjan Artemenko**
Seljak Solutions

- Email: Seljak.Soulutions@gmail.com
- GitHub: [@seljak-solutions](https://github.com/seljak-solutions)

---

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Encryption powered by [@noble/ciphers](https://github.com/paulmillr/noble-ciphers)
- Icons from [@expo/vector-icons](https://docs.expo.dev/guides/icons/)

---

## ⭐ Support

If you find this project useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🔀 Contributing code

---

<p align="center">
  <strong>Your notes. Your device. Your privacy.</strong><br>
  Made with ❤️ for privacy-conscious users
</p>
