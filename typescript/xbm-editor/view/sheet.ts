import { HTML } from "../../lib/dom.js"
import { xbm } from "../xbm.js"
import { CollectionEvent, CollectionEventType } from './../../lib/common.js'
import { Env } from "./env.js"
import { SpriteView } from "./sprite.js"

export class SheetView {
    readonly element: HTMLElement = HTML.create('div', { class: 'sheet-view' })
    readonly addSpriteButton = HTML.create('button', { textContent: '+' })

    readonly views: Map<xbm.Sprite, SpriteView> = new Map<xbm.Sprite, SpriteView>()

    constructor(readonly env: Env, readonly sheet: xbm.Sheet) {
        this.addSpriteButton.addEventListener('click', () => {
            const sizeInput = prompt('Enter size (w x h)', '8x8')
            if (sizeInput === null) return
            const sizeArray = sizeInput.split('x').map(x => parseInt(x.trim()))
            if (sizeArray.length !== 2) return
            if (sizeArray.some(x => isNaN(x))) return
            const name = prompt('Enter name', 'untitled')
            if (name === null || name.length === 0) return
            console.log(`new name: ${name}, w: ${sizeArray[0]}, h: ${sizeArray[1]}`)
            this.sheet.sprites.add(xbm.Sprite.single(sizeArray[0], sizeArray[1], name))
        })
        this.sheet.sprites.addObserver((event: CollectionEvent<xbm.Sprite>) => {
            switch (event.type) {
                case CollectionEventType.Add: {
                    const sprite = event.item!
                    this.views.set(sprite, new SpriteView(this.env, sprite))
                    this.updateOrder()
                    break
                }
                case CollectionEventType.Remove: {
                    const sprite = event.item!
                    const view = this.views.get(sprite)
                    console.assert(view !== undefined)
                    view!.terminate()
                    break
                }
                case CollectionEventType.Order: {
                    this.updateOrder()
                    break
                }
            }
        })

        sheet.sprites.forEach(sprite => this.views.set(sprite, new SpriteView(this.env, sprite)))
        this.updateOrder()
    }

    updateOrder(): void {
        this.addSpriteButton.remove()
        this.sheet.sprites.forEach(sprite => this.views.get(sprite)!.appendChildren(this.element))
        this.element.appendChild(this.addSpriteButton)
    }
}