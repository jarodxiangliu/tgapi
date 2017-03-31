# tgapi

Telegram bot API. Flow-compatible. Without unnecessary explicit dependencies in runtime.

- [Installation](#installation)
- [Usage](#usage)
  - [Advansed usage](#advansed-usage)
  - [Webhooks](#webhooks)
- [Events](#events)
  - [`updateReceived`](#updatereceived-event)
  - [`commandReceived`](#commandreceived-event)
  - [`commandReceived/<command>`](#commandreceivedcommand-event)
- [Types](#types)
  - [`CommandEvent`](#commandevent-type)
- [Native API methods support](#native-api-methods-support)

## Installation

```
npm install --save tgapi
```

## Usage

```javascript

import BotClient from 'tgapi';
import sendRequest from 'tgapi/sendRequest';

const token = 'bla-bla-bla';

const bot = new BotClient(token, sendRequest);

bot.getMe()
  .then(userObject => console.log(userObject));

bot.getUpdates({ offset: 100500 })
  .then(updatesArray => console.log(updatesArray));
```

`sendRequest` is the default implementation of the method of sending http requests to Telegram
server. You can to use another. `sendRequest` must receive the bot token as first argument and
Telegram API method parameters and must returns `Promise`.

### Advansed usage

```javascript
bot.on('updateReceived', update => console.log(update));

bot.startWatchUpdates(1);
// Will check updates each 1 second and emit updateReceived event
// after each one update.
```

### Webhooks

If you want to use webhooks, you can use this http-server:

```javascript
import BotClient from 'tgapi';
import sendRequest from 'tgapi/sendRequest';
import pureServer from 'tgapi/pureServer';

const bot = new BotClient('your token', sendRequest);

const server = pureServer(bot, 'your/webhook/path');

server.listen(80, () => console.log(
  'Webhook are available on http://localhost/your/webhook/path'
));

bot.on('updateReceived', update => console.log(update));
```

## Events

### `updateReceived` event

Emitted each any update. Receives [Update](https://core.telegram.org/bots/API#update) type.

### `commandReceived` event

Emitted each any bot command. Receives [CommandEvent](#commandevent-type) type.

### `commandReceived/<command>` event

Emitted each specific bot command. Receives [CommandEvent](#commandevent-type) type. Example:

```javascript
bot.on('commandReceived/start', sendHelloMessage);
```

## Types

### `CommandEvent` type

```javascript
type CommandEvent = {
  update: Update,
  command: string,
  args?: string,
};
```

- `update` — [Update](https://core.telegram.org/bots/API#update)
- `command` — Command text. For example `/say` for message `/say Hey you!`
- `args` — Text after command. For example `Hey you!` for message `/say Hey you!`

## Native API methods support

- [x] `getUpdates`
- [x] `setWebhook`
- [x] `deleteWebhook`
- [x] `getWebhookInfo`
- [x] `getMe`
- [x] `sendMessage`
- [x] `forwardMessage`
- [x] `sendPhoto`
- [x] `sendAudio`
- [x] `sendDocument`
- [x] `sendSticker`
- [x] `sendVideo`
- [x] `sendVoice`
- [x] `sendLocation`
- [x] `sendVenue`
- [x] `sendContact`
- [x] `sendChatAction`
- [x] `getUserProfilePhotos`
- [x] `getFile`
- [x] `kickChatMember`
- [x] `leaveChat`
- [x] `unbanChatMember`
- [x] `getChat`
- [x] `getChatAdministrators`
- [x] `getChatMembersCount`
- [x] `getChatMember`
- [x] `answerCallbackQuery`
- [ ] `answerInlineQuery`
- [ ] `sendGame`
- [ ] `setGameScore`
- [ ] `getGameHighScores`
