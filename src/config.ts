import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import type { HarnessOptions } from './index';

/**
 * The Playwright config for a package's e2e tests: specs in `specs/`, the package installed from source by the
 * global setup, no retries, list + HTML reporters, traces and screenshots kept on failure, and one Chromium project
 * that uses Google Chrome when `CI` is set.
 *
 * `overrides` are merged with Playwright's `defineConfig()`: top-level keys replace the defaults, `use` is merged key
 * by key, and a project with the same name (`chromium`) replaces the default one.
 */
export function defineShinyConfig(
  overrides: PlaywrightTestConfig<HarnessOptions> = {},
): PlaywrightTestConfig<HarnessOptions> {
  return defineConfig<HarnessOptions>(
    {
      testDir: './specs',
      globalSetup: require.resolve('./global-setup'),
      fullyParallel: true,
      forbidOnly: !!process.env.CI,
      // A flaky test should fail loudly, not pass on a retry.
      retries: 0,
      reporter: [['list'], ['html', { open: 'never' }]],
      use: {
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
      },
      projects: [
        {
          name: 'chromium',
          use: {
            ...devices['Desktop Chrome'],
            // In CI, use the Google Chrome that comes with the GitHub runner image. Playwright's own Chromium
            // needs system packages from the Ubuntu mirror (`--with-deps`), which is slow and sometimes fails.
            channel: process.env.CI ? 'chrome' : undefined,
          },
        },
      ],
    },
    overrides,
  );
}
