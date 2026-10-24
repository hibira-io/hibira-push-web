// Runs the built SDK against mocked browser APIs and checks the requests it
// makes to the push API.
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';

const requests = [];
let subscription = null;
const pushManager = {
  getSubscription: async () => subscription,
  subscribe: async ({ applicationServerKey }) => {
    assert.ok(applicationServerKey instanceof Uint8Array);
    subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/x', keys: { p256dh: 'p', auth: 'a' }, unsubscribe: async () => {} };
    return subscription;
  },
};
const registration = { scope: 'https://shop.example/', pushManager };

globalThis.window = globalThis;
window.isSecureContext = true;
window.PushManager = class {};
window.Notification = { permission: 'granted' };
window.location = { href: 'https://shop.example/' };
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { userAgent: 'Mozilla/5.0 Safari/605.1.15', vendor: 'Apple Computer, Inc.', serviceWorker: { ready: Promise.resolve(registration), register() {} } },
});
globalThis.fetch = async (url, opts = {}) => {
  requests.push({ url: String(url), method: opts.method || 'GET', body: opts.body ? JSON.parse(opts.body) : null, headers: opts.headers || {} });
  const path = new URL(url, 'https://shop.example').pathname;
  let body = {};
  if (path.endsWith('/web-vapid-public-key')) body = { vapidPublicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U' };
  if (path.endsWith('/devices/web')) body = { id: 'web-1234' };
  return { ok: true, status: 200, json: async () => body };
};

const { Client, TokenProvider, DEFAULT_ENDPOINT } = await import('../dist/push-web.js');

// Each test uses its own instance ID, so its IndexedDB state starts empty.
beforeEach(() => {
  requests.length = 0;
  subscription = null;
});

test('defaults to the hosted push API', () => {
  const c = new Client({ instanceId: 'instance-0', serviceWorkerRegistration: registration });
  assert.equal(DEFAULT_ENDPOINT, 'https://ws.hibira.io');
  assert.equal(c._baseURL, 'https://ws.hibira.io');
});

test('endpoint and endpointOverride set the host', () => {
  assert.equal(new Client({ instanceId: 'i', endpoint: 'https://ws-tyo.hibira.io/', serviceWorkerRegistration: registration })._baseURL, 'https://ws-tyo.hibira.io');
  assert.equal(new Client({ instanceId: 'i', endpointOverride: 'http://localhost:6001', serviceWorkerRegistration: registration })._baseURL, 'http://localhost:6001');
  assert.throws(() => new Client({ instanceId: 'i', endpoint: 'ws.hibira.io' }), /http\(s\) URL/);
});

test('start registers the browser, then interests and user go to the endpoint', async () => {
  const c = new Client({ instanceId: 'instance-1', endpoint: 'https://push.example', serviceWorkerRegistration: registration });
  await c.start();
  assert.equal(await c.getDeviceId(), 'web-1234');
  assert.deepEqual(requests.map((r) => `${r.method} ${r.url}`), [
    'GET https://push.example/device_api/v1/instances/instance-1/web-vapid-public-key',
    'POST https://push.example/device_api/v1/instances/instance-1/devices/web',
  ]);
  const token = JSON.parse(atob(requests[1].body.token));
  assert.equal(token.endpoint, 'https://fcm.googleapis.com/fcm/send/x');
  assert.match(requests[1].body.metadata.sdkVersion, /^\d+\.\d+\.\d+/);

  requests.length = 0;
  await c.addDeviceInterest('hello');
  const tp = new TokenProvider({ url: 'https://shop.example/pusher/beams-auth' });
  tp.fetchToken = async () => ({ token: 'jwt' });
  await c.setUserId('alice', tp);
  assert.deepEqual(requests.map((r) => `${r.method} ${r.url}`), [
    'POST https://push.example/device_api/v1/instances/instance-1/devices/web/web-1234/interests/hello',
    'PUT https://push.example/device_api/v1/instances/instance-1/devices/web/web-1234/user',
  ]);
  assert.equal(requests[1].headers.Authorization, 'Bearer jwt');
  assert.equal(await c.getRegistrationState(), 'PERMISSION_GRANTED_REGISTERED_WITH_BEAMS');
});

test('the CDN script and service worker define HibiraPush and the old HikibiPush alias', async () => {
  const { readFileSync } = await import('node:fs');
  const vm = await import('node:vm');
  const page = { window: {}, navigator: {} };
  vm.runInNewContext(readFileSync(new URL('../dist/push-web.min.js', import.meta.url), 'utf8'), page);
  assert.equal(typeof page.HibiraPush.Client, 'function');
  assert.equal(page.HikibiPush, page.HibiraPush);

  const worker = { addEventListener() {} };
  worker.self = worker;
  vm.runInNewContext(readFileSync(new URL('../dist/service-worker.js', import.meta.url), 'utf8'), worker);
  assert.equal(worker.HibiraPush.endpoint, 'https://ws.hibira.io');
  assert.equal(worker.HikibiPush, worker.HibiraPush);
});
