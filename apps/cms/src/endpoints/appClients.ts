import type { Endpoint } from 'payload'

import { ValidationError } from 'payload'

import type { Client } from '../payload-types'

import { refuseWithoutAppApiKey } from './appApiKey'

/** What awoz-api sends: the signup's name and email, and the company details it asked for */
type AppClient = {
  address?: { city?: unknown; country?: unknown; street?: unknown }
  appUserId?: unknown
  businessType?: unknown
  company?: unknown
  contactName?: unknown
  email?: unknown
  industry?: unknown
  jobTitle?: unknown
  phone?: unknown
  website?: unknown
}

/**
 * `POST /api/app/clients` - saves someone who signed up in the VgemsAI app as a client in the private
 * Clients collection (under "Business"). The app's backend, awoz-api, calls it after each signup.
 *
 * Server to server only: the caller sends `X-API-Key: <APP_API_KEY>` (see ./appApiKey.ts). While
 * APP_API_KEY is empty the endpoint answers 404, as if it didn't exist.
 *
 * Body: `{ appUserId, company, contactName, jobTitle, email, phone, website,
 * address: { street, city, country }, businessType, industry }`, where `appUserId` is the account's ID
 * in awoz-api. Only these fields are copied. The client starts as a lead with the source "VgemsAI app";
 * importance, notes and status are left to the team.
 *
 * Answers `201 { id }`. If a client already exists for the `appUserId`, answers `200` with its `id` instead
 * of making a second one, so awoz-api can safely try again after a lost answer. It sends one signup at a
 * time, so two requests for the same account don't race. Invalid fields get `400` with
 * `{ errors: [{ message, path }] }`.
 */
export const appClientsEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const body = (await req.json?.().catch(() => null)) as AppClient | null
    const appUserId = body?.appUserId

    if (!body || typeof appUserId !== 'number' || !Number.isSafeInteger(appUserId) || appUserId <= 0) {
      return Response.json(
        { errors: [{ message: 'appUserId must be a positive whole number.', path: 'appUserId' }] },
        { status: 400 },
      )
    }

    const existing = await req.payload.find({
      collection: 'clients',
      depth: 0,
      limit: 1,
      // Internal collection: this endpoint's API key check replaces the logged-in check
      overrideAccess: true,
      pagination: false,
      select: { appUserId: true },
      where: { appUserId: { equals: appUserId } },
    })

    if (existing.docs[0]) {
      return Response.json({ id: existing.docs[0].id }, { status: 200 })
    }

    try {
      const client = await req.payload.create({
        collection: 'clients',
        data: {
          address: {
            city: text(body.address?.city),
            country: text(body.address?.country),
            street: text(body.address?.street),
          },
          appUserId,
          // Checked against the field's options by Payload
          businessType: text(body.businessType) as Client['businessType'],
          // Required: Payload refuses an empty one
          company: text(body.company) ?? '',
          contactName: text(body.contactName),
          email: text(body.email),
          industry: text(body.industry),
          jobTitle: text(body.jobTitle),
          phone: text(body.phone),
          source: 'VgemsAI app',
          status: 'lead',
          website: text(body.website),
        },
        depth: 0,
        overrideAccess: true,
      })

      return Response.json({ id: client.id }, { status: 201 })
    } catch (error) {
      if (error instanceof ValidationError) {
        return Response.json(
          { errors: error.data.errors.map(({ message, path }) => ({ message, path })) },
          { status: 400 },
        )
      }

      throw error
    }
  },
  method: 'post',
  path: '/app/clients',
}

/** Trimmed text; anything else, or only spaces, is left out */
const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined
