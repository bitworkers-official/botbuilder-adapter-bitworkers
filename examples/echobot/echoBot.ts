/* eslint-disable no-await-in-loop */
import { ActivityHandler } from 'botbuilder'
import { createAdapter } from '../../src/adapter'

/**
 * Creates a bot that just sends back what the user has sent.
 */
export function createEchoBot(): ActivityHandler {
  const adapter = createAdapter()
  adapter.onMessage = async turnContext => {
    await turnContext.sendActivity(`you said ${turnContext.activity.text}`)
  }
  adapter.onMembersAdded = async turnContext => {
    await turnContext.sendActivity('hello and welcome')
  }
  return adapter.bot
}
