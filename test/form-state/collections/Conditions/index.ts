import type { CollectionConfig } from 'payload'

export const conditionsSlug = 'conditions'

/**
 * Demo collection exercising the three path-valued condition flavors
 * supported in Payload v4 form-state:
 *
 * 1. Path-valued top-level (client-side, fast path) — `revealedNote`
 * 2. Path-valued non-boolean input (select === 'beta') — `betaNote`,
 *    `betaPriority`
 * 3. Path-valued sibling-scoped inside an array row — `rows.*.value`
 *
 * Inline `admin.condition: () => boolean` is no longer supported. All
 * conditions must reference an importable module so they can bundle to
 * the client and evaluate synchronously.
 */
export const ConditionsCollection: CollectionConfig = {
  slug: conditionsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'toggle',
      type: 'checkbox',
      label: 'Toggle me to reveal the field below (path-valued condition)',
      defaultValue: false,
    },
    {
      name: 'revealedNote',
      type: 'text',
      label: 'Visible only when toggle is checked',
      admin: {
        // Path-valued condition — bundles to the client and evaluates
        // synchronously without a server roundtrip.
        condition:
          './collections/Conditions/conditions/showWhenToggleOn.js#showWhenToggleOn' as any,
      },
    },
    {
      name: 'tier',
      type: 'select',
      label: 'Tier (select beta to reveal two fields)',
      defaultValue: 'free',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Pro', value: 'pro' },
        { label: 'Beta', value: 'beta' },
      ],
    },
    {
      name: 'betaNote',
      type: 'text',
      label: 'Beta-only note',
      admin: {
        condition:
          './collections/Conditions/conditions/showWhenSelectIsBeta.js#showWhenSelectIsBeta' as any,
      },
    },
    {
      name: 'betaPriority',
      type: 'number',
      label: 'Beta-only priority',
      admin: {
        condition:
          './collections/Conditions/conditions/showWhenSelectIsBeta.js#showWhenSelectIsBeta' as any,
      },
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Each row: enable to reveal its value field',
      labels: { singular: 'Row', plural: 'Rows' },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'value',
          type: 'text',
          label: 'Visible when this row is enabled (sibling-scoped condition)',
          admin: {
            condition:
              './collections/Conditions/conditions/showWhenRowEnabled.js#showWhenRowEnabled' as any,
          },
        },
      ],
    },
  ],
}
