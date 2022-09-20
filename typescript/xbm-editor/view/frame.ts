import { HTML } from "../../lib/dom.js"
import { xbm } from "../xbm.js"
import { Env } from "./env.js"

export class FrameView {
    readonly element: HTMLElement = HTML.create('div', { class: 'frame-view' })
    readonly canvas: HTMLCanvasElement = document.createElement('canvas')
    readonly context: CanvasRenderingContext2D = this.canvas.getContext('2d')!

    constructor(readonly env: Env, readonly frame: xbm.Frame) {
        this.canvas.addEventListener('pointerdown', (event: PointerEvent) => {
            const r = this.canvas.getBoundingClientRect()
            const z = this.env.zoom.get() | 0
            const x = Math.floor((event.clientX - r.left) / z) | 0
            const y = Math.floor((event.clientY - r.top) / z) | 0
            frame.togglePixel(x, y)
            this.paint()
        })
        this.element.appendChild(this.canvas)
        this.paint()
    }

    paint(): void {
        const z = this.env.zoom.get() | 0
        const s = z - 1
        const fw = this.frame.getWidth()
        const fh = this.frame.getHeight()
        this.canvas.width = fw * z - 1
        this.canvas.height = fh * z - 1
        this.context.fillStyle = 'black'
        for (let y = 0; y < fh; ++y) {
            for (let x = 0; x < fw; ++x) {
                if (!this.frame.getPixel(x, y)) {
                    this.context.fillRect(x * z, y * z, s, s)
                }
            }
        }
        this.context.fillStyle = 'white'
        for (let y = 0; y < fh; ++y) {
            for (let x = 0; x < fw; ++x) {
                if (this.frame.getPixel(x, y)) {
                    this.context.fillRect(x * z, y * z, s, s)
                }
            }
        }
    }
}