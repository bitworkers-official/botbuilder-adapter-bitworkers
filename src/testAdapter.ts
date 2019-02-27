import { TestAdapter } from 'botbuilder'
import { Adapter } from './adapter'

/**
 * creates a adapter for testing
 * @param adapter
 */
export function createTestAdapter(adapter: Adapter) {
  return new TestAdapter(adapter.onTurn)
}
