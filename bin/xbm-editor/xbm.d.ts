import { Deserializer, Observable, ObservableCollection, ObservableValue, Observer, Serializer, Terminable } from '../lib/common.js';
export declare namespace xbm {
    type FrameFormat = {
        data: ReadonlyArray<number>;
    };
    interface Size {
        readonly width: number;
        readonly height: number;
    }
    class Frame implements Serializer<FrameFormat>, Observable<Frame> {
        readonly size: Size;
        readonly data: number[];
        private readonly observable;
        constructor(size: Size, data?: number[]);
        addObserver(observer: Observer<Frame>): Terminable;
        togglePixel(x: number, y: number): void;
        clear(): void;
        import(): Promise<void>;
        shift(dx: number, dy: number): void;
        mirrorHorizontal(): void;
        mirrorVertical(): void;
        translate(map: (c: number, r: number) => [number, number]): void;
        setPixel(x: number, y: number, on: boolean): void;
        getPixel(x: number, y: number): boolean;
        serialize(): FrameFormat;
        toString(prefix?: string, entriesEachLine?: number): string;
        writeData(data: ReadonlyArray<number>): void;
        getData(): ReadonlyArray<number>;
        paint(context: CanvasRenderingContext2D, style?: string): void;
        terminate(): void;
        toBitMask(x: number): number;
        toByteIndex(x: number, y: number): number;
    }
    enum PreviewMode {
        First = 0,
        Loop = 1,
        Alternate = 2,
        Tile = 3,
        _Last = 4
    }
    type SpriteFormat = {
        name: string;
        width: number;
        height: number;
        data: number[][];
        previewMode: PreviewMode;
    };
    class Sprite implements Serializer<SpriteFormat>, Size {
        readonly width: number;
        readonly height: number;
        static single(width: number, height: number, name: string): Sprite;
        static fromData(width: number, height: number, data: number[][], name: string): Sprite;
        readonly frames: ObservableCollection<Frame>;
        readonly name: ObservableValue<string>;
        readonly previewMode: ObservableValue<PreviewMode>;
        constructor(width: number, height: number, name: string);
        insertFrame(insertIndex?: number): Frame;
        removeFrame(frame: Frame): void;
        getFrame(index: number): Frame;
        serialize(): SpriteFormat;
        toString(entriesEachLine?: number): string;
        getFrameByteSize(): number;
        getFrameCount(): number;
        isSingleFrame(): boolean;
        terminate(): void;
    }
    type SheetFormat = {
        sprites: SpriteFormat[];
    };
    class Sheet implements Serializer<SheetFormat>, Deserializer<SheetFormat> {
        readonly sprites: ObservableCollection<Sprite>;
        constructor(sprites: Sprite[]);
        clear(): void;
        serialize(): SheetFormat;
        deserialize(format: SheetFormat): this;
        toString(entriesEachLine?: number): string;
    }
}
