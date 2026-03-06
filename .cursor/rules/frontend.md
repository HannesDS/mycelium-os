# Frontend conventions

- TypeScript strict mode. No `any` unless absolutely necessary.
- Every new component gets a Storybook story in the same directory.
- No hardcoded agent IDs — always import from `@/types/agent-events` (`ZENIK_AGENTS`) or `@/types/agents` (`AGENTS`).
- Run `pnpm --filter frontend tsc --noEmit` before opening a PR.
- Use Tailwind for styling. CSS modules only for complex animations.
- Path alias: `@/` maps to `src/`.
- Tests live in `__tests__/` directories adjacent to the code they test.
- Use Vitest + React Testing Library for component tests.
