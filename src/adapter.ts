/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-underscore-dangle */
import {
  TurnContext,
  ConversationState,
  BotState,
  MemoryStorage,
  ActivityHandler,
  ChannelAccount,
} from 'botbuilder'
import {
  DialogSet,
  DialogContext,
  DialogTurnResult,
  ComponentDialog,
  WaterfallDialog,
  DialogState,
} from 'botbuilder-dialogs'
import { Dialog, randomId, modStep, DialogMap } from './Dialog'

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

  readonly bot: ActivityHandler
  /**
   *  This function is called when the user has sent a message.
   */
  onMessage: (turnContext: TurnContext) => void | Promise<void>

  /**
   * This function is called when a user has entered the conversation.
   */
  onMembersAdded: (
    turnContext: TurnContext,
    membersAdded: ChannelAccount[]
  ) => void | Promise<void>

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

  readonly beginDialog: (<T extends object>(
    dialog: Dialog<T>,
    options: T
  ) => Promise<DialogTurnResult>) &
    ((dialog: Dialog<undefined>) => Promise<DialogTurnResult>)
  readonly continueDialog: () => Promise<DialogTurnResult<any>>
}

/**
 * Creates a bot adapter.
 *
 * @param conversationState - The conversationState to use, can be based on MemoryStorage or CosmosDBStorage or something else.
 */
export function createAdapter(
  conversationState: ConversationState = new ConversationState(
    new MemoryStorage()
  )
): Adapter {
  const activityHandler = new ActivityHandler()
  activityHandler.onDialog(async (turnContext, next) => {
    // Save any state changes. The load happened during the execution of the Dialog.
    await conversationState.saveChanges(turnContext, false)
    await next()
  })
  const _dialogState = conversationState.createProperty<DialogState>(
    'dialog_state'
  )
  /**
   * Dialog set, needed for adding and removing dialogs
   */
  const _dialogSet = new DialogSet(_dialogState)

  /**
   * The dialog context, needed for starting and switching between dialogs.
   */
  let _dialogContext: DialogContext

  const dialogMap: DialogMap = new Map<
    Dialog,
    { id: string; dialogClass: ComponentDialog }
  >()

  return {
    addDialogs(dialogs) {
      for (const dialog of dialogs) {
        _dialogSet.add(dialog)
      }
    },
    createDialogContext(turnContext) {
      return _dialogSet.createContext(turnContext)
    },
    get onMessage() {
      throw new Error('cannot access onMessage')
    },
    set onMessage(
      onMessage: (turnContext: TurnContext) => void | Promise<void>
    ) {
      activityHandler.onMessage(
        async (turnContext: TurnContext, next: () => Promise<void>) => {
          try {
            _dialogContext = await _dialogSet.createContext(turnContext)
            // make the turn that the user provided
            await onMessage(turnContext)
          } catch (error) {
            console.error(error)
            throw error
          }
          await conversationState.saveChanges(turnContext, false)
          await next()
        }
      )
    },
    get onMembersAdded() {
      throw new Error('cannot access onMembersAdded')
    },
    set onMembersAdded(
      onMembersAdded: (
        turnContext: TurnContext,
        membersAdded: ChannelAccount[]
      ) => void | Promise<void>
    ) {
      activityHandler.onMembersAdded(
        async (turnContext: TurnContext, next: () => Promise<void>) => {
          _dialogContext = await _dialogSet.createContext(turnContext)
          const { membersAdded } = turnContext.activity
          const isBotAdded =
            membersAdded &&
            membersAdded.length === 1 &&
            membersAdded[0].id !== turnContext.activity.recipient.id
          if (isBotAdded) {
            // user doesn't care if bot user was added
            await next()
            return
          }
          try {
            // notify that a user was added
            await onMembersAdded(turnContext, membersAdded!)
          } catch (error) {
            console.error(error)
            throw error
          }
          await next()
        }
      )
    },
    get bot() {
      return activityHandler
    },
    useState(
      initialState,
      {
        propertyName = 'state',
        state = conversationState,
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
    // @ts-ignore
    async beginDialog(dialog: Dialog, options: object | undefined) {
      if (!dialogMap.has(dialog)) {
        const id = `dialog-${randomId()}`
        const dialogClass = new (class extends ComponentDialog {
          constructor() {
            super(id)
            this.addDialog(
              new WaterfallDialog(
                `waterfall-${id}`,
                dialog.steps.map(step => modStep(step, dialogMap))
              )
            )
          }
        })()
        dialogMap.set(dialog, { id, dialogClass })
        _dialogSet.add(dialogClass)
      }
      const dialogId = dialogMap.get(dialog)!.id
      await _dialogContext.beginDialog(dialogId, options)
    },
    async continueDialog() {
      return _dialogContext.continueDialog()
    },
  }
}
