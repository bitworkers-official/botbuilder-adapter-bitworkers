/* eslint-disable promise/no-callback-in-promise */
/* eslint-disable promise/catch-or-return */
import { TestAdapter } from 'botbuilder'
import {
  expectSuggestedActionsMatch,
  createTestAdapterFromDialog,
} from '../../../../src/testAdapter'
import { BookingDialog } from './bookingDialog'

function createTestBot(): TestAdapter {
  return createTestAdapterFromDialog(BookingDialog)
}

test('asks about the journey', done => {
  createTestBot()
    .send('hi')
    .assertReply('To what city would you like to travel?')
    .send('new york')
    .assertReply('From what city will you be travelling?')
    .send('hamburg')
    .assertReply('On what date would you like to travel?')
    .send('06.06.2020')
    .assertReply(reply => {
      expectSuggestedActionsMatch({
        text: reply.text,
        actions:
          reply.suggestedActions &&
          reply.suggestedActions.actions.map(action => action.title),
        done,
        expectedText:
          'Please confirm, I have you traveling to: new york from: hamburg on: 2020-06-06.',
        expectedActions: ['Yes', 'No'],
      })
    })
    .then(done)
})
