import fs from 'node:fs';
import { test as base } from '@playwright/test';
import { resolveApp } from './paths';
import { Shiny } from './shiny';
import { ShinyAppProcess } from './shiny-app';

export { expect } from '@playwright/test';
export { defineShinyConfig } from './config';

export type HarnessOptions = {
  /**
   * App to test: a bare name is an app directory under `apps/` next to playwright.config.ts (`'routing'`); a path
   * with a separator is relative to the package root (`'inst/examples/dashboard'`, `'examples/basic/app.R'`); an
   * absolute path to an app directory or .R file is used as is.
   */
  app: string | undefined;
  /**
   * Console errors that are known and harmless, e.g. from a third-party library the package bundles. Set it in
   * playwright.config.ts `use`, with a comment saying why each pattern is safe to ignore. Patterns must not have the
   * `g` or `y` flag.
   */
  ignoreConsoleErrors: RegExp[];
};

/** Starts each app at most once per worker and stops them all when the worker ends. */
class AppPool {
  private readonly apps = new Map<string, Promise<ShinyAppProcess>>();

  get(appPath: string): Promise<ShinyAppProcess> {
    if (!this.apps.has(appPath)) this.apps.set(appPath, ShinyAppProcess.start(appPath));
    return this.apps.get(appPath)!;
  }

  async stopAll(): Promise<void> {
    const started = await Promise.allSettled(this.apps.values());
    await Promise.all(started.map((r) => (r.status === 'fulfilled' ? r.value.stop() : undefined)));
  }
}

export const test = base.extend<HarnessOptions & { shiny: Shiny }, { appPool: AppPool }>({
  app: [undefined, { option: true }],
  ignoreConsoleErrors: [[], { option: true }],

  appPool: [
    async ({}, use) => {
      const pool = new AppPool();
      await use(pool);
      await pool.stopAll();
    },
    { scope: 'worker' },
  ],

  shiny: async ({ page, app, appPool, ignoreConsoleErrors }, use, testInfo) => {
    if (!app) throw new Error('No app selected. Add test.use({ app: "<name>" }) to the spec.');
    // A global or sticky RegExp keeps lastIndex between test() calls, so it would skip every other match.
    const stateful = ignoreConsoleErrors.filter((pattern) => pattern.global || pattern.sticky);
    if (stateful.length > 0) {
      throw new Error(`ignoreConsoleErrors patterns must not have the g or y flag: ${stateful.join(', ')}`);
    }
    const proc = await appPool.get(resolveApp(app, testInfo.config));
    const logStart = proc.logLength;
    await use(new Shiny(page, proc, logStart, ignoreConsoleErrors));
    if (testInfo.status !== testInfo.expectedStatus) {
      // The whole R output of the app (it may have served earlier tests), with a marker where this
      // test started. Written to the test's folder in test-results/ and linked from the HTML report.
      const log = [proc.logs(0, logStart), '----- this test started here -----', proc.logs(logStart), ''].join('\n');
      const file = testInfo.outputPath('app.log');
      await fs.promises.writeFile(file, log);
      await testInfo.attach('app.log', { path: file, contentType: 'text/plain' });
    }
  },
});
