import { ActivityHandler, TurnContext } from 'botbuilder'
import { createAdapter } from '../../src/adapter'

async function sendCactus(turnContext: TurnContext): Promise<void> {
  await turnContext.sendActivity('🌵')
}

/**
 * Creates a bot that just sends 🌵.
 */
export function createCactusBot(): ActivityHandler {
  const adapter = createAdapter()
  adapter.onMembersAdded = sendCactus
  adapter.onMessage = sendCactus
  return adapter.bot
}
