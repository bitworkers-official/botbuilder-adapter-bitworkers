/* eslint-disable no-underscore-dangle */
import {
  MemoryStorage,
  UserState,
  TurnContext,
  ConversationState,
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
   */
  readonly useState: <T = any>(initialState: T) => StateAccessor<T>
}

export function createAdapter({
  storage = new MemoryStorage(),
  conversationState = new ConversationState(storage),
}: {
  storage?: MemoryStorage
  conversationState?: ConversationState
} = {}): Adapter {
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
  /**
   * An Array of states that the user provided
   */
  const _states: UserState[] = []
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
        // save every state for the next round
        await Promise.all(
          [conversationState, ..._states].map(state =>
            state.saveChanges(turnContext)
          )
        )
      }
    },
    set onTurn(onTurn) {
      _onTurn = onTurn
    },
    useState(initialState) {
      const state = new UserState(storage)
      _states.push(state)
      const accessor = state.createProperty('state')
      return {
        async get() {
          return accessor.get(_turnContext, initialState)
        },
        async set(value) {
          return accessor.set(_turnContext, value)
        },
      }
    },
  }
}
