export declare class ListItemDefaultData {
    readonly label: string;
    readonly shortcut: string;
    readonly checked: boolean;
    constructor(label: string, shortcut?: string, checked?: boolean);
    toString(): string;
}
export declare class ListItem {
    readonly data: any;
    separatorBefore: boolean;
    selectable: boolean;
    private readonly permanentChildren;
    private readonly transientChildren;
    private transientChildrenCallback;
    private openingCallback;
    private triggerCallback;
    private isOpening;
    constructor(data: any);
    static root(): ListItem;
    static default(label: string, shortcut?: string, checked?: boolean): ListItem;
    addListItem(listItem: ListItem): ListItem;
    opening(): void;
    trigger(): void;
    isSelectable(value?: boolean): ListItem;
    addSeparatorBefore(): ListItem;
    addRuntimeChildrenCallback(callback: (parent: ListItem) => void): ListItem;
    onOpening(callback: (listItem: ListItem) => void): ListItem;
    onTrigger(callback: (listItem: ListItem) => void): ListItem;
    hasChildren(): boolean;
    collectChildren(): ListItem[];
    removeTransientChildren(): void;
}
declare class Controller {
    private readonly mouseDownHandler;
    private root;
    private layer;
    private onClose;
    constructor();
    open(listItem: ListItem, x: number, y: number, docked: boolean, onClose?: () => void): void;
    close(): void;
    onDispose(pullDown: Menu): void;
    shutdown(): void;
    iterateAll(callback: (menu: Menu) => void): void;
    reduceAll(callback: (menu: Menu) => boolean): boolean;
}
export declare class Menu {
    private readonly listItem;
    static Controller: Controller;
    static Renderer: Map<any, (element: HTMLElement, data: any) => void>;
    readonly element: HTMLElement;
    childMenu: Menu | null;
    private readonly container;
    private readonly scrollUp;
    private readonly scrollDown;
    private selectedDiv;
    private x;
    private y;
    constructor(listItem: ListItem, docked?: boolean);
    moveTo(x: number, y: number): void;
    attach(parentNode: Element, parentMenu?: Menu | null): void;
    dispose(): void;
    domElement(): HTMLElement;
    isChild(target: Node | null): boolean;
    private makeScrollable;
}
export declare class MenuBar {
    static install(): MenuBar;
    private offsetX;
    private offsetY;
    private openListItem;
    private constructor();
    offset(x: number, y: number): MenuBar;
    addButton(button: HTMLElement, listItem: ListItem): MenuBar;
    open(button: HTMLElement, listItem: ListItem): void;
}
export {};
