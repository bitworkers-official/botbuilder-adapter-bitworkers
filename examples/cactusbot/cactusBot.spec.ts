/* eslint-disable promise/no-callback-in-promise */
/* eslint-disable promise/catch-or-return */
import { TestAdapter } from 'botbuilder'
import { createCactusBot } from './cactusBot'
import { createTestAdapter } from '../../src'

function createTestBot(): TestAdapter {
  return createTestAdapter(createCactusBot())
}

test('it replies with 🌵 ', done => {
  createTestBot()
    .send('hi')
    .assertReply('🌵')
    .send('what')
    .assertReply('🌵')
    .then(done)
})
