import { ArrayUtils } from '../lib/common.js';
export var xbm;
(function (xbm) {
    const writeHeader = (width, height, prefix) => `#define ${prefix}_width ${width}\n#define ${prefix}_height ${height}\n`;
    const writeDataBlock = (data, indention, entriesEachLine) => ArrayUtils
        .fill(Math.ceil(data.length / entriesEachLine), lineIndex => `${indention}${data
        .slice(lineIndex * entriesEachLine, (lineIndex + 1) * entriesEachLine)
        .map(byte => `0x${byte
        .toString(16)
        .toUpperCase()
        .padStart(2, '0')}`)}`)
        .join(',\n');
    const getFrameSize = (width, height) => height * Math.ceil(width / 8.0);
    class Frame {
        constructor(width, height, data = []) {
            this.width = width;
            this.height = height;
            this.data = data;
            console.assert(getFrameSize(width, height) === data.length);
        }
        togglePixel(x, y) {
            this.setPixel(x, y, !this.getPixel(x, y));
        }
        setPixel(x, y, value) {
            if (value) {
                this.data[this.toByteIndex(x, y)] |= this.toBitMask(x);
            }
            else {
                this.data[this.toByteIndex(x, y)] &= ~this.toBitMask(x);
            }
        }
        getPixel(x, y) {
            return 0 !== (this.data[this.toByteIndex(x, y)] & this.toBitMask(x));
        }
        serialize() {
            return {
                width: this.width,
                height: this.height,
                data: this.data
            };
        }
        deserialize(format) {
            console.assert(getFrameSize(format.width, format.height) === format.data.length);
            this.width = format.width;
            this.height = format.height;
            this.data = format.data.slice();
            return this;
        }
        toString(prefix = 'xbm', entriesEachLine = 8) {
            return `${writeHeader(this.width, this.height, prefix)}static unsigned char ${prefix}_xbm[] PROGMEM = {\n${writeDataBlock(this.data, '\t', entriesEachLine)}\n};`;
        }
        getWidth() {
            return this.width;
        }
        getHeight() {
            return this.height;
        }
        getData() {
            return this.data;
        }
        toBitMask(x) {
            return 1 << (x & 7);
        }
        toByteIndex(x, y) {
            return y * Math.ceil(this.width / 8.0) + (x >> 3);
        }
    }
    xbm.Frame = Frame;
    class Sprite {
        constructor(width, height, frames, name) {
            this.width = width;
            this.height = height;
            this.frames = frames;
            this.name = name;
            console.assert(this.frames.every(frame => frame.getWidth() === width && frame.getHeight() === height));
        }
        static single(width, height, name) {
            return new Sprite(width, height, [new Frame(width, height, ArrayUtils.fill(getFrameSize(width, height), () => 0))], name);
        }
        static fromData(width, height, data, name) {
            return new Sprite(width, height, data.map(data => new Frame(width, height, data)), name);
        }
        insertFrame(insertIndex = Number.MAX_SAFE_INTEGER) {
            const frame = new Frame(this.width, this.height);
            this.frames.splice(insertIndex, 0, frame);
            return frame;
        }
        getFrame(index) {
            return this.frames[index];
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
                data: this.frames.map(frame => frame.getData())
            };
        }
        deserialize(format) {
            this.name = format.name;
            this.width = format.width;
            this.height = format.height;
            this.frames = format.data.map(data => new Frame(format.width, format.height, data));
            return this;
        }
        toString(entriesEachLine = 8) {
            if (this.isSingleFrame()) {
                return this.frames[0].toString(this.name, entriesEachLine);
            }
            else {
                return `${writeHeader(this.width, this.height, this.name)}static unsigned char ${this.name}_xbm[${this.getFrameCount()}][${this.getFrameSize()}] PROGMEM = {${this.frames.map(frame => `\n\t{\n${writeDataBlock(frame.getData(), '\t\t', entriesEachLine)}\n\t}`).join(',')}\n};`;
            }
        }
        getWidth() {
            return this.width;
        }
        getHeight() {
            return this.height;
        }
        getFrameSize() {
            return getFrameSize(this.width, this.height);
        }
        getFrameCount() {
            return this.frames.length;
        }
        isSingleFrame() {
            return 1 === this.getFrameCount();
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
        deserialize(format) {
            this.sprites.splice(0, this.sprites.length);
            throw new Error();
            return this;
        }
        toString(entriesEachLine = 8) {
            return this.sprites.map(sprite => sprite.toString(entriesEachLine)).join('\n\n');
        }
    }
    xbm.Sheet = Sheet;
})(xbm || (xbm = {}));
//# sourceMappingURL=xbm.js.map