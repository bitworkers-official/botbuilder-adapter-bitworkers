[![travis build](https://img.shields.io/travis/bitworkers-official/botbuilder-adapter.svg?style=flat-square)](https://travis-ci.org/bitworkers-official/botbuilder-adapter) [![version](https://img.shields.io/npm/v/botbuilder-adapter.svg?style=flat-square)](http://npm.im/botbuilder-adapter) [![downloads](https://img.shields.io/npm/dm/botbuilder-adapter.svg?style=flat-square)](http://npm-stat.com/charts.html?package=botbuilder-adapter) [![MIT License](https://img.shields.io/npm/l/botbuilder-adapter.svg?style=flat-square)](http://opensource.org/licenses/MIT) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

# botbuilder-adapter-bitworkers

## Features

- Better Error handling
- Easier Testing
- Simpler Api

## Usage

Install the necessary dependencies:

```sh
npm install botbuilder-adapter-bitworkers botbuilder botbuilder-dialogs restify typescript source-map-support &&
npm install --save-dev nodemon  @types/source-map-support ts-node
```

Create a bot:

```typescript
// bot.ts
import { ActivityHandler, TurnContext } from 'botbuilder'
import { createAdapter } from 'botbuilder-adapter-bitworkers'

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
```

Create a server:

```typescript
// server.ts
import 'source-map-support/register'
import * as restify from 'restify'
import { BotFrameworkAdapter } from 'botbuilder'
import { createCactusBot } from './bot'

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
  console.log(`🌵  listening to http://localhost:${port}/api/messages`)
})
```

Run it:

```sh
npx nodemon --exec ts-node server.ts
```
