# Changelog

## 0.1.0

First release. The harness is extracted from the in-repo copies in shiny.i18n, shiny.router and shiny.fluent.

- npm package `@appsilon/shiny-e2e`: the `test` fixtures (`shiny`, the per-worker app pool, the `app` and
  `ignoreConsoleErrors` options), `expect`, the `HarnessOptions` type, `defineShinyConfig()`, and the global setup
  that installs the package from source into a temporary library.
- `app` also accepts a path relative to the package root (`'inst/examples/dashboard'`), so specs no longer need
  `PKG_ROOT`. The package root is the nearest directory with a DESCRIPTION file above `playwright.config.ts`.
- `ignoreConsoleErrors` rejects patterns with the `g` or `y` flag. Those keep state between `test()` calls and
  would let every other repeat of an ignored error through.
- Reusable workflow `.github/workflows/e2e.yml`: Shiny matrix of the oldest supported version and the latest.
  `latest` is resolved once, from the repository the install uses, and the version check compares against that.
