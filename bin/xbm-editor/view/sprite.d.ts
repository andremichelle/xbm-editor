import { ListItem } from "../../lib/menu.js";
import { xbm } from "../xbm.js";
import { Terminable } from './../../lib/common.js';
import { ViewContext } from "./context.js";
import { FrameView } from "./frame.js";
export declare class Animation {
    readonly map: (frame: number, totalFrames: number) => number;
    static readonly First: Animation;
    static readonly Loop: Animation;
    static readonly Alternate: Animation;
    constructor(map: (frame: number, totalFrames: number) => number);
}
export declare class SpriteView implements Terminable {
    readonly viewContext: ViewContext;
    readonly sprite: xbm.Sprite;
    private readonly terminator;
    readonly preview: HTMLDivElement;
    readonly title: HTMLHeadingElement;
    readonly previewMenu: HTMLDivElement;
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly frameContainer: HTMLDivElement;
    readonly views: Map<xbm.Frame, FrameView>;
    constructor(viewContext: ViewContext, sprite: xbm.Sprite);
    appendChildren(parent: ParentNode): void;
    createMenuItems(view: FrameView): ListItem[][];
    terminate(): void;
    private updateOrder;
}
