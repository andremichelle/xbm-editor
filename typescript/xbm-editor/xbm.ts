import { ArrayUtils, Serializer } from '../lib/common.js'

export namespace xbm {
    const writeHeader = (width: number, height: number, prefix: string): string =>
        `#define ${prefix}_width ${width}\n#define ${prefix}_height ${height}\n`

    const writeDataBlock = (data: number[], indention: string, entriesEachLine: number): string => ArrayUtils
        .fill(Math.ceil(data.length / entriesEachLine), lineIndex => `${indention}${data
            .slice(lineIndex * entriesEachLine, (lineIndex + 1) * entriesEachLine)
            .map(byte => `0x${byte
                .toString(16)
                .toUpperCase()
                .padStart(2, '0')}`)}`)
        .join(',\n')

    // If the image width does not match a multiple of 8, the extra bits in the last byte of each row are ignored.
    const getFrameSize = (width: number, height: number): number => height * Math.ceil(width / 8.0)

    export type FrameFormat = {
        width: number
        height: number
        data: number[]
    }

    export class Frame implements Serializer<FrameFormat> {
        constructor(
            private width: number,
            private height: number,
            private data: number[] = []) {
            console.assert(getFrameSize(width, height) === data.length)
        }

        togglePixel(x: number, y: number): void {
            this.setPixel(x, y, !this.getPixel(x, y))
        }

        setPixel(x: number, y: number, value: boolean): void {
            if (value) {
                this.data[this.toByteIndex(x, y)] |= this.toBitMask(x)
            } else {
                this.data[this.toByteIndex(x, y)] &= ~this.toBitMask(x)
            }
        }

        getPixel(x: number, y: number): boolean {
            return 0 !== (this.data[this.toByteIndex(x, y)] & this.toBitMask(x))
        }

        serialize(): FrameFormat {
            return {
                width: this.width,
                height: this.height,
                data: this.data
            }
        }

        deserialize(format: FrameFormat): this {
            console.assert(getFrameSize(format.width, format.height) === format.data.length)
            this.width = format.width
            this.height = format.height
            this.data = format.data
            return this
        }

        toString(prefix: string = 'xbm', entriesEachLine: number = 8): string {
            return `${writeHeader(this.width, this.height, prefix)}static unsigned char ${prefix}_xbm[] PROGMEM = {\n${writeDataBlock(this.data, '\t', entriesEachLine)}\n};`
        }

        getWidth(): number {
            return this.width
        }

        getHeight(): number {
            return this.height
        }

        getData(): number[] {
            return this.data
        }

        private toBitMask(x: number): number {
            return 1 << (x & 7)
        }

        private toByteIndex(x: number, y: number): number {
            return y * Math.ceil(this.width / 8.0) + (x >> 3)
        }
    }

    export type SpriteFormat = {
        name: string,
        width: number
        height: number
        data: number[][]
    }

    export class Sprite implements Serializer<SpriteFormat> {
        static single(width: number, height: number, name: string): Sprite {
            return new Sprite(width, height, [new Frame(width, height, ArrayUtils.fill(getFrameSize(width, height), () => 0))], name)
        }

        static fromData(width: number, height: number, data: number[][], name: string): Sprite {
            return new Sprite(width, height, data.map(data => new Frame(width, height, data)), name)
        }

        constructor(
            private width: number,
            private height: number,
            private frames: Frame[],
            private name: string) {

        }

        insertFrame(insertIndex: number = Number.MAX_SAFE_INTEGER): Frame {
            const frame = new Frame(this.width, this.height)
            this.frames.splice(insertIndex, 0, frame)
            return frame
        }

        getFrame(index: number): Frame {
            return this.frames[index]
        }

        serialize(): SpriteFormat {
            return {
                name: this.name,
                width: this.width,
                height: this.height,
                data: this.frames.map(frame => frame.getData())
            }
        }

        deserialize(format: SpriteFormat): this {
            this.name = format.name
            this.width = format.width
            this.height = format.height
            this.frames = format.data.map(data => new Frame(format.width, format.height, data))
            return this
        }

        toString(entriesEachLine: number = 8): string {
            if (this.isSingleFrame()) {
                return this.frames[0].toString(this.name, entriesEachLine)
            } else {
                return `${writeHeader(this.width, this.height, this.name)}static unsigned char ${this.name}_xbm[${this.getFrameCount()}][${this.getFrameSize()}] PROGMEM = {${this.frames.map(frame => `\n\t{\n${writeDataBlock(frame.getData(), '\t\t', entriesEachLine)}\n\t}`).join(',')}\n};`
            }
        }

        getWidth(): number {
            return this.width
        }

        getHeight(): number {
            return this.height
        }

        getFrameSize(): number {
            return getFrameSize(this.width, this.height)
        }

        getFrameCount(): number {
            return this.frames.length
        }

        isSingleFrame(): boolean {
            return 1 === this.getFrameCount()
        }
    }
}