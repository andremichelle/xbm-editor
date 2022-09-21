import { AnimationFrame, HTML } from "../../lib/dom.js"
import { ListItem, Menu } from "../../lib/menu.js"
import { xbm } from "../xbm.js"
import { CollectionEventType, Events, Terminable, Terminator } from './../../lib/common.js'
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

        this.terminator.with(this.sprite.addObserver(event => {
            switch (event.type) {
                case CollectionEventType.Add: {
                    const frame = event.item!
                    this.views.set(frame, new FrameView(this.env, frame))
                    break
                }
                case CollectionEventType.Remove: {
                    const frame = event.item!
                    const view = this.views.get(frame)
                    console.assert(view !== undefined)
                    this.views.delete(frame)
                    view!.terminate()
                    break
                }
                case CollectionEventType.Order: {
                    this.updateOrder()
                    break
                }
            }
        }))

        this.sprite.getFrames().forEach(frame => this.views.set(frame, new FrameView(this.env, frame)))
        this.updateOrder()

        let frame = 0 // Increment in single source with adjustable speed
        this.terminator.with(AnimationFrame.add(() => {
            this.canvas.width = sprite.width
            this.canvas.height = sprite.height
            this.sprite.getFrame(Animation.Alternate.map(frame++ >> 3, sprite.getFrameCount())).paint(this.context)
        }))
        this.terminator.with(Events.bind(this.frames, 'contextmenu', (event: MouseEvent) =>
            Menu.ContextMenu.append(
                ListItem.default('Copy Frame').onTrigger(() => {
                    const insertIndex = Array.from(this.views.values()).findIndex(view => view.contains(event.target as Node))
                    console.log(insertIndex)

                }),
                ListItem.default('Delete Frame').onTrigger(() => {
                    const view = Array.from(this.views.values()).find(view => view.contains(event.target as Node))
                    if (view === undefined) return
                    this.sprite.removeFrame(view.frame)
                })
            )))
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

    private updateOrder(): void {
        while (this.frames.lastChild !== null) this.frames.lastChild.remove()
        this.sprite.getFrames().forEach(frame => this.frames.appendChild(this.views.get(frame)!.element))
    }
}