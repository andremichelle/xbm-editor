import { xbm } from "../xbm.js";
import { Env } from "./env.js";
import { FrameView } from "./frame.js";
export declare class SpriteView {
    readonly env: Env;
    readonly sprite: xbm.Sprite;
    readonly element: HTMLElement;
    readonly frameContainer: HTMLDivElement;
    readonly frameViews: FrameView[];
    constructor(env: Env, sprite: xbm.Sprite);
}
