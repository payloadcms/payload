import type { Endpoint, PayloadRequest } from 'payload'

import { chatExpiresAt } from '../collections/chatRetention'
import { refuseWithoutAppApiKey } from './appApiKey'

/**
 * Chats of the VgemsAI app, saved by its backend (awoz-api) in Chat Sessions and Chat Messages, and the
 * deletion of an app account's data. Server to server only, with `X-API-Key: <APP_API_KEY>` (see
 * ./appApiKey.ts); while APP_API_KEY is empty every endpoint answers 404. awoz-api decides who is asking from
 * the user's login and sends it as `appUserId`; a session only ever answers to the account that started it.
 */

/** Earlier messages sent back with each question, for the AI to answer in context */
const HISTORY_LIMIT = 50
/** A conversation gets its summary once it has been quiet this long */
const QUIET_MINUTES = 30
const MAX_TEXT_LENGTH = 20_000

type ChatMessageBody = {
  appUserId?: unknown
  durationMs?: unknown
  inputTokens?: unknown
  model?: unknown
  outputTokens?: unknown
  provider?: unknown
  refused?: unknown
  role?: unknown
  sessionId?: unknown
  text?: unknown
}

/**
 * `POST /api/app/chat-messages` - saves a question (`role: "user"`) or an answer (`"assistant"`).
 *
 * A question without `sessionId` starts a new session, linked to the account's client. A question answers
 * `201 { sessionId, messageId, history }`, where `history` is the session's last 50 messages, oldest first,
 * the new one included: `[{ role, text }]`. An answer needs the `sessionId` and answers `201 { sessionId,
 * messageId }`. A session of another account, or none, is `404`.
 */
export const appChatMessagesEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const body = (await req.json?.().catch(() => null)) as ChatMessageBody | null
    const appUserId = body?.appUserId
    const role = body?.role
    const text = typeof body?.text === 'string' ? body.text.trim() : ''

    if (!body || !isAccountID(appUserId)) {
      return badRequest('appUserId', 'appUserId must be a positive whole number.')
    }
    if (role !== 'user' && role !== 'assistant') {
      return badRequest('role', 'role must be "user" or "assistant".')
    }
    if (!text || text.length > MAX_TEXT_LENGTH) {
      return badRequest('text', `text must have 1 to ${MAX_TEXT_LENGTH} characters.`)
    }

    const { payload } = req
    const now = new Date().toISOString()
    let session: Awaited<ReturnType<typeof findSession>>

    if (body.sessionId !== undefined && body.sessionId !== null) {
      session = await findSession({ id: body.sessionId, req })
      if (!session || session.appUserId !== appUserId) {
        return Response.json({ errors: [{ message: 'Chat session not found.' }] }, { status: 404 })
      }
    } else if (role === 'user') {
      session = await payload.create({
        collection: 'chat-sessions',
        data: {
          appUserId,
          client: await findClientID({ appUserId, req }),
          expiresAt: chatExpiresAt(),
          lastMessageAt: now,
          messageCount: 0,
          title: text.length > 80 ? `${text.slice(0, 79)}…` : text,
        },
        depth: 0,
        overrideAccess: true,
      })
    } else {
      return badRequest('sessionId', 'An answer needs the sessionId of its question.')
    }

    const message = await payload.create({
      collection: 'chat-messages',
      data: {
        appUserId,
        durationMs: wholeNumber(body.durationMs),
        expiresAt: chatExpiresAt(),
        inputTokens: wholeNumber(body.inputTokens),
        model: shortText(body.model),
        outputTokens: wholeNumber(body.outputTokens),
        provider: shortText(body.provider),
        refused: body.refused === true,
        role,
        session: session.id,
        text,
      },
      depth: 0,
      overrideAccess: true,
    })

    await payload.update({
      id: session.id,
      collection: 'chat-sessions',
      data: {
        // The account may have become a client after the session started
        client: session.client ?? (await findClientID({ appUserId, req })),
        expiresAt: chatExpiresAt(),
        lastMessageAt: now,
        messageCount: (session.messageCount ?? 0) + 1,
        ...(role === 'assistant' && { model: shortText(body.model) }),
        needsSummary: true,
      },
      depth: 0,
      overrideAccess: true,
    })

    if (role === 'assistant') {
      return Response.json({ messageId: message.id, sessionId: session.id }, { status: 201 })
    }

    return Response.json(
      {
        history: await sessionMessages({ limit: HISTORY_LIMIT, req, sessionID: session.id }),
        messageId: message.id,
        sessionId: session.id,
      },
      { status: 201 },
    )
  },
  method: 'post',
  path: '/app/chat-messages',
}

/**
 * `GET /api/app/chat-sessions/to-summarize?limit=10` - sessions that have been quiet for 30 minutes and
 * have messages their summary doesn't cover yet, oldest first: `{ docs: [{ id, lastMessageAt, messages }] }`
 * with up to 200 messages each (`[{ role, text }]`, oldest first).
 */
export const appChatSessionsToSummarizeEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const limit = Math.min(Math.max(Number(req.searchParams?.get('limit')) || 10, 1), 50)
    const quietSince = new Date(Date.now() - QUIET_MINUTES * 60 * 1000).toISOString()

    const { docs } = await req.payload.find({
      collection: 'chat-sessions',
      depth: 0,
      limit,
      overrideAccess: true,
      pagination: false,
      select: { lastMessageAt: true },
      sort: 'lastMessageAt',
      where: {
        and: [{ needsSummary: { equals: true } }, { lastMessageAt: { less_than: quietSince } }],
      },
    })

    return Response.json({
      docs: await Promise.all(
        docs.map(async (session) => ({
          id: session.id,
          lastMessageAt: session.lastMessageAt,
          messages: await sessionMessages({ limit: 200, req, sessionID: session.id }),
        })),
      ),
    })
  },
  method: 'get',
  path: '/app/chat-sessions/to-summarize',
}

/**
 * `POST /api/app/chat-sessions/:id/summary` - `{ summary, topics, basedOn }` saves what the AI wrote about a
 * session. `basedOn` is the `lastMessageAt` the summary was written from: when a message has come in since,
 * the session is summarized again later.
 */
export const appChatSessionSummaryEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const body = (await req.json?.().catch(() => null)) as {
      basedOn?: unknown
      summary?: unknown
      topics?: unknown
    } | null
    const summary = typeof body?.summary === 'string' ? body.summary.trim().slice(0, 4000) : ''
    const session = await findSession({ id: req.routeParams?.id, req })

    if (!session) {
      return Response.json({ errors: [{ message: 'Chat session not found.' }] }, { status: 404 })
    }
    if (!summary) {
      return badRequest('summary', 'summary must not be empty.')
    }

    const topics = (Array.isArray(body?.topics) ? body.topics : [])
      .map(shortText)
      .filter((topic): topic is string => Boolean(topic))
      .slice(0, 10)
    const basedOn = typeof body?.basedOn === 'string' ? new Date(body.basedOn).getTime() : NaN
    const isCurrent = basedOn === new Date(session.lastMessageAt ?? 0).getTime()

    await req.payload.update({
      id: session.id,
      collection: 'chat-sessions',
      data: { needsSummary: !isCurrent, summary, topics },
      depth: 0,
      overrideAccess: true,
    })

    return Response.json({ id: session.id })
  },
  method: 'post',
  path: '/app/chat-sessions/:id/summary',
}

/**
 * `POST /api/app/accounts/delete` - `{ appUserId }`, when someone deletes their VgemsAI app account.
 * Deletes all their chat sessions and messages. Their client is deleted too while it's still an untouched
 * app lead (status Lead, source "VgemsAI app"); once the team works with it, it stays, unlinked from the app,
 * with a note. Answers `{ client: "deleted" | "unlinked" | "none" }`.
 */
export const appAccountDeleteEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const body = (await req.json?.().catch(() => null)) as { appUserId?: unknown } | null
    const appUserId = body?.appUserId

    if (!isAccountID(appUserId)) {
      return badRequest('appUserId', 'appUserId must be a positive whole number.')
    }

    const { payload } = req
    const byAccount = { appUserId: { equals: appUserId } }

    // Straight in the database: an account can have thousands of messages, and these have no hooks
    await payload.db.deleteMany({ collection: 'chat-messages', req, where: byAccount })
    await payload.db.deleteMany({ collection: 'chat-sessions', req, where: byAccount })

    const { docs } = await payload.find({
      collection: 'clients',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: byAccount,
    })
    const client = docs[0]

    if (!client) {
      return Response.json({ client: 'none' })
    }

    if (client.status === 'lead' && client.source === 'VgemsAI app') {
      await payload.delete({ id: client.id, collection: 'clients', overrideAccess: true })
      return Response.json({ client: 'deleted' })
    }

    const note = `Deleted their VgemsAI app account on ${new Date().toISOString().slice(0, 10)}.`
    await payload.update({
      id: client.id,
      collection: 'clients',
      data: { appUserId: null, notes: client.notes ? `${client.notes}\n\n${note}` : note },
      depth: 0,
      overrideAccess: true,
    })
    return Response.json({ client: 'unlinked' })
  },
  method: 'post',
  path: '/app/accounts/delete',
}

const findSession = async ({ id, req }: { id: unknown; req: PayloadRequest }) => {
  if (typeof id !== 'string' || !/^[a-f0-9]{24}$/.test(id)) {
    return null
  }
  const { docs } = await req.payload.find({
    collection: 'chat-sessions',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { id: { equals: id } },
  })
  return docs[0] ?? null
}

const findClientID = async ({ appUserId, req }: { appUserId: number; req: PayloadRequest }) => {
  const { docs } = await req.payload.find({
    collection: 'clients',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    select: { appUserId: true },
    where: { appUserId: { equals: appUserId } },
  })
  return docs[0]?.id ?? null
}

/** The session's last `limit` messages, oldest first */
const sessionMessages = async ({
  limit,
  req,
  sessionID,
}: {
  limit: number
  req: PayloadRequest
  sessionID: number | string
}) => {
  const { docs } = await req.payload.find({
    collection: 'chat-messages',
    depth: 0,
    limit,
    overrideAccess: true,
    pagination: false,
    select: { role: true, text: true },
    sort: '-createdAt',
    where: { session: { equals: sessionID } },
  })
  return docs.reverse().map(({ role, text }) => ({ role, text }))
}

const isAccountID = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0

const wholeNumber = (value: unknown) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined

const shortText = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, 100) : undefined

const badRequest = (path: string, message: string) =>
  Response.json({ errors: [{ message, path }] }, { status: 400 })
