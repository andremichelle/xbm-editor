import { AnimationFrame, HTML } from "../../lib/dom.js";
import { Menu, ListItem } from "../../lib/menu.js";
import { Events, Terminator } from './../../lib/common.js';
import { FrameView } from "./frame.js";
export class Animation {
    constructor(map) {
        this.map = map;
    }
}
Animation.Forward = new Animation((frame, totalFrames) => totalFrames <= 1 ? 0 : frame % totalFrames);
Animation.Alternate = new Animation((frame, totalFrames) => {
    if (totalFrames <= 1)
        return 0;
    const m = totalFrames - 1;
    return Math.abs(m - (frame % (m << 1)));
});
export class SpriteView {
    constructor(env, sprite) {
        this.env = env;
        this.sprite = sprite;
        this.terminator = new Terminator();
        this.preview = HTML.create('div', { class: 'preview' });
        this.title = HTML.create('h1', { textContent: this.sprite.getName() });
        this.canvas = HTML.create('canvas');
        this.context = this.canvas.getContext('2d');
        this.frames = HTML.create('div', { class: 'frame-views' });
        this.views = new Map();
        this.preview.appendChild(this.canvas);
        this.terminator.with(this.sprite.addObserver(sprite => console.log('sprite changed')));
        this.sprite.getFrames().forEach(frame => this.addFrame(frame));
        let frame = 0;
        this.terminator.with(AnimationFrame.add(() => {
            this.canvas.width = sprite.width;
            this.canvas.height = sprite.height;
            this.sprite.getFrame(Animation.Alternate.map(frame++ >> 3, sprite.getFrameCount())).paint(this.context);
        }));
        this.terminator.with(Events.bind(this.frames, 'contextmenu', (event) => Menu.ContextMenu.append(ListItem.default('Remove Frame').onTrigger(() => {
            const view = Array.from(this.views.values()).find(view => view.contains(event.target));
            if (view === undefined)
                return;
            this.sprite.removeFrame(view.frame);
        }))));
    }
    addFrame(frame) {
        const view = new FrameView(this.env, frame);
        this.views.set(frame, view);
        this.frames.appendChild(view.element);
    }
    removeFrame(frame) {
        const view = this.views.get(frame);
        console.assert(view !== undefined);
        view.terminate();
    }
    appendChildren(parent) {
        parent.appendChild(this.preview);
        parent.appendChild(this.title);
        parent.appendChild(this.frames);
    }
    terminate() {
        this.preview.remove();
        this.title.remove();
        this.frames.remove();
        this.terminator.terminate();
    }
}
//# sourceMappingURL=sprite.js.map