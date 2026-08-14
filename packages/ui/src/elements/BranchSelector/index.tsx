'use client'

import { branchesCollectionSlug, formatAdminURL, MAIN_BRANCH } from 'payload/shared'
import React, { Fragment, useMemo } from 'react'

import type { BranchOption } from '../../providers/Branch/index.js'
import type { ComboboxEntry } from '../Combobox/index.js'

import { BranchIcon } from '../../icons/Branch/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { NewTabIcon } from '../../icons/NewTab/index.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { useBranch, useShowBranchSelector } from '../../providers/Branch/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Combobox } from '../Combobox/index.js'
import { Link } from '../Link/index.js'
import { useMergeBranch } from '../MergeBranch/context.js'
import { useModal } from '../Modal/index.js'
import { NewBranchModal, newBranchModalSlug } from './NewBranchModal/index.js'
import './index.css'

const baseClass = 'branch-selector'

/**
 * Switcher for the active content branch, sitting to the left of the breadcrumb
 * trail — everything after it is scoped to the branch it names.
 *
 * Renders nothing when branching is off, and nothing while `main` is the only
 * branch there is — until a branch exists there is nothing to switch to.
 */
export const BranchSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { activeBranch, branches, setBranch } = useBranch()
  const showSelector = useShowBranchSelector()
  const { t } = useTranslation()
  const { openModal } = useModal()
  const { openMerge } = useMergeBranch()

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const manageBranchesURL = formatAdminURL({
    adminRoute,
    path: `/collections/${branchesCollectionSlug}`,
  })

  // A branch that was merged, closed or made unreadable while it was still
  // selected is no longer in the list. It is still what the request resolved to,
  // so the switcher names it — and pinning it at the top is also the way out.
  const activeOption: BranchOption =
    activeBranch === MAIN_BRANCH
      ? { name: MAIN_BRANCH, slug: MAIN_BRANCH }
      : (branches.find(({ slug }) => slug === activeBranch) ?? {
          name: activeBranch,
          slug: activeBranch,
        })

  const { entries, slugByEntry } = useMemo(() => {
    // Everything except where you already are: the active branch is pinned above
    // the search, so listing it again would offer switching to it.
    const options: BranchOption[] = [{ name: MAIN_BRANCH, slug: MAIN_BRANCH }, ...branches].filter(
      ({ slug }) => slug !== activeBranch,
    )

    const slugByEntry = new Map<ComboboxEntry, string>()

    const entries = options.map((option) => {
      const hasDistinctName = option.name !== option.slug

      const entry: ComboboxEntry = {
        Component: (
          <span className={`${baseClass}__option`}>
            <span className={`${baseClass}__option-labels`}>
              <span className={`${baseClass}__option-name`}>{option.name}</span>
              {/* A merged branch is still switchable, so it stays in the list — but
                  "nothing pending" is worth saying, or it looks identical to a
                  branch with work on it. */}
              {option.isScheduled ? (
                <span className={`${baseClass}__option-scheduled`}>
                  {t('branching:scheduledToMerge')}
                </span>
              ) : (
                option.isMerged && (
                  <span className={`${baseClass}__option-merged`}>
                    {t('branching:status_merged')}
                  </span>
                )
              )}
            </span>
          </span>
        ),
        // The slug is not rendered — editors name branches, the slug is derived —
        // but it stays searchable, since it is what URLs and the API expose.
        name: hasDistinctName ? `${option.name} ${option.slug}` : option.name,
      }

      slugByEntry.set(entry, option.slug)

      return entry
    })

    return { entries, slugByEntry }
  }, [activeBranch, branches, t])

  if (!showSelector) {
    return null
  }

  const activeLabel =
    branches.find(({ slug }) => slug === activeBranch)?.name ?? activeBranch ?? MAIN_BRANCH

  return (
    <Fragment>
      <Combobox
        aria-label={t('branching:branches')}
        className={[baseClass, className].filter(Boolean).join(' ')}
        entries={entries}
        // Pinned rather than listed, so both stay reachable no matter what the
        // search has filtered the list down to.
        footer={({ close }) => (
          <Fragment>
            <Link
              className={`${baseClass}__option ${baseClass}__action ${baseClass}__manage`}
              href={manageBranchesURL}
              onClick={close}
            >
              <span className={`${baseClass}__option-labels`}>{t('branching:manageBranches')}</span>
            </Link>
            <div className={`${baseClass}__footer-divider`} />
            <button
              className={`${baseClass}__option ${baseClass}__action ${baseClass}__create`}
              onClick={() => {
                close()
                openModal(newBranchModalSlug)
              }}
              type="button"
            >
              <span className={`${baseClass}__option-labels`}>
                <PlusIcon size={16} />
                {t('branching:createNewBranch')}
              </span>
            </button>
          </Fragment>
        )}
        // Where you are, before what you could switch to. On a branch the name
        // itself is the way to manage it, so the row carries only the name and the
        // one action that is not reachable from anywhere else.
        header={({ close }) => (
          <div className={`${baseClass}__current`}>
            {activeOption.id === undefined ? (
              <span className={`${baseClass}__current-name`}>{activeOption.name}</span>
            ) : (
              // Opens in a new tab, which is what the icon promises. Reviewing a
              // branch is a detour from whatever you were editing when you opened
              // the switcher, so it should not cost you that place.
              <Link
                className={`${baseClass}__current-name ${baseClass}__current-link`}
                href={formatAdminURL({
                  adminRoute,
                  path: `/collections/${branchesCollectionSlug}/${activeOption.id}`,
                })}
                onClick={close}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className={`${baseClass}__current-text`}>{activeOption.name}</span>
                <NewTabIcon className={`${baseClass}__current-icon`} size={16} />
              </Link>
            )}
            {activeOption.id !== undefined && (
              <Button
                buttonStyle="primary"
                onClick={() => {
                  close()
                  // No selection to pass: from the switcher, merging means the whole
                  // branch — so it hands over the way to narrow that instead, and
                  // lets the modal count what is pending.
                  openMerge({
                    branchID: activeOption.id,
                    branchName: activeOption.name,
                    branchSlug: activeOption.slug,
                    reviewURL: formatAdminURL({
                      adminRoute,
                      path: `/collections/${branchesCollectionSlug}/${activeOption.id}`,
                    }),
                  })
                }}
                size="medium"
              >
                {t('branching:merge')}
              </Button>
            )}
          </div>
        )}
        horizontalAlign="left"
        // Searchable as soon as there is anything to search. With nothing to switch
        // to, a search box and a "no matches" message describe a search nobody ran —
        // the popup is then only its two actions.
        minEntriesForSearch={entries.length ? 0 : 1}
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
            buttonStyle="secondary"
            className={`${baseClass}__trigger`}
            extraButtonProps={{ onKeyDown }}
            icon={<BranchIcon />}
            iconPosition="left"
            onClick={onClick}
            selected={active}
            size="medium"
            {...ariaProps}
          >
            <span className={`${baseClass}__trigger-label`}>
              <span className={`${baseClass}__trigger-name`}>{activeLabel}</span>
              <ChevronIcon direction={active ? 'up' : 'down'} size={16} />
            </span>
          </Button>
        )}
        searchPlaceholder={t('branching:searchBranches')}
        // Suppressed only when there is nothing to match against in the first place;
        // a search that filters everything out still says so.
        showEmptyMessage={entries.length > 0}
        size="fit-content"
      />
      <NewBranchModal />
    </Fragment>
  )
}
