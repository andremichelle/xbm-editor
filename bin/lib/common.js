var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const TerminableVoid = {
    terminate() {
    }
};
export class Terminator {
    constructor() {
        this.terminables = [];
    }
    with(terminable) {
        this.terminables.push(terminable);
        return terminable;
    }
    terminate() {
        while (this.terminables.length) {
            this.terminables.pop().terminate();
        }
    }
}
export class Options {
    static valueOf(value) {
        return null === value || undefined === value ? Options.None : new Options.Some(value);
    }
}
Options.Some = class {
    constructor(value) {
        this.value = value;
        this.get = () => this.value;
        this.contains = (value) => value === this.value;
        this.ifPresent = (callback) => callback(this.value);
        this.isEmpty = () => false;
        this.nonEmpty = () => true;
        console.assert(null !== value && undefined !== value, "Cannot be null or undefined");
    }
    map(callback) {
        return Options.valueOf(callback(this.value));
    }
    toString() {
        return `Options.Some(${this.value})`;
    }
};
Options.None = new class {
    constructor() {
        this.get = () => {
            throw new Error("Option has no value");
        };
        this.contains = (_) => false;
        this.ifPresent = (_) => {
        };
        this.isEmpty = () => true;
        this.nonEmpty = () => false;
    }
    map(callback) {
        return Options.None;
    }
    toString() {
        return 'Options.None';
    }
};
export class ObservableImpl {
    constructor() {
        this.observers = [];
    }
    notify(value) {
        this.observers.forEach(observer => observer(value));
    }
    addObserver(observer) {
        this.observers.push(observer);
        return { terminate: () => this.removeObserver(observer) };
    }
    removeObserver(observer) {
        let index = this.observers.indexOf(observer);
        if (-1 < index) {
            this.observers.splice(index, 1);
            return true;
        }
        return false;
    }
    terminate() {
        this.observers.splice(0, this.observers.length);
    }
}
export var CollectionEventType;
(function (CollectionEventType) {
    CollectionEventType[CollectionEventType["Add"] = 0] = "Add";
    CollectionEventType[CollectionEventType["Remove"] = 1] = "Remove";
    CollectionEventType[CollectionEventType["Order"] = 2] = "Order";
})(CollectionEventType || (CollectionEventType = {}));
export class CollectionEvent {
    constructor(collection, type, item = null, index = -1) {
        this.collection = collection;
        this.type = type;
        this.item = item;
        this.index = index;
    }
}
export class ObservableCollection {
    constructor() {
        this.observable = new ObservableImpl();
        this.items = [];
    }
    static observeNested(collection, observer) {
        const itemObserver = () => observer(collection);
        const observers = new Map();
        collection.forEach((observable) => observers.set(observable, observable.addObserver(itemObserver)));
        collection.addObserver((event) => {
            if (event.type === CollectionEventType.Add) {
                observers.set(event.item, event.item.addObserver(itemObserver));
            }
            else if (event.type === CollectionEventType.Remove) {
                const observer = observers.get(event.item);
                console.assert(observer !== undefined);
                observers.delete(event.item);
                observer.terminate();
            }
            else if (event.type === CollectionEventType.Order) {
            }
            observer(collection);
        });
        return {
            terminate() {
                observers.forEach((value) => value.terminate());
                observers.clear();
            }
        };
    }
    add(value, index = Number.MAX_SAFE_INTEGER) {
        console.assert(0 <= index);
        index = Math.min(index, this.items.length);
        if (this.items.includes(value))
            return false;
        this.items.splice(index, 0, value);
        this.observable.notify(new CollectionEvent(this, CollectionEventType.Add, value, index));
        return true;
    }
    addAll(values) {
        for (const value of values) {
            this.add(value);
        }
    }
    remove(value) {
        return this.removeIndex(this.items.indexOf(value));
    }
    removeIndex(index) {
        if (-1 === index)
            return false;
        const removed = this.items.splice(index, 1);
        if (0 === removed.length)
            return false;
        this.observable.notify(new CollectionEvent(this, CollectionEventType.Remove, removed[0], index));
        return true;
    }
    clear() {
        for (let index = this.items.length - 1; index > -1; index--) {
            this.removeIndex(index);
        }
    }
    get(index) {
        return this.items[index];
    }
    first() {
        return 0 < this.items.length ? Options.valueOf(this.items[0]) : Options.None;
    }
    indexOf(value) {
        return this.items.indexOf(value);
    }
    size() {
        return this.items.length;
    }
    map(fn) {
        const arr = [];
        for (let i = 0; i < this.items.length; i++) {
            arr[i] = fn(this.items[i], i, this.items);
        }
        return arr;
    }
    forEach(fn) {
        for (let i = 0; i < this.items.length; i++) {
            fn(this.items[i], i);
        }
    }
    move(fromIndex, toIndex) {
        if (fromIndex === toIndex)
            return;
        console.assert(0 <= toIndex && toIndex < this.size());
        console.assert(0 <= fromIndex && fromIndex < this.size());
        this.items.splice(toIndex, 0, this.items.splice(fromIndex, 1)[0]);
        this.observable.notify(new CollectionEvent(this, CollectionEventType.Order));
    }
    reduce(fn, initialValue) {
        let value = initialValue;
        for (let i = 0; i < this.items.length; i++) {
            value = fn(value, this.items[i], i);
        }
        return value;
    }
    addObserver(observer, notify = false) {
        if (notify)
            this.forEach((item, index) => observer(new CollectionEvent(this, CollectionEventType.Add, item, index)));
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
}
export const ObservableValueVoid = {
    addObserver: (_) => TerminableVoid,
    get: () => null,
    set: (_) => true,
    terminate: () => { }
};
export class ObservableValueImpl {
    constructor(value) {
        this.value = value;
        this.observable = new ObservableImpl();
    }
    get() {
        return this.value;
    }
    set(value) {
        if (this.value === value) {
            return false;
        }
        this.value = value;
        this.observable.notify(value);
        return true;
    }
    addObserver(observer, notify = false) {
        if (notify)
            observer(this.value);
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
}
export class ArrayUtils {
    constructor() {
    }
    static fill(n, factory) {
        const array = [];
        for (let i = 0; i < n; i++) {
            array[i] = factory(i);
        }
        return array;
    }
    static clear(array) {
        array.splice(0, array.length);
        return array;
    }
    static shuffle(array, random) {
        for (let i = 0; i < array.length; i++) {
            const element = array[i];
            const randomIndex = random.nextInt(0, array.length - 1);
            array[i] = array[randomIndex];
            array[randomIndex] = element;
        }
    }
}
ArrayUtils.binarySearch = (array, key) => {
    let low = 0 | 0;
    let high = (array.length - 1) | 0;
    while (low <= high) {
        const mid = (low + high) >>> 1;
        const midVal = array[mid];
        if (midVal < key)
            low = mid + 1;
        else if (midVal > key)
            high = mid - 1;
        else {
            if (midVal === key)
                return mid;
            else if (midVal < key)
                low = mid + 1;
            else
                high = mid - 1;
        }
    }
    return high;
};
export class Waiting {
    static forFrame() {
        return new Promise(resolve => requestAnimationFrame(() => resolve()));
    }
    static forFrames(count) {
        return new Promise(resolve => {
            const callback = () => {
                if (--count <= 0)
                    resolve();
                else
                    requestAnimationFrame(callback);
            };
            requestAnimationFrame(callback);
        });
    }
    static forAnimationComplete(element) {
        return Waiting.forEvents(element, "animationstart", "animationend");
    }
    static forTransitionComplete(element) {
        return Waiting.forEvents(element, "transitionstart", "transitionend");
    }
    static forEvent(element, type) {
        return new Promise((resolve) => element.addEventListener(type, () => resolve(), { once: true }));
    }
    static forEvents(element, startType, endType) {
        let numProperties = 0;
        element.addEventListener(startType, event => {
            if (event.target === element) {
                numProperties++;
            }
        });
        return new Promise((resolve) => element.addEventListener(endType, event => {
            if (event.target === element) {
                if (--numProperties === 0) {
                    resolve();
                }
                console.assert(numProperties >= 0);
            }
        }));
    }
}
export class Events {
    static toPromise(target, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => target
                .addEventListener(type, (event) => resolve(event), { once: true }));
        });
    }
    static bind(target, type, listener, options) {
        target.addEventListener(type, listener, options);
        return { terminate: () => target.removeEventListener(type, listener, options) };
    }
    static configRepeatButton(button, callback) {
        const mouseDownListener = () => {
            let lastTime = Date.now();
            let delay = 500.0;
            const repeat = () => {
                if (!isNaN(lastTime)) {
                    if (Date.now() - lastTime > delay) {
                        lastTime = Date.now();
                        delay *= 0.75;
                        callback();
                    }
                    requestAnimationFrame(repeat);
                }
            };
            requestAnimationFrame(repeat);
            callback();
            window.addEventListener("mouseup", () => {
                lastTime = NaN;
                delay = Number.MAX_VALUE;
            }, { once: true });
        };
        button.addEventListener("mousedown", mouseDownListener);
        return { terminate: () => button.removeEventListener("mousedown", mouseDownListener) };
    }
}
Events.preventDefault = (event) => event.preventDefault();
//# sourceMappingURL=common.js.map