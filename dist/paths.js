"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.e2eRoot = e2eRoot;
exports.packageRoot = packageRoot;
exports.resolveApp = resolveApp;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
/** The directory of the Playwright config (by default the package's tests/e2e). */
function e2eRoot(config) {
    return config.configFile ? node_path_1.default.dirname(config.configFile) : process.cwd();
}
/** The R package under test: the nearest directory above the e2e root that has a DESCRIPTION file. */
function packageRoot(config) {
    const start = e2eRoot(config);
    for (let dir = start;; dir = node_path_1.default.dirname(dir)) {
        if (node_fs_1.default.existsSync(node_path_1.default.join(dir, 'DESCRIPTION')))
            return dir;
        if (node_path_1.default.dirname(dir) === dir)
            throw new Error(`No R package (DESCRIPTION file) found in ${start} or above it.`);
    }
}
/**
 * Resolve the `app` option to a path:
 * - an absolute path is used as is;
 * - a path with a separator (`examples/basic/app.R`) is relative to the package root;
 * - a bare name (`routing`) is an app under `apps/` next to the Playwright config.
 */
function resolveApp(app, config) {
    if (node_path_1.default.isAbsolute(app))
        return app;
    if (/[\\/]/.test(app))
        return node_path_1.default.join(packageRoot(config), app);
    return node_path_1.default.join(e2eRoot(config), 'apps', app);
}
