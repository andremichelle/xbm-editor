import { Boot, preloadImagesOfCssFile } from "./lib/boot.js"
import { Waiting } from "./lib/common.js"
import { AnimationFrame, HTML } from './lib/dom.js'
import { ListItem, MenuBar } from "./lib/menu.js"
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

    const sheet = new xbm.Sheet([
        xbm.Sprite.fromData(8, 14, [
            [0x1F, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04],
            [0x0E, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04],
            [0x04, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04]
        ], 'hero'),
        xbm.Sprite.fromData(11, 7, [
            [80, 0, 168, 0, 216, 0, 252, 1, 38, 3, 2, 2, 2, 2],
            [80, 0, 168, 0, 216, 0, 252, 1, 34, 2, 2, 2, 0, 0],
            [80, 0, 168, 0, 216, 0, 252, 1, 3, 6, 0, 0, 0, 0]
        ], 'bat')])

    AnimationFrame.init()

    HTML.query('main').appendChild(new SheetView(new Env(), sheet).element)

    const element = document.querySelector("nav#app-menu")!
    MenuBar.install()
        .offset(0, 0)
        .addButton(HTML.query("[data-menu='file']", element), ListItem.root()
            .addListItem(ListItem.default("Open File...", "", false)
                .onTrigger(async () => {
                    await Waiting.forFrames(2)
                    alert('not yet')
                    if (false) {
                        try {
                            const files = await window.showOpenFilePicker({ multiple: false, suggestedName: 'xbm-sheet.json' })
                            if (files.length !== 1) return
                            const file = await files[0].getFile()
                            const text = await file.text()
                            const json = JSON.parse(text)
                            console.log('open', json) // TODO
                        } catch (e) { }
                    }
                }))
            .addListItem(ListItem.default("Save File...", "", false)
                .onTrigger(async () => {
                    const handler = await window.showSaveFilePicker({ multiple: false, suggestedName: 'xbm-sheet.json' })
                    const fileStream = await handler.createWritable()
                    fileStream.write(new Blob([JSON.stringify(sheet.serialize())], { type: "application/json" }))
                    fileStream.close()
                }))
            .addListItem(ListItem.default("Export C++...", "", false)
                .onTrigger(async () => {
                    const handler = await window.showSaveFilePicker({ multiple: false, suggestedName: 'sprites.h' })
                    const fileStream = await handler.createWritable()
                    fileStream.write(new Blob([sheet.toString()]))
                    fileStream.close()
                }))
        )

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