import { xbm } from "../xbm.js";
import { Env } from "./env.js";
export declare class FrameView {
    readonly env: Env;
    readonly frame: xbm.Frame;
    readonly element: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    constructor(env: Env, frame: xbm.Frame);
    paint(): void;
}
