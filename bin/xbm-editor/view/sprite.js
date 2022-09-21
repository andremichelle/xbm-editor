import { AnimationFrame, HTML } from "../../lib/dom.js";
import { ListItem, Menu } from "../../lib/menu.js";
import { CollectionEventType, Events, Terminator } from './../../lib/common.js';
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
        this.terminator.with(this.sprite.addObserver(event => {
            switch (event.type) {
                case CollectionEventType.Add: {
                    const frame = event.item;
                    this.views.set(frame, new FrameView(this.env, frame));
                    break;
                }
                case CollectionEventType.Remove: {
                    const frame = event.item;
                    const view = this.views.get(frame);
                    console.assert(view !== undefined);
                    this.views.delete(frame);
                    view.terminate();
                    break;
                }
                case CollectionEventType.Order: {
                    this.updateOrder();
                    break;
                }
            }
        }));
        this.sprite.getFrames().forEach(frame => this.views.set(frame, new FrameView(this.env, frame)));
        this.updateOrder();
        let frame = 0;
        this.terminator.with(AnimationFrame.add(() => {
            this.canvas.width = sprite.width;
            this.canvas.height = sprite.height;
            this.sprite.getFrame(Animation.Alternate.map(frame++ >> 3, sprite.getFrameCount())).paint(this.context);
        }));
        this.terminator.with(Events.bind(this.frames, 'contextmenu', (event) => Menu.ContextMenu.append(ListItem.default('Copy Frame').onTrigger(() => {
            const insertIndex = Array.from(this.views.values()).findIndex(view => view.contains(event.target));
            console.log(insertIndex);
        }), ListItem.default('Delete Frame').onTrigger(() => {
            const view = Array.from(this.views.values()).find(view => view.contains(event.target));
            if (view === undefined)
                return;
            this.sprite.removeFrame(view.frame);
        }))));
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
    updateOrder() {
        while (this.frames.lastChild !== null)
            this.frames.lastChild.remove();
        this.sprite.getFrames().forEach(frame => this.frames.appendChild(this.views.get(frame).element));
    }
}
//# sourceMappingURL=sprite.js.map