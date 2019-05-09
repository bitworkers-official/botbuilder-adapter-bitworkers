import { TestAdapter } from 'botbuilder'
import { createCactusBot } from './bot'
import { createTestAdapter } from '../src/testAdapter'

function createTestBot(): TestAdapter {
  return createTestAdapter(createCactusBot())
}

test('it replies with 🌵 ', () => {
  createTestBot()
    .send('hi')
    .assertReply('🌵')
    .send('what')
    .assertReply('🌵')
})
