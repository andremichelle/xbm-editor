import { Boot, preloadImagesOfCssFile } from "./lib/boot.js"
import { HTML } from './lib/dom.js'
import { xbm } from './xbm-editor/xbm.js'

const showProgress = (() => {
    const progress: SVGSVGElement = document.querySelector("svg.preloader") as SVGSVGElement
    window.onerror = () => progress.classList.add("error")
    window.onunhandledrejection = () => progress.classList.add("error")
    return (percentage: number) => progress.style.setProperty("--percentage", percentage.toFixed(2))
})();

(async () => {
    console.debug("booting...")

    // --- BOOT STARTS ---

    const boot = new Boot()
    boot.await('css', preloadImagesOfCssFile("./bin/main.css"))
    await boot.awaitCompletion()

    const sprite = xbm.Sprite.fromData(8, 14, [
        [0x1F, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04],
        [0x0E, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04],
        [0x04, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04]
    ], 'hero')
    const frame = sprite.getFrame(0)
    console.log(sprite.toString())
    console.log(JSON.stringify(sprite.serialize()))


    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    const zoom = 16

    canvas.width = frame.getWidth() * zoom
    canvas.height = frame.getHeight() * zoom
    canvas.style.backgroundColor = '#DDD'
    context.fillStyle = 'black'

    const update = () => {
        context.clearRect(0, 0, canvas.width, canvas.height)
        for (let y = 0; y < frame.getHeight(); ++y) {
            for (let x = 0; x < frame.getWidth(); ++x) {
                if (frame.getPixel(x, y)) {
                    context.fillRect(x * zoom, y * zoom, zoom, zoom)
                }
            }
        }
    }

    canvas.addEventListener('pointerdown', (event: PointerEvent) => {
        const r = canvas.getBoundingClientRect()
        const x = Math.floor((event.clientX - r.left) / zoom)
        const y = Math.floor((event.clientY - r.top) / zoom)
        frame.togglePixel(x, y)
        update()
    })

    HTML.query('main').appendChild(canvas)
    update()

    // --- BOOT ENDS ---

    // prevent dragging entire document on mobile
    document.addEventListener('touchmove', (event: TouchEvent) => event.preventDefault(), { passive: false })
    document.addEventListener('dblclick', (event: Event) => event.preventDefault(), { passive: false })
    const resize = () => document.body.style.height = `${window.innerHeight}px`
    window.addEventListener("resize", resize)
    resize()
    requestAnimationFrame(() => {
        document.querySelectorAll("body svg.preloader").forEach(element => element.remove())
        document.querySelectorAll("body main").forEach(element => element.classList.remove("invisible"))
    })
    console.debug("boot complete.")
})()