import { HTML } from "../../lib/dom.js"
import { xbm } from "../xbm.js"
import { Env } from "./env.js"
import { SpriteView } from "./sprite.js"

export class SheetView {
    readonly element: HTMLElement = HTML.create('div', { class: 'sheet-view' })
    readonly spriteContainer: HTMLDivElement = HTML.create('div', { class: 'sprite-container' })
    readonly addSpriteButton = HTML.create('button', { textContent: '+' })
    readonly spriteViews: SpriteView[]

    constructor(readonly env: Env, readonly sheet: xbm.Sheet) {
        this.spriteViews = sheet.sprites.map(sprite => new SpriteView(env, sprite))
        this.spriteViews.forEach(view => this.spriteContainer.appendChild(view.element))
        this.element.appendChild(this.spriteContainer)
        this.element.appendChild(this.addSpriteButton)

        this.addSpriteButton.addEventListener('click', () => {
            const sizeInput = prompt('Enter size (w x h)', '8x8')
            if (sizeInput === null) return
            const sizeArray = sizeInput.split('x').map(x => parseInt(x.trim()))
            if (sizeArray.length !== 2) return
            if (sizeArray.some(x => isNaN(x))) return
            const name = prompt('Enter name', 'untitled')
            if (name === null || name.length === 0) return
            const spriteView = new SpriteView(this.env, xbm.Sprite.single(sizeArray[0], sizeArray[1], name))
            this.spriteViews.push(spriteView)
            this.spriteContainer.appendChild(spriteView.element)
            console.log(`new name: ${name}, w: ${sizeArray[0]}, h: ${sizeArray[1]}`)
        })
    }
}