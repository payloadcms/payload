/**
 * Converts a string into a URL-safe slug, preserving non-Latin scripts.
 *
 * Contract, which `generateSlug` and `computePaths` depend on:
 * - `null`/`undefined` in → `undefined` out.
 * - Anything that cannot yield a usable slug → `''` (never a string with no
 *   visible letter or number), so the caller's `hasValue` check works.
 * - The output is a fixed point: `slugify(slugify(x)) === slugify(x)`.
 *   Autosave re-slugifies the stored slug on every tick; a non-fixed-point
 *   would rewrite slugs behind the editor's back.
 * - Canonically equivalent inputs produce byte-identical output, and the
 *   output is itself NFKC-normalized, so exact-string uniqueness checks and
 *   normalizing downstream layers (databases, routers, CDNs) agree on
 *   which slugs are the same.
 *
 * Scripts are preserved, never transliterated (`正念餅乾` stays `正念餅乾`).
 * Use the field-level `slugify` override or `hierarchy.slugify` for
 * transliteration. Lowercasing is locale-independent by design: the same
 * title must produce the same slug on every machine.
 *
 * Only ES2018 regex features are used. No lookbehind — Safari < 16.4 fails
 * at parse time on lookbehind, and this ships in the browser admin bundle
 * (see the same decision in `wordBoundariesRegex.ts`).
 */
export const slugify = (val?: string): string | undefined => {
  if (val == null) {
    return undefined
  }

  const result = val
    // Fold compatibility forms first (full-width ＡＢＣ → abc, ㍿ → 株式会社),
    // and equalize NFC/NFD input so the same visible title always slugifies
    // identically regardless of the platform that typed it.
    .normalize('NFKC')
    .toLowerCase()
    // Whitespace and anything Unicode classifies as a dash become hyphens.
    // \p{Dash}, not \p{Dash_Punctuation}: the minus sign U+2212 and swung dash
    // U+2053 are dashes but not Pd, and deleting them would join the two sides
    // (`a−b` → `ab`) — a silent collision with a real `ab`. U+2043 (hyphen
    // bullet) is dash-shaped but in neither set, so it is added explicitly.
    .replace(/[\s\p{Dash}\u2043]+/gu, '-')
    // Drop everything that isn't a letter, combining mark, number, underscore,
    // or hyphen. The trailing \p{M}* is load-bearing: it deletes combining marks
    // together with the character they were attached to, so `a!́b` → `ab`
    // rather than the orphaned mark re-attaching to the `a`.
    .replace(/[^\p{L}\p{M}\p{N}_-]+\p{M}*/gu, '')
    // Then the invisible characters the pass above keeps because they are marks
    // (VS16, CGJ, the Mongolian and ideographic variation selectors) or even
    // letters (the Hangul fillers U+115F/U+1160/U+3164/U+FFA0). Left in, they
    // produce slugs that compare unequal without reliably looking different, and
    // a filler alone would satisfy the letter-or-number guard below as an
    // invisible slug. The variation selectors are the deliberate trade-off here:
    // they do change rendering, so stripping them merges glyph variants of the
    // same character (辻 U+8FBB with and without U+E0100) into one slug. A URL
    // is the wrong place to carry a distinction a reader cannot see or type.
    // This must run AFTER the pass above, and needs the same trailing \p{M}*:
    // deleting an invisible would otherwise expose its combining marks to the
    // preceding character, so `a<RLO>́b` would compose to `áb` and collide with
    // a genuine `áb`. Removing the marks along with what they followed gives `ab`.
    .replace(/\p{Default_Ignorable_Code_Point}+\p{M}*/gu, '')
    // Strip any remaining mark run that doesn't follow a letter or another mark
    // (i.e. at the start, or after a digit/underscore/hyphen). Written as a
    // capture instead of a lookbehind for Safari < 16.4, matching the approach
    // in wordBoundariesRegex.ts.
    .replace(/(^|[^\p{L}\p{M}])\p{M}+/gu, '$1')
    // Re-normalize, and only here. Two things de-normalize the string above:
    // lowercasing (NFKC has no composed form for H̱, so lowercase leaves
    // `h + U+0331` instead of the canonical single code point ẖ), and the
    // deletions themselves (removing the `!` from `ᄀ!ᅡ` leaves adjacent jamo
    // that NFKC composes into 가). Normalizing any earlier misses the second
    // case and the output stops being a fixed point.
    .normalize('NFKC')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  // A slug must contain at least one visible letter or number. Without this,
  // input like `-_-` would survive as a non-empty string, pass the caller's
  // hasValue check, and suppress the numeric fallback.
  return /[\p{L}\p{N}]/u.test(result) ? result : ''
}
