#!/usr/bin/env python3
"""
Generate a rich set of charts from the mega patch-partial-perf benchmark outputs.

Reads:
  ../results/reducer.json   — 100 shapes × 6 scenarios, bytes + ms
  ../results/update.json    — N shapes × 6 scenarios, update ms

Writes PNGs next to the JSON files.

Usage:
  pip install -r requirements.txt
  python plot_patch_perf.py
"""

from __future__ import annotations

import json
import os
import sys
from collections import defaultdict
from pathlib import Path


def network_upload_ms(payload_bytes: float, bits_per_second: float) -> float:
    """Time to push JSON over the wire from byte size (8 bits/byte). Returns ms."""
    if bits_per_second <= 0:
        return 0.0
    return (payload_bytes * 8.0) / bits_per_second * 1000.0

SCRIPT_DIR = Path(__file__).resolve().parent
RESULTS_DIR = SCRIPT_DIR.parent / "results"


def load(name: str) -> dict | None:
    p = RESULTS_DIR / name
    if not p.is_file():
        return None
    return json.loads(p.read_text("utf-8"))


def main() -> int:
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("pip install matplotlib", file=sys.stderr)
        return 1

    reducer = load("reducer.json")
    update = load("update.json")

    if not reducer and not update:
        print("No results found. Run: pnpm test:patch-perf", file=sys.stderr)
        return 1

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # ── Reducer charts ─────────────────────────────────────────────────

    if reducer:
        rows = reducer["rows"]

        # 1. Savings % histogram (all rows)
        savings = [r["savingsPercent"] for r in rows]
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.hist(savings, bins=40, edgecolor="black", alpha=0.8)
        ax.set_xlabel("Payload size savings (%)")
        ax.set_ylabel("Count (collection × scenario cells)")
        ax.set_title(
            f"Distribution of payload size savings — {reducer['count']} collections × 6 scenarios"
        )
        ax.axvline(
            sum(savings) / len(savings),
            color="red",
            linestyle="--",
            label=f"Mean {sum(savings)/len(savings):.1f}%",
        )
        ax.legend()
        ax.grid(axis="y", alpha=0.3)
        fig.tight_layout()
        fig.savefig(RESULTS_DIR / "savings_histogram.png", dpi=150)
        plt.close(fig)

        # 2. Bytes by scenario (box plot)
        scenario_full: dict[str, list[int]] = defaultdict(list)
        scenario_partial: dict[str, list[int]] = defaultdict(list)
        for r in rows:
            scenario_full[r["scenario"]].append(r["fullBytes"])
            scenario_partial[r["scenario"]].append(r["partialBytes"])

        scenarios = sorted(scenario_full.keys())
        fig, ax = plt.subplots(figsize=(12, 6))
        x = range(len(scenarios))
        w = 0.35
        ax.bar(
            [i - w / 2 for i in x],
            [sum(scenario_full[s]) / len(scenario_full[s]) for s in scenarios],
            w,
            label="Full (mean bytes)",
        )
        ax.bar(
            [i + w / 2 for i in x],
            [sum(scenario_partial[s]) / len(scenario_partial[s]) for s in scenarios],
            w,
            label="Partial (mean bytes)",
        )
        ax.set_ylabel("JSON bytes (mean across collections)")
        ax.set_title("Mean payload size by edit scenario")
        ax.set_xticks(list(x))
        ax.set_xticklabels([s.replace("_", " ") for s in scenarios], rotation=20, ha="right")
        ax.legend()
        ax.grid(axis="y", alpha=0.3)
        fig.tight_layout()
        fig.savefig(RESULTS_DIR / "bytes_by_scenario.png", dpi=150)
        plt.close(fig)

        # 3. Savings % by scenario (box plot)
        scenario_savings: dict[str, list[float]] = defaultdict(list)
        for r in rows:
            scenario_savings[r["scenario"]].append(r["savingsPercent"])

        fig, ax = plt.subplots(figsize=(12, 6))
        bp = ax.boxplot(
            [scenario_savings[s] for s in scenarios],
            tick_labels=[s.replace("_", " ") for s in scenarios],
            patch_artist=True,
        )
        for patch in bp["boxes"]:
            patch.set_facecolor("#6fa8dc")
        ax.set_ylabel("Payload size savings (%)")
        ax.set_title("Savings distribution by edit scenario")
        ax.grid(axis="y", alpha=0.3)
        fig.tight_layout()
        fig.savefig(RESULTS_DIR / "savings_by_scenario.png", dpi=150)
        plt.close(fig)

        # 4. Scatter: field count vs savings %
        field_counts = [r["fieldCount"] for r in rows]
        fig, ax = plt.subplots(figsize=(10, 6))
        scatter = ax.scatter(field_counts, savings, c=savings, cmap="RdYlGn", alpha=0.6, s=12)
        ax.set_xlabel("FormState field count")
        ax.set_ylabel("Payload size savings (%)")
        ax.set_title("Savings vs document complexity (each dot = 1 collection × 1 scenario)")
        fig.colorbar(scatter, ax=ax, label="Savings %")
        ax.grid(alpha=0.3)
        fig.tight_layout()
        fig.savefig(RESULTS_DIR / "savings_vs_fields.png", dpi=150)
        plt.close(fig)

        # 5. Reducer CPU time by scenario
        scenario_full_ms: dict[str, list[float]] = defaultdict(list)
        scenario_partial_ms: dict[str, list[float]] = defaultdict(list)
        for r in rows:
            scenario_full_ms[r["scenario"]].append(r["fullMsMean"])
            scenario_partial_ms[r["scenario"]].append(r["partialMsMean"])

        fig, ax = plt.subplots(figsize=(12, 6))
        ax.bar(
            [i - w / 2 for i in x],
            [sum(scenario_full_ms[s]) / len(scenario_full_ms[s]) for s in scenarios],
            w,
            label="Full reducer (mean ms)",
        )
        ax.bar(
            [i + w / 2 for i in x],
            [sum(scenario_partial_ms[s]) / len(scenario_partial_ms[s]) for s in scenarios],
            w,
            label="Partial reducer (mean ms)",
        )
        ax.set_ylabel("Milliseconds (mean per call)")
        ax.set_title("Reducer CPU time by edit scenario")
        ax.set_xticks(list(x))
        ax.set_xticklabels([s.replace("_", " ") for s in scenarios], rotation=20, ha="right")
        ax.legend()
        ax.grid(axis="y", alpha=0.3)
        fig.tight_layout()
        fig.savefig(RESULTS_DIR / "reducer_time_by_scenario.png", dpi=150)
        plt.close(fig)

    # ── Update API charts ──────────────────────────────────────────────

    if update:
        urows = update["rows"]
        uscenarios = sorted(set(r["scenario"] for r in urows))
        ux = range(len(uscenarios))

        uscenario_full: dict[str, list[float]] = defaultdict(list)
        uscenario_partial: dict[str, list[float]] = defaultdict(list)
        for r in urows:
            uscenario_full[r["scenario"]].append(r["fullMsMean"])
            uscenario_partial[r["scenario"]].append(r["partialMsMean"])

        # 6. Update time by scenario (mean across collections)
        fig, ax = plt.subplots(figsize=(12, 6))
        w = 0.35
        ax.bar(
            [i - w / 2 for i in ux],
            [sum(uscenario_full[s]) / len(uscenario_full[s]) for s in uscenarios],
            w,
            label="Full document update (mean ms)",
        )
        ax.bar(
            [i + w / 2 for i in ux],
            [sum(uscenario_partial[s]) / len(uscenario_partial[s]) for s in uscenarios],
            w,
            label="Partial update (mean ms)",
        )
        ax.set_ylabel("Milliseconds (mean per call)")
        ax.set_title(
            f"payload.update() time by scenario — {update['collectionsUsed']} collections × {update['iterationsPerCell']} iterations"
        )
        ax.set_xticks(list(ux))
        ax.set_xticklabels([s.replace("_", " ") for s in uscenarios], rotation=20, ha="right")
        ax.legend()
        ax.grid(axis="y", alpha=0.3)
        fig.tight_layout()
        fig.savefig(RESULTS_DIR / "update_time_by_scenario.png", dpi=150)
        plt.close(fig)

        # 7. P50 / P95 comparison
        fig, axes = plt.subplots(1, 2, figsize=(16, 6), sharey=True)
        for idx, (metric, label) in enumerate(
            [("fullMsP50", "Full doc P50"), ("partialMsP50", "Partial P50")]
        ):
            vals_by_scenario: dict[str, list[float]] = defaultdict(list)
            for r in urows:
                vals_by_scenario[r["scenario"]].append(r[metric])
            bp = axes[idx].boxplot(
                [vals_by_scenario[s] for s in uscenarios],
                tick_labels=[s.replace("_", " ") for s in uscenarios],
                patch_artist=True,
            )
            color = "#e06666" if "Full" in label else "#6aa84f"
            for patch in bp["boxes"]:
                patch.set_facecolor(color)
            axes[idx].set_title(label)
            axes[idx].set_ylabel("ms (P50)" if idx == 0 else "")
            axes[idx].tick_params(axis="x", rotation=25)
            axes[idx].grid(axis="y", alpha=0.3)

        fig.suptitle("Update latency P50 distribution by scenario", fontsize=13)
        fig.tight_layout()
        fig.savefig(RESULTS_DIR / "update_p50_boxplot.png", dpi=150)
        plt.close(fig)

        # 8. Speed-up ratio per collection
        speedups_by_scenario: dict[str, list[float]] = defaultdict(list)
        for r in urows:
            if r["partialMsMean"] > 0:
                speedups_by_scenario[r["scenario"]].append(
                    r["fullMsMean"] / r["partialMsMean"]
                )

        fig, ax = plt.subplots(figsize=(12, 6))
        bp = ax.boxplot(
            [speedups_by_scenario[s] for s in uscenarios],
            tick_labels=[s.replace("_", " ") for s in uscenarios],
            patch_artist=True,
        )
        for patch in bp["boxes"]:
            patch.set_facecolor("#f6b26b")
        ax.axhline(1.0, color="gray", linestyle="--", alpha=0.5)
        ax.set_ylabel("Speed-up ratio (full / partial)")
        ax.set_title("Update speed-up ratio by scenario (>1 = partial is faster)")
        ax.grid(axis="y", alpha=0.3)
        fig.tight_layout()
        fig.savefig(RESULTS_DIR / "update_speedup_ratio.png", dpi=150)
        plt.close(fig)

        # 9. Measured JSON body size for payload.update() (full vs partial)
        if "fullPayloadBytesMean" not in urows[0]:
            pass
        else:
            uscenario_full_bytes: dict[str, list[float]] = defaultdict(list)
            uscenario_partial_bytes: dict[str, list[float]] = defaultdict(list)
            for r in urows:
                uscenario_full_bytes[r["scenario"]].append(r["fullPayloadBytesMean"])
                uscenario_partial_bytes[r["scenario"]].append(r["partialPayloadBytesMean"])

            fig, ax = plt.subplots(figsize=(12, 6))
            w = 0.35
            ax.bar(
                [i - w / 2 for i in ux],
                [sum(uscenario_full_bytes[s]) / len(uscenario_full_bytes[s]) for s in uscenarios],
                w,
                label="Full update body (mean UTF-8 bytes)",
            )
            ax.bar(
                [i + w / 2 for i in ux],
                [
                    sum(uscenario_partial_bytes[s]) / len(uscenario_partial_bytes[s])
                    for s in uscenarios
                ],
                w,
                label="Partial update body (mean UTF-8 bytes)",
            )
            ax.set_ylabel("Bytes (mean across collections)")
            ax.set_title(
                "Request body size for payload.update() — what actually gets saved per call"
            )
            ax.set_xticks(list(ux))
            ax.set_xticklabels([s.replace("_", " ") for s in uscenarios], rotation=20, ha="right")
            ax.legend()
            ax.grid(axis="y", alpha=0.3)
            fig.tight_layout()
            fig.savefig(RESULTS_DIR / "update_payload_bytes_by_scenario.png", dpi=150)
            plt.close(fig)

            # 10–11. Estimated end-to-end save time: real local update() + modeled upload
            # Partial PATCH wins here when bytes drop a lot (typical edits), even if DB ms is similar.
            bps = float(os.environ.get("PATCH_PERF_NETWORK_BPS", "10000000"))  # default 10 Mbps; 0 = DB only
            uscenario_full_b: dict[str, list[float]] = defaultdict(list)
            uscenario_partial_b: dict[str, list[float]] = defaultdict(list)
            for r in urows:
                uscenario_full_b[r["scenario"]].append(r["fullPayloadBytesMean"])
                uscenario_partial_b[r["scenario"]].append(r["partialPayloadBytesMean"])

            totals_full: list[float] = []
            totals_partial: list[float] = []
            speedups: list[float] = []
            labels: list[str] = []
            for s in uscenarios:
                mf = sum(uscenario_full[s]) / len(uscenario_full[s])
                mp = sum(uscenario_partial[s]) / len(uscenario_partial[s])
                bf = sum(uscenario_full_b[s]) / len(uscenario_full_b[s])
                bp = sum(uscenario_partial_b[s]) / len(uscenario_partial_b[s])
                nf = network_upload_ms(bf, bps)
                np_ = network_upload_ms(bp, bps)
                tf = mf + nf
                tp = mp + np_
                totals_full.append(tf)
                totals_partial.append(tp)
                speedups.append(tf / tp if tp > 0 else 1.0)
                labels.append(s.replace("_", " "))

            fig, ax = plt.subplots(figsize=(12, 6))
            w = 0.35
            x = list(range(len(uscenarios)))
            ax.bar([i - w / 2 for i in x], totals_full, w, label="Full save (est.)", color="#5b8fd8")
            ax.bar([i + w / 2 for i in x], totals_partial, w, label="Partial save (est.)", color="#6aa84f")
            ax.set_ylabel("Milliseconds (mean per save)")
            mbps = bps / 1_000_000
            upload_note = (
                f"upload at {mbps:.0f} Mbps — set PATCH_PERF_NETWORK_BPS to tune"
                if bps > 0
                else "PATCH_PERF_NETWORK_BPS=0 (DB time only, no upload model)"
            )
            ax.set_title(
                "Estimated save time: local payload.update() + modeled JSON upload\n"
                f"({upload_note})"
            )
            ax.set_xticks(x)
            ax.set_xticklabels(labels, rotation=20, ha="right")
            ax.legend()
            ax.grid(axis="y", alpha=0.3)
            fig.tight_layout()
            fig.savefig(RESULTS_DIR / "save_time_estimated_end_to_end.png", dpi=150)
            plt.close(fig)

            fig, ax = plt.subplots(figsize=(12, 5))
            colors = ["#cccccc" if s < 1.0 else "#6aa84f" for s in speedups]
            ax.bar(labels, speedups, color=colors, edgecolor="black", linewidth=0.5)
            ax.axhline(1.0, color="gray", linestyle="--", linewidth=1.2, label="Parity (1×)")
            ax.set_ylabel("How many × faster partial is (full ÷ partial)")
            ax.set_title(
                "Estimated save speed-up from partial PATCH\n(same model: DB time + upload from JSON size)"
            )
            ax.tick_params(axis="x", rotation=20)
            ax.legend()
            ax.grid(axis="y", alpha=0.3)
            fig.tight_layout()
            fig.savefig(RESULTS_DIR / "save_time_speedup_estimated.png", dpi=150)
            plt.close(fig)

    save_metrics = load("save_metrics.json")
    if save_metrics:
        h = save_metrics.get("headlines", {}).get("typicalEdits", {})
        print()
        print("=== Save metrics (see save_metrics.json) ===")
        print(
            f"  Typical edits (excl. all_fields): ~{h.get('meanPayloadSavingsPercent')}% "
            f"smaller update JSON body (avg across scenarios/collections)."
        )
        print(
            f"  Mean full/partial update() time ratio: {h.get('meanUpdateSpeedupRatio')} "
            f"(full ÷ partial; >1 means partial was faster in this harness)."
        )
        print("  Notes:", save_metrics.get("notes", []))
        print()

    print(f"Charts written to {RESULTS_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
