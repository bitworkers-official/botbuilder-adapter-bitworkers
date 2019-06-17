/* eslint-disable @typescript-eslint/no-non-null-assertion, no-restricted-syntax */
import { DialogTurnResult } from 'botbuilder-dialogs'

type Next = () => any

export type OnBeginDialog = (
  innerDialogContext: any,
  options: any,
  next: Next
) => Promise<DialogTurnResult>

export type OnContinueDialog = (
  innerDialogContext: any,
  next: Next
) => Promise<DialogTurnResult>

export interface DialogMiddleware {
  readonly onBeginDialog?: OnBeginDialog
  readonly onContinueDialog?: OnContinueDialog
}

export function createMiddlewareDialog(
  filteredMiddleware: DialogMiddleware[],
  upperDialog: (...args: any) => any,
  middlewareName: keyof DialogMiddleware
): (...args: any[]) => Promise<DialogTurnResult> {
  return async (...args) => {
    let index = 0
    let result
    const runAllMiddlewares: () => Promise<DialogTurnResult> = async () => {
      const middleware = filteredMiddleware[index][middlewareName]!
      index++
      if (index < filteredMiddleware!.length) {
        result = await middleware(
          ...args,
          // @ts-ignore
          runAllMiddlewares
        )
      } else {
        // @ts-ignore
        result = await middleware(...args, () => upperDialog(...args))
      }
      return result
    }
    return runAllMiddlewares()
  }
}

// function createMiddleware(middleware: DialogMiddleware): any {
//   class x extends ComponentDialog {
//     constructor() {
//       super()
//       if (middleware.onBeginDialog) {
//         this.onBeginDialog = (innerDialogContext, options) =>
//           middleware.onBeginDialog!(innerDialogContext, options, () =>
//             super.onBeginDialog(innerDialogContext, options)
//           )
//       }
//       if (middleware.onContinueDialog) {
//         this.onContinueDialog = innerDialogContext =>
//           middleware.onContinueDialog!(innerDialogContext, () =>
//             super.onContinueDialog(innerDialogContext)
//           )
//       }
//     }
//   }
// }
