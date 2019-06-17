import { ActivityHandler, TurnContext } from 'botbuilder'
import { createAdapter } from '../../src/adapter'

async function sendCactus(context: TurnContext): Promise<void> {
  await context.sendActivity('🌵')
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
