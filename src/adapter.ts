/* eslint-disable no-underscore-dangle */
import {
  TurnContext,
  ConversationState,
} from 'botbuilder'
import { DialogSet, DialogContext } from 'botbuilder-dialogs'

export interface Adapter {
  /**
   * Add dialogs to the dialog set
   */
  readonly addDialogs: (dialogs: any[]) => void
  /**
   * Create a dialog context for starting dialogs
   */
  readonly createDialogContext: () => Promise<DialogContext>
  /**
   *  A proxy for the onTurn function provided by the user
   */
  onTurn: (turnContext: TurnContext) => Promise<void>
}

/**
 * Creates a bot adapter.
 * @param storage - the storage to use, can be MemoryStorage or CosmosDBStorage or something else
 */
export function createAdapter(conversationState: ConversationState): Adapter {
  /**
   * The current turn context, needed for getting and setting state
   */
  let _turnContext: TurnContext
  /**
   * Dialog set, needed for adding and removing dialogs
   */
  const _dialogSet = new DialogSet(
    conversationState.createProperty('dialog_state')
  )
  return {
    addDialogs(dialogs) {
      for (const dialog of dialogs) {
        _dialogSet.add(dialog)
      }
    },
    createDialogContext() {
      return _dialogSet.createContext(_turnContext)
    },
    // eslint-disable-next-line no-empty-function, @typescript-eslint/no-unused-vars
    async onTurn(turnContext: TurnContext) {},
  }
}
