import { AnimationFrame, HTML } from "../../lib/dom.js"
import { ListItem, Menu } from "../../lib/menu.js"
import { xbm } from "../xbm.js"
import { CollectionEventType, Events, Terminable, Terminator, Waiting } from './../../lib/common.js'
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
    readonly title: HTMLHeadingElement = HTML.create('h1', { textContent: this.sprite.name.get() })
    readonly canvas: HTMLCanvasElement = HTML.create('canvas')
    readonly context: CanvasRenderingContext2D = this.canvas.getContext('2d')!
    readonly frameContainer: HTMLDivElement = HTML.create('div', { class: 'frame-views' })
    readonly views: Map<xbm.Frame, FrameView> = new Map<xbm.Frame, FrameView>()

    constructor(readonly env: Env, readonly sprite: xbm.Sprite) {
        this.preview.appendChild(this.canvas)

        this.terminator.with(this.sprite.name.addObserver(name => this.title.textContent = name))
        this.terminator.with(this.sprite.frames.addObserver(event => {
            switch (event.type) {
                case CollectionEventType.Add: {
                    const frame = event.item!
                    this.views.set(frame, new FrameView(this.env, frame))
                    this.updateOrder()
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

        this.sprite.frames.forEach(frame => this.views.set(frame, new FrameView(this.env, frame)))
        this.updateOrder()

        let frame = 0 // Increment in single source with adjustable speed
        this.terminator.with(AnimationFrame.add(() => {
            this.canvas.width = sprite.width
            this.canvas.height = sprite.height
            this.sprite.getFrame(Animation.Alternate.map(frame++ >> 3, sprite.getFrameCount())).paint(this.context)
        }))
        this.terminator.with(Events.bind(this.frameContainer, 'contextmenu', (event: MouseEvent) => {
            const index = this.sprite.frames.map(frame => this.views.get(frame)!).findIndex(view => view.contains(event.target as Node))
            Menu.ContextMenu.append(
                ListItem.default('Move Frame Left').onTrigger(() => {
                    this.sprite.frames.move(index, index - 1)

                }).isSelectable(index > 0),
                ListItem.default('Move Frame Right').onTrigger(() => {
                    this.sprite.frames.move(index, index + 1)

                }).isSelectable(index < this.sprite.getFrameCount() - 1),
                ListItem.default('Add Frame').onTrigger(() => {
                    this.sprite.insertFrame(index + 1)
                }),
                ListItem.default('Copy Frame').onTrigger(() => {
                    const original = this.sprite.getFrame(index).getData().slice(0)
                    this.sprite.insertFrame(index + 1).writeData(original)

                }),
                ListItem.default('Delete Frame').onTrigger(() => {
                    const view = Array.from(this.views.values()).find(view => view.contains(event.target as Node))
                    if (view === undefined) return
                    this.sprite.removeFrame(view.frame)
                }),
            )
        }))
        this.terminator.with(Events.bind(this.title, 'contextmenu', (event: MouseEvent) =>
            Menu.ContextMenu.append(
                ListItem.default('Rename').onTrigger(async () => {
                    await Waiting.forFrames(2)
                    const name = prompt('Enter new name', this.sprite.name.get())
                    if (name === null) return
                    this.sprite.name.set(name.trim().toLowerCase())
                })
            )))
    }

    appendChildren(parent: ParentNode): void {
        parent.appendChild(this.preview)
        parent.appendChild(this.title)
        parent.appendChild(this.frameContainer)
    }

    terminate(): void {
        this.preview.remove()
        this.title.remove()
        this.frameContainer.remove()
        this.terminator.terminate()
    }

    private updateOrder(): void {
        while (this.frameContainer.lastChild !== null) this.frameContainer.lastChild.remove()
        this.sprite.frames.forEach(frame => this.frameContainer.appendChild(this.views.get(frame)!.element))
    }
}