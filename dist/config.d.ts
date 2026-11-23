import { type PlaywrightTestConfig } from '@playwright/test';
import type { HarnessOptions } from './index';
/**
 * The Playwright config for a package's e2e tests: specs in `specs/`, the package installed from source by the
 * global setup, no retries, list + HTML reporters, traces and screenshots kept on failure, and one Chromium project
 * that uses Google Chrome when `CI` is set.
 *
 * `overrides` are merged with Playwright's `defineConfig()`: top-level keys replace the defaults, `use` is merged key
 * by key, and a project with the same name (`chromium`) replaces the default one.
 */
export declare function defineShinyConfig(overrides?: PlaywrightTestConfig<HarnessOptions>): PlaywrightTestConfig<HarnessOptions>;
