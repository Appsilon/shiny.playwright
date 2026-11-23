import type { FullConfig } from '@playwright/test';
/** The directory of the Playwright config (by default the package's tests/e2e). */
export declare function e2eRoot(config: FullConfig): string;
/** The R package under test: the nearest directory above the e2e root that has a DESCRIPTION file. */
export declare function packageRoot(config: FullConfig): string;
/**
 * Resolve the `app` option to a path:
 * - an absolute path is used as is;
 * - a path with a separator (`examples/basic/app.R`) is relative to the package root;
 * - a bare name (`routing`) is an app under `apps/` next to the Playwright config.
 */
export declare function resolveApp(app: string, config: FullConfig): string;
