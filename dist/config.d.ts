import { type PlaywrightTestConfig } from '@playwright/test';
import type { HarnessOptions } from './index';
/**
 * The Playwright config for a package's e2e tests: specs in `specs/`, the package installed from source by the
 * global setup, no retries, list + HTML reporters, traces and screenshots kept on failure, and one Chromium project
 * that uses Google Chrome when `CI` is set.
 *
 * `overrides` are merged with Playwright's `defineConfig()`: top-level keys replace the defaults, `use` is merged key
 * by key, a project named `chromium` is merged into the default one (its `use` key by key too), and projects with
 * other names are added.
 */
export declare function defineShinyConfig(overrides?: PlaywrightTestConfig<HarnessOptions>): PlaywrightTestConfig<HarnessOptions>;
