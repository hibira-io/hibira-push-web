# @hibira-io/push-web

Web push notifications for [Hibira Push](https://hibira.io). It is the web
client for the Beams-compatible push API: an MIT-licensed fork of the Pusher
Beams web SDK with the host made configurable, so code written for that SDK
keeps working after changing the import.

Works in browsers with standard Web Push: Chrome, Edge, Firefox, Opera and
Safari 16.4+ (the Beams SDK did not enable Safari).

## Install

```sh
npm install @hibira-io/push-web
```

Or load the script, which defines the global `HibiraPush`:

```html
<script src="https://cdn.jsdelivr.net/npm/@hibira-io/push-web@1/dist/push-web.min.js"></script>
```

## Service worker

Serve a `/service-worker.js` at your site root that loads ours:

```js
importScripts('https://cdn.jsdelivr.net/npm/@hibira-io/push-web@1/dist/service-worker.js');
// Only if your app is not on the default cluster:
// self.HibiraPush.endpoint = 'https://ws-tyo.hibira.io';
```

You can also copy `node_modules/@hibira-io/push-web/dist/service-worker.js`
into your site. To handle notifications yourself, set
`self.HibiraPush.onNotificationReceived` (same arguments as Beams'
`onNotificationReceived`).

## Use

```js
import { Client, TokenProvider } from '@hibira-io/push-web';

const push = new Client({
  instanceId: 'YOUR_INSTANCE_ID', // portal: app page → Push notifications
  // endpoint: 'https://ws.hibira.io', // the default
});

await push.start();
await push.addDeviceInterest('news');

// Authenticated users: your backend returns a user token
// (generateToken in the server SDKs).
await push.setUserId('alice', new TokenProvider({ url: '/push/user-token' }));
```

`endpoint` is the push API base URL shown on the app page in the portal.
`endpointOverride` is accepted as a synonym.

## Moving from @hikibi/push-web

Hikibi is now Hibira, and this package moved from `@hikibi/push-web` to
`@hibira-io/push-web`. The API is the same: change the import and the
`importScripts` URL. The global and the service-worker namespace are now
`HibiraPush`; `HikibiPush` still works as an alias, so existing service
workers that set `self.HikibiPush.endpoint` keep working. `@hikibi/push-web`
1.0.0 stays on npm (deprecated) and gets no new versions. The push API host
is still `https://ws.hibira.io`.

## Moving from the Beams web SDK

| Beams web SDK | @hibira-io/push-web |
|---|---|
| `import * as PusherPushNotifications from '@pusher/push-notifications-web'` | `import * as HibiraPush from '@hibira-io/push-web'` |
| `new PusherPushNotifications.Client({ instanceId })` | `new HibiraPush.Client({ instanceId })` |
| `importScripts('https://js.pusher.com/beams/service-worker.js')` | `importScripts('https://cdn.jsdelivr.net/npm/@hibira-io/push-web@1/dist/service-worker.js')` |
| `PusherPushNotifications.onNotificationReceived = …` in the service worker | `HibiraPush.onNotificationReceived = …` |

Everything else (`start`, interests, `setUserId`, `stop`, `clearAllState`,
`getRegistrationState` and its values) is unchanged. Browsers that were
registered with Beams register again on the first `start()`.

## License

MIT. Based on the Pusher Beams web SDK, Copyright (c) 2019 Pusher; see
LICENSE. Hibira is not affiliated with Pusher.
