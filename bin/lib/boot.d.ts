export declare const preloadImagesOfCssFile: (pathToCss: string) => Promise<void>;
export declare type Type<T> = (new (...args: any[]) => T);
export declare type UniqueKey<T = void> = Type<T> | string | number;
export declare type Factory<T> = () => T;
export interface Dependency<T> {
    require(...keys: UniqueKey[]): this;
    get(): T;
}
export declare class Boot {
    private readonly dependencies;
    private readonly available;
    private promise;
    add<T>(key: UniqueKey<T>, factory: Factory<T>): Dependency<T>;
    await<T>(key: UniqueKey<T>, construct: Promise<T> | Factory<Promise<T>>): Dependency<T>;
    get<T>(key: UniqueKey<T>): T;
    normalizedPercentage(): number;
    percentage(): number;
    awaitCompletion(): Promise<void>;
}
export declare const newAudioContext: (options?: AudioContextOptions) => AudioContext;
