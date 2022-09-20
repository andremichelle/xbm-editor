import { AnimationFrame, HTML } from "../../lib/dom.js"
import { xbm } from "../xbm.js"
import { Terminable, Terminator } from './../../lib/common.js'
import { Env } from "./env.js"
import { FrameView } from "./frame.js"

export class Animation {
    static readonly Forward = new Animation((frame: number, totalFrames: number) => totalFrames <= 1 ? 0 : frame % totalFrames)
    static readonly Alternate = new Animation((frame: number, totalFrames: number) => {
        if (totalFrames <= 1) return 0
        const m = totalFrames - 1
        return Math.abs(m - (frame % (m << 1)))
    })

    constructor(readonly map: (frame: number, totalFrames: number) => number) { }
}

export class SpriteView implements Terminable {
    private readonly terminator = new Terminator()

    readonly preview: HTMLDivElement = HTML.create('div', { class: 'preview' })
    readonly title: HTMLHeadingElement = HTML.create('h1', { textContent: this.sprite.getName() })
    readonly canvas: HTMLCanvasElement = HTML.create('canvas')
    readonly context: CanvasRenderingContext2D = this.canvas.getContext('2d')!
    readonly frames: HTMLDivElement = HTML.create('div', { class: 'frame-views' })
    readonly views: Map<xbm.Frame, FrameView> = new Map<xbm.Frame, FrameView>()

    constructor(readonly env: Env, readonly sprite: xbm.Sprite) {
        this.preview.appendChild(this.canvas)

        this.terminator.with(this.sprite.addObserver(sprite => { })) // TODO

        this.sprite.getFrames().forEach(frame => this.addFrame(frame))

        let frame = 0 // Move to single source with adjustable speed
        this.terminator.with(AnimationFrame.add(() => {
            this.canvas.width = sprite.width
            this.canvas.height = sprite.height
            this.sprite.getFrame(Animation.Alternate.map(frame++ >> 3, sprite.getFrameCount())).paint(this.context)
        }))
    }

    addFrame(frame: xbm.Frame): void {
        const view = new FrameView(this.env, frame)
        this.views.set(frame, view)
        this.frames.appendChild(view.element)
    }

    removeFrame(frame: xbm.Frame): void {
        const view = this.views.get(frame)
        console.assert(view !== undefined)
        view!.terminate()
    }

    appendChildren(parent: ParentNode): void {
        parent.appendChild(this.preview)
        parent.appendChild(this.title)
        parent.appendChild(this.frames)
    }

    terminate(): void {
        this.preview.remove()
        this.title.remove()
        this.frames.remove()
        this.terminator.terminate()
    }
}