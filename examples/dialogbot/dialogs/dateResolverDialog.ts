/* eslint-disable @typescript-eslint/no-non-null-assertion */
// @ts-ignore
import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression'
import { PromptValidatorContext, DateTimeResolution } from 'botbuilder-dialogs'
import { prompts } from '../../../src/prompts'
import { CancelAndHelpMiddleware } from '../middleware/cancelAndHelpMiddleware'
import { Step, Dialog } from '../../../src/Dialog'

interface Options {
  date: string | undefined
}

async function dateTimePromptValidator(
  promptContext: PromptValidatorContext<DateTimeResolution[]>
): Promise<boolean> {
  if (promptContext.recognized.succeeded) {
    // This value will be a TIMEX. And we are only interested in a Date so grab the first result and drop the Time part.
    // TIMEX is a format that represents DateTime expressions that include some ambiguity. e.g. missing a Year.
    const timex = promptContext.recognized.value![0].timex.split('T')[0]

    // If this is a definite Date including year, month and day we are good otherwise reprompt.
    // A better solution might be to let the user know what part is actually missing.
    return new TimexProperty(timex).types.has('definite')
  }
  return false
}

const initialStep: Step<Options> = async stepContext => {
  const timex = stepContext.options.date
  const promptMsg = 'On what date would you like to travel?'
  const repromptMsg =
    'I\'m sorry, for best results, please enter your travel date including the month, day and year.'

  const promptType = prompts.datetime({ validator: dateTimePromptValidator })
  if (!timex) {
    // We were not given any date at all so prompt the user.
    return stepContext.prompt({
      message: promptMsg,
      retryMessage: repromptMsg,
      promptType,
    })
  }
  // We have a Date we just need to check it is unambiguous.
  const timexProperty = new TimexProperty(timex)
  if (!timexProperty.types.has('definite')) {
    // This is essentially a "reprompt" of the data we were given up front.
    return stepContext.prompt({ message: repromptMsg, promptType })
  }
  return stepContext.next([{ timex }])
}

const finalStep: Step<Options, [{ timex: string }]> = async stepContext => {
  console.log(stepContext.result)
  const { timex } = stepContext.result[0]
  return stepContext.endDialog(timex)
}

export const dateResolverDialog: Dialog<Options> = {
  steps: [initialStep, finalStep],
  middleware: [CancelAndHelpMiddleware],
}
