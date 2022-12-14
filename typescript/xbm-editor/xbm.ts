import { ArrayUtils, Deserializer, Observable, ObservableCollection, ObservableImpl, ObservableValue, ObservableValueImpl, Observer, Serializer, Terminable } from '../lib/common.js'
import { HTML } from '../lib/dom.js'

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

        async import(): Promise<void> {
            try {
                const files = await window.showOpenFilePicker({
                    multiple: false, suggestedName: 'image.png',
                    types: [{ accept: { 'image/*': ['.png'] }, description: '' }]
                })
                if (files.length !== 1) return
                const file = await files[0].getFile()
                const array = await file.arrayBuffer()
                const image = new Image()
                image.onerror = reason => console.warn(reason)
                image.onload = () => {
                    const canvas = HTML.create('canvas', { width: image.width, height: image.height })
                    const context: CanvasRenderingContext2D = canvas.getContext('2d')!
                    context.drawImage(image, 0, 0)
                    const rgba = context.getImageData(0, 0, image.width, image.height).data
                    this.data.fill(0)
                    for (let y = 0; y < image.height; y++) {
                        for (let x = 0; x < image.width; x++) {
                            // we only check the red channel
                            if (rgba[(y * image.width + x) << 2] > 0x7F) {
                                this.data[this.toByteIndex(x, y)] |= this.toBitMask(x)
                            }
                        }
                    }
                    this.observable.notify(this)
                }
                image.src = URL.createObjectURL(new Blob([array], { type: "image/png" }))

            } catch (e) { console.warn(e) }
        }

        shift(dx: number, dy: number): void {
            const w = this.size.width
            const h = this.size.height
            this.translate((c: number, r: number) => [(c - dx + w) % w, (r - dy + h) % h])
        }

        mirrorHorizontal(): void {
            this.translate((c: number, r: number) => [this.size.width - c - 1, r])
        }

        mirrorVertical(): void {
            this.translate((c: number, r: number) => [c, this.size.height - r - 1])
        }

        translate(map: (c: number, r: number) => [number, number]): void {
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
                    const [x, y] = map(c, r)
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
            this.observable.notify(this)
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

        toBitMask(x: number): number {
            return 1 << (x & 7)
        }

        toByteIndex(x: number, y: number): number {
            return y * Math.ceil(this.size.width / 8.0) + (x >> 3)
        }
    }

    export enum PreviewMode {
        First, Loop, Alternate, Tile, _Last
    }

    export type SpriteFormat = {
        name: string,
        width: number
        height: number
        data: number[][]
        previewMode: PreviewMode
    }

    export class Sprite implements Serializer<SpriteFormat>, Size {
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

        readonly frames: ObservableCollection<Frame> = new ObservableCollection<Frame>()
        readonly name: ObservableValue<string> = new ObservableValueImpl<string>('')
        readonly previewMode: ObservableValue<PreviewMode> = new ObservableValueImpl<PreviewMode>(PreviewMode.First)

        constructor(readonly width: number, readonly height: number, name: string) {
            this.name.set(name.trim())
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

        serialize(): SpriteFormat {
            return {
                name: this.name.get(),
                width: this.width,
                height: this.height,
                data: this.frames.map(frame => frame.getData().slice()),
                previewMode: this.previewMode.get()
            }
        }

        toString(entriesEachLine: number = 8): string {
            if (this.isSingleFrame()) {
                return this.frames.get(0).toString(this.name.get(), entriesEachLine)
            } else {
                const name = this.name.get()
                return `${writeHeader(this, name)}static unsigned char ${name}_xbm[${this.getFrameCount()}][${this.getFrameByteSize()}] PROGMEM = {${this.frames.map(frame => `\n\t{\n${writeDataBlock(frame.getData(), '\t\t', entriesEachLine)}\n\t}`).join(',')}\n};`
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
            this.name.terminate()
            this.frames.terminate()
        }
    }

    export type SheetFormat = { sprites: SpriteFormat[] }

    export class Sheet implements Serializer<SheetFormat>, Deserializer<SheetFormat> {
        readonly sprites: ObservableCollection<Sprite> = new ObservableCollection<Sprite>()

        constructor(sprites: Sprite[]) {
            this.sprites.addAll(sprites)
        }

        clear(): void {
            this.sprites.clear()
        }

        serialize(): SheetFormat {
            return { sprites: this.sprites.map(sprite => sprite.serialize()) }
        }

        deserialize(format: SheetFormat): this {
            this.clear()
            format.sprites.forEach(spriteFormat => {
                const sprite = Sprite.fromData(spriteFormat.width, spriteFormat.height, spriteFormat.data, spriteFormat.name)
                sprite.previewMode.set(spriteFormat.previewMode)
                this.sprites.add(sprite)
            })
            return this
        }

        toString(entriesEachLine: number = 8): string {
            return '/*\n * https://github.com/andremichelle/xbm-editor\n */\n\n' + this.sprites.map(sprite => sprite.toString(entriesEachLine)).join('\n\n')
        }
    }
}