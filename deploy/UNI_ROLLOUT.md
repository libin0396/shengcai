# Uni H5 release preparation

This document is a rollout plan. Do not apply it until the reviewed, attested release is ready.

- Import only the app's approved source and assets with `python3 deploy/import_uni_source.py <local-uni-app-path>`. It excludes local databases, credentials, feed snapshots, article extracts and the materials library. The empty bundled feed loads the server's read-only `/api/feed` at runtime.
- CI must pass the existing React/backend/deployer tests first, then build `uni-app`, replace only `dist/client`, run the uni release and CSP checks, and package/attest as before. Preserve the persistent data symlink and existing server.
- Add the following systemd drop-in for `ainpe.service` only after the new release and writable storage are staged. The directory must be an actual non-symlink directory owned by `ainpe:ainpe`, mode `0700`; do not use the static directory or overwrite existing data.

```ini
[Service]
Environment=AINPE_RESERVATION_DB=/var/lib/ainpe/reservations/reservations.sqlite
Environment=AINPE_PUBLIC_ORIGIN=https://ainpe.aisen.xin
ReadWritePaths=/var/lib/ainpe/reservations
LimitFSIZE=64M
```

- Confirm unit syntax, daemon-reload, stage a candidate and exercise health/API under production request headers and the site's actual CSP. Confirm `/api/health` names the expected commit, the homepage loads, the article feed is populated, games work, QR image is intact, reservations deduplicate and reject cross-origin requests, and previous URLs redirect correctly. Use isolated test data before release; after release prefer read-only checks and do not delete real reservation records. Monitor SQLite database and WAL size with warning thresholds below 64 MiB and alert if writes fail; the limit is per file, not a storage quota.
- The release poller accepts only attested artifacts for the current main SHA and automatically switches `current`. An ad-hoc symlink change is overwritten by the next poll if main still points at a different valid release.
- For durable rollback, publish a reverting commit on main and wait for its attested artifact; preserve the old release and persistent data. If immediate emergency recovery is needed, use the existing controlled rollback mechanism and coordinate the deployment timer so it does not immediately reactivate the faulty main. Remove the reservation drop-in and restart only if the rollback version cannot support it; never delete reservation data.
- Server-side daily feed synchronization remains disabled until independently authorized and configured; this release does not enable it.
