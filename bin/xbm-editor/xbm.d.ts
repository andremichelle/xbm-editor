import { Serializer } from '../lib/common.js';
export declare namespace xbm {
    type FrameFormat = {
        width: number;
        height: number;
        data: ReadonlyArray<number>;
    };
    class Frame implements Serializer<FrameFormat> {
        private width;
        private height;
        private data;
        constructor(width: number, height: number, data?: number[]);
        togglePixel(x: number, y: number): void;
        setPixel(x: number, y: number, value: boolean): void;
        getPixel(x: number, y: number): boolean;
        serialize(): FrameFormat;
        deserialize(format: FrameFormat): this;
        toString(prefix?: string, entriesEachLine?: number): string;
        getWidth(): number;
        getHeight(): number;
        getData(): number[];
        private toBitMask;
        private toByteIndex;
    }
    type SpriteFormat = {
        name: string;
        width: number;
        height: number;
        data: number[][];
    };
    class Sprite implements Serializer<SpriteFormat> {
        private width;
        private height;
        private frames;
        private name;
        static single(width: number, height: number, name: string): Sprite;
        static fromData(width: number, height: number, data: number[][], name: string): Sprite;
        constructor(width: number, height: number, frames: Frame[], name: string);
        insertFrame(insertIndex?: number): Frame;
        getFrame(index: number): Frame;
        getFrames(): ReadonlyArray<Frame>;
        getName(): string;
        serialize(): SpriteFormat;
        deserialize(format: SpriteFormat): this;
        toString(entriesEachLine?: number): string;
        getWidth(): number;
        getHeight(): number;
        getFrameSize(): number;
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
        deserialize(format: SheetFormat): this;
        toString(entriesEachLine?: number): string;
    }
}
