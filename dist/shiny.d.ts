import { Page } from '@playwright/test';
import { ShinyAppProcess } from './shiny-app';
/** Test-facing handle for one Shiny app and the page that shows it. */
export declare class Shiny {
    readonly page: Page;
    readonly app: ShinyAppProcess;
    private readonly logStart;
    private readonly ignoreConsoleErrors;
    private readonly browserErrors;
    constructor(page: Page, app: ShinyAppProcess, logStart: number, ignoreConsoleErrors: RegExp[]);
    /** Open the app and wait until Shiny is connected and has finished its first round of work. */
    goto(pathname?: string): Promise<void>;
    /**
     * Wait until Shiny is connected and not busy. Use it after page load; after a user
     * action prefer web-first assertions (`await expect(locator).toHaveText(...)`),
     * which retry until the UI settles.
     */
    waitForIdle(): Promise<void>;
    /** Current value of a Shiny input, as the server sees it. */
    inputValue(inputId: string): Promise<unknown>;
    /** Pick `value` in a selectInput the way a user would; handles selectize and native <select>. */
    selectOption(inputId: string, value: string): Promise<void>;
    /** R output of the app captured since this test started. */
    logs(): string;
    /**
     * Assert the app is healthy: still connected, no output errors, no browser errors.
     * Waits first until Shiny has been idle for SETTLE_WINDOW_MS, so outputs that appear later
     * (e.g. inside renderUI) have rendered before their absence of errors is checked.
     */
    expectNoErrors(): Promise<void>;
}
