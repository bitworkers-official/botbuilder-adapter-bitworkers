/* eslint-disable import/no-unresolved */
import { CardFactory } from 'botbuilder'
import * as WelcomeCard from './WelcomeCard.json'

export const cards = {
  WelcomeCard: CardFactory.adaptiveCard(WelcomeCard),
}
