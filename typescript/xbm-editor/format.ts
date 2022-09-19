export class XBMEncoder {
    constructor(private width: number, private height: number, private data: number[] = []) {
    }

    getWidth(): number {
        return this.width
    }

    getHeight(): number {
        return this.height
    }

    togglePixel(x: number, y: number): void {
        this.setPixel(x, y, !this.getPixel(x, y))
    }

    setPixel(x: number, y: number, value: boolean): void {
        if (value) {
            this.data[this.toByteIndex(x, y)] |= this.toBitIndex(x)
        } else {
            this.data[this.toByteIndex(x, y)] &= ~this.toBitIndex(x)
        }
    }

    getPixel(x: number, y: number): boolean {
        return 0 !== (this.data[this.toByteIndex(x, y)] & this.toBitIndex(x))
    }

    toString(prefix: string = 'bitmap', entriesEachLine: number = 8): string {
        return `#define ${prefix}_width ${this.width}\n#define ${prefix}_height ${this.height}\nstatic char ${prefix}_xbm[] = {\n${(() => {
            const numLines = Math.ceil(this.data.length / entriesEachLine)
            const lines = []
            for (let i = 0; i < numLines; i++) {
                lines.push(`\t${this.data.slice(i * entriesEachLine, (i + 1) * entriesEachLine).map(byte => `0x${byte.toString(16).padStart(2, '0')}`)}`)
            }
            return lines.join(',\n')
        })()}\n};`
    }

    private toBitIndex(x: number): number {
        return 1 << (x & 7)
    }

    private toByteIndex(x: number, y: number): number {
        return y * Math.ceil(this.width / 8) + (x >> 3)
    }
}