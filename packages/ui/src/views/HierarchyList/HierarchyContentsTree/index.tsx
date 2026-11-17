'use client'

import type { HierarchyContents } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { TreePosition } from '../../../elements/Tree/types.js'
import type { ParentID } from './useHierarchyContentsTree.js'

import { Link } from '../../../elements/Link/index.js'
import { Pill } from '../../../elements/Pill/index.js'
import { TreeItem } from '../../../elements/Tree/TreeItem/index.js'
import { DocumentIcon } from '../../../icons/Document/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentSelection } from '../../../providers/DocumentSelection/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import '../../../elements/Table/index.css'
import { getHierarchyListURL } from '../getHierarchyListURL.js'
import { ContentsAction } from './ContentsAction/index.js'
import { ContentsSelectRow } from './ContentsSelectRow/index.js'
import { ContentsTable } from './ContentsTable/index.js'
import { getVisibleDocuments } from './getVisibleDocuments.js'
import { allSourcesKey, branchKey, useHierarchyContentsTree } from './useHierarchyContentsTree.js'
import './index.css'

export function HierarchyContentsTree({
  collectionSlug,
  enableRowSelections = true,
  initialContents,
  selectedTypes,
  SmallIcon,
}: {
  collectionSlug: string
  enableRowSelections?: boolean
  initialContents: HierarchyContents
  selectedTypes: string[]
  SmallIcon?: React.ReactNode
}) {
  const { i18n, t } = useTranslation()
  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()
  const { branches, container, expanded, isGroupExpanded, loadMore, toggle, toggleGroup } =
    useHierarchyContentsTree({ collectionSlug, initialContents })

  const { registerVisibleDocuments } = useDocumentSelection()
  const ownConfig = getEntityConfig({ collectionSlug })
  const collectionSpecificFieldName =
    typeof ownConfig.hierarchy === 'object' && ownConfig.hierarchy.collectionSpecific
      ? ownConfig.hierarchy.collectionSpecific.fieldName
      : undefined
  const parentID = initialContents.parentID
  const visibleDocuments = React.useMemo(
    () =>
      getVisibleDocuments({
        branches,
        collectionSlug,
        collectionSpecificFieldName,
        expanded,
        isGroupExpanded,
        parentID,
        selectedTypes,
      }),
    [
      branches,
      collectionSlug,
      collectionSpecificFieldName,
      expanded,
      isGroupExpanded,
      parentID,
      selectedTypes,
    ],
  )

  React.useLayoutEffect(() => {
    if (enableRowSelections) {
      registerVisibleDocuments?.({ documents: visibleDocuments })
    }
  }, [enableRowSelections, registerVisibleDocuments, visibleDocuments])
  const headingID = React.useId()
  const containerIcon = SmallIcon === undefined ? <DocumentIcon size={16} /> : SmallIcon

  const labelFor = ({ slug }: { slug: string }) =>
    getTranslation(getEntityConfig({ collectionSlug: slug }).labels.plural, i18n)
  const positionFor = ({
    ancestorContinues,
    indent,
    isLastRendered = false,
    isLastSibling = true,
  }: {
    ancestorContinues: boolean[]
    indent: number
    isLastRendered?: boolean
    isLastSibling?: boolean
  }): TreePosition => ({
    ancestorContinues,
    indent,
    isLastRendered,
    isLastSibling,
  })

  const renderBranch = ({
    id,
    ancestorContinues = [],
    ancestorIDs = [],
    indent,
    isLastBranch = true,
    parentTitle,
    rootSection,
  }: {
    ancestorContinues?: boolean[]
    ancestorIDs?: string[]
    id: ParentID
    indent: number
    isLastBranch?: boolean
    parentTitle?: string
    rootSection?: 'containers' | 'unassigned'
  }): React.ReactNode => {
    const branch = branches[branchKey({ id })]
    const position = positionFor({ ancestorContinues, indent })
    const renderAction = ({
      hasFollowingSource = false,
      isSummary = false,
      source,
    }: {
      hasFollowingSource?: boolean
      isSummary?: boolean
      source?: string
    }) => {
      const key = source ?? allSourcesKey
      const isPending = !branch || branch.pending.includes(key)
      const hasError = branch?.errors.includes(key)
      const sourceData = branch?.sources.find((value) => value.collectionSlug === source)
      const label = labelFor({ slug: source ?? collectionSlug })
      const hasAction = !isSummary || sourceData?.hasNextPage || isPending || hasError
      const action = t(
        isPending ? 'general:loading' : hasError ? 'general:retry' : 'general:loadMore',
      )
      return (
        <ContentsAction
          action={action}
          hasAction={Boolean(hasAction)}
          hasError={Boolean(hasError)}
          hasRowSelections={enableRowSelections}
          isPending={isPending}
          isSummary={isSummary}
          key={`action-${key}`}
          label={label}
          onLoadMore={({ control }) => {
            void loadMore({ control, parentID: id, source })
          }}
          parentTitle={parentTitle}
          position={{
            ...position,
            isLastRendered: !hasFollowingSource && isLastBranch,
            isLastSibling: !hasFollowingSource,
          }}
          sourceData={sourceData}
        />
      )
    }
    if (
      !branch ||
      branch.pending.includes(allSourcesKey) ||
      branch.errors.includes(allSourcesKey)
    ) {
      return renderAction({})
    }
    const sources = branch.sources
      .filter(
        (source) =>
          source.collectionSlug === collectionSlug || selectedTypes.includes(source.collectionSlug),
      )
      .filter((source) =>
        rootSection === 'containers'
          ? source.collectionSlug === collectionSlug
          : rootSection === 'unassigned'
            ? source.collectionSlug !== collectionSlug
            : true,
      )
      .sort(
        (a, b) =>
          Number(b.collectionSlug === collectionSlug) - Number(a.collectionSlug === collectionSlug),
      )
    if (!sources.some((source) => source.docs.length > 0 || source.hasNextPage)) {
      return (
        <tr>
          {enableRowSelections && <td data-column="_select" />}
          <td className="cell--linked">
            <TreeItem position={position}>
              <span role="status">{t('general:noResultsFound')}</span>
            </TreeItem>
          </td>
          <td />
          <td />
        </tr>
      )
    }
    return sources
      .filter((source) => source.docs.length > 0 || source.hasNextPage)
      .map((source, sourceIndex, renderedSources) => {
        const isDocumentGroup = source.collectionSlug !== collectionSlug
        const isLastSource = sourceIndex === renderedSources.length - 1
        const isExpandedGroup = isGroupExpanded({ parentID: id, source: source.collectionSlug })
        const groupLabel = labelFor({ slug: source.collectionSlug })
        return (
          <React.Fragment key={source.collectionSlug}>
            {isDocumentGroup && (
              <tr className="hierarchy-contents-tree__type" data-parent-id={id ?? 'root'}>
                {enableRowSelections && <td data-column="_select" />}
                <td className="cell--linked">
                  <TreeItem
                    hasChildren
                    isExpanded={isExpandedGroup}
                    onToggle={() => toggleGroup({ parentID: id, source: source.collectionSlug })}
                    position={positionFor({
                      ancestorContinues,
                      indent,
                      isLastRendered: isLastBranch && isLastSource && !isExpandedGroup,
                      isLastSibling: isLastSource && !isExpandedGroup,
                    })}
                    toggleLabel={`${t(isExpandedGroup ? 'general:collapse' : 'general:expand')}: ${groupLabel}`}
                    variant="group"
                  >
                    <Pill pillStyle="success" size="small">
                      <span className="hierarchy-contents-tree__type-label">
                        <span aria-hidden="true">
                          <DocumentIcon size={16} />
                        </span>
                        {groupLabel}
                      </span>
                    </Pill>
                  </TreeItem>
                </td>
                <td />
                <td />
              </tr>
            )}
            {(!isDocumentGroup || isExpandedGroup) &&
              source.docs.map((doc, index) => {
                const isContainer = source.collectionSlug === collectionSlug
                const config = getEntityConfig({ collectionSlug: source.collectionSlug })
                const rawTitle = doc[config.admin.useAsTitle || 'id']
                const title =
                  typeof rawTitle === 'string' || typeof rawTitle === 'number'
                    ? String(rawTitle)
                    : String(doc.id)
                const key = JSON.stringify([source.collectionSlug, doc.id])
                const canExpand = isContainer && !ancestorIDs.includes(String(doc.id))
                const isExpanded = canExpand && expanded.has(branchKey({ id: doc.id }))
                const isLastSibling = index === source.docs.length - 1 && !source.hasNextPage
                const isLastInBranch = sourceIndex === renderedSources.length - 1 && isLastSibling
                const href = isContainer
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
                      path: `/collections/${source.collectionSlug}/${encodeURIComponent(String(doc.id))}`,
                    })
                return (
                  <React.Fragment key={key}>
                    <tr data-id={key}>
                      {enableRowSelections && (
                        <td data-column="_select">
                          <ContentsSelectRow
                            collectionSlug={source.collectionSlug}
                            id={doc.id}
                            title={title}
                          />
                        </td>
                      )}
                      <td className="cell--linked">
                        <TreeItem
                          hasChildren={canExpand}
                          isExpanded={isExpanded}
                          isPending={
                            isContainer &&
                            branches[branchKey({ id: doc.id })]?.pending.includes(allSourcesKey)
                          }
                          onToggle={canExpand ? () => toggle({ id: doc.id }) : undefined}
                          parentDescription={
                            parentTitle === undefined
                              ? undefined
                              : `${t('general:parentDocument')}: ${parentTitle}. `
                          }
                          position={positionFor({
                            ancestorContinues,
                            indent,
                            isLastRendered:
                              isLastBranch && isLastInBranch && !isExpanded && isContainer,
                            isLastSibling: isLastInBranch && isContainer,
                          })}
                          toggleLabel={`${t(isExpanded ? 'general:collapse' : 'general:expand')}: ${title}`}
                        >
                          <Link className="hierarchy-contents-tree__link cell-link" href={href}>
                            <span aria-hidden="true">
                              {isContainer ? containerIcon : <DocumentIcon size={16} />}
                            </span>
                            {title}
                          </Link>
                        </TreeItem>
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
                        ancestorContinues: [...ancestorContinues, !isLastInBranch],
                        ancestorIDs: [...ancestorIDs, String(doc.id)],
                        indent: indent + 1,
                        isLastBranch: isLastBranch && isLastInBranch,
                        parentTitle: title,
                      })}
                  </React.Fragment>
                )
              })}
            {(!isDocumentGroup || isExpandedGroup) &&
              (isDocumentGroup ||
                source.hasNextPage ||
                branch.pending.includes(source.collectionSlug) ||
                branch.errors.includes(source.collectionSlug)) &&
              renderAction({
                hasFollowingSource: sourceIndex < renderedSources.length - 1,
                isSummary: isDocumentGroup,
                source: source.collectionSlug,
              })}
          </React.Fragment>
        )
      })
  }

  const renderTable = ({ rootSection }: { rootSection?: 'containers' | 'unassigned' } = {}) => (
    <ContentsTable
      documents={visibleDocuments}
      hasRowSelections={enableRowSelections}
      hasSelectAll={rootSection !== 'unassigned'}
      label={
        rootSection === 'unassigned' ? t('general:unassigned') : labelFor({ slug: collectionSlug })
      }
    >
      {renderBranch({
        id: parentID,
        ancestorIDs: parentID === null ? [] : [String(parentID)],
        indent: 0,
        rootSection,
      })}
    </ContentsTable>
  )

  return (
    <div
      className="hierarchy-contents-tree"
      data-row-selections={enableRowSelections}
      ref={container}
    >
      {parentID === null ? (
        <>
          <section
            aria-labelledby={`${headingID}-containers`}
            className="hierarchy-contents-tree__section"
          >
            <h2 id={`${headingID}-containers`}>{labelFor({ slug: collectionSlug })}</h2>
            {renderTable({ rootSection: 'containers' })}
          </section>
          <section
            aria-labelledby={`${headingID}-unassigned`}
            className="hierarchy-contents-tree__section"
          >
            <h2 id={`${headingID}-unassigned`}>{t('general:unassigned')}</h2>
            {renderTable({ rootSection: 'unassigned' })}
          </section>
        </>
      ) : (
        renderTable()
      )}
    </div>
  )
}
