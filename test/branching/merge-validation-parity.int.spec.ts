import { createPayloadRequest, resolveEffectiveOperations } from 'payload'
import { expect } from 'vitest'

/* oxlint-disable payload/no-relative-monorepo-imports -- Exercise private merge preparation without depending on the later execution layer. */
import {
  createBranchMergeValidationRequest,
  defaultBranchMergeValidation,
  prepareBranchMergeValidationCandidates,
} from '../../packages/payload/src/branching/validation.js'
/* oxlint-enable payload/no-relative-monorepo-imports */
import { test } from '../__helpers/int/vitest.js'
import {
  branchChangesSlug,
  branchesSlug,
  mergeValidationGlobalSlug,
  mergeValidationSlug,
} from './shared.js'
import { createTrustedPayload } from './trustedPayload.js'

const branch = 'Accepted content'
const data = {
  link: {
    type: 'custom',
    url: '/accepted',
    reference: { relationTo: mergeValidationSlug, value: null },
  },
  layout: [{ blockType: 'text', text: 'English layout' }],
}

test.suite(
  'Branching: merge validation parity',
  { config: './merge-validation-parity.config.ts' },
  () => {
    for (const entityType of ['collection', 'global'] as const) {
      test(`should accept saved ${entityType} links and untranslated layouts in merge preflight`, async ({
        payload: instance,
      }) => {
        const payload = createTrustedPayload(instance)

        await payload.create({ collection: branchesSlug, data: { name: branch } })

        if (entityType === 'collection') {
          await payload.create({
            branch,
            collection: mergeValidationSlug,
            data: { ...structuredClone(data), _status: 'published' },
            locale: 'en',
          })
        } else {
          await payload.updateGlobal({
            branch,
            slug: mergeValidationGlobalSlug,
            data: { ...structuredClone(data), _status: 'published' },
            locale: 'en',
          })
        }

        const req = await createPayloadRequest({ branch: 'main', payload })
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: branch } },
        })
        const pending = await resolveEffectiveOperations({
          branch,
          changes: changes.docs.filter((change) => change.entityType !== 'global'),
          payload,
          req,
        })
        const candidates = await prepareBranchMergeValidationCandidates({
          payload,
          pending,
          pendingGlobals: changes.docs.filter((change) => change.entityType === 'global'),
          req,
        })
        const originalCandidates = structuredClone(candidates)
        const result = await defaultBranchMergeValidation({
          branch,
          candidates,
          req: createBranchMergeValidationRequest({ req }),
          target: 'main',
        })

        expect(candidates).toContainEqual(
          expect.objectContaining({
            entityType,
            locale: 'fr',
            data: expect.objectContaining({ layout: null }),
          }),
        )
        expect(result).toEqual({ errors: [], valid: true })
        expect(candidates).toEqual(originalCandidates)
      })
    }
  },
)
