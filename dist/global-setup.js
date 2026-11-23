"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalSetup;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const paths_1 = require("./paths");
/**
 * Install the package from the current source into a throwaway library, once per run.
 * Every app process puts this library first on its library path, so apps always
 * test the code in this checkout, never a previously installed version.
 * Each run gets its own library, so two runs from the same checkout don't interfere.
 */
function globalSetup(config) {
    const pkgRoot = (0, paths_1.packageRoot)(config);
    const lib = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'shiny-playwright-lib-'));
    // Workers inherit the runner's environment; shiny-app.ts reads it from there.
    process.env.E2E_LIB = lib;
    const started = Date.now();
    try {
        (0, node_child_process_1.execFileSync)('R', ['CMD', 'INSTALL', '--no-docs', '--no-multiarch', '--no-test-load', `--library=${lib}`, pkgRoot], { stdio: 'pipe' });
    }
    catch (error) {
        node_fs_1.default.rmSync(lib, { recursive: true, force: true });
        const { stdout = '', stderr = '' } = error;
        throw new Error(`Installing the package from ${pkgRoot} failed:\n${stdout}${stderr}`);
    }
    console.log(`[e2e] Installed package from source in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    // Returned function = global teardown.
    return () => node_fs_1.default.rmSync(lib, { recursive: true, force: true });
}
