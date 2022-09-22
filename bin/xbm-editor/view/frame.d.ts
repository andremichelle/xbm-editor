import { xbm } from "../xbm.js";
import { Terminable } from './../../lib/common.js';
import { ListItem } from './../../lib/menu.js';
import { ViewContext } from "./context.js";
export declare class FrameView implements Terminable {
    readonly viewContext: ViewContext;
    readonly frame: xbm.Frame;
    private readonly terminator;
    readonly element: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    readonly menu: HTMLDivElement;
    readonly context: CanvasRenderingContext2D;
    constructor(viewContext: ViewContext, frame: xbm.Frame);
    contains(target: Node | null): boolean;
    terminate(): void;
    createMenuItems(): ListItem[];
    private readonly togglePixel;
    private readonly paint;
}
