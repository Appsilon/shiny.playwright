"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shiny = void 0;
const test_1 = require("@playwright/test");
/**
 * The server only reports busy/idle when an observer or output actually runs. If no busy
 * signal arrives within this window after the session starts, the app had no initial
 * server work (e.g. a static UI) and is treated as idle.
 */
const NO_WORK_WINDOW_MS = 500;
/**
 * How long Shiny must stay idle before expectNoErrors() checks for errors. Outputs created by
 * renderUI() are bound and rendered in a later round of server work, after a first idle;
 * checking for the absence of errors before that round would miss errors in those outputs.
 */
const SETTLE_WINDOW_MS = 500;
// Runs before any page script. Shiny announces busy/idle with jQuery events, which
// native listeners never see, so subscribe through jQuery once the DOM is parsed.
// This DOMContentLoaded listener is registered before jQuery's own ready handler,
// so it is in place before Shiny initialises.
function trackShinyState() {
    const state = {
        connected: false,
        disconnected: false,
        busy: false,
        idleCount: 0,
        initializedAt: null,
        lastActivityAt: null,
    };
    window.__e2eShiny = state;
    document.addEventListener('DOMContentLoaded', () => {
        const $ = window.jQuery;
        if (!$)
            return;
        $(document).on('shiny:sessioninitialized', () => {
            state.initializedAt = performance.now();
            state.lastActivityAt = state.initializedAt;
        });
        $(document).on('shiny:connected', () => (state.connected = true));
        $(document).on('shiny:disconnected', () => {
            state.connected = false;
            state.disconnected = true;
        });
        $(document).on('shiny:busy', () => {
            state.busy = true;
            state.lastActivityAt = performance.now();
        });
        $(document).on('shiny:idle', () => {
            state.busy = false;
            state.idleCount += 1;
            state.lastActivityAt = performance.now();
        });
    });
}
/** Test-facing handle for one Shiny app and the page that shows it. */
class Shiny {
    page;
    app;
    logStart;
    ignoreConsoleErrors;
    browserErrors = [];
    constructor(page, app, logStart, ignoreConsoleErrors) {
        this.page = page;
        this.app = app;
        this.logStart = logStart;
        this.ignoreConsoleErrors = ignoreConsoleErrors;
        page.on('console', (msg) => {
            // Google Chrome (unlike Playwright's headless shell) requests /favicon.ico, and most Shiny apps
            // don't serve one. That 404 is not an app error.
            if (msg.type() !== 'error' || msg.location().url.endsWith('/favicon.ico'))
                return;
            if (this.ignoreConsoleErrors.some((pattern) => pattern.test(msg.text())))
                return;
            this.browserErrors.push(`console: ${msg.text()}`);
        });
        page.on('pageerror', (error) => this.browserErrors.push(`pageerror: ${error.message}`));
    }
    /** Open the app and wait until Shiny is connected and has finished its first round of work. */
    async goto(pathname = '/') {
        await this.page.addInitScript(trackShinyState);
        await this.page.goto(new URL(pathname, this.app.url).toString());
        await this.waitForIdle();
    }
    /**
     * Wait until Shiny is connected and not busy. Use it after page load; after a user
     * action prefer web-first assertions (`await expect(locator).toHaveText(...)`),
     * which retry until the UI settles.
     */
    async waitForIdle() {
        const outcome = await this.page.waitForFunction((noWorkWindowMs) => {
            const s = window.__e2eShiny;
            if (s?.disconnected)
                return 'disconnected';
            if (!s || !s.connected || s.busy)
                return false;
            if (s.idleCount > 0)
                return 'idle';
            const quiet = s.initializedAt !== null && performance.now() - s.initializedAt > noWorkWindowMs;
            return quiet ? 'idle' : false;
        }, NO_WORK_WINDOW_MS, { polling: 50 });
        if ((await outcome.jsonValue()) === 'disconnected') {
            throw new Error(`The Shiny session disconnected (the app likely errored). R output:\n${this.logs()}`);
        }
    }
    /** Current value of a Shiny input, as the server sees it. */
    async inputValue(inputId) {
        return this.page.evaluate((id) => {
            const values = window
                .Shiny.shinyapp.$inputValues;
            // Inputs with a custom type are stored as "<id>:<type>".
            const key = Object.keys(values).find((k) => k === id || k.startsWith(`${id}:`));
            return key === undefined ? undefined : values[key];
        }, inputId);
    }
    /** Pick `value` in a selectInput the way a user would; handles selectize and native <select>. */
    async selectOption(inputId, value) {
        const selectize = this.page.locator(`[id="${inputId}"] + .selectize-control`);
        if ((await selectize.count()) > 0) {
            await selectize.locator('.selectize-input').click();
            await selectize.locator(`.selectize-dropdown .option[data-value="${value}"]`).click();
        }
        else {
            await this.page.locator(`select[id="${inputId}"]`).selectOption(value);
        }
    }
    /** R output of the app captured since this test started. */
    logs() {
        return this.app.logs(this.logStart);
    }
    /**
     * Assert the app is healthy: still connected, no output errors, no browser errors.
     * Waits first until Shiny has been idle for SETTLE_WINDOW_MS, so outputs that appear later
     * (e.g. inside renderUI) have rendered before their absence of errors is checked.
     */
    async expectNoErrors() {
        await this.page.waitForFunction((settleMs) => {
            const s = window.__e2eShiny;
            if (!s || s.disconnected)
                return true; // the disconnect check below reports it
            return !s.busy && s.lastActivityAt !== null && performance.now() - s.lastActivityAt > settleMs;
        }, SETTLE_WINDOW_MS, { polling: 50 });
        await (0, test_1.expect)(this.page.locator('#shiny-disconnected-overlay')).toHaveCount(0);
        await (0, test_1.expect)(this.page.locator('.shiny-output-error:not(.shiny-output-error-silent):not(.shiny-output-error-validation)')).toHaveCount(0);
        (0, test_1.expect)(this.browserErrors, 'browser console errors').toEqual([]);
    }
}
exports.Shiny = Shiny;
