import { xbm } from '../xbm.js'
import { ObservableValue } from './../../lib/common.js'
export interface ViewContext {
    zoom: ObservableValue<number>

    remove(sprite: xbm.Sprite): void
}