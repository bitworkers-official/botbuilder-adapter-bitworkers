import { RecognizerResult, TurnContext } from 'botbuilder'
import { LuisRecognizer } from 'botbuilder-ai'
import { BookingDetails } from '../types'

export function parseCompositeEntity(
  result: RecognizerResult,
  compositeName: string,
  entityName: string
): string | undefined {
  const compositeEntity = result.entities[compositeName]
  if (!compositeEntity || !compositeEntity[0]) {
    return undefined
  }
  const entity = compositeEntity[0][entityName]
  if (!entity || !entity[0]) {
    return undefined
  }
  return entity[0][0]
}

function parseDatetimeEntity(result: RecognizerResult): string | undefined {
  const datetimeEntity = result.entities.datetime
  if (!datetimeEntity || !datetimeEntity[0]) {
    return undefined
  }
  const { timex } = datetimeEntity[0]
  if (!timex || !timex[0]) {
    return undefined
  }
  return timex[0].split('T')[0]
}

export async function executeLuisQuery(
  context: TurnContext
): Promise<BookingDetails> {
  const bookingDetails: BookingDetails = {}
  try {
    const recognizer = new LuisRecognizer(
      {
        applicationId: process.env.LuisAppId as string,
        endpoint: `https://${process.env.LuisAPIHostName}`,
        endpointKey: process.env.LuisAPIKey as string,
      },
      {},
      true
    )
    const recognizerResult = await recognizer.recognize(context)
    const intent = LuisRecognizer.topIntent(recognizerResult)
    bookingDetails.intent = intent
    if (intent === 'Book_flight') {
      // We need to get the result from the LUIS JSON which at every level returns an array
      bookingDetails.destination = parseCompositeEntity(
        recognizerResult,
        'To',
        'Airport'
      )
      bookingDetails.origin = parseCompositeEntity(
        recognizerResult,
        'From',
        'Airport'
      )
      // This value will be a TIMEX. And we are only interested in a Date so grab the first result and drop the Time part.
      // TIMEX is a format that represents DateTime expressions that include some ambiguity. e.g. missing a Year.
      bookingDetails.travelDate = parseDatetimeEntity(recognizerResult)
    }
  } catch (error) {
    console.warn(`LUIS Exception: ${error} Check your LUIS configuration`)
  }
  return bookingDetails
}
