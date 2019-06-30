/* eslint-disable no-shadow */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  WaterfallStepContext,
  DialogTurnResult,
  ComponentDialog,
  WaterfallDialog,
  Prompt,
} from 'botbuilder-dialogs'
import { ResourceResponse, Activity, TurnContext } from 'botbuilder'
import { DialogMiddleware, createMiddlewareDialog } from './middleware'
import { prompts } from './prompts'

export type Step<Options = any, Result = any> = (
  stepContext: StepContext<Options, Result>
) => Promise<DialogTurnResult>

export interface Dialog<Options = any> {
  readonly steps: ReadonlyArray<Step<Options>>
  readonly middleware?: readonly DialogMiddleware[]
}

export interface StepContext<Options = any, Result = any> {
  readonly turnContext: TurnContext
  readonly beginDialog: (<T extends object>(
    dialog: Dialog<T>,
    options: T
  ) => Promise<DialogTurnResult>) &
    ((dialog: Dialog<undefined>) => Promise<DialogTurnResult>)

  readonly sendActivity: (text: any) => Promise<ResourceResponse | undefined>
  readonly endDialog: (returnValue?: any) => Promise<DialogTurnResult>
  readonly options: Options
  readonly result: Result
  readonly prompt: (({
    message,
    retryMessage,
    promptType,
  }: {
    message?: string
    retryMessage?: string
    promptType?: Prompt<any>
  }) => Promise<DialogTurnResult>) &
    (({ attachments }: { attachments?: any[] }) => Promise<DialogTurnResult>)
  readonly next: (result?: any) => Promise<DialogTurnResult>
  readonly activity: Activity
}

export type DialogMap = Map<
  Dialog,
  { id: string; dialogClass: ComponentDialog }
>

export function randomId(): string {
  return Math.random().toFixed(10)
}

export function modStep(
  step: Step,
  dialogMap: DialogMap
): (stepContext: WaterfallStepContext) => Promise<DialogTurnResult> {
  return async waterfallStepContext => {
    const stepContext = createStepContext(waterfallStepContext, dialogMap)
    return step(stepContext)
  }
}

function getDialogClassById(
  id: string,
  dialogMap: DialogMap
): ComponentDialog | undefined {
  const found = [...dialogMap].find(([_, { id: otherId }]) =>
    id.endsWith(otherId)
  )
  if (!found) {
    return undefined
  }
  return found[1].dialogClass
}

function createStepContext(
  waterfallStepContext: WaterfallStepContext,
  dialogMap: DialogMap
): StepContext {
  return {
    turnContext: waterfallStepContext.context,
    // @ts-ignore
    async beginDialog(dialog: Dialog, options: object | undefined) {
      if (!dialogMap.has(dialog)) {
        const newDialogId = `dialog-${randomId()}`
        const dialogClass = new (class extends ComponentDialog {
          constructor() {
            super(newDialogId)
            this.addDialog(
              new WaterfallDialog(
                `waterfall-${newDialogId}`,
                dialog.steps.map(step => modStep(step, dialogMap))
              )
            )
            if (dialog.middleware) {
              const onBeginDialogMiddlewares = dialog.middleware.filter(
                middleware => middleware.onBeginDialog
              )
              if (onBeginDialogMiddlewares.length > 0) {
                this.onBeginDialog = createMiddlewareDialog(
                  onBeginDialogMiddlewares,
                  super.onBeginDialog.bind(this),
                  'onBeginDialog'
                )
              }
              const onContinueMiddlewares = dialog.middleware.filter(
                middleware => middleware.onContinueDialog
              )
              if (onContinueMiddlewares.length > 0) {
                this.onContinueDialog = createMiddlewareDialog(
                  onContinueMiddlewares,
                  super.onContinueDialog,
                  'onContinueDialog'
                )
              }
            }
          }
        })()
        const activeDialogId = waterfallStepContext.activeDialog!.id
        const activeDialogClass = getDialogClassById(activeDialogId, dialogMap)
        if (!activeDialogClass) {
          throw new Error('cannot find active dialog')
        }
        activeDialogClass.addDialog(dialogClass)
        dialogMap.set(dialog, { id: newDialogId, dialogClass })
      }
      const dialogId = dialogMap.get(dialog)!.id
      return waterfallStepContext.beginDialog(dialogId, options)
    },
    sendActivity(activityOrText) {
      return waterfallStepContext.context.sendActivity(activityOrText)
    },
    endDialog(result) {
      return waterfallStepContext.endDialog(result)
    },
    options: waterfallStepContext.options,
    result: waterfallStepContext.result,
    next() {
      return waterfallStepContext.next()
    },
    // @ts-ignore
    prompt({
      // @ts-ignore
      message,
      // @ts-ignore
      retryMessage,
      // @ts-ignore
      attachments,
      promptType = prompts.text(),
    }) {
      const activeDialogId = waterfallStepContext.activeDialog!.id
      const activeDialogClass = getDialogClassById(activeDialogId, dialogMap)
      if (!activeDialogClass) {
        throw new Error('cannot find active dialog')
      }
      activeDialogClass.addDialog(promptType)
      if (message && attachments) {
        throw new Error('either pass message or attachments but not both')
      }
      const prompt = message || { attachments }
      return waterfallStepContext.prompt(promptType.id, {
        prompt,
        retryPrompt: retryMessage,
      })
    },
    activity: waterfallStepContext.context.activity,
  }
}
