/** One Shiny app running in its own R process. */
export declare class ShinyAppProcess {
    readonly appPath: string;
    private readonly proc;
    url: string;
    private readonly lines;
    private constructor();
    /** Start the app at `appPath`: an absolute path to an app dir or .R file. */
    static start(appPath: string): Promise<ShinyAppProcess>;
    private waitUntilListening;
    /** Number of captured log lines; pass to logs() to get only what came after. */
    get logLength(): number;
    /** Captured R stdout/stderr (stderr lines are prefixed with "[stderr]"). */
    logs(fromLine?: number, toLine?: number): string;
    /** Kill the R process and everything it started. */
    stop(): Promise<void>;
}
