import { AnimationFrame, HTML } from "../../lib/dom.js"
import { ListItem, Menu } from "../../lib/menu.js"
import { xbm } from "../xbm.js"
import { CollectionEventType, Events, Terminable, Terminator, Waiting } from './../../lib/common.js'
import { ViewContext } from "./context.js"
import { FrameView } from "./frame.js"

export class Animation {
    static readonly First = new Animation((frame: number, totalFrames: number) => 0)
    static readonly Loop = new Animation((frame: number, totalFrames: number) => totalFrames <= 1 ? 0 : frame % totalFrames)
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
    readonly previewMenu = HTML.create('div', { class: 'menu' })
    readonly canvas: HTMLCanvasElement = HTML.create('canvas')
    readonly context: CanvasRenderingContext2D = this.canvas.getContext('2d')!
    readonly frameContainer: HTMLDivElement = HTML.create('div', { class: 'frame-views' })
    readonly views: Map<xbm.Frame, FrameView> = new Map<xbm.Frame, FrameView>()

    constructor(readonly viewContext: ViewContext, readonly sprite: xbm.Sprite) {
        this.preview.appendChild(this.canvas)
        this.preview.appendChild(this.previewMenu)

        this.terminator.with(Events.bind(this.previewMenu, 'pointerdown', (event: PointerEvent) => {
            this.previewMenu.classList.add('active')
            const rect = this.previewMenu.getBoundingClientRect()
            event.stopPropagation()
            Menu.Controller.open(ListItem.root()
                .addRuntimeChildrenCallback(parentItem => {
                    for (let mode = 0; mode < xbm.PreviewMode._Last; mode++) {
                        parentItem
                            .addListItem(ListItem.default(xbm.PreviewMode[mode], '', this.sprite.previewMode.get() === mode)
                                .onTrigger(() => this.sprite.previewMode.set(mode)))

                    }
                }), rect.left - 24, rect.top + rect.height, false, () => this.previewMenu.classList.remove('active'))

        }))

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
                    }), rect.left - 24, rect.top + rect.height, false, () => menuItem.classList.remove('active'))
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

        const previewSubscriptions = this.terminator.with(new Terminator())
        const startPainting = (animation: Animation): void => {
            let frame = 0
            previewSubscriptions.with(AnimationFrame.add(() => {
                this.canvas.width = sprite.width
                this.canvas.height = sprite.height
                this.sprite.getFrame(animation.map(frame++ >> 3, sprite.getFrameCount())).paint(this.context)
            }))
        }
        const updatePreviewMode = (mode: xbm.PreviewMode) => {
            previewSubscriptions.terminate()
            if (mode === xbm.PreviewMode.First) {
                startPainting(Animation.First)
            } else if (mode === xbm.PreviewMode.Tile) {
                let frame = 0
                previewSubscriptions.with(AnimationFrame.add(() => {
                    this.canvas.width = sprite.width * 4
                    this.canvas.height = sprite.height * 4
                    const frameIndex = Animation.Loop.map(frame++ >> 7, sprite.getFrameCount())
                    for (let y = 0; y < 4; y++) {
                        for (let x = 0; x < 4; x++) {
                            this.context.save()
                            this.context.translate(x * sprite.width, y * sprite.height)
                            this.sprite.getFrame(frameIndex).paint(this.context)
                            this.context.restore()
                        }
                    }
                }))
            } else if (mode === xbm.PreviewMode.Loop) {
                startPainting(Animation.Loop)
            } else if (mode === xbm.PreviewMode.Alternate) {
                startPainting(Animation.Alternate)
            }
        }
        this.terminator.with(this.sprite.previewMode.addObserver(updatePreviewMode))
        updatePreviewMode(this.sprite.previewMode.get())
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