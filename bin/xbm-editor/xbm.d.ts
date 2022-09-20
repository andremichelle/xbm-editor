import { Observable, Observer, Serializer, Terminable } from '../lib/common.js';
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
        setPixel(x: number, y: number, on: boolean): void;
        getPixel(x: number, y: number): boolean;
        serialize(): FrameFormat;
        toString(prefix?: string, entriesEachLine?: number): string;
        writeData(data: ReadonlyArray<number>): void;
        getData(): ReadonlyArray<number>;
        paint(context: CanvasRenderingContext2D, style?: string): void;
        terminate(): void;
        private toBitMask;
        private toByteIndex;
    }
    type SpriteFormat = {
        name: string;
        width: number;
        height: number;
        data: number[][];
    };
    class Sprite implements Size, Serializer<SpriteFormat> {
        readonly width: number;
        readonly height: number;
        private name;
        static single(width: number, height: number, name: string): Sprite;
        static fromData(width: number, height: number, data: number[][], name: string): Sprite;
        private readonly frames;
        constructor(width: number, height: number, name: string);
        insertFrame(insertIndex?: number): Frame;
        getFrame(index: number): Frame;
        getFrames(): ReadonlyArray<Frame>;
        getName(): string;
        serialize(): SpriteFormat;
        toString(entriesEachLine?: number): string;
        getFrameByteSize(): number;
        getFrameCount(): number;
        isSingleFrame(): boolean;
    }
    type SheetFormat = {
        sprites: SpriteFormat[];
    };
    class Sheet implements Serializer<SheetFormat> {
        readonly sprites: Sprite[];
        constructor(sprites: Sprite[]);
        serialize(): SheetFormat;
        toString(entriesEachLine?: number): string;
    }
}
