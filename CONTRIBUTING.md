# Contributing to suncalc3-ts

Thanks for your interest in contributing! This document describes how to get
set up and what we expect from contributions.

## Getting started

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/hbmartin/suncalc3-ts.git
cd suncalc3-ts
npm ci
```

## Development workflow

| Command                  | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `npm test`               | Run the test suite once                       |
| `npm run test:watch`     | Run the tests in watch mode                   |
| `npm run coverage`       | Run the tests with a coverage report          |
| `npm run typecheck`      | Type-check all sources and tests              |
| `npm run eslint-check`   | Lint (`eslint-fix` to auto-fix)               |
| `npm run prettier-check` | Check formatting (`prettier-fix` to auto-fix) |
| `npm run build`          | Compile to `dist/`                            |
| `npm run docs`           | Generate the API docs with TypeDoc            |

All of these run in CI on every pull request, so please make sure they pass
locally before pushing.

## Guidelines

- **Keep the public API stable.** This library is used as a drop-in
  replacement for suncalc3; breaking changes need a strong justification and
  a major version bump.
- **Add tests** for every behavior change or bug fix. Reference values for
  astronomical results should come from a trustworthy source (e.g. the
  original suncalc test data, suncalc.org, or NOAA) and use an appropriate
  tolerance.
- **Timezone-sensitive code**: the test suite pins `TZ=UTC` (see
  `vitest.config.ts`). Be careful with functions that use local time
  (`getSunTimes` without `inUTC`, `getSolarTime`).
- **Update the CHANGELOG** (`CHANGELOG.md`) under the unreleased heading.
- Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Releasing (maintainers)

1. Update the version in `package.json` and finalize the CHANGELOG entry.
2. Create a GitHub release — the `npm-publish` workflow builds, tests, and
   publishes to npm with provenance.
