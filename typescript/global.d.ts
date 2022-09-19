interface AudioWorkletProcessor {
    port: MessagePort
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor
    port: MessagePort
    new(option?: any): AudioWorkletProcessor
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: { [name: string]: Float32Array }): boolean
}

declare var sampleRate: number

declare function registerProcessor<T extends AudioWorkletProcessor>(name: string, processorCtor: T): void

// Spec: https://www.w3.org/TR/css-font-loading/
type CSSOMString = string

interface FontFace {
    family: CSSOMString
    style: CSSOMString
    weight: CSSOMString

    load(): Promise<FontFace>
}

interface FontFaceSet {
    readonly ready: Promise<FontFaceSet>

    add(_: FontFace): FontFace
}

declare interface Document {
    fonts: FontFaceSet
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/
declare interface FileSystemWritableFileStream {
    write(data: BufferSource | Blob): void

    close(): void
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle
declare interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>

    getFile(): Promise<File>
}

declare interface PickerOptionType {
    description: string
    accept?: { [key: string]: string[] }
}

declare interface PickerOptions {
    excludeAcceptAllOption?: boolean
    suggestedName?: string
    multiple?: boolean
    types?: PickerOptionType[]
}

// Hides error TS2339: Property 'text' does not exist on type 'File'
declare interface Window {
    showOpenFilePicker(pickerOpts?: PickerOptions): Promise<FileSystemFileHandle[]>

    showSaveFilePicker(pickerOpts?: PickerOptions): Promise<FileSystemFileHandle>
}

declare interface File extends Blob {
    text(): Promise<string>
}