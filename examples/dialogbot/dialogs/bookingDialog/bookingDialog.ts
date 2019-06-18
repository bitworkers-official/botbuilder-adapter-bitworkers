// @ts-ignore
import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression'
import { Step, Dialog } from '../../../../src/Dialog'
import { BookingDetails } from '../../types'
import { dateResolverDialog } from '../dateResolverDialog/dateResolverDialog'
import { prompts } from '../../../../src/prompts'
import { CancelAndHelpMiddleware } from '../../middleware/cancelAndHelpMiddleware'

function isAmbiguous(timex: string): boolean {
  const timexProperty = new TimexProperty(timex)
  return !timexProperty.types.has('definite')
}

type Options = BookingDetails

/**
 * If a destination city has not been provided, prompt for one.
 */
const destinationStep: Step<Options> = async stepContext => {
  const bookingDetails = stepContext.options
  if (!bookingDetails.destination) {
    return stepContext.prompt({
      message: 'To what city would you like to travel?',
    })
  }
  return stepContext.next(bookingDetails.destination)
}

/**
 * If an origin city has not been provided, prompt for one.
 */
const originStep: Step<Options, string> = async stepContext => {
  const bookingDetails = stepContext.options
  // Capture the response to the previous step's prompt
  bookingDetails.destination = stepContext.result
  if (!bookingDetails.origin) {
    return stepContext.prompt({
      message: 'From what city will you be travelling?',
    })
  }
  return stepContext.next(bookingDetails.origin)
}

/**
 * If a travel date has not been provided, prompt for one.
 * This will use the DATE_RESOLVER_DIALOG.
 */
const travelDateStep: Step<Options, string> = stepContext => {
  const bookingDetails = stepContext.options

  // Capture the results of the previous step
  bookingDetails.origin = stepContext.result
  if (!bookingDetails.travelDate || isAmbiguous(bookingDetails.travelDate)) {
    return stepContext.beginDialog(dateResolverDialog, {
      date: bookingDetails.travelDate,
    })
  }
  return stepContext.next(bookingDetails.travelDate)
}

/**
 * Confirm the information the user has provided.
 */
const confirmStep: Step<Options, string> = stepContext => {
  const bookingDetails = stepContext.options

  // Capture the results of the previous step
  bookingDetails.travelDate = stepContext.result
  const msg = `Please confirm, I have you traveling to: ${bookingDetails.destination} from: ${bookingDetails.origin} on: ${bookingDetails.travelDate}.`

  // Offer a YES/NO prompt.
  return stepContext.prompt({ message: msg, promptType: prompts.confirm() })
}

/**
 * Complete the interaction and end the dialog.
 */
const finalStep: Step<Options, boolean> = stepContext => {
  if (stepContext.result === true) {
    const bookingDetails = stepContext.options
    return stepContext.endDialog(bookingDetails)
  }
  return stepContext.endDialog()
}

export const BookingDialog: Dialog<Options> = {
  steps: [destinationStep, originStep, travelDateStep, confirmStep, finalStep],
  middleware: [CancelAndHelpMiddleware],
}
