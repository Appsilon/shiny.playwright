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
declare class AppPool {
    private readonly apps;
    get(appPath: string): Promise<ShinyAppProcess>;
    stopAll(): Promise<void>;
}
export declare const test: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & HarnessOptions & {
    shiny: Shiny;
}, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions & {
    appPool: AppPool;
}>;
