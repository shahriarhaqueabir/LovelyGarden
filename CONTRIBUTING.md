# Contributing to LovelyGarden

Thank you for your interest in contributing to LovelyGarden!

## Coding Standards

- **TypeScript**: Use TypeScript strict mode. All new code must be typed.
- **Styling**: Use Tailwind CSS for all styling. Avoid custom CSS when possible.
- **State Management**: Use Zustand for global state. Keep component state local when appropriate.
- **Data Layer**: Use RxDB for data persistence. Follow existing schema patterns in `src/schema/`.
- **Components**: Use functional components with React hooks. Use `React.lazy` for code splitting.
- **Validation**: Use Zod schemas from `src/schema/zod-schemas.ts` for runtime validation.

## Commit Rules

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring without feature changes
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples

```
feat(garden): add support for companion planting alerts
fix(db): resolve import validation error
docs: update README with new setup instructions
```

## Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes following the coding standards
4. Run `pnpm lint` to ensure code quality
5. Run `pnpm build` to verify the build passes
6. Commit using conventional commit format
7. Push and create a pull request

## Pull Request Guidelines

- Provide a clear description of changes
- Reference any related issues
- Ensure all checks pass
- Keep PRs focused on a single concern
