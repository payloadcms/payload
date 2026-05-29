import type { FuzzyMatchResult } from '../../utilities/fuzzyMatch.js'
import type { CommandPaletteAction, CommandPaletteGroup } from './types.js'

import { fuzzyMatch } from '../../utilities/fuzzyMatch.js'

/**
 * Fuzzy-filters each group's actions against the query, ranks survivors by score
 * (descending), and removes groups left with no matches. An empty query returns
 * the groups unchanged.
 */
export function filterActions(groups: CommandPaletteGroup[], query: string): CommandPaletteGroup[] {
  if (!query) {
    return groups
  }

  return groups.reduce<CommandPaletteGroup[]>((filtered, group) => {
    const actions = group.actions
      .map((action) => ({ action, match: fuzzyMatch(query, action.label) }))
      .filter(
        (scored): scored is { action: CommandPaletteAction; match: FuzzyMatchResult } =>
          scored.match !== null,
      )
      .sort((a, b) => b.match.score - a.match.score)
      .map((scored) => scored.action)

    if (actions.length > 0) {
      filtered.push({ ...group, actions })
    }

    return filtered
  }, [])
}
