/* @flow */

import { writeFileSync } from 'fs'
import { resolve } from 'path'

// $FlowFixMe
import { map, startsWith, always, ifElse, flatten } from 'ramda'

import toJSDoc from '../helpers/toJSDoc'
import leftPad from '../helpers/leftPad'
import tgTypeToFlow from '../helpers/tgTypeToFlow'
import getRawData from '../electron-runtime/getRawData'
import getAbstractSpecType from '../helpers/getAbstractSpecType'
import getAbstractSpecUnion from '../helpers/getAbstractSpecUnion'

const generatedTypesPath = resolve(__dirname, '../generatedTypes.js')

const returns = {
  getUpdates: 'Update[]',
  setWebhook: 'true',
  deleteWebhook: 'true',
  getWebhookInfo: 'WebhookInfo',

  getMe: 'User',
  sendMessage: 'Message',
  forwardMessage: 'Message',
  sendPhoto: 'Message',
  sendAudio: 'Message',
  sendDocument: 'Message',
  sendVideo: 'Message',
  sendVoice: 'Message',
  sendVideoNote: 'Message',
  sendLocation: 'Message',
  sendVenue: 'Message',
  sendContact: 'Message',

  sendChatAction: 'true',

  getUserProfilePhotos: 'UserProfilePhotos',
  getFile: 'File',

  kickChatMember: 'true',
  unbanChatMember: 'true',
  restrictChatMember: 'true',
  promoteChatMember: 'true',
  exportChatInviteLink: 'string',
  setChatPhoto: 'true',
  deleteChatPhoto: 'true',
  setChatTitle: 'true',
  setChatDescription: 'true',
  pinChatMessage: 'true',
  unpinChatMessage: 'true',
  leaveChat: 'true',

  getChat: 'Chat',
  getChatAdministrators: 'ChatMember[]',
  getChatMembersCount: 'number',
  getChatMember: 'ChatMember',
  answerCallbackQuery: 'true',

  editMessageText: 'Message | true',
  editMessageCaption: 'Message | true',
  editMessageReplyMarkup: 'Message | true',
  deleteMessage: 'true',

  sendSticker: 'Message',
  getStickerSet: 'StickerSet',
  uploadStickerFile: 'File',
  createNewStickerSet: 'true',
  addStickerToSet: 'true',
  setStickerPositionInSet: 'true',
  deleteStickerFromSet: 'true',

  answerInlineQuery: 'true',

  sendInvoice: 'Message',
  answerShippingQuery: 'true',
  answerPreCheckoutQuery: 'true',

  sendGame: 'Message',
  setGameScore: 'Message | true',
  getGameHighScores: 'GameHighScore[]',
}

const ret = (methodName: string) => returns[methodName] || 'any'

const getSpecsTypes = map(getAbstractSpecType)
const getSpecsUnions = map(getAbstractSpecUnion)

const max = 80
const pad = leftPad(2)
const pad2 = leftPad(4)

const getGlue = ifElse(
  startsWith('Optional.'),
  always('?: '),
  always(': '),
)

const result = `export type Result<R> = {
  ok: false,
  description: string,
  error_code: number,
  parameters?: ResponseParameters,
} | {
  ok: true,
  result: R,
}`

getRawData()
  .then(
    ({ types, unions }) => {
      const raw = [
        ...getSpecsTypes(types),
        ...getSpecsUnions(unions),
      ]

      const typedefs = [
        '/* @flow */',
        '/* eslint no-use-before-define: off */',
        result,
        'export type Res<T> = Promise<Result<T>>',
        'export type InputFile = any',
        'export type CallbackGame = any',
        raw.map(
          (spec) => {
            switch (spec.type) {
              case 'typedef': return flatten([
                toJSDoc([spec.name, ...spec.description], max, 0),
                `export type ${spec.name} = {`,
                spec.fields.map(
                  ({ field, type, description }) => [
                    toJSDoc([description], max, 2),
                    pad(field + getGlue(description) + tgTypeToFlow(type)).concat(','),
                  ],
                ),
                '}',
              ]).join('\n')

              case 'union': return flatten([
                toJSDoc([spec.name, ...spec.description], max, 0),
                `export type ${spec.name} = (`,
                spec.types.map(
                  (subType, i, a) => pad(subType)
                    .concat(i < a.length - 1 ? ' |' : ''),
                ),
                ')',
              ]).join('\n')

              case 'method': return undefined
              case 'unknown': return undefined
              default:
                (spec.type: empty)
                return undefined
            }
          },
        ),
        ['export interface BotAPIClient {',
          [
            toJSDoc([
              'Method getMe',
              'A simple method for testing your bot\'s auth token. Requires no parameters. ' +
              'Returns basic information about the bot in form of a User object.',
            ], max, 2),
            pad('getMe: () => Res<User>,'),
          ].join('\n').concat('\n'),
          raw.map(
            (spec) => {
              if (typeof spec === 'string') return spec

              switch (spec.type) {
                case 'method': return flatten([
                  toJSDoc([`Method ${spec.name}`, ...spec.description], max, 2),
                  pad(`${spec.name}: (params: {`),
                  spec.fields.map(
                    ({ parameters: param, description, required, type }) => [
                      toJSDoc([description], max, 4),
                      pad2(param) + (
                        required === 'Yes' ? ': ' : '?: '
                      ) + tgTypeToFlow(type).concat(','),
                    ],
                  ),
                  pad(`}) => Res<${ret(spec.name)}>,`),
                ]).join('\n')

                case 'typedef': return undefined
                case 'union': return undefined
                case 'unknown': return undefined
                default:
                  (spec.type: empty)
                  return undefined
              }
            },
          ).filter(Boolean).join('\n'.repeat(2)),
          '}'].join('\n'),
      ]

      return flatten(typedefs)
        .filter(Boolean)
        .join('\n'.repeat(2))
        .concat('\n')
    },
  ).then(res => writeFileSync(generatedTypesPath, res, 'utf8'))
