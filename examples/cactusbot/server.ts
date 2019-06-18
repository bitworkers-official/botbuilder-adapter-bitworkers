/* eslint-disable import/no-extraneous-dependencies */
import 'source-map-support/register'
import * as restify from 'restify'
import { BotFrameworkAdapter } from 'botbuilder'
import { createCactusBot } from './cactusBot'

// Create adapter.
const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
})

// Create the bot.
const myBot = createCactusBot()

// Create HTTP server.
const server = restify.createServer()

// Listen for incoming requests.
server.post('/api/messages', (req: any, res: any) => {
  adapter.processActivity(req, res, async context => {
    // Route to main dialog.
    await myBot.run(context)
  })
})

const port = process.env.port || process.env.PORT || 3978

server.listen(port, () => {
  console.log(`
  🌵  listening to http://localhost:${port}/api/messages

  Get Bot Framework Emulator: https://aka.ms/botframework-emulator
  See https://aka.ms/connect-to-bot for more information
  `)
})
