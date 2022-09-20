import { HTML } from "../../lib/dom.js"
import { xbm } from "../xbm.js"
import { Env } from "./env.js"
import { SpriteView } from "./sprite.js"

export class SheetView {
    readonly element: HTMLElement = HTML.create('div', { class: 'sheet-view' })
    readonly addSpriteButton = HTML.create('button', { textContent: '+' })

    readonly views: Map<xbm.Sprite, SpriteView> = new Map<xbm.Sprite, SpriteView>()

    constructor(readonly env: Env, readonly sheet: xbm.Sheet) {
        sheet.sprites.forEach(sprite => this.addSprite(sprite))

        this.addSpriteButton.addEventListener('click', () => {
            const sizeInput = prompt('Enter size (w x h)', '8x8')
            if (sizeInput === null) return
            const sizeArray = sizeInput.split('x').map(x => parseInt(x.trim()))
            if (sizeArray.length !== 2) return
            if (sizeArray.some(x => isNaN(x))) return
            const name = prompt('Enter name', 'untitled')
            if (name === null || name.length === 0) return
            console.log(`new name: ${name}, w: ${sizeArray[0]}, h: ${sizeArray[1]}`)
            this.addSprite(xbm.Sprite.single(sizeArray[0], sizeArray[1], name))
        })
    }

    addSprite(sprite: xbm.Sprite): void {
        const view = new SpriteView(this.env, sprite)
        this.views.set(sprite, view)

        this.addSpriteButton.remove()
        view.appendChildren(this.element)
        this.element.appendChild(this.addSpriteButton)
    }

    removeSprite(sprite: xbm.Sprite): void {
        const view = this.views.get(sprite)
        console.assert(view !== undefined)
        view!.terminate()
    }
}