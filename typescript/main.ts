import { Waiting } from './lib/common.js'
import { Boot, preloadImagesOfCssFile } from "./lib/boot.js"
import { AnimationFrame, HTML } from './lib/dom.js'
import { ListItem, Menu, MenuBar } from "./lib/menu.js"
import { SheetView } from "./xbm-editor/view/sheet.js"
import { xbm } from './xbm-editor/xbm.js'

(async () => {
    console.debug("booting...")

    // --- BOOT STARTS ---

    const boot = new Boot()
    boot.await('css', preloadImagesOfCssFile("./bin/main.css"))
    boot.await('format', fetch('./xbm-sheet.json').then(x => x.json()))
    await boot.awaitCompletion()

    const sheet = new xbm.Sheet([/*
        xbm.Sprite.fromData(8, 14, [
            [0x1F, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04],
            [0x0E, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04],
            [0x04, 0x04, 0x24, 0x56, 0x3E, 0xBE, 0x7E, 0x1C, 0x18, 0x10, 0x18, 0x08, 0x04, 0x04]
        ], 'hero'),
        xbm.Sprite.fromData(11, 7, [
            [80, 0, 168, 0, 216, 0, 252, 1, 38, 3, 2, 2, 2, 2],
            [80, 0, 168, 0, 216, 0, 252, 1, 34, 2, 2, 2, 0, 0],
            [80, 0, 168, 0, 216, 0, 252, 1, 3, 6, 0, 0, 0, 0]
        ], 'bat')]
    */]).deserialize(boot.get('format'))

    AnimationFrame.init()
    Menu.ContextMenu.init()

    const sheetView = new SheetView(sheet)
    HTML.query('main').appendChild(sheetView.element)

    const element = document.querySelector("nav#app-menu")!
    MenuBar.install()
        .offset(0, 0)
        .addButton(HTML.query("[data-menu='file']", element), ListItem.root()
            .addListItem(ListItem.default("Open File...", "", false)
                .onTrigger(async () => {
                    try {
                        const files = await window.showOpenFilePicker({ multiple: false, suggestedName: 'xbm-sheet.json' })
                        if (files.length !== 1) return
                        const file = await files[0].getFile()
                        const text = await file.text()
                        const json = JSON.parse(text)
                        sheet.deserialize(json)
                    } catch (e) { }
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
            .addListItem(ListItem.default("Clear", "", false).onTrigger(() => sheet.clear()))
        )
        .addButton(HTML.query("[data-menu='view']", element), ListItem.root()
            .addRuntimeChildrenCallback(parentItem => {
                [6, 8, 16, 32].forEach(zoomLevel => {
                    parentItem.addListItem(ListItem.default(`${zoomLevel}x`, '', sheetView.zoom.get() === zoomLevel)
                        .onTrigger(() => sheetView.zoom.set(zoomLevel)))
                })
                parentItem.addListItem(ListItem.default('Center').onTrigger(() => sheetView.center()))
            })
        )
        .addButton(HTML.query("[data-menu='help']", element), ListItem.root()
            .addListItem(ListItem.default("No Help...", "", false)
                .isSelectable(false))
        )

    // --- BOOT ENDS ---
    requestAnimationFrame(() => {
        document.querySelectorAll("body svg.preloader").forEach(element => element.remove())
        document.querySelectorAll("body main").forEach(element => element.classList.remove("invisible"))
    })
    console.debug("boot complete.")
    await Waiting.forFrame()
    sheetView.center()
})()