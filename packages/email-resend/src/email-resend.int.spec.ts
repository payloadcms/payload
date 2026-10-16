import type { Payload } from 'payload'

import { describe, expect, it } from 'vitest'

import { resendAdapter } from './index.js'

/**
 * Real end-to-end checks against the live Resend API. Skipped unless RESEND_API_KEY
 * is set, so the default unit run and CI never hit the network.
 *
 * Run with:
 *   RESEND_API_KEY=re_xxx pnpm vitest run packages/email-resend/src/email-resend.int.spec.ts
 *
 * Uses Resend's sandbox identities, which require no domain verification:
 *   from:  onboarding@resend.dev
 *   to:    delivered@resend.dev  (also bounced@resend.dev / complained@resend.dev)
 */
describe.skipIf(!process.env.RESEND_API_KEY)('email-resend (integration)', () => {
  const mockPayload = {} as unknown as Payload

  const adapter = (apiKey: string) =>
    resendAdapter({
      apiKey,
      defaultFromAddress: 'onboarding@resend.dev',
      defaultFromName: 'Payload Integration Test',
    })({ payload: mockPayload })

  it('should send a real email and return a Resend id', async () => {
    const result = (await adapter(process.env.RESEND_API_KEY!).sendEmail({
      from: 'Payload <onboarding@resend.dev>',
      subject: 'Payload email-resend integration test',
      text: 'This message was sent by the email-resend integration test.',
      to: 'delivered@resend.dev',
    })) as { id: string }

    expect(result.id).toEqual(expect.any(String))
    expect(result.id.length).toBeGreaterThan(0)
  })

  it('should throw a descriptive APIError for an invalid API key', async () => {
    // Exercises the real Resend error path end-to-end (JSON 401/403 body),
    // proving the adapter surfaces the reason instead of a JSON parse error.
    await expect(() =>
      adapter('re_invalid_key_for_testing').sendEmail({
        from: 'Payload <onboarding@resend.dev>',
        subject: 'Should fail',
        text: 'Should fail',
        to: 'delivered@resend.dev',
      }),
    ).rejects.toThrow(/Error sending email/)
  })
})
