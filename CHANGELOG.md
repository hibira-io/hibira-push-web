# Changelog

## 1.0.0 - 2026-10-22

First release: a fork of `@pusher/push-notifications-web` 1.1.0 (MIT) for Hikibi Push.

- `endpoint` option, default `https://ws.hikibi.io` (`endpointOverride` still works).
- Global and service-worker namespace `self.HikibiPush`.
- Safari 16.4+ enabled through feature detection.
