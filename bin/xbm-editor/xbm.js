import { ArrayUtils, ObservableCollection, ObservableImpl } from '../lib/common.js';
export var xbm;
(function (xbm) {
    const writeHeader = (size, prefix) => `#define ${prefix}_width ${size.width}\n#define ${prefix}_height ${size.height}\n`;
    const writeDataBlock = (data, indention, entriesEachLine) => ArrayUtils
        .fill(Math.ceil(data.length / entriesEachLine), lineIndex => `${indention}${data
        .slice(lineIndex * entriesEachLine, (lineIndex + 1) * entriesEachLine)
        .map(byte => `0x${byte
        .toString(16)
        .toUpperCase()
        .padStart(2, '0')}`)}`)
        .join(',\n');
    const getFrameByteSize = (size) => size.height * Math.ceil(size.width / 8.0);
    class Frame {
        constructor(size, data = ArrayUtils.fill(getFrameByteSize(size), () => 0)) {
            this.size = size;
            this.data = data;
            this.observable = new ObservableImpl();
        }
        addObserver(observer) {
            return this.observable.addObserver(observer);
        }
        togglePixel(x, y) {
            this.setPixel(x, y, !this.getPixel(x, y));
        }
        clear() {
            if (this.data.some(x => x > 0)) {
                this.data.fill(0);
                this.observable.notify(this);
            }
        }
        shift(dx, dy) {
            if (!this.data.some(x => x > 0))
                return;
            const w = this.size.width;
            const h = this.size.height;
            const pixels = ArrayUtils.fill(h, () => ArrayUtils.fill(w, () => false));
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    pixels[y][x] = this.getPixel(x, y);
                }
            }
            this.data.fill(0);
            for (let r = 0; r < h; r++) {
                for (let c = 0; c < w; c++) {
                    const y = (r - dy + h) % h;
                    const x = (c - dx + w) % w;
                    if (pixels[y][x]) {
                        this.data[this.toByteIndex(c, r)] |= this.toBitMask(c);
                    }
                }
            }
            this.observable.notify(this);
        }
        setPixel(x, y, on) {
            const old = this.data[this.toByteIndex(x, y)];
            let value = old;
            if (on) {
                value |= this.toBitMask(x);
            }
            else {
                value &= ~this.toBitMask(x);
            }
            if (value === old)
                return;
            this.data[this.toByteIndex(x, y)] = value;
            this.observable.notify(this);
        }
        getPixel(x, y) {
            return 0 !== (this.data[this.toByteIndex(x, y)] & this.toBitMask(x));
        }
        serialize() {
            return { data: this.data };
        }
        toString(prefix = 'xbm', entriesEachLine = 8) {
            return `${writeHeader(this.size, prefix)}static unsigned char ${prefix}_xbm[] PROGMEM = {\n${writeDataBlock(this.data, '\t', entriesEachLine)}\n};`;
        }
        writeData(data) {
            data.forEach((byte, index) => this.data[index] = byte);
        }
        getData() {
            return this.data;
        }
        paint(context, style = 'white') {
            context.fillStyle = style;
            for (let y = 0; y < this.size.height; ++y) {
                for (let x = 0; x < this.size.width; ++x) {
                    if (this.getPixel(x, y)) {
                        context.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
        terminate() {
            this.observable.terminate();
        }
        toBitMask(x) {
            return 1 << (x & 7);
        }
        toByteIndex(x, y) {
            return y * Math.ceil(this.size.width / 8.0) + (x >> 3);
        }
    }
    xbm.Frame = Frame;
    class Sprite {
        constructor(width, height, name) {
            this.width = width;
            this.height = height;
            this.name = name;
            this.frames = new ObservableCollection();
        }
        static single(width, height, name) {
            const sprite = new Sprite(width, height, name);
            sprite.insertFrame(0);
            return sprite;
        }
        static fromData(width, height, data, name) {
            const sprite = new Sprite(width, height, name);
            data.forEach(data => sprite.insertFrame().writeData(data));
            return sprite;
        }
        addObserver(observer) {
            return this.frames.addObserver(observer);
        }
        insertFrame(insertIndex = Number.MAX_SAFE_INTEGER) {
            const frame = new Frame(this);
            this.frames.add(frame, insertIndex);
            return frame;
        }
        removeFrame(frame) {
            this.frames.remove(frame);
            frame.terminate();
        }
        getFrame(index) {
            return this.frames.get(index);
        }
        getFrames() {
            return this.frames;
        }
        getName() {
            return this.name;
        }
        serialize() {
            return {
                name: this.name,
                width: this.width,
                height: this.height,
                data: this.frames.map(frame => frame.getData().slice())
            };
        }
        toString(entriesEachLine = 8) {
            if (this.isSingleFrame()) {
                return this.frames.get(0).toString(this.name, entriesEachLine);
            }
            else {
                return `${writeHeader(this, this.name)}static unsigned char ${this.name}_xbm[${this.getFrameCount()}][${this.getFrameByteSize()}] PROGMEM = {${this.frames.map(frame => `\n\t{\n${writeDataBlock(frame.getData(), '\t\t', entriesEachLine)}\n\t}`).join(',')}\n};`;
            }
        }
        getFrameByteSize() {
            return getFrameByteSize(this);
        }
        getFrameCount() {
            return this.frames.size();
        }
        isSingleFrame() {
            return 1 === this.getFrameCount();
        }
        terminate() {
            this.frames.terminate();
        }
    }
    xbm.Sprite = Sprite;
    class Sheet {
        constructor(sprites) {
            this.sprites = sprites;
        }
        serialize() {
            return { sprites: this.sprites.map(sprite => sprite.serialize()) };
        }
        toString(entriesEachLine = 8) {
            return this.sprites.map(sprite => sprite.toString(entriesEachLine)).join('\n\n');
        }
    }
    xbm.Sheet = Sheet;
})(xbm || (xbm = {}));
//# sourceMappingURL=xbm.js.map