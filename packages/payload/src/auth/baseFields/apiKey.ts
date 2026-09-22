import type { CheckboxField, Field, FieldHook, TextField } from '../../fields/config/types.js'

import { generateAPIKey } from '../apiKeys/hash.js'
import { getRevealedAPIKey, stashRevealedAPIKey } from '../apiKeys/reveal.js'

/**
 * What a read returns in place of the stored hash when a key is set. Distinct from `null`,
 * which means no key is set at all, and that distinction is what makes writes safe: a
 * client that never held the key can only send the mask back, which means "leave it alone",
 * while `null` for a key that exists is an explicit revoke.
 */
const maskedAPIKey = ''

/**
 * Resolves what to store in `apiKey`, which is only ever a one-way hash of the key. Runs in
 * `beforeChange`, after field-level access control has had its say on the incoming value: a
 * denied write is reverted to the masked value, and so is treated as no change.
 */
const resolveAPIKeyHash =
  ({ includeEnableAPIKey }: { includeEnableAPIKey: boolean }): FieldHook =>
  ({ req, siblingData, siblingDocWithLocales, value }) => {
    // `siblingDocWithLocales` is the untouched database row, so unlike `value` it carries
    // the hash that is currently stored rather than the masked form of it.
    const currentHash =
      typeof siblingDocWithLocales?.apiKey === 'string' && siblingDocWithLocales.apiKey !== ''
        ? siblingDocWithLocales.apiKey
        : null

    const enableAPIKey = siblingData?.enableAPIKey

    if (includeEnableAPIKey && (enableAPIKey === false || enableAPIKey === null)) {
      return null
    }

    // The mask, sent back unchanged - which is what the Admin Panel submits on every save.
    if (value === maskedAPIKey) {
      return currentHash
    }

    if (typeof value === 'string') {
      return stashRevealedAPIKey({ rawAPIKey: value, req })
    }

    // `null` for a key that exists revokes it.
    if (currentHash) {
      return null
    }

    // API keys are on and there is no key, so issue one. This is what makes "enabled"
    // always mean a usable key exists, both on create and on the save that switches keys on.
    if (!includeEnableAPIKey || enableAPIKey === true) {
      return stashRevealedAPIKey({ rawAPIKey: generateAPIKey(), req })
    }

    return null
  }

/**
 * Returns the raw key only in the response of the request that set or generated it. Any
 * other read is masked, with an explicit value rather than `undefined`, since an undefined
 * `afterRead` result is treated as "no change" and would return the stored hash.
 */
const revealAPIKeyOnce: FieldHook = ({ req, value }) => {
  if (typeof value !== 'string' || value === '') {
    return null
  }

  return getRevealedAPIKey({ apiKeyHash: value, req }) ?? maskedAPIKey
}

/**
 * A duplicate must never inherit the original's key: one credential for two users would let
 * either act as the other. Clearing it makes the create path see a document with no key, so
 * a fresh one is issued when API keys are enabled.
 */
const dropAPIKeyOnDuplicate: FieldHook = () => null

type APIKeyCheckboxFieldOverride = Omit<Partial<CheckboxField>, 'name' | 'type'>
type APIKeyTextFieldOverride = Omit<
  Partial<TextField>,
  'hasMany' | 'maxRows' | 'minRows' | 'name' | 'type' | 'validate'
>

export const createAPIKeyFields = ({
  apiKeyField,
  apiKeyIndexField,
  enableAPIKeyField,
  includeEnableAPIKey = true,
}: {
  apiKeyField?: APIKeyTextFieldOverride
  apiKeyIndexField?: APIKeyTextFieldOverride
  enableAPIKeyField?: APIKeyCheckboxFieldOverride
  includeEnableAPIKey?: boolean
} = {}): Field[] => {
  const fields: Field[] = []

  if (includeEnableAPIKey) {
    fields.push({
      name: 'enableAPIKey',
      type: 'checkbox',
      ...enableAPIKeyField,
      admin: {
        components: {
          Field: false,
        },
        ...enableAPIKeyField?.admin,
      },
      label: enableAPIKeyField?.label ?? (({ t }) => t('authentication:enableAPIKey')),
    })
  }

  fields.push(
    {
      name: 'apiKey',
      type: 'text',
      ...apiKeyField,
      admin: {
        components: {
          Field: false,
        },
        ...apiKeyField?.admin,
      },
      hooks: {
        afterRead: [revealAPIKeyOnce],
        beforeChange: [resolveAPIKeyHash({ includeEnableAPIKey })],
        beforeDuplicate: [dropAPIKeyOnDuplicate],
        ...apiKeyField?.hooks,
      },
      index: true,
      label: apiKeyField?.label ?? (({ t }) => t('authentication:apiKey')),
    },
    {
      /**
       * @deprecated Only read by `migrateAPIKeysToHash`, to recover keys written before
       * they were stored as one-way hashes. Nothing else reads or writes it, and it is
       * removed in the next major.
       */
      name: 'apiKeyIndex',
      type: 'text',
      ...apiKeyIndexField,
      admin: {
        disabled: true,
        ...apiKeyIndexField?.admin,
      },
      hidden: apiKeyIndexField?.hidden ?? true,
    },
  )

  return fields
}
