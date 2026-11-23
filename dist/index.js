"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = exports.defineShinyConfig = exports.expect = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const test_1 = require("@playwright/test");
const paths_1 = require("./paths");
const shiny_1 = require("./shiny");
const shiny_app_1 = require("./shiny-app");
var test_2 = require("@playwright/test");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_2.expect; } });
var config_1 = require("./config");
Object.defineProperty(exports, "defineShinyConfig", { enumerable: true, get: function () { return config_1.defineShinyConfig; } });
/** Starts each app at most once per worker and stops them all when the worker ends. */
class AppPool {
    apps = new Map();
    get(appPath) {
        if (!this.apps.has(appPath))
            this.apps.set(appPath, shiny_app_1.ShinyAppProcess.start(appPath));
        return this.apps.get(appPath);
    }
    async stopAll() {
        const started = await Promise.allSettled(this.apps.values());
        await Promise.all(started.map((r) => (r.status === 'fulfilled' ? r.value.stop() : undefined)));
    }
}
exports.test = test_1.test.extend({
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
        if (!app)
            throw new Error('No app selected. Add test.use({ app: "<name>" }) to the spec.');
        // A global or sticky RegExp keeps lastIndex between test() calls, so it would skip every other match.
        const stateful = ignoreConsoleErrors.filter((pattern) => pattern.global || pattern.sticky);
        if (stateful.length > 0) {
            throw new Error(`ignoreConsoleErrors patterns must not have the g or y flag: ${stateful.join(', ')}`);
        }
        const proc = await appPool.get((0, paths_1.resolveApp)(app, testInfo.config));
        const logStart = proc.logLength;
        await use(new shiny_1.Shiny(page, proc, logStart, ignoreConsoleErrors));
        if (testInfo.status !== testInfo.expectedStatus) {
            // The whole R output of the app (it may have served earlier tests), with a marker where this
            // test started. Written to the test's folder in test-results/ and linked from the HTML report.
            const log = [proc.logs(0, logStart), '----- this test started here -----', proc.logs(logStart), ''].join('\n');
            const file = testInfo.outputPath('app.log');
            await node_fs_1.default.promises.writeFile(file, log);
            await testInfo.attach('app.log', { path: file, contentType: 'text/plain' });
        }
    },
});
