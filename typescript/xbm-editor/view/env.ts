import { ObservableValue, ObservableValueImpl } from '../../lib/common.js'

export class Env {
    readonly zoom: ObservableValue<number> = new ObservableValueImpl<number>(8)
}