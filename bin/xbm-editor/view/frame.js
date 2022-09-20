import { HTML } from "../../lib/dom.js";
export class FrameView {
    constructor(env, frame) {
        this.env = env;
        this.frame = frame;
        this.element = HTML.create('div', { class: 'frame-view' });
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.addEventListener('pointerdown', (event) => {
            const r = this.canvas.getBoundingClientRect();
            const z = this.env.zoom.get() | 0;
            const x = Math.floor((event.clientX - r.left) / z) | 0;
            const y = Math.floor((event.clientY - r.top) / z) | 0;
            frame.togglePixel(x, y);
            this.paint();
        });
        this.element.appendChild(this.canvas);
        this.paint();
    }
    paint() {
        const z = this.env.zoom.get() | 0;
        const s = z - 1;
        const fw = this.frame.getWidth();
        const fh = this.frame.getHeight();
        this.canvas.width = fw * z - 1;
        this.canvas.height = fh * z - 1;
        this.context.fillStyle = 'black';
        for (let y = 0; y < fh; ++y) {
            for (let x = 0; x < fw; ++x) {
                if (!this.frame.getPixel(x, y)) {
                    this.context.fillRect(x * z, y * z, s, s);
                }
            }
        }
        this.context.fillStyle = 'white';
        for (let y = 0; y < fh; ++y) {
            for (let x = 0; x < fw; ++x) {
                if (this.frame.getPixel(x, y)) {
                    this.context.fillRect(x * z, y * z, s, s);
                }
            }
        }
    }
}
//# sourceMappingURL=frame.js.map