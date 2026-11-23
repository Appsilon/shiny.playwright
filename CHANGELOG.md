# Changelog

## 0.2.0

- **Breaking for required checks:** the reusable workflow's job is now named `Shiny <version>`, so a caller job
  `e2e` gets the checks `e2e / Shiny latest` and `e2e / Shiny <shiny-oldest>` instead of `e2e / e2e (Shiny latest)`
  and `e2e / e2e (Shiny <shiny-oldest>)`. Update the required checks in the repository's ruleset when upgrading.
  The npm package is unchanged apart from its version.

## 0.1.0

First release. The harness is extracted from the in-repo copies in shiny.i18n, shiny.router and shiny.fluent.

- npm package `@appsilon/shiny-playwright`: the `test` fixtures (`shiny`, the per-worker app pool, the `app` and
  `ignoreConsoleErrors` options), `expect`, the `HarnessOptions` type, `defineShinyConfig()`, and the global setup
  that installs the package from source into a temporary library.
- `app` also accepts a path relative to the package root (`'inst/examples/dashboard'`), so specs no longer need
  `PKG_ROOT`. The package root is the nearest directory with a DESCRIPTION file above `playwright.config.ts`.
- `ignoreConsoleErrors` rejects patterns with the `g` or `y` flag. Those keep state between `test()` calls and
  would let every other repeat of an ignored error through.
- Reusable workflow `.github/workflows/e2e.yml`: Shiny matrix of the oldest supported version and the latest.
  `latest` is resolved once, from the repository the install uses, and the version check compares against that.
