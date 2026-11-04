# Versioned consent contracts

`schemas/*.schema.json` are the source of truth (JSON Schema draft 7). Run `npm run schema:generate` at the repository root to regenerate TypeScript declarations and Zod validators. Example documents are validated by both engines in `npm test`.

- `BannerConfigSchema` and `ConsentEventSchema`: strict producer/ingestion validators, including nested object fields. Unknown fields are rejected.
- `BannerConfigReader` and `ConsentEventReader`: readers ignore unknown object fields for forward compatibility.
- Both documents have `schemaVersion: 1`. Changes within v1 may only add optional fields. Removing/renaming fields, changing meanings, or adding required fields needs a new major schema version and a separately supported reader/ingestion path.
- UUIDv7 `eventId` identifies a single decision across retries. Deduplicate by `(projectId, eventId)`; conflicting payloads must not overwrite an existing event.
- `configHash` is lowercase SHA-256 over UTF-8 canonical JSON, excluding the `configHash` field itself. Canonicalization recursively sorts object keys, retains array order, and uses JSON scalar serialization. See `src/hash.js`. Store the full immutable document under its hash. A hash identifies content; it is not proof a person read it or a cryptographic signature.
- `receivedAt` is server metadata, outside the submitted event schema. Neither document includes raw IP addresses or browsing URLs. The banner may include a static privacy-policy URL.
- Region rules use ISO country codes and a `*` fallback. The core chooses an exact country match before fallback. Country resolution is supplied by the host/edge, not an SDK IP lookup.

Local routes: `GET /api/v1/config/:projectId` and `POST /api/v1/events`. Existing unversioned demo routes remain compatible. The edge ingestion route accepts v1 events and looks up the immutable R2 config by hash; authorization metadata (`allowedOrigins`, `domainVerified`) remains part of the existing delivery envelope. Deploy the SDK's loader, core, blocking, v1 adapter and lazy UI modules together. The edge resources remain undeployed scaffolds.

When verifying a hash, use the original full document before a tolerant reader strips unknown fields. Script match rules compare literal `src`/`data-src` attribute values using exact or prefix matching; cookie patterns are descriptive catalog entries, not a claim that the core deletes vendor cookies.
