import { xbm } from "../xbm.js";
import { Terminable } from './../../lib/common.js';
import { Env } from "./env.js";
export declare class FrameView implements Terminable {
    readonly env: Env;
    readonly frame: xbm.Frame;
    private readonly terminator;
    readonly element: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    constructor(env: Env, frame: xbm.Frame);
    contains(target: Node | null): boolean;
    terminate(): void;
    private readonly paint;
}
