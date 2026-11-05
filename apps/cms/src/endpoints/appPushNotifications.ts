import type { Endpoint, PayloadRequest } from 'payload'

import type { PushNotification } from '../payload-types'

import { refuseWithoutAppApiKey } from './appApiKey'

/**
 * How awoz-api sends the push notifications written in the CMS (Push Notifications, under "VgemsAI App"): every
 * minute it asks which are due, marks each as sending, sends it through Firebase to the devices it keeps in MySQL,
 * and writes back how it went. Server to server only, with `X-API-Key: <APP_API_KEY>` (see ./appApiKey.ts);
 * while APP_API_KEY is empty the endpoints answer 404.
 */

/** Notifications per answer: the rest come a minute later */
const MAX_DUE = 20

/**
 * `GET /api/app/push-notifications/due` - the notifications waiting to send whose time has come, oldest first:
 *
 *   { notifications: [{ id, title, body, screen: "events", audience: "everyone" | "clients",
 *                       appUserIds: [12, 40] | null }] }
 *
 * `appUserIds` are the VgemsAI app accounts of the chosen clients (null for everyone). Clients without an app
 * account are left out, so it can be empty.
 */
export const appPushNotificationsDueEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const { docs } = await req.payload.find({
      collection: 'push-notifications',
      depth: 0,
      // Internal collection: this endpoint's API key check replaces the logged-in check
      overrideAccess: true,
      limit: MAX_DUE,
      sort: 'sendAt',
      where: {
        and: [
          { status: { equals: 'queued' } },
          { sendAt: { less_than_equal: new Date().toISOString() } },
        ],
      },
    })

    return Response.json({
      notifications: await Promise.all(
        docs.map(async (notification) => ({
          id: notification.id,
          appUserIds:
            notification.audience === 'clients' ? await appUserIds(req, notification) : null,
          audience: notification.audience,
          body: notification.body,
          screen: notification.screen,
          title: notification.title,
        })),
      ),
    })
  },
  method: 'get',
  path: '/app/push-notifications/due',
}

/**
 * `POST /api/app/push-notifications/:id/start` - marks a notification as sending, so it isn't sent twice.
 * `200 { status: "sending" }`, or `409` when it's no longer waiting (sent already, back to draft, deleted).
 */
export const appPushNotificationStartEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const notification = await findNotification(req)

    if (notification?.status !== 'queued') {
      return conflict('The notification is no longer waiting to send.')
    }

    await req.payload.update({
      id: notification.id,
      collection: 'push-notifications',
      context: { pushProgress: true },
      data: { status: 'sending' },
      overrideAccess: true,
    })

    return Response.json({ status: 'sending' })
  },
  method: 'post',
  path: '/app/push-notifications/:id/start',
}

/**
 * `POST /api/app/push-notifications/:id/result` - how sending went:
 *
 *   { "status": "sent", "devices": 120, "delivered": 117, "failed": 1, "removed": 2 }
 *   { "status": "failed", "problem": "Firebase refused the service account: …" }
 *
 * Only for a notification that is sending; `409` otherwise.
 */
export const appPushNotificationResultEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const body = (await req.json?.().catch(() => null)) as null | Record<string, unknown>
    const status = body?.status

    if (status !== 'sent' && status !== 'failed') {
      return Response.json(
        { errors: [{ message: 'status must be sent or failed.', path: 'status' }] },
        { status: 400 },
      )
    }

    const notification = await findNotification(req)

    if (notification?.status !== 'sending') {
      return conflict('The notification is not being sent.')
    }

    await req.payload.update({
      id: notification.id,
      collection: 'push-notifications',
      context: { pushProgress: true },
      data: {
        problem: status === 'failed' ? text(body?.problem) : null,
        results: {
          delivered: count(body?.delivered),
          devices: count(body?.devices),
          failed: count(body?.failed),
          removed: count(body?.removed),
        },
        sentAt: status === 'sent' ? new Date().toISOString() : null,
        status,
      },
      overrideAccess: true,
    })

    return Response.json({ status })
  },
  method: 'post',
  path: '/app/push-notifications/:id/result',
}

/** The VgemsAI app accounts of the chosen clients */
const appUserIds = async (req: PayloadRequest, notification: PushNotification) => {
  const ids = (notification.clients ?? []).map((client) =>
    typeof client === 'object' ? client.id : client,
  )

  if (ids.length === 0) {
    return []
  }

  const { docs } = await req.payload.find({
    collection: 'clients',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { appUserId: true },
    where: { id: { in: ids } },
  })

  return [
    ...new Set(
      docs
        .map((client) => client.appUserId)
        .filter((id): id is number => typeof id === 'number' && id > 0),
    ),
  ]
}

/** The notification of the `:id` in the path, or null */
const findNotification = async (req: PayloadRequest) => {
  const id = req.routeParams?.id

  if (typeof id !== 'string' || !id) {
    return null
  }

  return req.payload
    .findByID({ id, collection: 'push-notifications', depth: 0, overrideAccess: true })
    .catch(() => null)
}

const conflict = (message: string) => Response.json({ errors: [{ message }] }, { status: 409 })

const count = (value: unknown) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null

const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, 500) : null
