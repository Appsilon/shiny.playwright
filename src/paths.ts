import fs from 'node:fs';
import path from 'node:path';
import type { FullConfig } from '@playwright/test';

/** The directory of the Playwright config (by default the package's tests/e2e). */
export function e2eRoot(config: FullConfig): string {
  return config.configFile ? path.dirname(config.configFile) : process.cwd();
}

/** The R package under test: the nearest directory above the e2e root that has a DESCRIPTION file. */
export function packageRoot(config: FullConfig): string {
  const start = e2eRoot(config);
  for (let dir = start; ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'DESCRIPTION'))) return dir;
    if (path.dirname(dir) === dir) throw new Error(`No R package (DESCRIPTION file) found in ${start} or above it.`);
  }
}

/**
 * Resolve the `app` option to a path:
 * - an absolute path is used as is;
 * - a path with a separator (`examples/basic/app.R`) is relative to the package root;
 * - a bare name (`routing`) is an app under `apps/` next to the Playwright config.
 */
export function resolveApp(app: string, config: FullConfig): string {
  if (path.isAbsolute(app)) return app;
  if (/[\\/]/.test(app)) return path.join(packageRoot(config), app);
  return path.join(e2eRoot(config), 'apps', app);
}
