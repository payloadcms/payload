import { describe, expect, it } from 'vitest'

import { createFormRequestScheduler } from './requestScheduler.js'

const deferred = <T = void>() => Promise.withResolvers<T>()

describe('createFormRequestScheduler', () => {
  it('runs one active task and only the latest equal-priority pending task', async () => {
    const active = deferred()
    const calls: string[] = []
    const scheduler = createFormRequestScheduler({ getRevision: () => 0 })
    const first = scheduler.schedule({
      intent: 'formState',
      run: async () => {
        calls.push('first')
        await active.promise
      },
    })
    const dropped = scheduler.schedule({
      intent: 'formState',
      run: async () => calls.push('dropped'),
    })
    const latest = scheduler.schedule({
      intent: 'formState',
      run: async () => calls.push('latest'),
    })

    expect(calls).toEqual(['first'])
    await expect(dropped).resolves.toEqual({ status: 'superseded' })
    active.resolve()
    await first
    await latest
    expect(calls).toEqual(['first', 'latest'])
  })

  it('captures revision when pending work starts', async () => {
    let revision = 1
    const active = deferred()
    const revisions: number[] = []
    const scheduler = createFormRequestScheduler({ getRevision: () => revision })
    void scheduler.schedule({
      intent: 'formState',
      run: async ({ dispatchedRevision, isCurrent }) => {
        revisions.push(dispatchedRevision)
        await active.promise
        expect(isCurrent()).toBe(false)
      },
    })
    const pending = scheduler.schedule({
      intent: 'autosave',
      run: async ({ dispatchedRevision, isCurrent }) => {
        revisions.push(dispatchedRevision)
        expect(isCurrent()).toBe(true)
      },
    })
    revision = 2
    active.resolve()
    await pending
    expect(revisions).toEqual([1, 2])
  })

  it('invalidates an active context when the revision changes without scheduling work', async () => {
    let revision = 1
    const active = deferred()
    const scheduler = createFormRequestScheduler({ getRevision: () => revision })
    const running = scheduler.schedule({
      intent: 'formState',
      run: async ({ dispatchedRevision, isCurrent }) => {
        expect(dispatchedRevision).toBe(1)
        expect(isCurrent()).toBe(true)
        await active.promise
        expect(isCurrent()).toBe(false)
      },
    })

    revision = 2
    active.resolve()
    await running
  })

  it('uses submit, autosave, then form state precedence for pending work', async () => {
    const active = deferred()
    const calls: string[] = []
    const scheduler = createFormRequestScheduler({ getRevision: () => 0 })

    void scheduler.schedule({
      intent: 'formState',
      run: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const formState = scheduler.schedule({
      intent: 'formState',
      run: async () => calls.push('formState'),
    })
    const autosave = scheduler.schedule({
      intent: 'autosave',
      run: async () => calls.push('autosave'),
    })
    const submit = scheduler.schedule({
      intent: 'submit',
      run: async () => calls.push('submit'),
    })

    await expect(formState).resolves.toEqual({ status: 'superseded' })
    await expect(autosave).resolves.toEqual({ status: 'superseded' })
    active.resolve()
    await submit
    expect(calls).toEqual(['active', 'submit'])
  })

  it('does not replace higher-priority pending work with a lower-priority task', async () => {
    const active = deferred()
    const calls: string[] = []
    const scheduler = createFormRequestScheduler({ getRevision: () => 0 })

    void scheduler.schedule({
      intent: 'formState',
      run: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const autosave = scheduler.schedule({
      intent: 'autosave',
      run: async () => calls.push('autosave'),
    })
    const formState = scheduler.schedule({
      intent: 'formState',
      run: async () => calls.push('formState'),
    })

    await expect(formState).resolves.toEqual({ status: 'superseded' })
    active.resolve()
    await autosave
    expect(calls).toEqual(['active', 'autosave'])
  })

  it('starts pending work after an active task rejects', async () => {
    const active = deferred()
    const calls: string[] = []
    const scheduler = createFormRequestScheduler({ getRevision: () => 0 })
    const rejected = scheduler.schedule({
      intent: 'formState',
      run: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const pending = scheduler.schedule({
      intent: 'autosave',
      run: async () => calls.push('autosave'),
    })

    active.reject(new Error('active task failed'))
    await expect(rejected).rejects.toThrow('active task failed')
    await pending
    expect(calls).toEqual(['active', 'autosave'])
  })

  it('supersedes pending work on reset and invalidates the active context', async () => {
    const active = deferred()
    let isCurrent: (() => boolean) | undefined
    const scheduler = createFormRequestScheduler({ getRevision: () => 0 })
    const running = scheduler.schedule({
      intent: 'formState',
      run: async (context) => {
        isCurrent = context.isCurrent
        await active.promise
      },
    })
    const pending = scheduler.schedule({
      intent: 'autosave',
      run: async () => undefined,
    })

    scheduler.reset()

    await expect(pending).resolves.toEqual({ status: 'superseded' })
    expect(isCurrent?.()).toBe(false)
    active.resolve()
    await running
  })

  it('does not start pending work until an unabortable active promise settles', async () => {
    const active = deferred()
    const calls: string[] = []
    const scheduler = createFormRequestScheduler({ getRevision: () => 0 })

    void scheduler.schedule({
      intent: 'formState',
      run: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const pending = scheduler.schedule({
      intent: 'autosave',
      run: async () => calls.push('autosave'),
    })

    await Promise.resolve()
    expect(calls).toEqual(['active'])
    active.resolve()
    await pending
    expect(calls).toEqual(['active', 'autosave'])
  })
})
