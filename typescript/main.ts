import { Boot, preloadImagesOfCssFile } from "./lib/boot.js"
import { HTML } from './lib/dom.js'
import { Env } from "./xbm-editor/view/env.js"
import { SheetView } from "./xbm-editor/view/sheet.js"
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

    const sheet = new xbm.Sheet([xbm.Sprite.fromData(8, 14, [
        [0x1F, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04],
        [0x0E, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04],
        [0x04, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04]
    ], 'hero'),
    xbm.Sprite.fromData(11, 7, [
        [80, 0, 168, 0, 216, 0, 252, 1, 38, 3, 2, 2, 2, 2],
        [80, 0, 168, 0, 216, 0, 252, 1, 34, 2, 2, 2, 0, 0],
        [80, 0, 168, 0, 216, 0, 252, 1, 3, 6, 0, 0, 0, 0]
    ], 'bat')])

    HTML.query('main').appendChild(new SheetView(new Env(), sheet).element)
    HTML.query('button[data-action=open]').addEventListener('click', async () => {
        try {
            const files = await window.showOpenFilePicker({ multiple: false, suggestedName: 'xbm-sheet.json' })
            if (files.length !== 1) return
            const file = await files[0].getFile()
            const text = await file.text()
            const json = JSON.parse(text)
            sheet.deserialize(json)
        } catch (e) { }
    })
    HTML.query('button[data-action=save]').addEventListener('click', async () => {
        const handler = await window.showSaveFilePicker({ multiple: false, suggestedName: 'xbm-sheet.json' })
        const fileStream = await handler.createWritable()
        fileStream.write(new Blob([JSON.stringify(sheet.serialize())], { type: "application/json" }))
        fileStream.close()
    })
    HTML.query('button[data-action=export]').addEventListener('click', async () => {
        const handler = await window.showSaveFilePicker({ multiple: false, suggestedName: 'sprites.h' })
        const fileStream = await handler.createWritable()
        fileStream.write(new Blob([sheet.toString()]))
        fileStream.close()
    })
    HTML.query('button[data-action=clear]').addEventListener('click', async () => {
        // TODO
    })

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