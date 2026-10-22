/* eslint-env serviceworker */
import doRequest from './do-request';
import DeviceStateStore from './device-state-store';

// Set self.HikibiPush.endpoint after importing this script when the app is
// not on Hikibi's default cluster (it is only used to report deliveries and
// opens).
self.HikibiPush = {
  endpoint: 'https://ws.hikibi.io',
  onNotificationReceived: null,

  _endpoint: () => self.HikibiPush.endpoint.replace(/\/+$/, ''),

  _getVisibleClient: () =>
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then(clients => clients.find(c => c.visibilityState === 'visible')),

  _hasVisibleClient: () =>
    self.HikibiPush._getVisibleClient().then(
      client => client !== undefined
    ),

  _getFocusedClient: () =>
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then(clients => clients.find(c => c.focused === true)),

  _hasFocusedClient: () =>
    self.HikibiPush._getFocusedClient().then(
      client => client !== undefined
    ),

  reportEvent: async ({ eventType, pusherMetadata }) => {
    const {
      instanceId,
      publishId,
      hasDisplayableContent,
      hasData,
    } = pusherMetadata;
    if (!instanceId || !publishId) {
      // Can't report this notification, fail silently.
      return;
    }

    const deviceStateStore = new DeviceStateStore(instanceId);
    await deviceStateStore.connect();

    const deviceId = await deviceStateStore.getDeviceId();
    const userId = (await deviceStateStore.getUserId()) || null;

    const appInBackground = !(await self.HikibiPush._hasVisibleClient());

    const path = `${self.HikibiPush._endpoint(
      instanceId
    )}/reporting_api/v2/instances/${instanceId}/events`;

    const options = {
      method: 'POST',
      path,
      body: {
        publishId,
        event: eventType,
        deviceId,
        userId,
        timestampSecs: Math.floor(Date.now() / 1000),
        appInBackground,
        hasDisplayableContent,
        hasData,
      },
    };

    try {
      await doRequest(options);
    } catch (_) {
      // Reporting is best effort, so we do nothing.
    }
  },
};

self.addEventListener('push', e => {
  let payload;
  try {
    payload = e.data.json();
  } catch (_) {
    return; // Not a Hikibi Push notification
  }

  if (!payload.data || !payload.data.pusher) {
    return; // Not a Hikibi Push notification
  }

  // Report analytics event, best effort
  self.HikibiPush.reportEvent({
    eventType: 'delivery',
    pusherMetadata: payload.data.pusher,
  });

  const customerPayload = { ...payload };
  const customerData = {};
  Object.keys(customerPayload.data || {}).forEach(key => {
    if (key !== 'pusher') {
      customerData[key] = customerPayload.data[key];
    }
  });
  customerPayload.data = customerData;

  const pusherMetadata = payload.data.pusher;

  const handleNotification = async payloadFromCallback => {
    const hideNotificationIfSiteHasFocus =
      payloadFromCallback.notification.hide_notification_if_site_has_focus ===
      true;
    if (
      hideNotificationIfSiteHasFocus &&
      (await self.HikibiPush._hasFocusedClient())
    ) {
      return;
    }

    const title = payloadFromCallback.notification.title || '';
    const body = payloadFromCallback.notification.body || '';
    const icon = payloadFromCallback.notification.icon;

    const options = {
      body,
      icon,
      data: {
        pusher: {
          customerPayload: payloadFromCallback,
          pusherMetadata,
        },
      },
    };

    return self.registration.showNotification(title, options);
  };

  if (self.HikibiPush.onNotificationReceived) {
    self.HikibiPush.onNotificationReceived({
      payload: customerPayload,
      pushEvent: e,
      handleNotification,
    });
  } else {
    e.waitUntil(handleNotification(customerPayload));
  }
});

self.addEventListener('notificationclick', e => {
  const { pusher } = e.notification.data;

  const isHikibiNotification = pusher !== undefined;
  if (isHikibiNotification) {
    // Report analytics event, best effort
    self.HikibiPush.reportEvent({
      eventType: 'open',
      pusherMetadata: pusher.pusherMetadata,
    });

    if (pusher.customerPayload.notification.deep_link) {
      e.waitUntil(
        clients.openWindow(pusher.customerPayload.notification.deep_link)
      );
    }
    e.notification.close();
  }
});
