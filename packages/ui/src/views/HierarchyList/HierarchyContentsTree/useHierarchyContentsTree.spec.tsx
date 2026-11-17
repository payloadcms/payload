import type { HierarchyContents, HierarchyContentsSource, ServerFunctionClient } from 'payload'

import React, { useLayoutEffect, useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ServerFunctionsProvider } from '../../../providers/ServerFunctions/index.js'
import { useHierarchyContentsTree } from './useHierarchyContentsTree.js'

type Tree = ReturnType<typeof useHierarchyContentsTree>

const source = ({
  collectionSlug = 'pages',
  docs = [{ id: 'a1', title: 'First page' }],
  hasNextPage = true,
  page = 1,
}: Partial<HierarchyContentsSource> = {}): HierarchyContentsSource => ({
  collectionSlug,
  docs,
  hasNextPage,
  page,
  totalDocs: 2,
  totalPages: 2,
})

const snapshot = ({
  parentID = null,
  sources = [source()],
}: Partial<HierarchyContents> = {}): HierarchyContents => ({ parentID, sources })

const deferred = () => {
  let resolve!: (value: HierarchyContents) => void
  const promise = new Promise<HierarchyContents>((finish) => {
    resolve = finish
  })

  return { promise, resolve }
}

describe('hierarchy contents requests', () => {
  it('should ignore a queued paging callback after the final page', async () => {
    const response = deferred()
    const serverFunction = vi.fn().mockReturnValue(response.promise)
    let tree!: Tree
    const screen = await render(
      <Fixture
        initialContents={snapshot()}
        onTree={(value) => {
          tree = value
        }}
        serverFunction={serverFunction}
      />,
    )
    const queuedLoadMore = tree.loadMore

    await screen.getByRole('button', { name: 'Load null pages' }).click()
    response.resolve(
      snapshot({
        sources: [
          source({ docs: [{ id: 'a2', title: 'Second page' }], hasNextPage: false, page: 2 }),
        ],
      }),
    )
    await expect.element(screen.getByRole('link', { name: 'Second page' })).toBeVisible()
    await queuedLoadMore({ parentID: null, source: 'pages' })

    expect(serverFunction).toHaveBeenCalledTimes(1)
    expect(serverFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'hierarchy-contents',
        args: expect.objectContaining({ page: 2, source: 'pages' }),
      }),
    )
    await expect
      .element(screen.getByRole('button', { name: 'Load null pages' }))
      .not.toBeInTheDocument()
  })

  it('should not reload a successful summary over an appended source page', async () => {
    const summary = snapshot({ parentID: 0 })
    const appended = snapshot({
      parentID: 0,
      sources: [
        source({ docs: [{ id: 'a2', title: 'Second page' }], hasNextPage: false, page: 2 }),
      ],
    })
    const serverFunction = vi
      .fn()
      .mockResolvedValueOnce(summary)
      .mockResolvedValueOnce(appended)
      .mockResolvedValue(summary)
    let tree!: Tree
    const screen = await render(
      <Fixture
        initialContents={snapshot({ sources: [] })}
        onTree={(value) => {
          tree = value
        }}
        serverFunction={serverFunction}
      />,
    )
    const queuedLoadMore = tree.loadMore

    await tree.loadMore({ parentID: 0 })
    await screen.getByRole('button', { name: 'Load 0 pages' }).click()
    await expect.element(screen.getByRole('link', { name: 'Second page' })).toBeVisible()
    await queuedLoadMore({ parentID: 0 })

    expect(serverFunction).toHaveBeenCalledTimes(2)
    await expect.element(screen.getByRole('link', { name: 'First page' })).toBeVisible()
    await expect.element(screen.getByRole('link', { name: 'Second page' })).toBeVisible()
  })

  it('should keep replacement requests pending when old responses and callbacks finish', async () => {
    const oldResponse = deferred()
    const replacementResponse = deferred()
    const oldSnapshot = snapshot()
    const replacement = snapshot({
      sources: [source({ docs: [{ id: 'fresh', title: 'Replacement page' }] })],
    })
    const serverFunction = vi
      .fn()
      .mockReturnValueOnce(oldResponse.promise)
      .mockReturnValue(replacementResponse.promise)
    let tree!: Tree
    const onTree = (value: Tree) => {
      tree = value
    }
    const screen = await render(
      <Fixture
        collectionSlug="old-containers"
        initialContents={oldSnapshot}
        onTree={onTree}
        serverFunction={serverFunction}
      />,
    )
    const staleLoadMore = tree.loadMore

    await screen.getByRole('button', { name: 'Load null pages' }).click()
    await screen.rerender(
      <Fixture
        collectionSlug="new-containers"
        initialContents={replacement}
        onTree={onTree}
        serverFunction={serverFunction}
      />,
    )
    await screen.getByRole('button', { name: 'Load null pages' }).click()
    oldResponse.resolve(
      snapshot({
        sources: [
          source({ docs: [{ id: 'old', title: 'Stale response' }], hasNextPage: false, page: 2 }),
        ],
      }),
    )
    await oldResponse.promise
    await staleLoadMore({ parentID: null, source: 'pages' })

    await expect.element(screen.getByRole('status')).toHaveTextContent('pages')
    await expect.element(screen.getByRole('link', { name: 'Replacement page' })).toBeVisible()
    await expect
      .element(screen.getByRole('link', { name: 'Stale response' }))
      .not.toBeInTheDocument()
    await screen.getByRole('button', { name: 'Load null pages' }).click()
    expect(serverFunction).toHaveBeenCalledTimes(2)
    replacementResponse.resolve(
      snapshot({
        sources: [
          source({ docs: [{ id: 'new', title: 'New response' }], hasNextPage: false, page: 2 }),
        ],
      }),
    )
    await expect.element(screen.getByRole('link', { name: 'New response' })).toBeVisible()
    await expect.element(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('should recover manual paging focus without moving it to a concurrently loaded source', async () => {
    const pagesResponse = deferred()
    const articlesResponse = deferred()
    const serverFunction = vi.fn(({ args }) =>
      args.source === 'pages' ? pagesResponse.promise : articlesResponse.promise,
    )
    const initialContents = snapshot({
      sources: [
        source(),
        source({ collectionSlug: 'articles', docs: [{ id: 'b1', title: 'First article' }] }),
      ],
    })
    let tree!: Tree
    const screen = await render(
      <Fixture
        initialContents={initialContents}
        onTree={(value) => {
          tree = value
        }}
        serverFunction={serverFunction}
      />,
    )

    await screen.getByRole('button', { name: 'Load null pages' }).click()
    void tree.loadMore({ parentID: null, source: 'articles' })
    pagesResponse.resolve(
      snapshot({
        sources: [source({ docs: [{ id: 'a2', title: 'New page' }], hasNextPage: false, page: 2 })],
      }),
    )
    articlesResponse.resolve(
      snapshot({
        sources: [
          source({
            collectionSlug: 'articles',
            docs: [{ id: 'b2', title: 'New article' }],
            hasNextPage: false,
            page: 2,
          }),
        ],
      }),
    )

    await expect.element(screen.getByRole('link', { name: 'New page' })).toHaveFocus()
    await expect.element(screen.getByRole('link', { name: 'New article' })).toBeVisible()
    expect(serverFunction).toHaveBeenCalledTimes(2)
  })

  it('should preserve a new focus target established before paging recovery commits', async () => {
    const response = deferred()
    const serverFunction = vi.fn().mockReturnValue(response.promise)
    const screen = await render(
      <Fixture
        initialContents={snapshot()}
        onTree={() => {}}
        serverFunction={serverFunction}
        shouldFocusOnResult
      />,
    )

    await screen.getByRole('button', { name: 'Load null pages' }).click()
    response.resolve(
      snapshot({
        sources: [
          source({ docs: [{ id: 'a2', title: 'Second page' }], hasNextPage: false, page: 2 }),
        ],
      }),
    )

    await expect.element(screen.getByRole('link', { name: 'Second page' })).toBeVisible()
    await expect.element(screen.getByRole('textbox', { name: 'Elsewhere' })).toHaveFocus()
  })

  it('should leave focus where the user moved it while a page was pending', async () => {
    const response = deferred()
    const serverFunction = vi.fn().mockReturnValue(response.promise)
    const screen = await render(
      <Fixture initialContents={snapshot()} onTree={() => {}} serverFunction={serverFunction} />,
    )

    await screen.getByRole('button', { name: 'Load null pages' }).click()
    await screen.getByRole('textbox', { name: 'Elsewhere' }).click()
    response.resolve(
      snapshot({
        sources: [
          source({ docs: [{ id: 'a2', title: 'Second page' }], hasNextPage: false, page: 2 }),
        ],
      }),
    )

    await expect.element(screen.getByRole('link', { name: 'Second page' })).toBeVisible()
    await expect.element(screen.getByRole('textbox', { name: 'Elsewhere' })).toHaveFocus()
  })
})

function Fixture({
  collectionSlug = 'containers',
  initialContents,
  onTree,
  serverFunction,
  shouldFocusOnResult,
}: {
  collectionSlug?: string
  initialContents: HierarchyContents
  onTree: (tree: Tree) => void
  serverFunction: ServerFunctionClient
  shouldFocusOnResult?: boolean
}) {
  return (
    <ServerFunctionsProvider serverFunction={serverFunction}>
      <Harness
        collectionSlug={collectionSlug}
        initialContents={initialContents}
        onTree={onTree}
        shouldFocusOnResult={shouldFocusOnResult}
      />
    </ServerFunctionsProvider>
  )
}

function Harness({
  collectionSlug,
  initialContents,
  onTree,
  shouldFocusOnResult,
}: {
  collectionSlug: string
  initialContents: HierarchyContents
  onTree: (tree: Tree) => void
  shouldFocusOnResult?: boolean
}) {
  const elsewhere = useRef<HTMLInputElement>(null)
  const tree = useHierarchyContentsTree({ collectionSlug, initialContents })

  useLayoutEffect(() => {
    onTree(tree)
  }, [onTree, tree])

  return (
    <div ref={tree.container}>
      <CommitFocus
        target={elsewhere}
        shouldFocus={Boolean(
          shouldFocusOnResult &&
          Object.values(tree.branches).some((branch) =>
            branch.sources.some((value) => value.docs.some((doc) => doc.title === 'Second page')),
          ),
        )}
      />
      <label>
        Elsewhere
        <input aria-label="Elsewhere" ref={elsewhere} />
      </label>
      <div role="status">
        {Object.values(tree.branches)
          .flatMap((branch) => branch.pending)
          .join(',')}
      </div>
      <table>
        <tbody>
          {Object.entries(tree.branches).flatMap(([key, branch]) =>
            branch.sources.map((value) => (
              <React.Fragment key={JSON.stringify([key, value.collectionSlug])}>
                {value.docs.map((doc) => (
                  <tr data-id={JSON.stringify([value.collectionSlug, doc.id])} key={String(doc.id)}>
                    <td>
                      <a href={`#${doc.id}`}>{String(doc.title ?? doc.id)}</a>
                    </td>
                  </tr>
                ))}
                {(value.hasNextPage || branch.pending.includes(value.collectionSlug)) && (
                  <tr>
                    <td>
                      <button
                        type="button"
                        onClick={(event) =>
                          void tree.loadMore({
                            parentID: JSON.parse(key),
                            source: value.collectionSlug,
                            control: event.currentTarget,
                          })
                        }
                      >
                        Load {key} {value.collectionSlug}
                      </button>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )),
          )}
        </tbody>
      </table>
    </div>
  )
}

function CommitFocus({
  target,
  shouldFocus,
}: {
  target: React.RefObject<HTMLInputElement | null>
  shouldFocus: boolean
}) {
  useLayoutEffect(() => {
    if (shouldFocus) {
      target.current?.focus()
    }
  }, [shouldFocus, target])

  return null
}
