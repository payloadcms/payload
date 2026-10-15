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
