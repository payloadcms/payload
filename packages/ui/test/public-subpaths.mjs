import assert from 'node:assert/strict'

const expectedSubpaths = [
  ['@payloadcms/ui/elements/DraggableSortable', /elements\/DraggableSortable\/index\.tsx$/],
  [
    '@payloadcms/ui/elements/DraggableSortable/DraggableSortableItem',
    /elements\/DraggableSortable\/DraggableSortableItem\/index\.tsx$/,
  ],
  ['@payloadcms/ui/elements/Pill', /elements\/Pill\/index\.tsx$/],
  ['@payloadcms/ui/elements/ReactSelect', /elements\/ReactSelect\/index\.tsx$/],
  [
    '@payloadcms/ui/elements/RenderServerComponent',
    /elements\/RenderServerComponent\/index\.tsx$/,
  ],
  ['@payloadcms/ui/elements/Tooltip', /elements\/Tooltip\/index\.tsx$/],
  ['@payloadcms/ui/elements/Upload', /elements\/Upload\/index\.tsx$/],
]

for (const [specifier, expectedPath] of expectedSubpaths) {
  assert.match(import.meta.resolve(specifier), expectedPath)
}
