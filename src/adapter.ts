/* eslint-disable no-underscore-dangle */
import {
  TurnContext,
  ConversationState,
  BotState,
  MemoryStorage,
} from 'botbuilder'
import { DialogSet, DialogContext } from 'botbuilder-dialogs'

/**
 * A state accessor is just a proxy around a value with the methods 'get' and 'set', similar to localStorage
 * @example
 * ```js
 * // get the state
 * const state = await stateAccessor.get(context)
 *
 * // set the state
 * await stateAccessor.set(context, { x: 2 })
 * ```
 */
export interface StateAccessor<T> {
  /**
   * Get the value
   */
  readonly get: (turnContext: TurnContext) => Promise<T>
  /**
   * Set the value
   */
  readonly set: (turnContext: TurnContext, value: T) => Promise<void>
}

export interface Adapter {
  /**
   * Add dialogs to the dialog set
   */
  readonly addDialogs: (dialogs: any[]) => void
  /**
   * Create a dialog context for starting dialogs
   */
  readonly createDialogContext: (
    turnContext: TurnContext
  ) => Promise<DialogContext>
  /**
   *  A proxy for the onTurn function provided by the user
   */
  onTurn: (turnContext: TurnContext) => Promise<void>

  /**
   * Use state which can be used for saving data between turns
   *
   * @param initialState - the initial state
   * @param options options
   * @param options.propertyName - name of the state (e.g. for database tables)
   * @param options.state - scope of the state, (e.g if the state is specific to a user or a specific to a group chat or both)
   * @example
   * const userState = adapter.useState({ name: 'Tom' }, {state: new UserState(cosmosDBStorage)})
   *
   */
  readonly useState: <T = any>(
    initialState: T,
    { propertyName, state }?: { propertyName?: string; state: BotState }
  ) => StateAccessor<T>
}

/**
 * Creates a bot adapter.
 * @param conversationState - the conversationState to use, can be based on MemoryStorage or CosmosDBStorage or something else
 */
export function createAdapter(
  conversationState: ConversationState = new ConversationState(
    new MemoryStorage()
  )
): Adapter {
  let _onTurn: (turnContext: TurnContext) => Promise<void> = Promise.resolve
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
    createDialogContext(turnContext) {
      return _dialogSet.createContext(turnContext)
    },
    get onTurn() {
      return async (turnContext: TurnContext) => {
        // make the turn that the user provided
        await _onTurn(turnContext)
        // save the conversation state for the next round
        await conversationState.saveChanges(turnContext)
      }
    },
    set onTurn(onTurn) {
      _onTurn = onTurn
    },
    useState(
      initialState,
      {
        propertyName = 'state',
        state = new ConversationState(new MemoryStorage()),
      }: { propertyName?: string; state?: BotState } = {}
    ) {
      const accessor = state.createProperty(propertyName)
      return {
        async get(turnContext: TurnContext) {
          return accessor.get(turnContext, initialState)
        },
        async set(turnContext: TurnContext, value) {
          await accessor.set(turnContext, value)
          await state.saveChanges(turnContext)
        },
      }
    },
  }
}
