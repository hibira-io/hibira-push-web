# Changelog

## 1.1.0 - 2026-10-24

Renamed for the Hikibi → Hibira rebrand. No API changes.

- Published as `@hibira-io/push-web` (was `@hikibi/push-web`); the repository is now
  github.com/hibira-io/hibira-push-web.
- Global and service-worker namespace `HibiraPush`; `HikibiPush` stays as an alias.
- The default endpoint is still `https://ws.hikibi.io`.

## 1.0.0 - 2026-10-22

First release: a fork of `@pusher/push-notifications-web` 1.1.0 (MIT) for Hikibi Push.

- `endpoint` option, default `https://ws.hikibi.io` (`endpointOverride` still works).
- Global and service-worker namespace `self.HikibiPush`.
- Safari 16.4+ enabled through feature detection.
