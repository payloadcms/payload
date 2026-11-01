/** Every page size the widget's CSS tiers can produce. Keep in sync with `--activity-page-size`. */
export const PAGE_SIZES = [4, 5, 6, 7, 8] as const
/** Documents are fetched in fixed batches that fill the largest page. */
export const DOCUMENTS_BATCH_SIZE = 8
