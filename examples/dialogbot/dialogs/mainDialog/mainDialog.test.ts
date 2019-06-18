/* eslint-disable promise/no-callback-in-promise */
/* eslint-disable promise/catch-or-return */
import { TestAdapter } from 'botbuilder'
import {
  createTestAdapterFromDialog,
  expectSuggestedActionsMatch,
} from '../../../../src/testAdapter'
import { MainDialog } from './mainDialog'

function createTestBot(): TestAdapter {
  return createTestAdapterFromDialog(MainDialog)
}

test('main dialog', done => {
  createTestBot()
    .send('hi')
    .assertReply(
      'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.'
    )
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
        expectedText:
          'Please confirm, I have you traveling to: new york from: hamburg on: 2020-06-06.',
        expectedActions: ['Yes', 'No'],
      })
    })
    .send('yes')
    .assertReply('I have you booked to new york from hamburg on 6th June 2020.')
    .then(done)
})
