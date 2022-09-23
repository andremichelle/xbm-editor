var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { HTML } from "../../lib/dom.js";
import { Events, Terminator } from './../../lib/common.js';
import { ListItem } from './../../lib/menu.js';
export class FrameView {
    constructor(viewContext, frame) {
        this.viewContext = viewContext;
        this.frame = frame;
        this.terminator = new Terminator();
        this.element = HTML.create('div', { class: 'frame-view' });
        this.canvas = HTML.create('canvas');
        this.menu = HTML.create('div', { class: 'menu', 'data-menu': true });
        this.context = this.canvas.getContext('2d');
        this.paint = () => {
            const w = this.frame.size.width | 0;
            const h = this.frame.size.height | 0;
            const z = this.viewContext.zoom.get() | 0;
            const s = z - 1;
            this.canvas.width = w * z - 1;
            this.canvas.height = h * z - 1;
            this.context.fillStyle = 'black';
            for (let y = 0; y < h; ++y) {
                for (let x = 0; x < w; ++x) {
                    if (!this.frame.getPixel(x, y)) {
                        this.context.fillRect(x * z, y * z, s, s);
                    }
                }
            }
            this.context.fillStyle = 'white';
            for (let y = 0; y < h; ++y) {
                for (let x = 0; x < w; ++x) {
                    if (this.frame.getPixel(x, y)) {
                        this.context.fillRect(x * z, y * z, s, s);
                    }
                }
            }
        };
        this.terminator.with(this.frame.addObserver(this.paint));
        this.terminator.with(this.viewContext.zoom.addObserver(this.paint));
        this.terminator.with(Events.bind(this.canvas, 'pointerdown', (event) => {
            const r = this.canvas.getBoundingClientRect();
            const z = this.viewContext.zoom.get() | 0;
            let tx = Math.floor((event.clientX - r.left) / z) | 0;
            let ty = Math.floor((event.clientY - r.top) / z) | 0;
            let lockAxis = false;
            let lockAxisVector = { x: 1, y: 1 };
            const pv = !this.frame.getPixel(tx, ty);
            const pointerMove = (event) => {
                const mx = Math.floor((event.clientX - r.left) / z) | 0;
                const my = Math.floor((event.clientY - r.top) / z) | 0;
                const dx = mx - tx;
                const dy = my - ty;
                if (dx === 0 && dy === 0)
                    return;
                if (!lockAxis && event.shiftKey) {
                    lockAxisVector = { x: Math.abs(Math.sign(dx)), y: Math.abs(Math.sign(dy)) };
                    lockAxis = true;
                }
                this.frame.setPixel(tx + dx * lockAxisVector.x, ty + dy * lockAxisVector.y, pv);
            };
            this.canvas.addEventListener('pointermove', pointerMove);
            this.canvas.addEventListener('pointerup', () => this.canvas.removeEventListener('pointermove', pointerMove), { once: true });
            this.frame.setPixel(tx, ty, pv);
        }));
        this.element.appendChild(this.canvas);
        this.element.appendChild(this.menu);
        this.paint();
    }
    contains(target) {
        return this.element.contains(target);
    }
    terminate() {
        this.canvas.remove();
        this.element.remove();
        this.terminator.terminate();
    }
    createMenuItems() {
        return [
            ListItem.default('Shift Up').onTrigger(() => this.frame.shift(0, -1)),
            ListItem.default('Shift Right').onTrigger(() => this.frame.shift(1, 0)),
            ListItem.default('Shift Down').onTrigger(() => this.frame.shift(0, 1)),
            ListItem.default('Shift Left').onTrigger(() => this.frame.shift(-1, 0)),
            ListItem.default('Mirror ⧗').onTrigger(() => this.frame.mirrorVertical()),
            ListItem.default('Mirror ⧓').onTrigger(() => this.frame.mirrorHorizontal()),
            ListItem.default('Clear Pixels').onTrigger(() => this.frame.clear()),
            ListItem.default('Import Image').onTrigger(() => this.import())
        ];
    }
    import() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const files = yield window.showOpenFilePicker({
                    multiple: false, suggestedName: 'image.png',
                    types: [{ accept: { 'image/*': ['.png'] }, description: '' }]
                });
                if (files.length !== 1)
                    return;
                const file = yield files[0].getFile();
                const array = yield file.arrayBuffer();
                const image = new Image();
                image.onerror = reason => console.warn(reason);
                image.onload = () => {
                    const canvas = HTML.create('canvas', { width: image.width, height: image.height });
                    const context = canvas.getContext('2d');
                    context.drawImage(image, 0, 0);
                    const rgba = context.getImageData(0, 0, image.width, image.height).data;
                    const data = [];
                    for (let y = 0; y < image.height; y++) {
                        for (let x = 0; x < image.width; x++) {
                            if (rgba[(y * image.width + x) << 2] > 0x7F) {
                                data[this.frame.toByteIndex(x, y)] |= this.frame.toBitMask(x);
                            }
                        }
                    }
                    this.frame.writeData(data);
                };
                image.src = URL.createObjectURL(new Blob([array], { type: "image/png" }));
            }
            catch (e) {
                console.warn(e);
            }
        });
    }
}
//# sourceMappingURL=frame.js.map