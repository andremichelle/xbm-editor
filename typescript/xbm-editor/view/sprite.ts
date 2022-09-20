import { HTML } from "../../lib/dom.js"
import { xbm } from "../xbm.js"
import { Env } from "./env.js"
import { FrameView } from "./frame.js"

export class SpriteView {
    readonly element: HTMLElement = HTML.create('div', { class: 'sprite-view' })
    readonly frameContainer: HTMLDivElement = HTML.create('div', { class: 'frame-container' })
    readonly frameViews: FrameView[]

    constructor(readonly env: Env, readonly sprite: xbm.Sprite) {
        this.frameViews = this.sprite.getFrames().map(frame => new FrameView(env, frame))
        this.frameViews.forEach(view => this.frameContainer.appendChild(view.element))
        this.element.append(HTML.create('h1', { textContent: sprite.getName() }))
        this.element.appendChild(this.frameContainer)
    }
}