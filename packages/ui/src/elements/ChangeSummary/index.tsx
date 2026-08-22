'use client'

import type React from 'react'

import { getTranslation } from '@payloadcms/translations'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'change-summary'

/** The least a change has to say about itself to be counted here. */
export type SummarizableChange = {
  /** Absent for a global. */
  collectionSlug?: string
  globalSlug?: string
  operation?: 'create' | 'delete' | 'update'
}

/** Beyond this the sentence stops being readable, and the rest is rolled into a count. */
const MAX_NAMED_COLLECTIONS = 3

/**
 * What a set of branch changes amounts to, in one sentence.
 *
 * "Changes to 3 Pages, 2 Media, and 1 Post" answers the question a bare count cannot
 * — whether this merge touches the things the reader cares about — without making them
 * open a list to find out. It is deliberately a summary and not a table: the table
 * already exists on the branch view, and callers that can reach it link there themselves.
 *
 * Shared rather than written per caller, because the merge modal, a scheduled merge and
 * the manage modal are all answering the same question about the same kind of set, and
 * three hand-rolled sentences would drift apart.
 */
export const ChangeSummary: React.FC<{
  changes: SummarizableChange[]
  className?: string
  /** Shown as a second, muted line. Off where the operations are already on screen. */
  showOperations?: boolean
}> = ({ changes, className, showOperations = false }) => {
  const { getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()

  if (!changes.length) {
    return null
  }

  // Keyed by kind as well as slug: a global and a collection could share a slug, and they
  // are labelled from different places.
  const counts = new Map<string, number>()

  for (const change of changes) {
    const key = change.globalSlug
      ? `global:${change.globalSlug}`
      : `collection:${change.collectionSlug}`

    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  // Biggest group first: it is the one that describes the merge. Ties fall back to the
  // slug so the sentence is stable between renders rather than following Map order.
  const groups = [...counts.entries()].sort(
    ([slugA, countA], [slugB, countB]) => countB - countA || slugA.localeCompare(slugB),
  )

  const named = groups.slice(0, MAX_NAMED_COLLECTIONS).map(([key, count]) => {
    const [kind, slug] = key.split(':') as ['collection' | 'global', string]

    // A branch holds at most one change per global, so there is no plural form to pick.
    if (kind === 'global') {
      const label = getEntityConfig({ globalSlug: slug })?.label

      return `${count} ${getTranslation(label ?? slug, i18n)}`
    }

    const labels = getEntityConfig({ collectionSlug: slug })?.labels
    const label = count === 1 ? labels?.singular : labels?.plural

    return `${count} ${getTranslation(label ?? slug, i18n)}`
  })

  const remainder = groups
    .slice(MAX_NAMED_COLLECTIONS)
    .reduce((total, [, count]) => total + count, 0)

  if (remainder) {
    named.push(t('branching:andMoreChanges', { count: remainder }))
  }

  // `Intl.ListFormat` rather than joining on ", " and "and": the separator and the
  // conjunction are both language-specific, and this is a translated sentence.
  const summary = new Intl.ListFormat(i18n.language, { type: 'conjunction', style: 'long' }).format(
    named,
  )

  const operations = showOperations ? summarizeOperations({ changes, t }) : null

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <span className={`${baseClass}__sentence`}>{t('branching:changesTo', { summary })}</span>
      {operations && <span className={`${baseClass}__operations`}>{operations}</span>}
    </div>
  )
}

/**
 * "2 Created · 3 Updated", in the order the operations happen to a document rather than
 * by count — this line is about what kind of merge it is, and a delete matters at any size.
 */
const summarizeOperations = ({
  changes,
  t,
}: {
  changes: SummarizableChange[]
  t: (key: string) => string
}): null | string => {
  const order = ['create', 'update', 'delete'] as const

  const parts = order.reduce<string[]>((acc, operation) => {
    const count = changes.filter((change) => change.operation === operation).length

    if (count) {
      acc.push(`${count} ${t(`branching:operation_${operation}`)}`)
    }

    return acc
  }, [])

  return parts.length ? parts.join(' · ') : null
}
