/* eslint-disable no-underscore-dangle */
import {
  MemoryStorage,
  UserState,
  TurnContext,
  ConversationState,
  BotState,
  Storage,
} from 'botbuilder'
import { DialogSet, DialogContext } from 'botbuilder-dialogs'

/**
 * A state accessor is just a proxy around a value with the methods 'get' and 'set', similar to localStorage
 * @example
 * ```js
 * // get the state
 * const state = await stateAccessor.get()
 *
 * // set the state
 * await stateAccessor.set({ x: 2 })
 * ```
 */
export interface StateAccessor<T> {
  /**
   * Get the value
   */
  readonly get: () => Promise<T>
  /**
   * Set the value
   */
  readonly set: (value: T) => Promise<void>
}

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

  /**
   * Use state which is saved after every turn
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
    { propertyName, state }?: { propertyName: string; state: BotState }
  ) => StateAccessor<T>
}

/**
 * Creates a bot adapter.
 * @param storage - the storage to use, can be MemoryStorage or CosmosDBStorage or something else
 */
export function createAdapter(storage: Storage = new MemoryStorage()): Adapter {
  const conversationState = new ConversationState(storage)
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
  /**
   * The onTurn function provided by the user
   */
  let _onTurn: (turnContext: TurnContext) => Promise<void>
  return {
    addDialogs(dialogs) {
      for (const dialog of dialogs) {
        _dialogSet.add(dialog)
      }
    },
    createDialogContext() {
      return _dialogSet.createContext(_turnContext)
    },
    get onTurn() {
      return async (turnContext: TurnContext) => {
        // assign the context so that it can be used for getting and setting state
        _turnContext = turnContext
        // make the turn that the user provided
        await _onTurn(_turnContext)
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
        state = new UserState(storage),
      }: { propertyName?: string; state?: BotState } = {}
    ) {
      const accessor = state.createProperty(propertyName)
      return {
        async get() {
          return accessor.get(_turnContext, initialState)
        },
        async set(value) {
          await accessor.set(_turnContext, value)
          await state.saveChanges(_turnContext)
        },
      }
    },
  }
}
