# Changelog

Every release is tagged and published from CI with npm provenance. Versions
follow semver; the embed protocol has its own version in the `ready` event.

## 0.2.0 - 2026-11-24

Needs `@snappedcut/sdk` 0.2.0. New tools:

- `list_operations` — every operation, its parameters, and the presets.
- `upload_asset` — upload a local file once, use it by id.
- `render_design`, `batch_render`, `compile_design` — declarative designs,
  several outputs per job, an `idempotencyKey` so a retry is not charged twice.
- `run_tool` — a free micro-tool over local files or asset ids.
- `download_output` — save one output of a finished job.
- `get_usage` — renders and credits, grouped.
- `list_storage_destinations`, `test_storage_destination`.
- `list_webhooks`, `webhook_deliveries`.

## 0.1.0 - 2026-11-24

First publish.

