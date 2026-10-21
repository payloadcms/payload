import { createHash } from 'node:crypto'

import type { CollectionConfig } from '../../../collections/config/types.js'

/** Rebuildable query state only. Neither collection stores authoritative content. */
export const buildBranchProjectionControlCollections = ({
  invalidations,
  states,
}: {
  invalidations: string
  states: string
}): CollectionConfig[] => {
  const internal = {
    access: { create: () => false, delete: () => false, read: () => false, update: () => false },
    admin: { hidden: true },
    graphQL: false,
    lockDocuments: false,
    timestamps: false,
    versions: false,
  } as const

  return [
    {
      ...internal,
      slug: states,
      dbName: `bp_state_${createHash('sha256').update(states).digest('hex').slice(0, 12)}`,
      fields: [
        { name: 'rowKey', type: 'text', required: true },
        { name: 'branchKey', type: 'text', required: true },
        { name: 'scopeKey', type: 'text', required: true },
        { name: 'generation', type: 'number', min: 1, required: true },
        { name: 'pendingCount', type: 'number', min: 0, required: true },
        { name: 'isInitialized', type: 'checkbox', required: true },
        { name: 'bootstrapCursor', type: 'json' },
      ],
      indexes: [{ fields: ['rowKey'], unique: true }],
    },
    {
      ...internal,
      slug: invalidations,
      dbName: `bp_dirty_${createHash('sha256').update(invalidations).digest('hex').slice(0, 12)}`,
      fields: [
        { name: 'branchKey', type: 'text', required: true },
        { name: 'scopeKey', type: 'text', required: true },
        { name: 'rowKey', type: 'text', required: true },
        { name: 'logicalID', type: 'json', required: true },
        { name: 'identityKey', type: 'text', required: true },
        { name: 'lifetime', type: 'text', required: true },
        { name: 'revision', type: 'number', min: 1, required: true },
        {
          name: 'state',
          type: 'select',
          options: ['pending', 'structural-conflict'],
          required: true,
        },
      ],
      indexes: [
        { fields: ['rowKey'], unique: true },
        { fields: ['branchKey', 'scopeKey', 'state'] },
      ],
    },
  ]
}
