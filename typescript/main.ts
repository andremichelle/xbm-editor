import { HTML } from './lib/dom.js'
import { Boot, preloadImagesOfCssFile } from "./lib/boot.js"
import { XBMEncoder } from "./xbm-editor/format.js"

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


    const encoder = new XBMEncoder(8, 14, [0x1F, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04])

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    const zoom = 16

    canvas.width = encoder.getWidth() * zoom
    canvas.height = encoder.getHeight() * zoom
    canvas.style.backgroundColor = '#DDD'
    context.fillStyle = 'black'

    const update = () => {
        context.clearRect(0, 0, canvas.width, canvas.height)
        for (let y = 0; y < encoder.getHeight(); ++y) {
            for (let x = 0; x < encoder.getWidth(); ++x) {
                if (encoder.getPixel(x, y)) {
                    context.fillRect(x * zoom, y * zoom, zoom, zoom)
                }
            }
        }
    }

    console.log(encoder.toString())


    canvas.addEventListener('pointerdown', (event: PointerEvent) => {
        const r = canvas.getBoundingClientRect()
        const x = Math.floor((event.clientX - r.left) / zoom)
        const y = Math.floor((event.clientY - r.top) / zoom)
        encoder.togglePixel(x, y)
        update()
    })

    HTML.query('main').appendChild(canvas)
    update()

    // --- BOOT ENDS ---
    const frame = () => {
        requestAnimationFrame(frame)
    }
    frame()

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