import { ObservableValue, ObservableValueImpl } from './../lib/common.js'
import { HTML } from '../lib/dom.js'
import { xbm } from './xbm.js'

export class Env {
    readonly zoom: ObservableValue<number> = new ObservableValueImpl<number>(8)
}

export class SheetView {
    readonly element: HTMLElement = HTML.create('div', { class: 'sheet-view' })
    readonly spriteContainer: HTMLDivElement = HTML.create('div', { class: 'sprite-container' })
    readonly addSpriteButton = HTML.create('button', { textContent: '+' })
    readonly spriteViews: SpriteView[]

    constructor(readonly env: Env, readonly sheet: xbm.Sheet) {
        this.spriteViews = sheet.sprites.map(sprite => new SpriteView(env, sprite))
        this.spriteViews.forEach(view => this.spriteContainer.appendChild(view.element))
        this.element.appendChild(this.spriteContainer)
        this.element.appendChild(this.addSpriteButton)

        this.addSpriteButton.addEventListener('click', () => {
            const sizeInput = prompt('Enter size (w x h)', '8x8')
            if (sizeInput === null) return
            const sizeArray = sizeInput.split('x').map(x => parseInt(x.trim()))
            if (sizeArray.length !== 2) return
            if (sizeArray.some(x => isNaN(x))) return
            const name = prompt('Enter name', 'untitled')
            if (name === null || name.length === 0) return
            const spriteView = new SpriteView(this.env, xbm.Sprite.single(sizeArray[0], sizeArray[1], name))
            this.spriteViews.push(spriteView)
            this.spriteContainer.appendChild(spriteView.element)
            console.log(`new name: ${name}, w: ${sizeArray[0]}, h: ${sizeArray[1]}`)
        })
    }
}

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
            this.update()
        })
        this.element.appendChild(this.canvas)
        this.update()
    }

    update(): void {
        const z = this.env.zoom.get()
        this.canvas.width = this.frame.getWidth() * z
        this.canvas.height = this.frame.getHeight() * z
        this.context.fillStyle = 'white'
        for (let y = 0; y < this.frame.getHeight(); ++y) {
            for (let x = 0; x < this.frame.getWidth(); ++x) {
                if (this.frame.getPixel(x, y)) {
                    this.context.fillRect(x * z, y * z, z, z)
                }
            }
        }
    }
}