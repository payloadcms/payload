'use client'

import type { HierarchyContents, NestedDocRow } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { Link } from '../../../elements/Link/index.js'
import { NestedDocCell } from '../../../elements/Table/NestedDocCell/index.js'
import { DocumentIcon } from '../../../icons/Document/index.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import '../../../elements/Table/index.css'
import { getHierarchyListURL } from '../getHierarchyListURL.js'
import './index.css'

type ParentID = null | number | string

type Branch = {
  errors: string[]
  pending: string[]
  sources: HierarchyContents['sources']
}

const branchKey = ({ id }: { id: ParentID }) => JSON.stringify(id)
const initialSource = '*'
const pageSize = 10

/** Browse a folder tree while each connected collection owns its pagination. */
export function FolderTree({
  collectionSlug,
  initialSources,
  parentID,
}: {
  collectionSlug: string
  initialSources: HierarchyContents['sources']
  parentID: ParentID
}) {
  const { i18n, t } = useTranslation()
  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()
  const [branches, setBranches] = useState<Record<string, Branch>>(() => ({
    [branchKey({ id: parentID })]: { errors: [], pending: [], sources: initialSources },
  }))
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const requests = useRef(new Map<string, AbortController>())
  const epoch = useRef(0)
  const container = useRef<HTMLDivElement>(null)
  const focusAfterLoad = useRef<{ control: Element; firstRow?: string; id: ParentID }>(null)

  useLayoutEffect(() => {
    const pendingFocus = focusAfterLoad.current
    if (!pendingFocus) {
      return
    }
    focusAfterLoad.current = null
    if (pendingFocus.control.isConnected) {
      return
    }
    const rows = Array.from(
      container.current?.querySelectorAll<HTMLTableRowElement>('tr[data-id]') ?? [],
    )
    const parentRow = rows.find(
      (row) => row.dataset.id === JSON.stringify([collectionSlug, pendingFocus.id]),
    )
    const firstRow = rows.find((row) => row.dataset.id === pendingFocus.firstRow)
    const target =
      parentRow?.querySelector<HTMLButtonElement>('button[aria-expanded]') ??
      firstRow?.querySelector<HTMLAnchorElement>('a') ??
      container.current?.querySelector<HTMLAnchorElement>('a')
    target?.focus()
  }, [branches, collectionSlug])

  const load = useCallback(
    async ({ id, page = 1, source }: { id: ParentID; page?: number; source?: string }) => {
      const key = branchKey({ id })
      const sourceKey = source ?? initialSource
      const requestKey = JSON.stringify([key, sourceKey])
      if (requests.current.has(requestKey)) {
        return
      }
      const controller = new AbortController()
      const origin = epoch.current
      const control = document.activeElement
      requests.current.set(requestKey, controller)
      setBranches((previous) => {
        const branch = previous[key] ?? { errors: [], pending: [], sources: [] }
        return {
          ...previous,
          [key]: {
            ...branch,
            errors: branch.errors.filter((value) => value !== sourceKey),
            pending: [...branch.pending, sourceKey],
          },
        }
      })
      try {
        const url = formatAdminURL({
          apiRoute,
          path: `/${collectionSlug}/hierarchy-contents${qs.stringify({ limit: pageSize, page, parentID: id ?? undefined, source }, { addQueryPrefix: true })}`,
          serverURL,
        })
        const response = await fetch(url, { credentials: 'include', signal: controller.signal })
        if (!response.ok) {
          throw new Error('Unable to load folder contents')
        }
        const result: HierarchyContents = await response.json()
        if (controller.signal.aborted || origin !== epoch.current) {
          return
        }
        if (control && document.activeElement === control) {
          const firstSource = result.sources.find((value) => value.docs.length > 0)
          const firstDoc = firstSource?.docs[0]
          focusAfterLoad.current = {
            id,
            control,
            firstRow: firstDoc
              ? JSON.stringify([firstSource.collectionSlug, firstDoc.id])
              : undefined,
          }
        }
        setBranches((previous) => {
          const branch = previous[key]
          const sources = source
            ? branch.sources.map((existing) => {
                const next = result.sources.find(
                  (value) => value.collectionSlug === existing.collectionSlug,
                )
                if (existing.collectionSlug !== source) {
                  return existing
                }
                // Permission changes may remove a source between pages. Stop offering its continuation.
                if (!next) {
                  return { ...existing, hasNextPage: false }
                }
                const docs = new Map(
                  [...existing.docs, ...next.docs].map((doc) => [String(doc.id), doc]),
                )
                return { ...next, docs: [...docs.values()] }
              })
            : result.sources
          return { ...previous, [key]: { ...branch, sources } }
        })
      } catch {
        if (!controller.signal.aborted && origin === epoch.current) {
          setBranches((previous) => ({
            ...previous,
            [key]: { ...previous[key], errors: [...previous[key].errors, sourceKey] },
          }))
        }
      } finally {
        if (requests.current.get(requestKey) === controller) {
          requests.current.delete(requestKey)
        }
        if (!controller.signal.aborted && origin === epoch.current) {
          setBranches((previous) => ({
            ...previous,
            [key]: {
              ...previous[key],
              pending: previous[key].pending.filter((value) => value !== sourceKey),
            },
          }))
        }
      }
    },
    [apiRoute, collectionSlug, serverURL],
  )

  useEffect(() => {
    epoch.current += 1
    setBranches({
      [branchKey({ id: parentID })]: { errors: [], pending: [], sources: initialSources },
    })
    setExpanded(new Set())
    const activeRequests = requests.current
    return () => {
      for (const controller of activeRequests.values()) {
        controller.abort()
      }
      activeRequests.clear()
    }
  }, [initialSources, load, parentID])

  const toggle = ({ id }: { id: number | string }) => {
    const key = branchKey({ id })
    const isOpening = !expanded.has(key)
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
    if (isOpening && !branches[key]) {
      void load({ id })
    }
  }

  const labelFor = ({ slug }: { slug: string }) =>
    getTranslation(getEntityConfig({ collectionSlug: slug }).labels.plural, i18n)
  const metadata = ({
    id,
    ancestorContinues = [],
    depth,
    hasChildren = false,
    isExpanded = false,
    isLastSibling = true,
  }: {
    ancestorContinues?: boolean[]
    depth: number
    hasChildren?: boolean
    id: ParentID
    isExpanded?: boolean
    isLastSibling?: boolean
  }): NestedDocRow => ({
    ancestorContinues,
    depth,
    hasChildren,
    hasMore: false,
    isExpanded,
    isLastSibling,
    limit: pageSize,
    parentID: id,
  })

  const renderBranch = ({
    id,
    ancestorContinues = [],
    ancestorIDs = [],
    depth,
    isLastBranch = true,
    parentTitle,
  }: {
    ancestorContinues?: boolean[]
    ancestorIDs?: string[]
    depth: number
    id: ParentID
    isLastBranch?: boolean
    parentTitle?: string
  }): React.ReactNode => {
    const branch = branches[branchKey({ id })]
    const row = metadata({ id, ancestorContinues, depth })
    const renderAction = ({ page = 1, source }: { page?: number; source?: string }) => {
      const key = source ?? initialSource
      const isPending = !branch || branch.pending.includes(key)
      const hasError = branch?.errors.includes(key)
      const label = source ? labelFor({ slug: source }) : labelFor({ slug: collectionSlug })
      return (
        <tr className="folder-tree__action" key={`action-${key}`}>
          <td className="cell--linked">
            <NestedDocCell
              id={`action-${branchKey({ id })}-${key}`}
              isLastRendered={false}
              row={row}
              title=""
            >
              <span className="folder-tree__action-content">
                {isPending && (
                  <span
                    className="sr-only"
                    role="status"
                  >{`${t('general:loading')}: ${label}`}</span>
                )}
                {hasError && <span role="alert">{t('error:loadingItems')}</span>}
                <button
                  aria-disabled={isPending || undefined}
                  aria-label={`${t(isPending ? 'general:loading' : hasError ? 'general:retry' : 'general:loadMore')}: ${label}${parentTitle ? ` (${parentTitle})` : ''}`}
                  onClick={() => {
                    if (!isPending) {
                      void load({ id, page, source })
                    }
                  }}
                  type="button"
                >
                  {t(
                    isPending ? 'general:loading' : hasError ? 'general:retry' : 'general:loadMore',
                  )}
                </button>
              </span>
            </NestedDocCell>
          </td>
          <td />
          <td />
        </tr>
      )
    }
    if (
      !branch ||
      branch.pending.includes(initialSource) ||
      branch.errors.includes(initialSource)
    ) {
      return renderAction({})
    }
    const sources = [...branch.sources].sort(
      (a, b) =>
        Number(b.collectionSlug === collectionSlug) - Number(a.collectionSlug === collectionSlug),
    )
    if (!sources.some((source) => source.docs.length > 0 || source.hasNextPage)) {
      return (
        <tr>
          <td className="cell--linked">
            <NestedDocCell
              id={`empty-${branchKey({ id })}`}
              isLastRendered={false}
              row={row}
              title=""
            >
              <span role="status">{t('general:noResultsFound')}</span>
            </NestedDocCell>
          </td>
          <td />
          <td />
        </tr>
      )
    }
    return sources
      .filter((source) => source.docs.length > 0 || source.hasNextPage)
      .map((source, sourceIndex, renderedSources) => (
        <React.Fragment key={source.collectionSlug}>
          {source.collectionSlug !== collectionSlug && source.docs.length > 0 && (
            <tr className="folder-tree__group">
              <td className="cell--linked" colSpan={3}>
                <NestedDocCell
                  id={`group-${source.collectionSlug}`}
                  isLastRendered={false}
                  row={row}
                  title=""
                >
                  <strong className="folder-tree__group-label">
                    {labelFor({ slug: source.collectionSlug })}
                  </strong>
                </NestedDocCell>
              </td>
            </tr>
          )}
          {source.docs.map((doc, index) => {
            const isFolder = source.collectionSlug === collectionSlug
            const config = getEntityConfig({ collectionSlug: source.collectionSlug })
            const rawTitle = doc[config.admin.useAsTitle || 'id']
            const title =
              typeof rawTitle === 'string' || typeof rawTitle === 'number'
                ? String(rawTitle)
                : String(doc.id)
            const key = JSON.stringify([source.collectionSlug, doc.id])
            const canExpand = isFolder && !ancestorIDs.includes(String(doc.id))
            const isExpanded = canExpand && expanded.has(branchKey({ id: doc.id }))
            const isLastSibling = index === source.docs.length - 1 && !source.hasNextPage
            const isLastInBranch = sourceIndex === renderedSources.length - 1 && isLastSibling
            const href = isFolder
              ? getHierarchyListURL({
                  adminRoute,
                  collectionSlug,
                  parentFieldName:
                    typeof config.hierarchy === 'object'
                      ? config.hierarchy.parentFieldName
                      : undefined,
                  parentID: doc.id,
                })
              : formatAdminURL({
                  adminRoute,
                  path: `/collections/${source.collectionSlug}/${doc.id}`,
                })
            return (
              <React.Fragment key={key}>
                <tr data-id={key}>
                  <td className="cell--linked">
                    <NestedDocCell
                      id={key}
                      isLastRendered={isLastBranch && isLastInBranch && !isExpanded}
                      isPending={
                        isFolder &&
                        branches[branchKey({ id: doc.id })]?.pending.includes(initialSource)
                      }
                      onToggle={canExpand ? () => toggle({ id: doc.id }) : undefined}
                      parentTitle={parentTitle}
                      row={metadata({
                        id,
                        ancestorContinues,
                        depth,
                        hasChildren: canExpand,
                        isExpanded,
                        isLastSibling,
                      })}
                      title={title}
                    >
                      <Link className="folder-tree__link cell-link" href={href}>
                        <span aria-hidden="true">
                          {isFolder ? <FolderIcon size={16} /> : <DocumentIcon size={16} />}
                        </span>
                        {title}
                      </Link>
                    </NestedDocCell>
                  </td>
                  <td>{labelFor({ slug: source.collectionSlug })}</td>
                  <td>
                    {typeof doc.updatedAt === 'string' ? (
                      <time dateTime={doc.updatedAt}>
                        {new Date(doc.updatedAt).toLocaleDateString(i18n.language)}
                      </time>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
                {isExpanded &&
                  renderBranch({
                    id: doc.id,
                    ancestorContinues: depth > 0 ? [...ancestorContinues, !isLastSibling] : [],
                    ancestorIDs: [...ancestorIDs, String(doc.id)],
                    depth: depth + 1,
                    isLastBranch: isLastBranch && isLastInBranch,
                    parentTitle: title,
                  })}
              </React.Fragment>
            )
          })}
          {(source.hasNextPage ||
            branch.pending.includes(source.collectionSlug) ||
            branch.errors.includes(source.collectionSlug)) &&
            renderAction({ page: source.page + 1, source: source.collectionSlug })}
        </React.Fragment>
      ))
  }

  return (
    <div className="table table--nested-docs folder-tree" ref={container}>
      <table cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            <th scope="col">{t('general:name')}</th>
            <th scope="col">{t('version:type')}</th>
            <th scope="col">{t('general:updatedAt')}</th>
          </tr>
        </thead>
        <tbody>
          {renderBranch({
            id: parentID,
            ancestorIDs: parentID === null ? [] : [String(parentID)],
            depth: 0,
          })}
        </tbody>
      </table>
    </div>
  )
}
