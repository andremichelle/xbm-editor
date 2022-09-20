import { xbm } from "../xbm.js";
import { Env } from "./env.js";
import { SpriteView } from "./sprite.js";
export declare class SheetView {
    readonly env: Env;
    readonly sheet: xbm.Sheet;
    readonly element: HTMLElement;
    readonly spriteContainer: HTMLDivElement;
    readonly addSpriteButton: HTMLButtonElement;
    readonly spriteViews: SpriteView[];
    constructor(env: Env, sheet: xbm.Sheet);
}
