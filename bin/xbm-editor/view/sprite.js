import { HTML } from "../../lib/dom.js";
import { FrameView } from "./frame.js";
export class SpriteView {
    constructor(env, sprite) {
        this.env = env;
        this.sprite = sprite;
        this.element = HTML.create('div', { class: 'sprite-view' });
        this.frameContainer = HTML.create('div', { class: 'frame-container' });
        this.frameViews = this.sprite.getFrames().map(frame => new FrameView(env, frame));
        this.frameViews.forEach(view => this.frameContainer.appendChild(view.element));
        this.element.append(HTML.create('h1', { textContent: sprite.getName() }));
        this.element.appendChild(this.frameContainer);
    }
}
//# sourceMappingURL=sprite.js.map