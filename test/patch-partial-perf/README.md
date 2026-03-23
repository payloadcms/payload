# PATCH partial-save performance showcase

> **Temporary / exploratory only.** This folder is **not** part of CI and exists to generate evidence (JSON + charts) that partial saves send less data and—when you include a simple upload model—look faster end-to-end. **Delete the whole `test/patch-partial-perf/` tree** (and the `test:patch-perf` script in root `package.json`) when you no longer need the demo.

**What to show as “proof”:**

1. **`results/save_metrics.json`** — measured JSON size savings + local `payload.update()` timing.
2. **`save_time_estimated_end_to_end.png`** + **`save_time_speedup_estimated.png`** — same data + modeled upload (`PATCH_PERF_NETWORK_BPS`); use for “faster save” slides.
3. Ignore **`reducer_time_by_scenario.png`** for product claims (CPU-only; partial can lose there while still winning on bytes).

Opt-in benchmarks comparing **full document** payloads vs **partial PATCH** (modified fields only). Results go under `results/` (gitignored); charts via the Python script.

## 1. Run benchmarks

From the repository root:

```bash
pnpm test:patch-perf
```

This **deletes `results/` first**, then runs Vitest. If `PATCH_PERF` is unset, this suite is skipped so normal `pnpm test:int` is unchanged.

## 2. Metrics that reflect “saving data”

After a run, open:

| File                            | What it answers                                                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`results/save_metrics.json`** | **Headline numbers**: mean update JSON size (full vs partial), mean `payload.update()` time ratio by scenario, and a **typical edits** rollup (excludes `all_fields`, where partial ≡ full). |
| **`results/update.json`**       | Per collection × scenario: timing samples + **measured UTF-8 bytes** of `JSON.stringify(update data)` (proxy for wire / request body size).                                                  |
| **`results/reducer.json`**      | Client-side reducer: serialized size of full vs `reduceModifiedFieldsToValues` output (admin form simulation).                                                                               |

**Important:** `save_metrics.json` **update()** timings are **in-process** against the integration test database (often SQLite), not browser HTTP. Payload byte savings are the most portable story for “we send less on save”; local ms will vary by DB and hardware.

The test run also **logs one line** to stdout with the typical-edits headline (payload % saved and full/partial time ratio).

## 3. Plot charts

```bash
pip install -r test/patch-partial-perf/scripts/requirements.txt
python test/patch-partial-perf/scripts/plot_patch_perf.py
```

The script prints the same headline summary when `save_metrics.json` exists.

**Charts that show “partial save is faster” (recommended for slides):**

- **`save_time_estimated_end_to_end.png`** — **Estimated** total time per save: **measured** local `payload.update()` **plus** a **modeled** upload delay from JSON body size (partial sends far fewer bytes, so this usually beats full save on typical bandwidth).
- **`save_time_speedup_estimated.png`** — Same model as a **full ÷ partial** ratio (>1 = partial faster).

Model tuning: when plotting, set **`PATCH_PERF_NETWORK_BPS`** (bits per second) to match the story, e.g. `2500000` for ~2.5 Mbps. Use `0` to disable the upload term (then the chart reflects **DB-only** time, which is often a wash).

**Other outputs:**

- **`update_payload_bytes_by_scenario.png`** — Measured JSON body size for `payload.update()` (ground truth for bytes).
- **`update_time_by_scenario.png`** / **`update_speedup_ratio.png`** — Local `payload.update()` timing only (no network; can look flat).
- **`reducer_time_by_scenario.png`** — Client reducer CPU only; **partial can legitimately lose here** while still winning on bytes and end-to-end saves — do not use this chart alone to judge the feature.
- **`bytes_by_scenario.png`**, **`savings_*.png`** — Reducer / admin serialized size vs partial output.

## 4. Environment tuning

See `shared.ts`: `PERF_COLLECTIONS`, `PERF_UPDATE_COLLECTIONS`, `PERF_UPDATE_ITERS`, `PERF_REDUCER_ITERS`.

Regenerate types after config changes:

```bash
pnpm run dev:generate-types patch-partial-perf
```

The `results/` directory is gitignored.
