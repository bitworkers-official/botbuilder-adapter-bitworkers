/* eslint-disable no-await-in-loop */
import { ActivityHandler } from 'botbuilder'
import { DialogTurnStatus } from 'botbuilder-dialogs'
import { createAdapter } from '../../../src/adapter'
import { cards } from '../cards/cards'
import { MainDialog } from '../dialogs/mainDialog'

/**
 * Creates a bot that just sends back what the user has sent.
 */
export function createDialogBot(): ActivityHandler {
  const adapter = createAdapter()
  adapter.onMessage = async () => {
    const results = await adapter.continueDialog()
    if (results.status === DialogTurnStatus.empty) {
      await adapter.beginDialog(MainDialog)
    }
  }
  adapter.onMembersAdded = async turnContext => {
    await turnContext.sendActivity({
      attachments: [cards.WelcomeCard],
    })
  }
  return adapter.bot
}
