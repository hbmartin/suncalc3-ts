# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - Unreleased

### Added

- `customTimes` parameter on `getSunTimes` to calculate additional sun time
  definitions per call, without mutating process-global state.
- Deprecated `getTimes(date, lat, lng, height?, inUTC?)` compatibility wrapper
  that returns a plain map of `Date`s keyed by both the current and the
  original SunCalc time names, to ease migration from the original SunCalc.
- Input validation: all functions now throw on invalid dates
  (`TypeError`) and on out-of-range latitude/longitude (`RangeError`).
- `exports` map, `sideEffects: false`, source maps, and declaration maps in
  the published package.
- API documentation generated with TypeDoc (`pnpm run docs`) and published via
  GitHub Pages.
- Comprehensive Vitest test suite (sun/moon positions and times, southern
  hemisphere, observer height, polar edge cases, custom times, validation)
  with coverage reporting.

### Changed

- Package renamed to `suncalc3-ts`; repository metadata now points to
  [hbmartin/suncalc3-ts](https://github.com/hbmartin/suncalc3-ts).
- Source split into focused modules (`types`, `constants`, `utils`, `sun`,
  `moon`) re-exported from a single entry point — the public API is unchanged.
- `addTime` and `addDeprecatedTimeName` are deprecated in favor of the
  `customTimes` parameter (they still work).
- Custom `risePos` / `setPos` values passed to `addTime` (and via
  `customTimes`) are now honored in the calculated `pos` of the results.
- Moon phase name typo fixed ("third Quarter" → "Third Quarter").
- Tooling: mocha/ts-node replaced by Vitest; yarn/npm replaced by pnpm with a
  committed lockfile; CI runs Oxlint, Oxfmt, typecheck, build, and tests on
  Node.js 20/22/24; npm publish runs tests first and publishes with
  provenance.

### Fixed

- `getSunTimes` with `addDeprecated = true` returned a wrong `nameOrg`
  (the original position instead of the original name) and a meaningless
  `posOrg`; both now reflect the original time entry.
- Broken test suite (imported a nonexistent `getTimes` export) rebuilt
  against the actual API; removed the dead `test.js` tape script.
- README: corrected the usage example (`ISunTimeDef.value` holds the `Date`),
  the sunrise/sunset rename table, the `getSolarTime` parameter order, the
  amateur dawn/dusk angle (15°, not 12°), and broken links/badges.

## [2.0.9] and earlier

See the release history of the upstream projects:
[suncalc-ts](https://github.com/e-adrien/suncalc-ts),
[suncalc3](https://github.com/hypnos3/suncalc3), and
[suncalc](https://github.com/mourner/suncalc).
