import {
  ChoicePrompt,
  TextPrompt,
  NumberPrompt,
  ListStyle,
  ConfirmPrompt,
  DateTimePrompt,
  PromptValidator,
  DateTimeResolution,
} from 'botbuilder-dialogs'
import { randomId } from './Dialog'

export const prompts = {
  text() {
    return new TextPrompt(`text-prompt-${randomId()}`)
  },
  choice({ style }: { style?: ListStyle } = {}) {
    const choicePrompt = new ChoicePrompt(`choice-prompt-${randomId()}`)
    if (style) {
      choicePrompt.style = style
    }
    return choicePrompt
  },
  number() {
    return new NumberPrompt(`number-prompt-${randomId()}`)
  },
  confirm() {
    return new ConfirmPrompt(`confirm-prompt-${randomId()}`)
  },
  datetime({
    validator,
  }: {
    validator?: PromptValidator<DateTimeResolution[]>
  }) {
    return new DateTimePrompt(`date-prompt-${randomId()}`, validator)
  },
}
