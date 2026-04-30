import type { CollectionConfig } from 'payload'

export const conditionsSlug = 'conditions'

/**
 * Demo collection exercising the three path-valued condition flavors
 * supported in Payload v4 form-state. Field names are deliberately
 * functional (`controller` / `dependent`) rather than scenario-flavored
 * so the demo reads as a pure exercise of the visibility wiring.
 *
 * 1. `topLevelCheckbox` (controller, boolean) → `dependentTextA`
 * 2. `topLevelSelect`   (controller, enum)    → `dependentTextB`,
 *                                               `dependentNumberB`
 * 3. `rows.*.rowController` (sibling-scoped)  → `rows.*.dependentRowField`
 *
 * Inline `admin.condition: () => boolean` is no longer demonstrated. All
 * conditions reference an importable module so they bundle to the client
 * and evaluate synchronously.
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
      name: 'topLevelCheckbox',
      type: 'checkbox',
      label: 'Top-level checkbox controller (boolean)',
      defaultValue: false,
    },
    {
      name: 'dependentTextA',
      type: 'text',
      label: 'Dependent text A — visible when topLevelCheckbox is true',
      admin: {
        condition: './collections/Conditions/conditions/showWhenCheckboxOn.js#showWhenCheckboxOn',
      },
    },
    {
      name: 'topLevelSelect',
      type: 'select',
      label: 'Top-level select controller (enum)',
      defaultValue: 'optionA',
      options: [
        { label: 'Option A', value: 'optionA' },
        { label: 'Option B', value: 'optionB' },
        { label: 'Option C', value: 'optionC' },
      ],
    },
    {
      name: 'dependentTextB',
      type: 'text',
      label: 'Dependent text B — visible when topLevelSelect === optionB',
      admin: {
        condition: './collections/Conditions/conditions/showWhenSelectIsB.js#showWhenSelectIsB',
      },
    },
    {
      name: 'dependentNumberB',
      type: 'number',
      label: 'Dependent number B — visible when topLevelSelect === optionB',
      admin: {
        condition: './collections/Conditions/conditions/showWhenSelectIsB.js#showWhenSelectIsB',
      },
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Per-row controller / dependent (sibling-scoped condition)',
      labels: { singular: 'Row', plural: 'Rows' },
      fields: [
        {
          name: 'rowController',
          type: 'checkbox',
          label: 'Row controller',
          defaultValue: false,
        },
        {
          name: 'dependentRowField',
          type: 'text',
          label: 'Dependent row field — visible when rowController is true',
          admin: {
            condition:
              './collections/Conditions/conditions/showWhenRowControllerOn.js#showWhenRowControllerOn',
          },
        },
      ],
    },
  ],
}
