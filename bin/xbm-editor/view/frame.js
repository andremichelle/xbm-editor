import { HTML } from "../../lib/dom.js";
import { Events, Terminator } from './../../lib/common.js';
export class FrameView {
    constructor(env, frame) {
        this.env = env;
        this.frame = frame;
        this.terminator = new Terminator();
        this.element = HTML.create('div', { class: 'frame-view' });
        this.canvas = HTML.create('canvas');
        this.context = this.canvas.getContext('2d');
        this.paint = () => {
            const w = this.frame.size.width | 0;
            const h = this.frame.size.height | 0;
            const z = this.env.zoom.get() | 0;
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
        this.terminator.with(Events.bind(this.canvas, 'pointerdown', (event) => {
            const r = this.canvas.getBoundingClientRect();
            const z = this.env.zoom.get() | 0;
            const x = Math.floor((event.clientX - r.left) / z) | 0;
            const y = Math.floor((event.clientY - r.top) / z) | 0;
            frame.togglePixel(x, y);
        }));
        this.element.appendChild(this.canvas);
        this.paint();
    }
    terminate() {
        this.canvas.remove();
        this.element.remove();
        this.terminator.terminate();
    }
}
//# sourceMappingURL=frame.js.map