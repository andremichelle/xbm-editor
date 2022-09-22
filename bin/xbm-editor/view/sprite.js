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
import { xbm } from "../xbm.js";
import { CollectionEventType, Events, Terminator, Waiting } from './../../lib/common.js';
import { FrameView } from "./frame.js";
export class Animation {
    constructor(map) {
        this.map = map;
    }
}
Animation.First = new Animation((frame, totalFrames) => 0);
Animation.Loop = new Animation((frame, totalFrames) => totalFrames <= 1 ? 0 : frame % totalFrames);
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
        this.previewMenu = HTML.create('div', { class: 'menu' });
        this.canvas = HTML.create('canvas');
        this.context = this.canvas.getContext('2d');
        this.frameContainer = HTML.create('div', { class: 'frame-views' });
        this.views = new Map();
        this.preview.appendChild(this.canvas);
        this.preview.appendChild(this.previewMenu);
        this.terminator.with(Events.bind(this.previewMenu, 'pointerdown', (event) => {
            this.previewMenu.classList.add('active');
            const rect = this.previewMenu.getBoundingClientRect();
            event.stopPropagation();
            Menu.Controller.open(ListItem.root()
                .addRuntimeChildrenCallback(parentItem => {
                for (let mode = 0; mode < xbm.PreviewMode._Last; mode++) {
                    parentItem
                        .addListItem(ListItem.default(xbm.PreviewMode[mode], '', this.sprite.previewMode.get() === mode)
                        .onTrigger(() => this.sprite.previewMode.set(mode)));
                }
            }), rect.left - 1, rect.top + rect.height, false, () => this.previewMenu.classList.remove('active'));
        }));
        this.terminator.with(Events.bind(this.frameContainer, 'pointerdown', (event) => {
            const menuItem = event.target;
            if (menuItem.matches('[data-menu=true]')) {
                const view = this.sprite.frames.map(frame => this.views.get(frame)).find(view => view.contains(event.target));
                menuItem.classList.add('active');
                const rect = menuItem.getBoundingClientRect();
                event.stopPropagation();
                Menu.Controller.open(ListItem.root()
                    .addRuntimeChildrenCallback(parentItem => {
                    let separatorBefore = false;
                    this.createMenuItems(view).forEach(block => {
                        if (separatorBefore) {
                            block[0].addSeparatorBefore();
                        }
                        parentItem.addListItem(...block);
                        separatorBefore = true;
                    });
                }), rect.left - 1, rect.top + rect.height, false, () => menuItem.classList.remove('active'));
            }
        }));
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
        const previewSubscriptions = this.terminator.with(new Terminator());
        const startPainting = (animation) => {
            let frame = 0;
            previewSubscriptions.with(AnimationFrame.add(() => {
                this.canvas.width = sprite.width;
                this.canvas.height = sprite.height;
                this.sprite.getFrame(animation.map(frame++ >> 3, sprite.getFrameCount())).paint(this.context);
            }));
        };
        const updatePreviewMode = (mode) => {
            previewSubscriptions.terminate();
            if (mode === xbm.PreviewMode.First) {
                startPainting(Animation.First);
            }
            else if (mode === xbm.PreviewMode.Tile) {
                let frame = 0;
                previewSubscriptions.with(AnimationFrame.add(() => {
                    this.canvas.width = sprite.width * 4;
                    this.canvas.height = sprite.height * 4;
                    const frameIndex = Animation.Loop.map(frame++ >> 7, sprite.getFrameCount());
                    for (let y = 0; y < 4; y++) {
                        for (let x = 0; x < 4; x++) {
                            this.context.save();
                            this.context.translate(x * sprite.width, y * sprite.height);
                            this.sprite.getFrame(frameIndex).paint(this.context);
                            this.context.restore();
                        }
                    }
                }));
            }
            else if (mode === xbm.PreviewMode.Loop) {
                startPainting(Animation.Loop);
            }
            else if (mode === xbm.PreviewMode.Alternate) {
                startPainting(Animation.Alternate);
            }
        };
        this.terminator.with(this.sprite.previewMode.addObserver(updatePreviewMode));
        updatePreviewMode(this.sprite.previewMode.get());
    }
    appendChildren(parent) {
        parent.appendChild(this.preview);
        parent.appendChild(this.title);
        parent.appendChild(this.frameContainer);
    }
    createMenuItems(view) {
        const index = this.sprite.frames.indexOf(view.frame);
        return [
            [
                ListItem.default('Rename Sprite...').onTrigger(() => __awaiter(this, void 0, void 0, function* () {
                    yield Waiting.forFrames(2);
                    const name = prompt('Enter new name', this.sprite.name.get());
                    if (name === null)
                        return;
                    this.sprite.name.set(name.trim().toLowerCase());
                })),
                ListItem.default('Delete Sprite').onTrigger(() => __awaiter(this, void 0, void 0, function* () { return this.viewContext.remove(this.sprite); }))
            ],
            [
                ListItem.default('Move Frame Left').onTrigger(() => this.sprite.frames.move(index, index - 1))
                    .isSelectable(index > 0),
                ListItem.default('Move Frame Right').onTrigger(() => this.sprite.frames.move(index, index + 1))
                    .isSelectable(index < this.sprite.getFrameCount() - 1),
                ListItem.default('Add Frame').onTrigger(() => this.sprite.insertFrame(index + 1)),
                ListItem.default('Copy Frame').onTrigger(() => {
                    const original = this.sprite.getFrame(index).getData().slice(0);
                    this.sprite.insertFrame(index + 1).writeData(original);
                }),
                ListItem.default('Delete Frame').onTrigger(() => {
                    if (this.views.size === 1) {
                        this.sprite.removeFrame(this.sprite.frames.get(0));
                        this.viewContext.remove(this.sprite);
                    }
                    else {
                        this.sprite.removeFrame(view.frame);
                    }
                })
            ], view.createMenuItems()
        ];
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