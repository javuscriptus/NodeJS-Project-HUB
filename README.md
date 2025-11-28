<div align="center">

# 🚀 NodeJS Project Hub

**Desktop application for managing Node.js projects**

Quick access to npm scripts, git operations and project navigation

[![Build Status](https://github.com/javuscriptus/NodeJS-Project-HUB/workflows/Build%20and%20Test/badge.svg)](https://github.com/javuscriptus/NodeJS-Project-HUB/actions)
[![Release](https://img.shields.io/github/v/release/javuscriptus/NodeJS-Project-HUB)](https://github.com/javuscriptus/NodeJS-Project-HUB/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)](https://github.com/javuscriptus/NodeJS-Project-HUB)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Downloads](https://img.shields.io/github/downloads/javuscriptus/NodeJS-Project-HUB/total)](https://github.com/javuscriptus/NodeJS-Project-HUB/releases)
[![Stars](https://img.shields.io/github/stars/javuscriptus/NodeJS-Project-HUB?style=social)](https://github.com/javuscriptus/NodeJS-Project-HUB)

[Download](https://github.com/javuscriptus/NodeJS-Project-HUB/releases) • [Documentation](#usage) • [Roadmap](#roadmap-v30) • [Contributing](CONTRIBUTING.md) • [Improvements](SUGGESTED_IMPROVEMENTS.md)

![NodeJS Project Hub](https://via.placeholder.com/800x450/1a1a2e/16a085?text=NodeJS+Project+Hub+Screenshot)

</div>

> 📖 **[Русская версия / Russian Version](docs/README_ru.md)**  
> 🎯 **[Suggested Improvements / Предложения по улучшению](SUGGESTED_IMPROVEMENTS.md)**

---

## Features

### Core Functionality

- 🔍 Quick project search by name and notes
- 🚀 One-click npm/yarn/pnpm script execution
- 🔄 Git pull for quick code updates
- 📁 Open projects in Windows Explorer
- ⚡ Caching for fast scanning
- 🎨 Modern UI with Tailwind CSS

### New in v2.0 🎉

- 🟢 **Node.js Version Management** - Auto-detect and use Node.js versions (nvm/volta/fnm)
- 🔍 **Smart Search** - Intelligent search with transliteration (Cyrillic ↔ Latin), tags and aliases
- 💻 **Terminal Detection** - Auto-detect terminal (Git Bash, PowerShell, CMD)
- 🌿 **Git Intelligence** - Track remote status of branches (customizable per project)
- 📋 **Detail Panel** - Side panel with README, commits and project info
- 🔄 **Auto-Updates** - Automatic application updates

## System Requirements

- Windows 10 (1903+) or Windows 11
- 512 MB RAM for the application
- 200 MB free disk space
- Git (for git operations)
- Node.js version manager (optional): nvm-windows, volta or fnm

## Installation

### For Users

📦 **Installer ready!** The file `nodejs project hub Setup 2.0.0.exe` (92 MB) is in the `dist/` folder

1. Run `nodejs project hub Setup 2.0.0.exe`
2. Follow the installer instructions (you can choose the installation folder)
3. After installation, the application will be available via a desktop shortcut
4. On first launch, specify the root folder with your projects

### For Developers

```bash
# Clone the repository
git clone https://github.com/javuscriptus/NodeJS-Project-HUB.git
cd NodeJS-Project-HUB

# Install dependencies
npm install

# Run in development mode
npm run dev

# In another terminal, run Electron
npm start
```

## Development

### Project Structure

```
nodejs-project-hub/
├── docs/                   # Documentation
├── src/
│   ├── main/              # Electron Main Process
│   │   ├── index.js       # Entry point
│   │   ├── projectScanner.js
│   │   ├── gitOperations.js
│   │   ├── npmOperations.js
│   │   └── config.js
│   ├── preload/           # IPC Bridge
│   │   └── index.js
│   └── renderer/          # React UI
│       └── src/
│           ├── App.jsx
│           └── components/
├── build/                 # Icons and resources
├── package.json
└── vite.config.js
```

### Commands

```bash
# Development (Vite dev server)
npm run dev

# Run Electron (in separate terminal after npm run dev)
npm start

# Build renderer process
npm run build

# Build Windows installer
npm run build:win

# Testing
npm test

# Watch mode for tests
npm run test:watch
```

### Technologies

- **Electron** 39+ - Desktop framework
- **React** 19+ - UI library
- **Vite** 6+ - Build tool
- **Tailwind CSS** 3.4+ - CSS framework (+ Typography plugin)
- **electron-builder** 26+ - Application packaging
- **electron-updater** 6+ - Auto-updates
- **electron-log** 5+ - Logging
- **marked** + **dompurify** - Markdown rendering
- **transliteration** - Transliteration support for search
- **Vitest** 4+ - Unit testing

## Usage

### First Launch

1. On first launch, the settings window will open
2. Click "Select Folder" and specify the root folder with your projects (e.g., `C:\Dev`)
3. Click "Save"
4. Click "Scan" to search for projects

### Main Features

**Project Scanning:**
- The application searches for all folders with `package.json` + `.git`
- Results are cached for fast rescanning

**Smart Search:**
- Enter project name (Cyrillic and Latin supported)
- Search by tags, aliases and project notes
- Tag filtering via UI
- Real-time results (debounce 300ms)

**Running npm Scripts:**
- Buttons are displayed only for existing scripts
- Click opens a new terminal window with the running command

**Git Operations:**
- Git pull: Executes `git pull origin dev` with result notification
- Git Remote Status: Track branch status (customizable per project)
  - ✅ Up-to-date - branch is current
  - 🔽 Behind - shows number of commits behind remote
  - ⚠️ Error - connection issues (VPN, offline)

**Open Folder:**
- 📁 button opens the project in Windows Explorer

**Detail Panel:**
- 📋 button opens side panel with detailed information
- **README Tab**: View README.md with beautiful typography
- **Commits Tab**: History of last 10 commits
- **Info Tab**: Data from package.json, Node.js version, branch list

**Project Management:**
- ⚙️ button opens project settings
- Add/remove tags for organization
- Create aliases for quick search
- Add notes to projects
- **NEW**: Select branches to track for remote status

## Configuration

Settings are stored in:
```
C:\Users\<Username>\AppData\Roaming\BettingsProjectHub\config.json
```

Logs are stored in:
```
C:\Users\<Username>\AppData\Roaming\BettingsProjectHub\logs\main.log
```

## Documentation

Full documentation is in the `docs/` folder:

- `01-product-requirements.md` - Product requirements, personas, user stories
- `02-ux-architecture.md` - UX flow, architecture, IPC contracts
- `03-implementation-plan.md` - Release plan, risks, testing

## Security

- ✅ Context Isolation enabled
- ✅ Node Integration disabled
- ✅ Sandbox enabled
- ✅ Path validation
- ✅ Whitelist for npm scripts
- ✅ Command argument escaping

## 🤝 Contributing

We welcome contributions from the community! Please see [Contributing Guide](CONTRIBUTING.md).

### How to Help

- 🐛 [Report a bug](https://github.com/javuscriptus/NodeJS-Project-HUB/issues/new?template=bug_report.md)
- ✨ [Suggest a feature](https://github.com/javuscriptus/NodeJS-Project-HUB/issues/new?template=feature_request.md)
- 📖 Improve documentation
- 🔀 Submit a Pull Request

### Contributors

<a href="https://github.com/javuscriptus/NodeJS-Project-HUB/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=javuscriptus/NodeJS-Project-HUB" />
</a>

## 📄 License

This project is licensed under the [MIT](LICENSE) license.

## 🆘 Support

If you have problems:

1. 📖 Check the [documentation](#usage)
2. 🔍 Search in [Issues](https://github.com/javuscriptus/NodeJS-Project-HUB/issues)
3. 💬 Create a [new Issue](https://github.com/javuscriptus/NodeJS-Project-HUB/issues/new)
4. 📝 Check logs in `AppData\Roaming\BettingsProjectHub\logs`

### Common Issues

<details>
<summary>Git operations don't work</summary>

- Make sure Git is installed and available in PATH
- Check access rights to project folders
- For GitLab use Git Credential Manager:
  ```bash
  git config --global credential.helper manager
  ```
</details>

<details>
<summary>Projects not displayed</summary>

- Make sure the folder has `package.json` and `.git`
- Check the path to the root folder of projects
- Try rescanning projects
</details>

<details>
<summary>Scripts don't run</summary>

- Check that Node.js is installed
- Make sure package.json contains scripts section
- Check the selected terminal in settings
</details>

## Roadmap v3.0

- [ ] Full yarn and pnpm package manager support
- [ ] Check outdated dependencies
- [ ] Monorepo support (lerna, nx, turborepo)
- [ ] GitHub Actions/CI status integration
- [ ] Export/import project configuration
- [ ] Global file content search
- [ ] Dark/light theme switching
- [ ] Multi-branch projects with multiple branch tracking

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=javuscriptus/NodeJS-Project-HUB&type=Date)](https://star-history.com/#javuscriptus/NodeJS-Project-HUB&Date)

---

<div align="center">

**Made with ❤️ for Node.js developers**

[⬆ Back to Top](#-nodejs-project-hub)

</div>

