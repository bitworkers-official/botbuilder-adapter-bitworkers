/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/no-callback-in-promise */
import { TestAdapter } from 'botbuilder'
import { createDialogBot } from './dialogBot'
import { createTestAdapter } from '../../../src/testAdapter'

function createTestBot(): TestAdapter {
  return createTestAdapter(createDialogBot())
}

test('echoes the response', done => {
  createTestBot()
    .send('hi')
    .assertReply('you said hi')
    .send('what')
    .assertReply('you said what')
    .then(done)
})
