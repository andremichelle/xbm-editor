var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Boot, preloadImagesOfCssFile } from "./lib/boot.js";
import { AnimationFrame, HTML } from './lib/dom.js';
import { ListItem, Menu, MenuBar } from "./lib/menu.js";
import { SheetView } from "./xbm-editor/view/sheet.js";
import { xbm } from './xbm-editor/xbm.js';
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.debug("booting...");
    const boot = new Boot();
    boot.await('css', preloadImagesOfCssFile("./bin/main.css"));
    boot.await('format', fetch('./xbm-sheet.json').then(x => x.json()));
    yield boot.awaitCompletion();
    const sheet = new xbm.Sheet([]).deserialize(boot.get('format'));
    AnimationFrame.init();
    Menu.ContextMenu.init();
    const sheetView = new SheetView(sheet);
    HTML.query('main').appendChild(sheetView.element);
    const element = document.querySelector("nav#app-menu");
    MenuBar.install()
        .offset(0, 0)
        .addButton(HTML.query("[data-menu='file']", element), ListItem.root()
        .addListItem(ListItem.default("Open File...", "", false)
        .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const files = yield window.showOpenFilePicker({ multiple: false, suggestedName: 'xbm-sheet.json' });
            if (files.length !== 1)
                return;
            const file = yield files[0].getFile();
            const text = yield file.text();
            const json = JSON.parse(text);
            sheet.deserialize(json);
        }
        catch (e) { }
    })))
        .addListItem(ListItem.default("Save File...", "", false)
        .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
        const handler = yield window.showSaveFilePicker({ multiple: false, suggestedName: 'xbm-sheet.json' });
        const fileStream = yield handler.createWritable();
        fileStream.write(new Blob([JSON.stringify(sheet.serialize())], { type: "application/json" }));
        fileStream.close();
    })))
        .addListItem(ListItem.default("Export C++...", "", false)
        .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
        const handler = yield window.showSaveFilePicker({ multiple: false, suggestedName: 'sprites.h' });
        const fileStream = yield handler.createWritable();
        fileStream.write(new Blob([sheet.toString()]));
        fileStream.close();
    })))
        .addListItem(ListItem.default("Clear", "", false).onTrigger(() => sheet.clear())))
        .addButton(HTML.query("[data-menu='view']", element), ListItem.root()
        .addRuntimeChildrenCallback(parentItem => {
        [6, 8, 16, 32].forEach(zoomLevel => {
            parentItem.addListItem(ListItem.default(`${zoomLevel}x`, '', sheetView.zoom.get() === zoomLevel)
                .onTrigger(() => sheetView.zoom.set(zoomLevel)));
        });
    }))
        .addButton(HTML.query("[data-menu='help']", element), ListItem.root()
        .addListItem(ListItem.default("No Help...", "", false)
        .isSelectable(false)));
    requestAnimationFrame(() => {
        document.querySelectorAll("body svg.preloader").forEach(element => element.remove());
        document.querySelectorAll("body main").forEach(element => element.classList.remove("invisible"));
    });
    console.debug("boot complete.");
}))();
//# sourceMappingURL=main.js.map