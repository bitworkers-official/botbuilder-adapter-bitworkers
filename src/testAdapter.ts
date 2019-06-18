import { TestAdapter, ActivityHandler } from 'botbuilder'
import * as _ from 'lodash'
import 'colors'
import { DialogTurnStatus } from 'botbuilder-dialogs'
import { Dialog } from './Dialog'
import { createAdapter } from './adapter'

/**
 * Creates a adapter for testing.
 *
 * @param activityHandler - The bot.
 */
export function createTestAdapter(
  activityHandler: ActivityHandler
): TestAdapter {
  return new TestAdapter(async context => {
    await activityHandler.run(context)
  })
}

export function createTestAdapterFromDialog(dialog: Dialog): TestAdapter {
  const adapter = createAdapter()
  adapter.onMessage = async () => {
    const results = await adapter.continueDialog()
    if (results.status === DialogTurnStatus.empty) {
      await adapter.beginDialog(dialog)
    }
  }
  return createTestAdapter(adapter.bot)
}

export function expectSuggestedActionsMatch({
  text,
  actions,
  expectedText,
  expectedActions,
}: {
  text: string | undefined
  actions: any[] | undefined
  expectedText: string
  expectedActions: any[]
  done?: any
}): void {
  const textStyles = {
    number: `${expectedText}\n\n${expectedActions
      .map((action, index) => `   ${index + 1}. ${action}`)
      .join('\n')}`,
    inline: `${expectedText}${expectedActions
      .map((action, index) => ` (${index + 1}) ${action}`)
      .join(' or')}`,
  }
  if (!text) {
    throw new Error(`text is ${text}`)
  }
  if (text === expectedText && _.isEqual(actions, expectedActions)) {
    // done()
    return
  }
  if (text === textStyles.number || text === textStyles.inline) {
    // done()
    return
  }
  let error = `expected "${text.red}" to match "${expectedText.green}"`
  if (actions) {
    error += `and "${actions.toString().red}" to match "${
      expectedActions.toString().green
    }"`
  }
  throw new Error(error)
}
