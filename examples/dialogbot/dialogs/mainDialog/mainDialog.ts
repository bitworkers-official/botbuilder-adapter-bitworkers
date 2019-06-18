// @ts-ignore
import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression'
import { BookingDialog } from '../bookingDialog/bookingDialog'
import * as LuisHelper from '../../luisHelper'
import { Dialog, Step } from '../../../../src/Dialog'
import { BookingDetails } from '../../types'

type Options = BookingDetails

/**
 * First step in the waterfall dialog. Prompts the user for a command.
 * Currently, this expects a booking request, like "book me a flight from Paris to Berlin on march 22".
 * Note that the sample LUIS model will only recognize Paris, Berlin, New York and London as airport cities.
 */
const introStep: Step<Options> = async stepContext => {
  if (
    !process.env.LuisAppId ||
    !process.env.LuisAPIKey ||
    !process.env.LuisAPIHostName
  ) {
    await stepContext.sendActivity(
      'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.'
    )
    return stepContext.next()
  }

  return stepContext.prompt({
    message:
      'What can I help you with today?\nSay something like "Book a flight from Paris to Berlin on March 22, 2020"',
  })
}

/**
 * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
 * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
 */
const actStep: Step<Options> = async stepContext => {
  let bookingDetails: BookingDetails = {}
  if (
    process.env.LuisAppId &&
    process.env.LuisAPIKey &&
    process.env.LuisAPIHostName
  ) {
    // Call LUIS and gather any potential booking details.
    // This will attempt to extract the origin, destination and travel date from the user's message
    // and will then pass those values into the booking dialog
    // @ts-ignore
    bookingDetails = await LuisHelper.executeLuisQuery(stepContext as any)
  }

  // In this sample we only have a single intent we are concerned with. However, typically a scenario
  // will have multiple different intents each corresponding to starting a different child dialog.

  // Run the BookingDialog giving it whatever details we have from the LUIS call, it will fill out the remainder.
  return stepContext.beginDialog(BookingDialog, bookingDetails)
}

/**
 * This is the final step in the main waterfall dialog.
 * It wraps up the sample "book a flight" interaction with a simple confirmation.
 */
const finalStep: Step<Options, BookingDetails> = async stepContext => {
  // If the child dialog ("bookingDialog") was canceled or the user failed to confirm, the Result here will be null.
  if (stepContext.result) {
    const { result } = stepContext
    // Now we have all the booking details.
    // This is where calls to the booking AOU service or database would go.
    // If the call to the booking service was successful tell the user.
    const timeProperty = new TimexProperty(result.travelDate)
    const travelDateMsg = timeProperty.toNaturalLanguage(new Date(Date.now()))
    const msg = `I have you booked to ${result.destination} from ${result.origin} on ${travelDateMsg}.`
    await stepContext.sendActivity(msg)
  } else {
    await stepContext.sendActivity('Thank you.')
  }
  return stepContext.endDialog()
}

export const MainDialog: Dialog<Options> = {
  steps: [introStep, actStep, finalStep],
}
