import { xbm } from "../xbm.js";
import { Terminable } from './../../lib/common.js';
import { ViewContext } from "./context.js";
import { FrameView } from "./frame.js";
export declare class Animation {
    readonly map: (frame: number, totalFrames: number) => number;
    static readonly Forward: Animation;
    static readonly Alternate: Animation;
    constructor(map: (frame: number, totalFrames: number) => number);
}
export declare class SpriteView implements Terminable {
    readonly viewContext: ViewContext;
    readonly sprite: xbm.Sprite;
    private readonly terminator;
    readonly preview: HTMLDivElement;
    readonly title: HTMLHeadingElement;
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly frameContainer: HTMLDivElement;
    readonly views: Map<xbm.Frame, FrameView>;
    constructor(viewContext: ViewContext, sprite: xbm.Sprite);
    appendSpriteMenu(): void;
    appendChildren(parent: ParentNode): void;
    terminate(): void;
    private updateOrder;
}
