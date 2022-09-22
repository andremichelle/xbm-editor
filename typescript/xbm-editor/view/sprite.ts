import { AnimationFrame, HTML } from "../../lib/dom.js"
import { ListItem, Menu } from "../../lib/menu.js"
import { xbm } from "../xbm.js"
import { CollectionEventType, Events, Terminable, Terminator, Waiting } from './../../lib/common.js'
import { ViewContext } from "./context.js"
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

    constructor(readonly viewContext: ViewContext, readonly sprite: xbm.Sprite) {
        this.preview.appendChild(this.canvas)

        this.terminator.with(Events.bind(this.frameContainer, 'pointerdown', (event: PointerEvent) => {
            const menuItem = event.target as Element
            if (menuItem.matches('[data-menu=true]')) {
                const view = this.sprite.frames.map(frame => this.views.get(frame)!).find(view => view.contains(event.target as Node))!
                menuItem.classList.add('active')
                const rect = menuItem.getBoundingClientRect()
                event.stopPropagation()
                Menu.Controller.open(ListItem.root()
                    .addRuntimeChildrenCallback(parentItem => {
                        let separatorBefore = false
                        this.createMenuItems(view).forEach(block => {
                            if (separatorBefore) {
                                block[0].addSeparatorBefore()
                            }
                            parentItem.addListItem(...block)
                            separatorBefore = true
                        })
                    }), rect.left, rect.top + rect.height + 1, false, () => menuItem.classList.remove('active'))
            }
        }))
        this.terminator.with(this.sprite.name.addObserver(name => this.title.textContent = name))
        this.terminator.with(this.sprite.frames.addObserver(event => {
            switch (event.type) {
                case CollectionEventType.Add: {
                    const frame = event.item!
                    this.views.set(frame, new FrameView(this.viewContext, frame))
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

        this.sprite.frames.forEach(frame => this.views.set(frame, new FrameView(this.viewContext, frame)))
        this.updateOrder()

        let frame = 0 // Increment in single source with adjustable speed
        this.terminator.with(AnimationFrame.add(() => {
            this.canvas.width = sprite.width
            this.canvas.height = sprite.height
            this.sprite.getFrame(Animation.Alternate.map(frame++ >> 3, sprite.getFrameCount())).paint(this.context)
        }))
    }

    appendChildren(parent: ParentNode): void {
        parent.appendChild(this.preview)
        parent.appendChild(this.title)
        parent.appendChild(this.frameContainer)
    }

    createMenuItems(view: FrameView): ListItem[][] {
        const index = this.sprite.frames.indexOf(view.frame)
        return [
            [
                ListItem.default('Rename Sprite...').onTrigger(async () => {
                    await Waiting.forFrames(2)
                    const name = prompt('Enter new name', this.sprite.name.get())
                    if (name === null) return
                    this.sprite.name.set(name.trim().toLowerCase())
                }),
                ListItem.default('Delete Sprite').onTrigger(async () => this.viewContext.remove(this.sprite))
            ],
            [
                ListItem.default('Move Frame Left').onTrigger(() => this.sprite.frames.move(index, index - 1))
                    .isSelectable(index > 0),
                ListItem.default('Move Frame Right').onTrigger(() => this.sprite.frames.move(index, index + 1))
                    .isSelectable(index < this.sprite.getFrameCount() - 1),
                ListItem.default('Add Frame').onTrigger(() => this.sprite.insertFrame(index + 1)),
                ListItem.default('Copy Frame').onTrigger(() => {
                    const original = this.sprite.getFrame(index).getData().slice(0)
                    this.sprite.insertFrame(index + 1).writeData(original)
                }),
                ListItem.default('Delete Frame').onTrigger(() => {
                    if (this.views.size === 1) {
                        this.sprite.removeFrame(this.sprite.frames.get(0))
                        this.viewContext.remove(this.sprite)
                    } else {
                        this.sprite.removeFrame(view.frame)
                    }
                })
            ], view.createMenuItems()
        ]
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