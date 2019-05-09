import { TestAdapter, ActivityHandler } from 'botbuilder'

/**
 * Creates a adapter for testing.
 *
 * @param activityHandler - The bot.
 */
export function createTestAdapter(
  activityHandler: ActivityHandler
): TestAdapter {
  return new TestAdapter(async context => {
    activityHandler.run(context)
  })
}
