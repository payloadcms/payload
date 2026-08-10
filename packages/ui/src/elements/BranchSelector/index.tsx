'use client'

import { branchesCollectionSlug, formatAdminURL, MAIN_BRANCH } from 'payload/shared'
import React, { useMemo } from 'react'

import type { BranchOption } from '../../providers/Branch/index.js'
import type { ComboboxEntry } from '../Combobox/index.js'

import { CheckIcon } from '../../icons/Check/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { useBranch, useShowBranchSelector } from '../../providers/Branch/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Combobox } from '../Combobox/index.js'
import { Link } from '../Link/index.js'
import './index.css'

const baseClass = 'branch-selector'

/**
 * Breadcrumb-level switcher for the active content branch.
 *
 * Renders nothing when branching is off, and nothing while `main` is the only
 * branch there is — until a branch exists there is nothing to switch to.
 */
export const BranchSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { activeBranch, branches, setBranch } = useBranch()
  const showSelector = useShowBranchSelector()
  const { t } = useTranslation()

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const createBranchURL = formatAdminURL({
    adminRoute,
    path: `/collections/${branchesCollectionSlug}/create`,
  })

  const { entries, slugByEntry } = useMemo(() => {
    const options: BranchOption[] = [{ name: MAIN_BRANCH, slug: MAIN_BRANCH }, ...branches]

    // A branch that was merged, closed or made unreadable while it was still
    // selected is no longer in the list. It stays in the popup so the switcher
    // reflects what the request actually resolved to, and so there's a way out.
    if (activeBranch !== MAIN_BRANCH && !branches.some(({ slug }) => slug === activeBranch)) {
      options.push({ name: activeBranch, slug: activeBranch })
    }

    const slugByEntry = new Map<ComboboxEntry, string>()

    const entries = options.map((option) => {
      const isActive = option.slug === activeBranch
      const hasDistinctName = option.name !== option.slug

      const entry: ComboboxEntry = {
        Component: (
          <span
            className={[`${baseClass}__option`, isActive && `${baseClass}__option--active`]
              .filter(Boolean)
              .join(' ')}
          >
            <span className={`${baseClass}__option-labels`}>
              <span className={`${baseClass}__option-name`}>{option.name}</span>
              {hasDistinctName && (
                <span className={`${baseClass}__option-slug`}>{option.slug}</span>
              )}
            </span>
            {isActive && <CheckIcon size={16} />}
          </span>
        ),
        // Searched against, not rendered — so both the display name and the
        // slug an editor may know the branch by are matchable.
        name: hasDistinctName ? `${option.name} ${option.slug}` : option.name,
      }

      slugByEntry.set(entry, option.slug)

      return entry
    })

    return { entries, slugByEntry }
  }, [activeBranch, branches])

  if (!showSelector) {
    return null
  }

  const activeLabel =
    branches.find(({ slug }) => slug === activeBranch)?.name ?? activeBranch ?? MAIN_BRANCH

  return (
    <Combobox
      aria-label={t('branching:branches')}
      className={[baseClass, className].filter(Boolean).join(' ')}
      entries={entries}
      // Pinned rather than listed, so it stays reachable no matter what the
      // search has filtered the list down to.
      footer={({ close }) => (
        <Link
          className={`${baseClass}__option ${baseClass}__create`}
          href={createBranchURL}
          onClick={close}
        >
          <span className={`${baseClass}__option-labels`}>
            <PlusIcon size={16} />
            {t('branching:newBranch')}
          </span>
        </Link>
      )}
      horizontalAlign="left"
      // Always searchable: branch lists grow with editorial workload, and a
      // switcher that only sometimes has a search box is harder to learn.
      minEntriesForSearch={0}
      onSelect={(entry) => {
        const slug = slugByEntry.get(entry)

        if (slug) {
          setBranch(slug)
        }
      }}
      portalClassName={`${baseClass}__popup`}
      renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
        <Button
          aria-label={t('branching:selectBranch')}
          buttonStyle="ghost"
          className={`${baseClass}__trigger`}
          extraButtonProps={{ onKeyDown }}
          onClick={onClick}
          selected={active}
          {...ariaProps}
        >
          <span className={`${baseClass}__trigger-label`}>
            {activeLabel}
            <ChevronIcon direction={active ? 'up' : 'down'} size={16} />
          </span>
        </Button>
      )}
      searchPlaceholder={t('branching:searchBranches')}
      size="fit-content"
    />
  )
}
