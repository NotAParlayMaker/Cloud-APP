# Contributing to OpenSportsAnalytics

Thank you for your interest in contributing to OpenSportsAnalytics! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect differing viewpoints
- Show empathy towards others

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/opensportsanalytics/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, versions)

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach
   - Any relevant examples

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

#### PR Guidelines

- Reference related issues
- Provide clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed
- Follow code style guidelines

## Development Setup

See [README.md](./README.md#getting-started) for setup instructions.

## Code Style

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint rules
- Use meaningful variable names
- Add comments for complex logic
- Prefer `const` over `let`
- Use async/await over callbacks

### React

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript interfaces for props
- Extract reusable logic into custom hooks

### Backend

- Use service layer pattern
- Keep routes thin, logic in services
- Use async/await for async operations
- Handle errors properly
- Validate input data

## Testing

- Write unit tests for services
- Test API endpoints
- Test edge cases
- Maintain test coverage

## Documentation

- Update README for major changes
- Add JSDoc comments for functions
- Document API changes
- Update changelog

## Commit Messages

Use conventional commits:

- `feat: Add new feature`
- `fix: Fix bug`
- `docs: Update documentation`
- `style: Code style changes`
- `refactor: Code refactoring`
- `test: Add tests`
- `chore: Maintenance tasks`

## Review Process

1. Maintainers review PRs
2. Address feedback
3. Get approval from at least one maintainer
4. PR will be merged

## Community

- Be patient and respectful
- Help others learn
- Share knowledge
- Celebrate contributions

## Questions?

Open a discussion or reach out to maintainers.

Thank you for contributing!
