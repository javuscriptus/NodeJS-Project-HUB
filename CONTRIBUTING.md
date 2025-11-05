# Contributing to NodeJS Project Hub 🤝

Thank you for your interest in the project! We welcome any contribution — from fixing typos to adding new features.

> 📖 **[Русская версия / Russian Version](docs/CONTRIBUTING_ru.md)**

## 📋 Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Environment Setup](#environment-setup)
- [Code Style](#code-style)
- [Development Process](#development-process)
- [Submitting Pull Requests](#submitting-pull-requests)

## Code of Conduct

This project adheres to a Code of Conduct. By participating in this project, you agree to abide by its terms.

## How to Contribute

### 🐛 Report a Bug

1. Check that the bug hasn't already been [reported](https://github.com/javuscriptus/NodeJS-Project-HUB/issues)
2. If not found, [create a new issue](https://github.com/javuscriptus/NodeJS-Project-HUB/issues/new?template=bug_report.md)
3. Describe the problem in as much detail as possible:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - OS and Node.js version

### ✨ Suggest a Feature

1. Check [existing requests](https://github.com/javuscriptus/NodeJS-Project-HUB/issues?q=is%3Aissue+label%3Aenhancement)
2. [Create a Feature Request](https://github.com/javuscriptus/NodeJS-Project-HUB/issues/new?template=feature_request.md)
3. Describe:
   - The problem the feature solves
   - Proposed solution
   - Alternative options

### 💻 Contribute Code

1. Fork the repository
2. Create a branch from `main`: `git checkout -b feature/amazing-feature`
3. Make changes
4. Commit with a clear message: `git commit -m '✨ Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## Environment Setup

### Requirements

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git**

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/NodeJS-Project-HUB.git
cd NodeJS-Project-HUB

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Project Structure

```
project-hub/
├── src/
│   ├── main/          # Electron Main Process
│   ├── preload/       # Preload scripts
│   └── renderer/      # React UI
├── tests/             # Tests
├── scripts/           # Helper scripts
└── build/             # Build resources
```

## Code Style

### JavaScript/React

- Use project's **ESLint** configuration
- Follow **Prettier** rules
- Functional components with Hooks
- Naming:
  - `camelCase` for variables and functions
  - `PascalCase` for components
  - `UPPER_CASE` for constants

```javascript
// ✅ Good
const getUserData = async userId => {
  const data = await fetchUser(userId);
  return data;
};

// ❌ Bad
const get_user_data = async user_id => {
  const data = await fetchUser(user_id);
  return data;
};
```

### Git Commits

Use conventional commits with emojis:

- ✨ `:sparkles:` - New feature
- 🐛 `:bug:` - Bug fix
- 📝 `:memo:` - Documentation
- 🎨 `:art:` - UI/code style improvements
- ⚡ `:zap:` - Performance improvements
- ♻️ `:recycle:` - Refactoring
- ✅ `:white_check_mark:` - Add tests
- 🔧 `:wrench:` - Configuration changes
- 🚀 `:rocket:` - Deployment

```bash
git commit -m "✨ Add dark mode support"
git commit -m "🐛 Fix Git status detection"
git commit -m "📝 Update README with new features"
```

## Development Process

### 1. Before Starting Work

```bash
# Update main branch
git checkout main
git pull upstream main

# Create branch for task
git checkout -b feature/my-feature
```

### 2. Development

```bash
# Run in dev mode
npm run dev

# Run tests
npm test

# Check with linter
npm run lint

# Build
npm run build
```

### 3. Testing

- Ensure all existing tests pass
- Add tests for new functionality
- Check functionality on different OS (if possible)

### 4. Documentation

- Update README.md if new feature added
- Add JSDoc comments to functions
- Update CHANGELOG.md

## Submitting Pull Requests

### Checklist Before Submission

- [ ] Code follows project style
- [ ] All tests pass (`npm test`)
- [ ] No linter errors (`npm run lint`)
- [ ] Application builds (`npm run build`)
- [ ] Documentation added
- [ ] CHANGELOG.md updated
- [ ] Commits have clear messages

### Creating a PR

1. Push your branch to fork
2. Open Pull Request to main repository
3. Fill out PR template:
   - Description of changes
   - Related issues
   - Type of changes (bugfix/feature/docs/etc)
   - Screenshots (if UI changes)
4. Wait for review

### After Review

- Make requested changes
- Push updates to your branch
- Respond to comments
- Be ready for discussion

## 🙏 Thank You!

Every contribution matters, whether it's:

- 🐛 Fixing a typo
- 📝 Improving documentation
- ✨ Adding a new feature
- 💡 Suggesting an idea

Thank you for making NodeJS Project Hub better! 🚀

---

## Questions?

Don't hesitate to:

- Open a [Discussion](https://github.com/javuscriptus/NodeJS-Project-HUB/discussions)
- Create an [Issue](https://github.com/javuscriptus/NodeJS-Project-HUB/issues)
- Comment on Pull Requests
