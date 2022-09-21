import { ArrayUtils, Observable, ObservableCollection, ObservableImpl, Observer, Serializer, Terminable } from '../lib/common.js'
import { CollectionEvent } from './../lib/common'

export namespace xbm {
    const writeHeader = (size: Size, prefix: string): string =>
        `#define ${prefix}_width ${size.width}\n#define ${prefix}_height ${size.height}\n`

    const writeDataBlock = (data: ReadonlyArray<number>, indention: string, entriesEachLine: number): string => ArrayUtils
        .fill(Math.ceil(data.length / entriesEachLine), lineIndex => `${indention}${data
            .slice(lineIndex * entriesEachLine, (lineIndex + 1) * entriesEachLine)
            .map(byte => `0x${byte
                .toString(16)
                .toUpperCase()
                .padStart(2, '0')}`)}`)
        .join(',\n')

    // If the image width does not match a multiple of 8, the extra bits in the last byte of each row are ignored.
    const getFrameByteSize = (size: Size): number => size.height * Math.ceil(size.width / 8.0)

    export type FrameFormat = { data: ReadonlyArray<number> }

    export interface Size {
        readonly width: number
        readonly height: number
    }

    export class Frame implements Serializer<FrameFormat>, Observable<Frame> {
        private readonly observable: ObservableImpl<this> = new ObservableImpl<this>()

        constructor(
            readonly size: Size,
            readonly data: number[] = ArrayUtils.fill(getFrameByteSize(size), () => 0)) {
        }

        addObserver(observer: Observer<Frame>): Terminable {
            return this.observable.addObserver(observer)
        }

        togglePixel(x: number, y: number): void {
            this.setPixel(x, y, !this.getPixel(x, y))
        }

        clear(): void {
            if (this.data.some(x => x > 0)) {
                this.data.fill(0)
                this.observable.notify(this)
            }
        }

        shift(dx: number, dy: number): void {
            if (!this.data.some(x => x > 0)) return
            const w = this.size.width
            const h = this.size.height
            const pixels: boolean[][] = ArrayUtils.fill(h, () => ArrayUtils.fill(w, () => false))
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    pixels[y][x] = this.getPixel(x, y)
                }
            }
            this.data.fill(0)
            for (let r = 0; r < h; r++) {
                for (let c = 0; c < w; c++) {
                    const y = (r - dy + h) % h
                    const x = (c - dx + w) % w
                    if (pixels[y][x]) {
                        this.data[this.toByteIndex(c, r)] |= this.toBitMask(c)
                    }
                }
            }
            this.observable.notify(this)
        }

        setPixel(x: number, y: number, on: boolean): void {
            const old = this.data[this.toByteIndex(x, y)]
            let value = old
            if (on) {
                value |= this.toBitMask(x)
            } else {
                value &= ~this.toBitMask(x)
            }
            if (value === old) return
            this.data[this.toByteIndex(x, y)] = value
            this.observable.notify(this)
        }

        getPixel(x: number, y: number): boolean {
            return 0 !== (this.data[this.toByteIndex(x, y)] & this.toBitMask(x))
        }

        serialize(): FrameFormat {
            return { data: this.data }
        }

        toString(prefix: string = 'xbm', entriesEachLine: number = 8): string {
            return `${writeHeader(this.size, prefix)}static unsigned char ${prefix}_xbm[] PROGMEM = {\n${writeDataBlock(this.data, '\t', entriesEachLine)}\n};`
        }

        writeData(data: ReadonlyArray<number>): void {
            data.forEach((byte: number, index: number) => this.data[index] = byte)
        }

        getData(): ReadonlyArray<number> {
            return this.data
        }

        paint(context: CanvasRenderingContext2D, style: string = 'white'): void {
            context.fillStyle = style
            for (let y = 0; y < this.size.height; ++y) {
                for (let x = 0; x < this.size.width; ++x) {
                    if (this.getPixel(x, y)) {
                        context.fillRect(x, y, 1, 1)
                    }
                }
            }
        }

        terminate(): void {
            this.observable.terminate()
        }

        private toBitMask(x: number): number {
            return 1 << (x & 7)
        }

        private toByteIndex(x: number, y: number): number {
            return y * Math.ceil(this.size.width / 8.0) + (x >> 3)
        }
    }

    export type SpriteFormat = {
        name: string,
        width: number
        height: number
        data: number[][]
    }

    export class Sprite implements Observable<CollectionEvent<Frame>>, Serializer<SpriteFormat>, Size {
        static single(width: number, height: number, name: string): Sprite {
            const sprite = new Sprite(width, height, name)
            sprite.insertFrame(0)
            return sprite
        }

        static fromData(width: number, height: number, data: number[][], name: string): Sprite {
            const sprite = new Sprite(width, height, name)
            data.forEach(data => sprite.insertFrame().writeData(data))
            return sprite
        }

        private readonly frames: ObservableCollection<Frame> = new ObservableCollection<Frame>()

        constructor(readonly width: number, readonly height: number, private name: string) {
        }

        addObserver(observer: Observer<CollectionEvent<Frame>>): Terminable {
            return this.frames.addObserver(observer)
        }

        insertFrame(insertIndex: number = Number.MAX_SAFE_INTEGER): Frame {
            const frame = new Frame(this)
            this.frames.add(frame, insertIndex)
            return frame
        }

        removeFrame(frame: Frame): void {
            this.frames.remove(frame)
            frame.terminate()
        }

        getFrame(index: number): Frame {
            return this.frames.get(index)
        }

        getFrames(): ObservableCollection<Frame> {
            return this.frames
        }

        getName(): string {
            return this.name
        }

        serialize(): SpriteFormat {
            return {
                name: this.name,
                width: this.width,
                height: this.height,
                data: this.frames.map(frame => frame.getData().slice())
            }
        }

        toString(entriesEachLine: number = 8): string {
            if (this.isSingleFrame()) {
                return this.frames.get(0).toString(this.name, entriesEachLine)
            } else {
                return `${writeHeader(this, this.name)}static unsigned char ${this.name}_xbm[${this.getFrameCount()}][${this.getFrameByteSize()}] PROGMEM = {${this.frames.map(frame => `\n\t{\n${writeDataBlock(frame.getData(), '\t\t', entriesEachLine)}\n\t}`).join(',')}\n};`
            }
        }

        getFrameByteSize(): number {
            return getFrameByteSize(this)
        }

        getFrameCount(): number {
            return this.frames.size()
        }

        isSingleFrame(): boolean {
            return 1 === this.getFrameCount()
        }

        terminate(): void {
            this.frames.terminate()
        }
    }

    export type SheetFormat = { sprites: SpriteFormat[] }

    export class Sheet implements Serializer<SheetFormat> {
        constructor(readonly sprites: Sprite[]) { }

        serialize(): SheetFormat {
            return { sprites: this.sprites.map(sprite => sprite.serialize()) }
        }

        toString(entriesEachLine: number = 8): string {
            return this.sprites.map(sprite => sprite.toString(entriesEachLine)).join('\n\n')
        }
    }
}