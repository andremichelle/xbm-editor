import { xbm } from "../xbm.js";
import { ObservableValue } from './../../lib/common.js';
import { ViewContext } from "./context.js";
import { SpriteView } from "./sprite.js";
export declare class SheetView implements ViewContext {
    readonly sheet: xbm.Sheet;
    readonly zoom: ObservableValue<number>;
    readonly element: HTMLElement;
    readonly addSpriteButton: HTMLButtonElement;
    readonly views: Map<xbm.Sprite, SpriteView>;
    private readonly position;
    constructor(sheet: xbm.Sheet);
    remove(sprite: xbm.Sprite): void;
    updateOrder(): void;
    center(): void;
    updatePosition(): void;
}
