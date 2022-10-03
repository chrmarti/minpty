export declare function execPty(cmd: string, args: string[]): Promise<string>;
export interface Pty {
    onData: Event<string>;
    onExit: Event<PtyExit>;
}
export interface PtyExit {
    exitCode?: number;
    signal?: string;
}
export declare function spawnPty(cmd: string, args: string[]): Pty;
export interface Event<T> {
    (listener: (e: T) => void): Disposable;
}
export interface Disposable {
    dispose(): void;
}
