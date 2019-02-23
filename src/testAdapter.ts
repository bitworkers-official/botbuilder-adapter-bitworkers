import { TestAdapter } from 'botbuilder'
import { Adapter } from './adapter'

export function createTestAdapter(adapter: Adapter) {
  return new TestAdapter(adapter.onTurn)
}
