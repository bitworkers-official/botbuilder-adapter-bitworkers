import 'source-map-support/register'
import * as restify from 'restify'
import { BotFrameworkAdapter } from 'botbuilder'
import { createEchoBot } from './echoBot'

const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
})
const myBot = createEchoBot()
const server = restify.createServer()
server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async context => {
    await myBot.run(context)
  })
})
const port = 3978
server.listen(port, () =>
  console.log(`🌵  listening to http://localhost:${port}/api/messages`)
)
