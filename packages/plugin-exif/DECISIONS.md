# Decisions — `@payloadcms/plugin-exif`

## Task 1 spike: EXIF parser selection

**Decision: use `exifr` (v7.1.3) as the single EXIF-parsing dependency.**

`exifr` is a pure-JS, zero-native-binary library that parses EXIF directly from an
in-memory `Buffer` (`exifr.parse(buffer, { gps: true })`) and returns a flat object of
tags. It resolves GPS to top-level `latitude` / `longitude` numbers for free, which is
exactly what the plugin needs to map into the stored `exif` group. Because the plugin
already receives the uploaded file as a `Buffer`, a buffer-first parser with no extra
decode step (no `sharp` round-trip) is the simplest possible dependency.

### What was verified (probe against `test/uploads/*` + synthesized fixtures)

Probe: `scratchpad/exif-probe.mjs`, `exifr@7.1.3`, Node 24.15.0.

| Input                                                                                                    | Result                                                                                                                          |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `ios-image.jpeg` (real iPhone photo)                                                                     | Full EXIF: `Make: 'Apple'`, `Model: 'iPhone 13 Pro'`, `DateTimeOriginal`, `latitude: 43.1035`, `longitude: -85.616`             |
| **Synthesized JPEG** (`sharp(...).withMetadata({ exif: { IFD0: { Make: 'TestCam', Model: 'X100' } } })`) | Round-trips `Make: 'TestCam'`, `Model: 'X100'` — **definitive proof exifr reads embedded EXIF, not just that it doesn't crash** |
| `image.jpg`                                                                                              | Partial EXIF (`XResolution`, `Software`, …); no camera/GPS — parsed without error                                               |
| `image.png`, `test-image.png`                                                                            | PNG chunk metadata returned (`ImageWidth`, `ColorType`, …) — no crash                                                           |
| `test-image.tiff`                                                                                        | TIFF tags returned (`ImageWidth`, `Compression`, …) — no crash                                                                  |
| `2mb.jpg`, `test-image.jpg` (EXIF-stripped)                                                              | `null` — no crash (expected "stripped" case)                                                                                    |
| `non-animated.webp`                                                                                      | Throws `Error: Unknown file format` (caught) — WebP is not a target format                                                      |

Formats verified directly: **JPEG (real + synthetic), TIFF, PNG.** Stripped JPEGs correctly
return `null` without throwing.

### HEIC status

HEIC could not be synthesized or sampled locally: the workspace `sharp@0.32.6` build has no
HEVC encoder (`heifsave: Unsupported compression`), and no `.heic` fixture is committed.
`exifr` ships a dedicated HEIC/ISOBMFF parser and documents HEIC as a first-class supported
format — when handed an ISOBMFF-family buffer it enters that parser (it returned a structured
`errors` array rather than "Unknown file format" for an AVIF probe), so HEIC support is
present in the library but **unverified in this environment**. This should be confirmed with a
real `.heic` fixture when one is added to the test suite.

### Rationale summary

- **Pure JS, no native deps** — nothing to compile; works anywhere Payload runs.
- **Buffer-first** — parses the upload buffer directly; no `sharp` decode round-trip.
- **GPS convenience** — emits top-level `latitude`/`longitude` numbers.
- **Broad format coverage** — JPEG/TIFF/PNG verified; HEIC documented.
- **Single dependency** — simplest footprint vs. the two-package fallback.

### Fallback (only if HEIC proves unreliable in production)

`sharp.metadata().exif` yields a raw EXIF `Buffer`, decoded with `exif-reader`. `sharp@0.32.6`
is already in the workspace; `exif-reader` would be the only new dependency. This is strictly
more moving parts (native `sharp` + a second parser, plus a decode step). If adopted, **only
`src/extractExif.ts` would change** — the rest of the plugin (field mapping, hook wiring)
stays identical. Not chosen now given the strong JPEG/TIFF/PNG results and exifr's documented
HEIC support.
