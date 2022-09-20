import { xbm } from "../xbm.js";
import { Terminable } from './../../lib/common.js';
import { Env } from "./env.js";
import { FrameView } from "./frame.js";
export declare class Animation {
    readonly map: (frame: number, totalFrames: number) => number;
    static readonly Forward: Animation;
    static readonly Alternate: Animation;
    constructor(map: (frame: number, totalFrames: number) => number);
}
export declare class SpriteView implements Terminable {
    readonly env: Env;
    readonly sprite: xbm.Sprite;
    private readonly terminator;
    readonly preview: HTMLDivElement;
    readonly title: HTMLHeadingElement;
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly frames: HTMLDivElement;
    readonly views: Map<xbm.Frame, FrameView>;
    constructor(env: Env, sprite: xbm.Sprite);
    addFrame(frame: xbm.Frame): void;
    removeFrame(frame: xbm.Frame): void;
    appendChildren(parent: ParentNode): void;
    terminate(): void;
}
