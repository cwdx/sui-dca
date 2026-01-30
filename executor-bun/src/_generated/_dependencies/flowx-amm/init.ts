import { StructClassLoader } from '../../_framework/loader'
import * as comparator from './comparator/structs'
import * as factory from './factory/structs'
import * as pair from './pair/structs'
import * as treasury from './treasury/structs'

export function registerClasses(loader: StructClassLoader): void {
  loader.register(comparator.Result)
  loader.register(factory.Container)
  loader.register(factory.AdminCap)
  loader.register(factory.PairCreated)
  loader.register(factory.FeeChanged)
  loader.register(pair.LP)
  loader.register(pair.PairMetadata)
  loader.register(pair.LiquidityAdded)
  loader.register(pair.LiquidityRemoved)
  loader.register(pair.Swapped)
  loader.register(treasury.Treasury)
}
