import { HTML } from "../../lib/dom.js"
import { xbm } from "../xbm.js"
import { Events, Terminable, Terminator } from './../../lib/common.js'
import { ListItem, Menu } from './../../lib/menu.js'
import { ViewContext } from "./context.js"

export class FrameView implements Terminable {
    private readonly terminator = new Terminator()

    readonly element: HTMLElement = HTML.create('div', { class: 'frame-view' })
    readonly canvas: HTMLCanvasElement = HTML.create('canvas')
    readonly menu: HTMLDivElement = HTML.create('div', { class: 'menu', 'data-menu': true })
    readonly context: CanvasRenderingContext2D = this.canvas.getContext('2d')!

    constructor(readonly viewContext: ViewContext, readonly frame: xbm.Frame) {
        this.terminator.with(this.frame.addObserver(this.paint))
        this.terminator.with(this.viewContext.zoom.addObserver(this.paint))
        this.terminator.with(Events.bind(this.canvas, 'pointerdown', this.togglePixel))
        this.element.appendChild(this.canvas)
        this.element.appendChild(this.menu)
        this.paint()
    }

    contains(target: Node | null): boolean {
        return this.element.contains(target)
    }

    terminate(): void {
        this.canvas.remove()
        this.element.remove()
        this.terminator.terminate()
    }

    createMenuItems(): ListItem[] {
        return [
            ListItem.default('Shift Up').onTrigger(() => this.frame.shift(0, -1)),
            ListItem.default('Shift Right').onTrigger(() => this.frame.shift(1, 0)),
            ListItem.default('Shift Down').onTrigger(() => this.frame.shift(0, 1)),
            ListItem.default('Shift Left').onTrigger(() => this.frame.shift(-1, 0)),
            ListItem.default('Mirror Vertical').onTrigger(() => this.frame.mirrorVertical()),
            ListItem.default('Mirror Horizontal').onTrigger(() => this.frame.mirrorHorizontal()),
            ListItem.default('Clear Pixels').onTrigger(() => this.frame.clear()),
            ListItem.default('Import Image').onTrigger(() => this.frame.import())
        ]
    }

    private readonly togglePixel = (event: PointerEvent) => {
        const r = this.canvas.getBoundingClientRect()
        const z = this.viewContext.zoom.get() | 0
        const x = Math.floor((event.clientX - r.left) / z) | 0
        const y = Math.floor((event.clientY - r.top) / z) | 0
        this.frame.togglePixel(x, y)
    }

    private readonly paint = (): void => {
        const w = this.frame.size.width | 0
        const h = this.frame.size.height | 0
        const z = this.viewContext.zoom.get() | 0
        const s = z - 1
        this.canvas.width = w * z - 1
        this.canvas.height = h * z - 1
        this.context.fillStyle = 'black'
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                if (!this.frame.getPixel(x, y)) {
                    this.context.fillRect(x * z, y * z, s, s)
                }
            }
        }
        this.context.fillStyle = 'white'
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                if (this.frame.getPixel(x, y)) {
                    this.context.fillRect(x * z, y * z, s, s)
                }
            }
        }
    }
}