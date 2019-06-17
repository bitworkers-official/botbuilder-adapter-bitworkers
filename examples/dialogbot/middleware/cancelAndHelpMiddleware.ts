/* eslint-disable sonarjs/no-identical-functions */
import {
  DialogTurnResult,
  DialogTurnStatus,
  DialogContext,
} from 'botbuilder-dialogs'
import {
  DialogMiddleware,
  OnBeginDialog,
  OnContinueDialog,
} from '../../../src/middleware'

async function interrupt(
  innerDialogContext: DialogContext
): Promise<DialogTurnResult | undefined> {
  const text = innerDialogContext.context.activity.text.toLowerCase()

  switch (text) {
    case 'help':
    case '?':
      await innerDialogContext.context.sendActivity(
        '[ This is where to send sample help to the user... ]'
      )
      return { status: DialogTurnStatus.waiting }
    case 'cancel':
    case 'quit':
      await innerDialogContext.context.sendActivity('Cancelling')
      return innerDialogContext.cancelAllDialogs()
    default:
      return undefined
  }
}

const onBeginDialog: OnBeginDialog = async (
  innerDialogContext,
  options,
  next
) => {
  const result = await interrupt(innerDialogContext)
  if (result) {
    return result
  }
  return next()
}

const onContinueDialog: OnContinueDialog = async (innerDialogContext, next) => {
  const result = await interrupt(innerDialogContext)
  if (result) {
    return result
  }
  return next()
}

export const CancelAndHelpMiddleware: DialogMiddleware = {
  onBeginDialog,
  onContinueDialog,
}
