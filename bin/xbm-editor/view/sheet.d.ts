import { xbm } from "../xbm.js";
import { Env } from "./env.js";
import { SpriteView } from "./sprite.js";
export declare class SheetView {
    readonly env: Env;
    readonly sheet: xbm.Sheet;
    readonly element: HTMLElement;
    readonly addSpriteButton: HTMLButtonElement;
    readonly views: Map<xbm.Sprite, SpriteView>;
    constructor(env: Env, sheet: xbm.Sheet);
    addSprite(sprite: xbm.Sprite): void;
    removeSprite(sprite: xbm.Sprite): void;
}
