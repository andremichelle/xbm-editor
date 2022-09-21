// noinspection JSUnusedGlobalSymbols

import { ValueMapping } from "./mapping.js"
import { Random } from "./math.js"

export type NoArgType<T> = { new(): T }

export interface Terminable {
    terminate(): void
}

export const TerminableVoid: Terminable = {
    terminate() {
    }
}

export class Terminator implements Terminable {
    private readonly terminables: Terminable[] = []

    with<T extends Terminable>(terminable: T): T {
        this.terminables.push(terminable)
        return terminable
    }

    terminate(): void {
        while (this.terminables.length) {
            this.terminables.pop()!.terminate()
        }
    }
}

export interface Option<T> {
    get(): T

    ifPresent<R>(callback: (value: T) => R): R

    contains(value: T): boolean

    isEmpty(): boolean

    nonEmpty(): boolean

    map<U>(callback: (value: T) => U): Option<U>
}

export class Options {
    static valueOf<T>(value: T): Option<T> {
        return null === value || undefined === value ? Options.None : new Options.Some(value)
    }

    static Some = class <T> implements Option<T> {
        constructor(readonly value: T) {
            console.assert(null !== value && undefined !== value, "Cannot be null or undefined")
        }

        get = (): T => this.value
        contains = (value: T): boolean => value === this.value
        ifPresent = <R>(callback: (value: T) => R): R => callback(this.value)
        isEmpty = (): boolean => false
        nonEmpty = (): boolean => true

        map<U>(callback: (value: T) => U): Option<U> {
            return Options.valueOf(callback(this.value))
        }

        toString(): string {
            return `Options.Some(${this.value})`
        }
    }

    static None = new class implements Option<never> {
        get = (): never => {
            throw new Error("Option has no value")
        }
        contains = (_: never): boolean => false
        ifPresent = (_: (value: never) => never): any => {
        }
        isEmpty = (): boolean => true
        nonEmpty = (): boolean => false

        map<U>(callback: (_: never) => U): Option<U> {
            return Options.None
        }

        toString(): string {
            return 'Options.None'
        }
    }
}

export type Observer<VALUE> = (value: VALUE) => void

export interface Observable<VALUE> extends Terminable {
    addObserver(observer: Observer<VALUE>): Terminable
}

export class ObservableImpl<T> implements Observable<T> {
    private readonly observers: Observer<T>[] = []

    notify(value: T) {
        this.observers.forEach(observer => observer(value))
    }

    addObserver(observer: Observer<T>): Terminable {
        this.observers.push(observer)
        return { terminate: () => this.removeObserver(observer) }
    }

    removeObserver(observer: Observer<T>): boolean {
        let index = this.observers.indexOf(observer)
        if (-1 < index) {
            this.observers.splice(index, 1)
            return true
        }
        return false
    }

    terminate(): void {
        this.observers.splice(0, this.observers.length)
    }
}

export interface Serializer<T> {
    serialize(): T
}

export interface Deserializer<T> {
    deserialize(format: T): Serializer<T>
}

export interface Value<T> {
    set(value: T): boolean

    get(): T
}

export interface ObservableValue<T> extends Value<T>, Observable<T> {
}

export const ObservableValueVoid: ObservableValue<any> = {
    addObserver: (_: Observer<any>): Terminable => TerminableVoid,
    get: (): any => null,
    set: (_: any): boolean => true,
    terminate: (): void => { }
}

export class ObservableValueImpl<T> implements ObservableValue<T> {
    private readonly observable = new ObservableImpl<T>()

    constructor(private value: T) {
    }

    get(): T {
        return this.value
    }

    set(value: T): boolean {
        if (this.value === value) {
            return false
        }
        this.value = value
        this.observable.notify(value)
        return true
    }

    addObserver(observer: Observer<T>, notify: boolean = false): Terminable {
        if (notify) observer(this.value)
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<T>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.observable.terminate()
    }
}

export class ArrayUtils {
    static fill<T>(n: number, factory: (index: number) => T): T[] {
        const array: T[] = []
        for (let i = 0; i < n; i++) {
            array[i] = factory(i)
        }
        return array
    }

    static clear<T>(array: T[]): T[] {
        array.splice(0, array.length)
        return array
    }

    static shuffle<T>(array: T[], random: Random) {
        for (let i = 0; i < array.length; i++) {
            const element = array[i]
            const randomIndex = random.nextInt(0, array.length - 1)
            array[i] = array[randomIndex]
            array[randomIndex] = element
        }
    }

    static binarySearch = <T>(array: T[] | ArrayLike<any>, key: number): number => {
        let low = 0 | 0
        let high = (array.length - 1) | 0
        while (low <= high) {
            const mid = (low + high) >>> 1
            const midVal = array[mid]
            if (midVal < key)
                low = mid + 1
            else if (midVal > key)
                high = mid - 1
            else {
                if (midVal === key)
                    return mid
                else if (midVal < key)
                    low = mid + 1
                else
                    high = mid - 1
            }
        }
        return high
    }

    // noinspection JSUnusedLocalSymbols
    private constructor() {
    }
}

export class Waiting {
    static forFrame(): Promise<void> {
        return new Promise(resolve => requestAnimationFrame(() => resolve()))
    }

    static forFrames(count: number): Promise<void> {
        return new Promise(resolve => {
            const callback = () => {
                if (--count <= 0) resolve()
                else requestAnimationFrame(callback)
            }
            requestAnimationFrame(callback)
        })
    }

    static forAnimationComplete(element: Element): Promise<void> {
        return Waiting.forEvents(element, "animationstart", "animationend")
    }

    static forTransitionComplete(element: Element): Promise<void> {
        return Waiting.forEvents(element, "transitionstart", "transitionend")
    }

    static forEvent(element: Element, type: string): Promise<void> {
        return new Promise<void>((resolve) =>
            element.addEventListener(type, () => resolve(), { once: true }))
    }

    private static forEvents(element: Element, startType: string, endType: string): Promise<void> {
        let numProperties = 0
        element.addEventListener(startType, event => {
            if (event.target === element) {
                numProperties++
            }
        })
        return new Promise<void>((resolve) =>
            element.addEventListener(endType, event => {
                if (event.target === element) {
                    if (--numProperties === 0) {
                        resolve()
                    }
                    console.assert(numProperties >= 0)
                }
            }))
    }
}

export type EventMaps = HTMLElementEventMap & WindowEventMap & DocumentEventMap
export type ListenerElements = HTMLElement | Window | Document
export type EventType<E> = keyof Pick<EventMaps, { [K in keyof EventMaps]: EventMaps[K] extends E ? K : never }[keyof EventMaps]>

export class Events {
    static preventDefault = (event: Event): void => event.preventDefault()

    static async toPromise<E extends Event>(target: EventTarget, type: string): Promise<E> {
        return new Promise<E>(resolve => target
            .addEventListener(type, (event: Event): void => resolve(event as E), { once: true }))
    }

    static bind<E extends EventMaps[keyof EventMaps]>(
        target: ListenerElements,
        type: EventType<E>,
        listener: (event: E) => void,
        options?: AddEventListenerOptions): Terminable {
        target.addEventListener(type, listener as EventListener, options)
        return { terminate: () => target.removeEventListener(type, listener as EventListener, options) }
    }

    static configRepeatButton(button: EventTarget, callback: () => void): Terminable {
        const mouseDownListener = () => {
            let lastTime = Date.now()
            let delay = 500.0
            const repeat = () => {
                if (!isNaN(lastTime)) {
                    if (Date.now() - lastTime > delay) {
                        lastTime = Date.now()
                        delay *= 0.75
                        callback()
                    }
                    requestAnimationFrame(repeat)
                }
            }
            requestAnimationFrame(repeat)
            callback()
            window.addEventListener("mouseup", () => {
                lastTime = NaN
                delay = Number.MAX_VALUE
            }, { once: true })
        }
        button.addEventListener("mousedown", mouseDownListener)
        return { terminate: () => button.removeEventListener("mousedown", mouseDownListener) }
    }
}