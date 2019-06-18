/* eslint-disable promise/no-callback-in-promise */
/* eslint-disable promise/catch-or-return */
import { TestAdapter } from 'botbuilder'
import { createTestAdapterFromDialog } from '../../../../src/testAdapter'
import { dateResolverDialog } from './dateResolverDialog'

function createTestBot(): TestAdapter {
  return createTestAdapterFromDialog(dateResolverDialog)
}

test('registers the date', done => {
  createTestBot()
    .send('hi')
    .assertReply('On what date would you like to travel?')
    .send('06.06.2020')
    .then(done)
})

test("it reprompts if the user doesn't enter a date", done => {
  createTestBot()
    .send('hi')
    .assertReply('On what date would you like to travel?')
    .send('no')
    .assertReply(
      "I'm sorry, for best results, please enter your travel date including the month, day and year."
    )
    .send('06.06.2020')
    .then(done)
})
