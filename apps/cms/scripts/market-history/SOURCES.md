# Market price history (Research tab)

Ten years of prices for the VgemsAI app's Research tab, from open sources, imported once with
`deploy/import-market-history.sh` (README: "Market prices"). From then on awoz-api adds each day's
price from API Ninjas.

| File | Material | What | Source | Licence |
| --- | --- | --- | --- | --- |
| `gold.csv` | Gold, USD/troy oz | Monthly average, dated the 15th, Oct 2016 – Sep 2026 | World Bank Commodity Price Data (The Pink Sheet), October 2, 2026: "Gold, spot average of daily rates" (London afternoon fixing before June 2025) | CC BY 4.0 |
| `silver.csv` | Silver, USD/troy oz | Monthly average, as above | World Bank Pink Sheet: "Silver (UK), 99.9% refined, London afternoon fixing" | CC BY 4.0 |
| `platinum.csv` | Platinum, USD/troy oz | Monthly average, as above | World Bank Pink Sheet: "Platinum, 99.95% minimum purity, spot average of daily rates" (London afternoon fixing before June 2025) | CC BY 4.0 |
| `copper.csv` | Copper, USD/lb | Monthly average, as above, converted from USD per metric ton (÷ 2204.62) | World Bank Pink Sheet: "Copper (LME), grade A, minimum 99.9935% purity, cathodes and wire bar shapes, settlement price" | CC BY 4.0 |
| `oil.csv` | Brent crude, USD/bbl | Daily spot price, Oct 3, 2016 – Oct 27, 2026 | U.S. Energy Information Administration, "Europe Brent Spot Price FOB" (via datasets/oil-prices on GitHub) | Public domain |

Palladium isn't in the World Bank's prices, and no openly licensed source was found, so it has no
history here: its chart starts with API Ninjas' prices. To add one, put a `palladium.csv` with the
same columns here (`source` is one of `world-bank`, `eia` or `manual`) and import again.

**Attribution:** the World Bank's data is licensed CC BY 4.0, so the app credits it on the Research
tab ("Historical prices: World Bank, U.S. EIA").

These are monthly averages, while API Ninjas' are daily futures prices (COMEX/NYMEX, ICE for Brent),
so the two can differ a little where they meet; copper most of all, as the World Bank's is the
London (LME) price. Daily London fixing prices (LBMA) aren't used: they need a licence from the LBMA
for use in an app.
