# @hikibi/push-web

Web push notifications for [Hikibi Push](https://hikibi.io). It is the web
client for the Beams-compatible push API: an MIT-licensed fork of the Pusher
Beams web SDK with the host made configurable, so code written for that SDK
keeps working after changing the import.

Works in browsers with standard Web Push: Chrome, Edge, Firefox, Opera and
Safari 16.4+ (the Beams SDK did not enable Safari).

## Install

```sh
npm install @hikibi/push-web
```

Or load the script, which defines the global `HikibiPush`:

```html
<script src="https://cdn.jsdelivr.net/npm/@hikibi/push-web@1/dist/push-web.min.js"></script>
```

## Service worker

Serve a `/service-worker.js` at your site root that loads ours:

```js
importScripts('https://cdn.jsdelivr.net/npm/@hikibi/push-web@1/dist/service-worker.js');
// Only if your app is not on the default cluster:
// self.HikibiPush.endpoint = 'https://ws-tyo.hikibi.io';
```

You can also copy `node_modules/@hikibi/push-web/dist/service-worker.js`
into your site. To handle notifications yourself, set
`self.HikibiPush.onNotificationReceived` (same arguments as Beams'
`onNotificationReceived`).

## Use

```js
import { Client, TokenProvider } from '@hikibi/push-web';

const push = new Client({
  instanceId: 'YOUR_INSTANCE_ID', // portal: app page → Push notifications
  // endpoint: 'https://ws.hikibi.io', // the default
});

await push.start();
await push.addDeviceInterest('news');

// Authenticated users: your backend returns a user token
// (generateToken in the server SDKs).
await push.setUserId('alice', new TokenProvider({ url: '/push/user-token' }));
```

`endpoint` is the push API base URL shown on the app page in the portal.
`endpointOverride` is accepted as a synonym.

## Moving from the Beams web SDK

| Beams web SDK | @hikibi/push-web |
|---|---|
| `import * as PusherPushNotifications from '@pusher/push-notifications-web'` | `import * as HikibiPush from '@hikibi/push-web'` |
| `new PusherPushNotifications.Client({ instanceId })` | `new HikibiPush.Client({ instanceId })` |
| `importScripts('https://js.pusher.com/beams/service-worker.js')` | `importScripts('https://cdn.jsdelivr.net/npm/@hikibi/push-web@1/dist/service-worker.js')` |
| `PusherPushNotifications.onNotificationReceived = …` in the service worker | `HikibiPush.onNotificationReceived = …` |

Everything else (`start`, interests, `setUserId`, `stop`, `clearAllState`,
`getRegistrationState` and its values) is unchanged. Browsers that were
registered with Beams register again on the first `start()`.

## License

MIT. Based on the Pusher Beams web SDK, Copyright (c) 2019 Pusher; see
LICENSE. Hikibi is not affiliated with Pusher.
