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
        this.togglePixel = (event) => {
            const r = this.canvas.getBoundingClientRect();
            const z = this.viewContext.zoom.get() | 0;
            const x = Math.floor((event.clientX - r.left) / z) | 0;
            const y = Math.floor((event.clientY - r.top) / z) | 0;
            this.frame.togglePixel(x, y);
        };
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
        this.terminator.with(Events.bind(this.canvas, 'pointerdown', this.togglePixel));
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
            ListItem.default('Mirror Vertical').onTrigger(() => this.frame.mirrorVertical()),
            ListItem.default('Mirror Horizontal').onTrigger(() => this.frame.mirrorHorizontal()),
            ListItem.default('Clear Pixels').onTrigger(() => this.frame.clear()),
            ListItem.default('Import Image').onTrigger(() => this.frame.import())
        ];
    }
}
//# sourceMappingURL=frame.js.map