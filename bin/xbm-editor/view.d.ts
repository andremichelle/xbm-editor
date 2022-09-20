import { ObservableValue } from './../lib/common.js';
import { xbm } from './xbm.js';
export declare class Env {
    readonly zoom: ObservableValue<number>;
}
export declare class SheetView {
    readonly env: Env;
    readonly sheet: xbm.Sheet;
    readonly element: HTMLElement;
    readonly spriteContainer: HTMLDivElement;
    readonly addSpriteButton: HTMLButtonElement;
    readonly spriteViews: SpriteView[];
    constructor(env: Env, sheet: xbm.Sheet);
}
export declare class SpriteView {
    readonly env: Env;
    readonly sprite: xbm.Sprite;
    readonly element: HTMLElement;
    readonly frameContainer: HTMLDivElement;
    readonly frameViews: FrameView[];
    constructor(env: Env, sprite: xbm.Sprite);
}
export declare class FrameView {
    readonly env: Env;
    readonly frame: xbm.Frame;
    readonly element: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    constructor(env: Env, frame: xbm.Frame);
    update(): void;
}
