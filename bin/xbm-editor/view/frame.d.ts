import { xbm } from "../xbm.js";
import { Terminable } from './../../lib/common.js';
import { ViewContext } from "./context.js";
export declare class FrameView implements Terminable {
    readonly viewContext: ViewContext;
    readonly frame: xbm.Frame;
    private readonly terminator;
    readonly element: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    constructor(viewContext: ViewContext, frame: xbm.Frame);
    contains(target: Node | null): boolean;
    terminate(): void;
    private readonly togglePixel;
    private readonly paint;
}
