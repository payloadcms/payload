import type { Endpoint, PayloadRequest } from 'payload'

import { ValidationError } from 'payload'

import type { Client } from '../payload-types'

import { refuseWithoutAppApiKey } from './appApiKey'

/** What awoz-api sends: the signup's name and email, and the company details it asked for */
type AppClient = {
  address?: {
    city?: unknown
    country?: unknown
    postalCode?: unknown
    state?: unknown
    street?: unknown
  }
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
 * address: { street, city, state, postalCode, country }, businessType, industry }`, where `appUserId`
 * is the account's ID in awoz-api. Only these fields are copied. The client starts as a lead with the
 * source "VgemsAI app"; importance, notes and status are left to the team.
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

    if (
      !body ||
      typeof appUserId !== 'number' ||
      !Number.isSafeInteger(appUserId) ||
      appUserId <= 0
    ) {
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
          ...accountFields(body),
          appUserId,
          email: text(body.email),
          source: 'VgemsAI app',
          status: 'lead',
        },
        depth: 0,
        overrideAccess: true,
      })

      return Response.json({ id: client.id }, { status: 201 })
    } catch (error) {
      return validationErrors(error)
    }
  },
  method: 'post',
  path: '/app/clients',
}

/**
 * `GET /api/app/clients/by-account/:appUserId` - the client of an app account, for the app's Account screen:
 * `{ id, company, contactName, jobTitle, email, phone, website, address: { street, city, state, postalCode,
 * country }, businessType, industry }`, empty fields as null. `404` when the account has no client.
 */
export const appClientByAccountEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const client = await findAccountClient(req)

    return client
      ? Response.json(toAppClient(client))
      : Response.json({ errors: [{ message: 'Client not found.' }] }, { status: 404 })
  },
  method: 'get',
  path: '/app/clients/by-account/:appUserId',
}

/**
 * `PATCH /api/app/clients/by-account/:appUserId` - saves what someone changed in the app's Account screen.
 * Takes the fields of `POST /api/app/clients` except `appUserId` and `email`, and sets all of them: a field
 * left out or empty is cleared. Importance, notes, status and everything else stay as the team set them.
 * Answers the client like the `GET`; `404` when the account has no client, `400` for invalid fields.
 */
export const appClientUpdateEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const body = (await req.json?.().catch(() => null)) as AppClient | null
    const client = await findAccountClient(req)

    if (!client) {
      return Response.json({ errors: [{ message: 'Client not found.' }] }, { status: 404 })
    }
    if (!body) {
      return Response.json({ errors: [{ message: 'The body must be JSON.' }] }, { status: 400 })
    }

    try {
      const updated = await req.payload.update({
        id: client.id,
        collection: 'clients',
        data: accountFields(body, null),
        depth: 0,
        overrideAccess: true,
      })

      return Response.json(toAppClient(updated))
    } catch (error) {
      return validationErrors(error)
    }
  },
  method: 'patch',
  path: '/app/clients/by-account/:appUserId',
}

/**
 * The fields an app account fills in: at signup, then in the app's Account screen. `empty` is what an empty
 * one becomes: left out when creating, cleared (null) when updating.
 */
const accountFields = (body: AppClient, empty: null | undefined = undefined) => {
  const value = (field: unknown) => text(field) ?? empty

  return {
    address: {
      city: value(body.address?.city),
      country: value(body.address?.country),
      postalCode: value(body.address?.postalCode),
      state: value(body.address?.state),
      street: value(body.address?.street),
    },
    // Checked against the field's options by Payload
    businessType: value(body.businessType) as Client['businessType'],
    // Required: Payload refuses an empty one
    company: text(body.company) ?? '',
    contactName: value(body.contactName),
    industry: value(body.industry),
    jobTitle: value(body.jobTitle),
    phone: value(body.phone),
    website: value(body.website),
  }
}

/** What the app may see of its client: never notes, importance or status */
const toAppClient = (client: Client) => ({
  address: {
    city: client.address?.city ?? null,
    country: client.address?.country ?? null,
    postalCode: client.address?.postalCode ?? null,
    state: client.address?.state ?? null,
    street: client.address?.street ?? null,
  },
  businessType: client.businessType ?? null,
  company: client.company,
  contactName: client.contactName ?? null,
  email: client.email ?? null,
  id: client.id,
  industry: client.industry ?? null,
  jobTitle: client.jobTitle ?? null,
  phone: client.phone ?? null,
  website: client.website ?? null,
})

/** The client of the account in the `:appUserId` route parameter */
const findAccountClient = async (req: PayloadRequest) => {
  const appUserId = Number(req.routeParams?.appUserId)

  if (!Number.isSafeInteger(appUserId) || appUserId <= 0) {
    return null
  }

  const { docs } = await req.payload.find({
    collection: 'clients',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { appUserId: { equals: appUserId } },
  })

  return docs[0] ?? null
}

/** `400` with each invalid field's message and path */
const validationErrors = (error: unknown) => {
  if (error instanceof ValidationError) {
    return Response.json(
      { errors: error.data.errors.map(({ message, path }) => ({ message, path })) },
      { status: 400 },
    )
  }

  throw error
}

/** Trimmed text; anything else, or only spaces, is left out */
const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined
