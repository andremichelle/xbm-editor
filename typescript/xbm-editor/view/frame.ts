import { HTML } from "../../lib/dom.js"
import { xbm } from "../xbm.js"
import { Events, Terminable, Terminator } from './../../lib/common.js'
import { ListItem } from './../../lib/menu.js'
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
        this.terminator.with(Events.bind(this.canvas, 'pointerdown', (event: PointerEvent) => {
            const r = this.canvas.getBoundingClientRect()
            const z = this.viewContext.zoom.get() | 0
            let tx = Math.floor((event.clientX - r.left) / z) | 0
            let ty = Math.floor((event.clientY - r.top) / z) | 0
            let lockAxis = false
            let lockAxisVector: { x: number, y: number } = { x: 1, y: 1 }
            const pv = !this.frame.getPixel(tx, ty)
            const pointerMove = (event: PointerEvent) => {
                const mx = Math.floor((event.clientX - r.left) / z) | 0
                const my = Math.floor((event.clientY - r.top) / z) | 0
                const dx = mx - tx
                const dy = my - ty
                if (dx === 0 && dy === 0) return
                if (!lockAxis && event.shiftKey) {
                    lockAxisVector = { x: Math.abs(Math.sign(dx)), y: Math.abs(Math.sign(dy)) }
                    lockAxis = true
                }
                this.frame.setPixel(tx + dx * lockAxisVector.x, ty + dy * lockAxisVector.y, pv)
            }
            this.canvas.addEventListener('pointermove', pointerMove)
            this.canvas.addEventListener('pointerup', () => this.canvas.removeEventListener('pointermove', pointerMove), { once: true })
            this.frame.setPixel(tx, ty, pv)
        }))
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
            ListItem.default('Mirror ⧗').onTrigger(() => this.frame.mirrorVertical()),
            ListItem.default('Mirror ⧓').onTrigger(() => this.frame.mirrorHorizontal()),
            ListItem.default('Clear Pixels').onTrigger(() => this.frame.clear()),
            ListItem.default('Import Image').onTrigger(() => this.import())
        ]
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

    async import(): Promise<void> {
        try {
            const files = await window.showOpenFilePicker({
                multiple: false, suggestedName: 'image.png',
                types: [{ accept: { 'image/*': ['.png'] }, description: '' }]
            })
            if (files.length !== 1) return
            const file = await files[0].getFile()
            const array = await file.arrayBuffer()
            const image = new Image()
            image.onerror = reason => console.warn(reason)
            image.onload = () => {
                const canvas = HTML.create('canvas', { width: image.width, height: image.height })
                const context: CanvasRenderingContext2D = canvas.getContext('2d')!
                context.drawImage(image, 0, 0)
                const rgba = context.getImageData(0, 0, image.width, image.height).data
                const data: number[] = []
                for (let y = 0; y < image.height; y++) {
                    for (let x = 0; x < image.width; x++) {
                        // we only check the red channel
                        if (rgba[(y * image.width + x) << 2] > 0x7F) {
                            data[this.frame.toByteIndex(x, y)] |= this.frame.toBitMask(x)
                        }
                    }
                }
                this.frame.writeData(data)
            }
            image.src = URL.createObjectURL(new Blob([array], { type: "image/png" }))
        } catch (e) { console.warn(e) }
    }
}