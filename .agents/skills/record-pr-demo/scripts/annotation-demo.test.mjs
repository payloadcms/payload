import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createAnnotationInteraction } from './annotation-demo.mjs'

test('should use the chrome panel with a single annotation by default', async () => {
  const updates = []
  let clears = 0
  const { showAnnotation, hideAnnotation } = createAnnotationInteraction({
    presentation: {
      setAnnotation: async (note) => updates.push(note),
      clearAnnotation: async () => {
        clears++
      },
    },
  })
  await showAnnotation({ title: 'Result', body: 'The feature works.' })
  assert.deepEqual(updates, [{ index: 1, total: 1, title: 'Result', body: 'The feature works.' }])
  await hideAnnotation()
  assert.equal(clears, 1)
})

test('should reject floating and placement options before changing annotations', async () => {
  const { showAnnotation } = createAnnotationInteraction({
    presentation: { setAnnotation: () => assert.fail('Invalid annotation must not render') },
  })
  for (const legacy of [
    { type: 'floating' },
    { type: 'panel' },
    { position: { top: 20 } },
    { width: 300 },
  ]) {
    await assert.rejects(
      () => showAnnotation({ title: 'Invalid', body: 'Detail', ...legacy }),
      /remove type, position, and width/,
    )
  }
})

test('should require chrome for annotations', () => {
  assert.throws(() => createAnnotationInteraction({}), /require recording chrome/)
})

test('should require a visible opening note once annotations have been used', async () => {
  const annotations = createAnnotationInteraction({
    presentation: { setAnnotation: async () => {}, clearAnnotation: async () => {} },
  })
  await annotations.showAnnotation({ title: 'Opening', body: 'First note.' })
  await annotations.hideAnnotation()
  assert.throws(() => annotations.markReady(), /annotation.*before.*ready\(\)/i)
  await annotations.showAnnotation({ title: 'Opening', body: 'First note.' })
  annotations.markReady()
  await annotations.hideAnnotation()
  await annotations.showAnnotation({
    title: 'Next',
    body: 'Later notes may follow a hidden interval.',
  })
})

test('should allow an unannotated opening but reject introducing notes afterward', async () => {
  let renders = 0
  const annotations = createAnnotationInteraction({
    presentation: {
      setAnnotation: async () => {
        renders++
      },
      clearAnnotation: async () => {},
    },
  })
  annotations.markReady()
  await annotations.hideAnnotation()
  await assert.rejects(
    () => annotations.showAnnotation({ title: 'Late start', body: 'Missing opening note.' }),
    /annotation.*before.*ready\(\)/i,
  )
  assert.equal(renders, 0)
})
