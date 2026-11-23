# shiny.playwright

End-to-end tests for Shiny extension R packages, with [Playwright](https://playwright.dev). The tests start real
Shiny apps that use the package **built from the current checkout** and drive them in Chromium.

This repository has two parts, released together under one version tag:

- **`@appsilon/shiny-playwright`**, an npm package: Playwright fixtures that install the package under test from source,
  run each app in its own R process, wait for Shiny's busy/idle state, and check for app and browser errors. It
  also provides a config helper.
- **`.github/workflows/e2e.yml`**, a reusable GitHub workflow that runs those tests on the oldest supported Shiny
  version and on the latest.

The package is installed from git (`github:Appsilon/shiny.playwright#v0.1.0`); it is not published to the npm registry.

## Adding e2e tests to a package

The e2e tests live in `tests/e2e/` of the R package. Files per repository:

```
.github/workflows/e2e.yml   # calls the reusable workflow
DESCRIPTION                 # Config/Needs/e2e, if the apps need packages beyond Imports
.Rbuildignore               # ^tests/e2e$
tests/e2e/
  package.json + package-lock.json
  playwright.config.ts
  .gitignore                # node_modules/, test-results/, playwright-report/
  apps/<name>/app.R         # test apps that call library(<your package>)
  specs/*.spec.ts
```

### `tests/e2e/package.json`

```json
{
  "name": "<your package>-e2e",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@appsilon/shiny-playwright": "github:Appsilon/shiny.playwright#v0.1.0",
    "@playwright/test": "1.64.1",
    "@types/node": "22.20.5"
  }
}
```

Then run `npm install` in `tests/e2e` once and commit `package-lock.json`. CI uses `npm ci`. `@playwright/test` is a
peer dependency (`^1.64.0`), so the repository pins its own version.

### `tests/e2e/playwright.config.ts`

```ts
import { defineShinyConfig } from '@appsilon/shiny-playwright';

export default defineShinyConfig();
```

`defineShinyConfig()` gives you these settings: specs in `specs/`; the global setup that installs the package from
source; `fullyParallel`; `forbidOnly` when `CI` is set; `retries: 0`; the `list` and `html` reporters; traces and
screenshots kept on failure; and one `chromium` project that uses Google Chrome (`channel: 'chrome'`) when `CI` is
set. You can pass overrides, which are merged with Playwright's `defineConfig()`. Top-level keys replace the
defaults, and `use` is merged key by key. A project named `chromium` is merged into the default project (its `use`
key by key too), and projects with other names are added. For example, shiny.fluent:

```ts
import { defineShinyConfig } from '@appsilon/shiny-playwright';

export default defineShinyConfig({
  use: {
    ignoreConsoleErrors: [
      // Fluent UI's makeStyles() adds a window "unload" listener. Google Chrome no longer allows unload listeners
      // and logs this instead. The listener only cleans up when the page closes.
      /^Permissions policy violation: unload is not allowed in this document\.$/,
    ],
    timezoneId: 'UTC',
  },
});
```

### A spec

```ts
import { expect, test } from '@appsilon/shiny-playwright';

test.use({ app: 'routing' }); // tests/e2e/apps/routing

// From shiny.router.
test('a route link switches the page', async ({ page, shiny }) => {
  await shiny.goto();                       // open the app, wait until Shiny is connected and idle
  await page.locator('#link_other').click();
  await expect(page).toHaveURL(/\/#!\/other$/);
  await expect(page.locator('#other_page')).toBeVisible();
  await expect(page.locator('#current_page')).toHaveText('other'); // what the server sees
  await shiny.expectNoErrors();             // still connected, no output errors, no browser console errors
});
```

Don't sleep (`page.waitForTimeout()`). Use `await expect(locator)...` or `expect.poll(...)`, which retry until the
UI catches up.

### `DESCRIPTION`

If the test apps need R packages that are not in `Imports`, list them in `Config/Needs/e2e`, e.g.
`Config/Needs/e2e: DT, leaflet`. The workflow installs hard dependencies plus these. Locally:
`pak::local_install_deps(dependencies = "Config/Needs/e2e")`.

### `.github/workflows/e2e.yml`

```yaml
name: e2e

on:
  push:
    branches:
      - main
  # No path filter on pull requests: if the e2e checks are required, a PR that touches none of the paths would get
  # no e2e checks and wait for them forever.
  pull_request:

permissions:
  contents: read

jobs:
  e2e:
    uses: Appsilon/shiny.playwright/.github/workflows/e2e.yml@v0.1.0
    with:
      shiny-oldest: '1.7.5.1'
```

Don't add a `paths` filter to `pull_request`. A required check that never runs blocks the PR. A `push` path filter
is fine.

**Check names.** GitHub prefixes the called workflow's job name with the caller's job name. With the caller job
`e2e` above, the checks are:

- `e2e / e2e (Shiny latest)`
- `e2e / e2e (Shiny 1.7.5.1)` (the `shiny-oldest` value)

A repository moving from an inline e2e workflow, whose checks were `e2e (Shiny latest)` and
`e2e (Shiny 1.7.5.1)`, must update the required checks in its ruleset to the new names.

Call it once per caller workflow: two calls in the same workflow and ref share a concurrency group and artifact
names.

Workflow inputs:

| Input | Default | Meaning |
|---|---|---|
| `shiny-oldest` | (required) | The oldest Shiny version to test: the `shiny (>= x)` minimum in DESCRIPTION, or, if there is none, the oldest version that installs on current R (1.7.5.1 for shiny.i18n, shiny.router and shiny.fluent). |
| `working-directory` | `.` | The R package root, relative to the repository root. The tests are in its `tests/e2e`. |
| `timeout-minutes` | `10` | Timeout of each leg. |

What a leg does: it installs R and sets Posit Package Manager as the package repository. It resolves the Shiny
version once (for `latest`, the newest version in that repository) and installs it in the same dependency solve as the package's hard dependencies
and `Config/Needs/e2e`, with a separate R package cache per leg. It then checks that the installed Shiny is that
version. Finally it runs `npm ci` and `npm test` in `tests/e2e`, with the npm cache keyed on
`tests/e2e/package-lock.json`. On failure, it uploads the HTML report, traces and app logs as the artifact
`e2e-shiny-<version>`. There is no `playwright install`: in CI the tests run in the runner's Google Chrome.

## Options

### Fixture options (`use` in the config, or `test.use()` in a spec)

| Option | Default | Meaning |
|---|---|---|
| `app` | none | The app to test. A bare name is a directory under `apps/` next to `playwright.config.ts` (`'routing'`). A path with a separator is relative to the package root (`'inst/examples/dashboard'`, `` `examples/${name}` ``). An absolute path to an app directory or `.R` file is used as is. |
| `ignoreConsoleErrors` | `[]` | Browser console errors that are known and harmless, as `RegExp`s matched against the message. Give each pattern a comment saying why it is safe. Patterns with the `g` or `y` flag are rejected: they keep state between matches and would let every other repeat through. |

The package root is the nearest directory above `playwright.config.ts` that has a `DESCRIPTION` file, so
`tests/e2e` works without configuration.

### The `shiny` fixture

| Member | Purpose |
|---|---|
| `goto(path?)` | Open the app and wait until Shiny is connected and has finished its first round of work. If the session dies, it fails immediately with the R output. |
| `selectOption(inputId, value)` | Choose a value in a `selectInput` the way a user would (selectize or native). |
| `inputValue(inputId)` | The value of a Shiny input as the client last sent it to the server. |
| `waitForIdle()` | Wait until Shiny is connected and not busy. Rarely needed; prefer assertions. |
| `logs()` | The app's R stdout/stderr since this test started. |
| `expectNoErrors()` | Wait until Shiny has been idle for 0.5 s, so that outputs created later (e.g. by `renderUI()`) have rendered. Then assert there is no disconnect overlay, no visible output error, and no browser console error or uncaught exception. |
| `app.url` | Base URL of the running app. |

How it works:

- **Install from source.** The global setup runs `R CMD INSTALL` into a temporary library once per run. Every app
  process puts that library first and stops if the package would load from anywhere else.
- **One R process per app.** Each app starts at most once per worker, on a port R picks, and every test gets a new
  page and Shiny session.
- **Clean shutdown.** App processes are killed when the worker ends. If the runner is killed hard, the R process
  notices that its parent is gone and quits within about a second (Linux and macOS).
- **Failure output.** When a test fails, its folder in `test-results/` has a screenshot, a trace, and `app.log` with
  the app's R output. If the app fails to start, there is no `app.log`: the error message includes the R output.

## Running locally

You need R with the package's dependencies (plus `Config/Needs/e2e`) and Node.js 20 or newer.

```sh
cd tests/e2e
npm ci                            # first time, or after package-lock.json changes
npx playwright install chromium   # first time, or after upgrading @playwright/test
npm test
```

| Command | What it does |
|---|---|
| `npm test -- specs/routing.spec.ts` | Run one file |
| `npm test -- -g "other page"` | Run tests whose title matches |
| `npm run test:ui` | UI mode (installs the package once when it starts; restart it after changing the package) |
| `npm test -- --headed --debug` | Step through a test in a visible browser |
| `npm run report` | Open the HTML report of the last run |
| `CI=1 npm test` | Run as CI does, in your Google Chrome |

Run `CI=1 npm test` before the first push. Google Chrome logs some console errors that Playwright's Chromium does
not (shiny.fluent needed `ignoreConsoleErrors` because of that).

To test another Shiny version, install it into a separate library and put that library first:
`R_LIBS=/path/to/shiny-1.7.5.1-lib npm test`.

## Migrating from the in-repo harness

shiny.i18n, shiny.router and shiny.fluent started with a copy of this harness in `tests/e2e/harness/`. To switch:

1. Delete `tests/e2e/harness/` and add the `@appsilon/shiny-playwright` dependency (see above).
2. In specs, import from `'@appsilon/shiny-playwright'` instead of `'../harness'`. Replace
   `path.join(PKG_ROOT, 'inst', 'examples', 'x')` with `'inst/examples/x'`, and drop the `PKG_ROOT` and `node:path`
   imports if nothing else uses them.
3. Replace `playwright.config.ts` with `defineShinyConfig()`, keeping only the repository's own `use` settings.
4. Replace the inline workflow with the caller above and update the required check names.

## Versions and upgrades

Releases are git tags `vX.Y.Z`. The npm package and the workflow share the tag, so upgrade both together: the
`github:Appsilon/shiny.playwright#vX.Y.Z` dependency (then `npm install` to update the lockfile) and the
`uses: ...e2e.yml@vX.Y.Z` reference. See [CHANGELOG.md](CHANGELOG.md).

## Developing this repository

`dist/` is committed: a git dependency then needs no build step at install time. After changing `src/`, run
`npm run build:dist` and commit `dist/`. (The script is not called `build`: npm
would then install this repository's devDependencies whenever a consumer installs it from git.) CI fails if `dist/` does not match `src/`.

`tests/fixture/` is a minimal R package (`e2efixture`) with a custom input binding and a Playwright suite in
`tests/fixture/tests/e2e/` that tests the harness. That suite covers startup, the busy/idle waits, app and browser
errors, `ignoreConsoleErrors`, and expected failures (`specs/negative.spec.ts`). It installs this repository's
package from the working tree (`file:` with `install-links`):

```sh
npm ci && npm run build:dist && npm run lint
cd tests/fixture/tests/e2e
npm ci          # again after every `npm run build:dist`, to pick up the new dist/
CI=1 npm test
```

CI (`.github/workflows/ci.yml`) checks the build and types, and runs the reusable workflow against the fixture
package.

## License

MIT, see [LICENSE](LICENSE).
