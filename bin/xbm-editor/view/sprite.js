var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AnimationFrame, HTML } from "../../lib/dom.js";
import { ListItem, Menu } from "../../lib/menu.js";
import { CollectionEventType, Events, Terminator, Waiting } from './../../lib/common.js';
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
    constructor(viewContext, sprite) {
        this.viewContext = viewContext;
        this.sprite = sprite;
        this.terminator = new Terminator();
        this.preview = HTML.create('div', { class: 'preview' });
        this.title = HTML.create('h1', { textContent: this.sprite.name.get() });
        this.canvas = HTML.create('canvas');
        this.context = this.canvas.getContext('2d');
        this.frameContainer = HTML.create('div', { class: 'frame-views' });
        this.views = new Map();
        this.preview.appendChild(this.canvas);
        this.terminator.with(this.sprite.name.addObserver(name => this.title.textContent = name));
        this.terminator.with(this.sprite.frames.addObserver(event => {
            switch (event.type) {
                case CollectionEventType.Add: {
                    const frame = event.item;
                    this.views.set(frame, new FrameView(this.viewContext, frame));
                    this.updateOrder();
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
        this.sprite.frames.forEach(frame => this.views.set(frame, new FrameView(this.viewContext, frame)));
        this.updateOrder();
        let frame = 0;
        this.terminator.with(AnimationFrame.add(() => {
            this.canvas.width = sprite.width;
            this.canvas.height = sprite.height;
            this.sprite.getFrame(Animation.Alternate.map(frame++ >> 3, sprite.getFrameCount())).paint(this.context);
        }));
        this.terminator.with(Events.bind(this.frameContainer, 'contextmenu', (event) => {
            const index = this.sprite.frames.map(frame => this.views.get(frame)).findIndex(view => view.contains(event.target));
            Menu.ContextMenu.append(ListItem.default('Move Frame Left').onTrigger(() => {
                this.sprite.frames.move(index, index - 1);
            }).isSelectable(index > 0), ListItem.default('Move Frame Right').onTrigger(() => {
                this.sprite.frames.move(index, index + 1);
            }).isSelectable(index < this.sprite.getFrameCount() - 1), ListItem.default('Add Frame').onTrigger(() => {
                this.sprite.insertFrame(index + 1);
            }), ListItem.default('Copy Frame').onTrigger(() => {
                const original = this.sprite.getFrame(index).getData().slice(0);
                this.sprite.insertFrame(index + 1).writeData(original);
            }), ListItem.default('Delete Frame').onTrigger(() => {
                if (this.views.size === 1) {
                    this.sprite.removeFrame(this.sprite.frames.get(0));
                    this.viewContext.remove(this.sprite);
                }
                else {
                    const view = Array.from(this.views.values()).find(view => view.contains(event.target));
                    if (view === undefined)
                        return;
                    this.sprite.removeFrame(view.frame);
                }
            }));
        }));
        this.terminator.with(Events.bind(this.title, 'contextmenu', (event) => Menu.ContextMenu.append(ListItem.default('Rename Sprite...').onTrigger(() => __awaiter(this, void 0, void 0, function* () {
            yield Waiting.forFrames(2);
            const name = prompt('Enter new name', this.sprite.name.get());
            if (name === null)
                return;
            this.sprite.name.set(name.trim().toLowerCase());
        })), ListItem.default('Delete Sprite').onTrigger(() => __awaiter(this, void 0, void 0, function* () { return this.viewContext.remove(this.sprite); })))));
    }
    appendChildren(parent) {
        parent.appendChild(this.preview);
        parent.appendChild(this.title);
        parent.appendChild(this.frameContainer);
    }
    terminate() {
        this.preview.remove();
        this.title.remove();
        this.frameContainer.remove();
        this.terminator.terminate();
    }
    updateOrder() {
        while (this.frameContainer.lastChild !== null)
            this.frameContainer.lastChild.remove();
        this.sprite.frames.forEach(frame => this.frameContainer.appendChild(this.views.get(frame).element));
    }
}
//# sourceMappingURL=sprite.js.map