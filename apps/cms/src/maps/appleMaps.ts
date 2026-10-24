import crypto from 'node:crypto'

/**
 * Calls the Apple Maps Server API (https://developer.apple.com/documentation/applemapsserverapi),
 * which finds where events are (./findEventLocation.ts). It has the same map data as Apple Maps in
 * the VgemsAI app, so the pins match what the app shows around them.
 *
 * Enabled when APPLE_MAPS_TEAM_ID, APPLE_MAPS_KEY_ID and APPLE_MAPS_PRIVATE_KEY are set (README:
 * "Event locations"). Each call signs a short-lived token with the private key, trades it for an
 * access token at `GET /v1/token` and calls the API with that. The access token is valid for 30
 * minutes and reused until shortly before it expires.
 *
 * Apple allows 25,000 calls a day per developer team (shared with MapKit JS) and answers `429`
 * after that.
 */
const teamId = process.env.APPLE_MAPS_TEAM_ID?.trim() || ''
const keyId = process.env.APPLE_MAPS_KEY_ID?.trim() || ''
const privateKey = process.env.APPLE_MAPS_PRIVATE_KEY || ''
const baseURL = 'https://maps-api.apple.com/v1'

export const isAppleMapsEnabled = Boolean(teamId && keyId && privateKey)

export type Coordinate = {
  latitude: number
  longitude: number
}

/** A result of `GET /v1/geocode` or `GET /v1/search`, with the fields used here */
export type Place = {
  coordinate: Coordinate
  country?: string
  formattedAddressLines?: string[]
  name?: string
  /** Only for points of interest, e.g. "ConventionCenter" */
  poiCategory?: string
  structuredAddress?: {
    locality?: string
    /** The street, only when the address was found down to the street */
    thoroughfare?: string
  }
}

type Params = {
  q: string
  /** Search for these kinds of places only, e.g. `Poi` for points of interest such as venues */
  resultTypeFilter?: string
  /** Prefer places near here */
  searchLocation?: Coordinate
}

/** Places that match an address, best match first */
export const geocode = (params: Params) => get('/geocode', params)

/** Places, such as venues, that match a name, best match first */
export const search = (params: Params) => get('/search', params)

async function get(path: string, params: Params): Promise<Place[]> {
  const query = new URLSearchParams({ lang: 'en-US', q: params.q })

  if (params.resultTypeFilter) query.set('resultTypeFilter', params.resultTypeFilter)
  if (params.searchLocation) {
    query.set(
      'searchLocation',
      `${params.searchLocation.latitude},${params.searchLocation.longitude}`,
    )
  }

  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${baseURL}${path}?${query}`, {
      headers: { Authorization: `Bearer ${await accessToken()}` },
      signal: AbortSignal.timeout(15_000),
    }).catch((error: unknown) => {
      throw new Error(`Apple Maps is unreachable: ${(error as Error).message}`)
    })

    // The access token stopped working before it expired, e.g. the key was replaced: get a new one
    if (res.status === 401 && attempt === 1) {
      cachedToken = undefined
      continue
    }

    if (!res.ok) {
      throw new Error(await errorMessage(res))
    }

    const { results } = (await res.json()) as { results?: Place[] }

    return (results ?? []).filter(
      (place) =>
        Number.isFinite(place.coordinate?.latitude) && Number.isFinite(place.coordinate?.longitude),
    )
  }
}

let cachedToken: Promise<{ expiresAt: number; value: string }> | undefined

async function accessToken() {
  const token = await cachedToken?.catch(() => undefined)

  if (token && token.expiresAt > Date.now()) {
    return token.value
  }

  cachedToken = fetchAccessToken()

  return (await cachedToken).value
}

async function fetchAccessToken() {
  const res = await fetch(`${baseURL}/token`, {
    headers: { Authorization: `Bearer ${authToken()}` },
    signal: AbortSignal.timeout(15_000),
  }).catch((error: unknown) => {
    throw new Error(`Apple Maps is unreachable: ${(error as Error).message}`)
  })

  if (!res.ok) {
    throw new Error(
      `${await errorMessage(res)} Check APPLE_MAPS_TEAM_ID, APPLE_MAPS_KEY_ID and APPLE_MAPS_PRIVATE_KEY.`,
    )
  }

  const { accessToken, expiresInSeconds } = (await res.json()) as {
    accessToken: string
    expiresInSeconds: number
  }

  // A minute early, so a token never runs out during a call
  return { expiresAt: Date.now() + (expiresInSeconds - 60) * 1000, value: accessToken }
}

/** The token `GET /v1/token` trades for an access token: a JWT signed with the private key */
function authToken() {
  const now = Math.floor(Date.now() / 1000)
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsigned = `${encode({ alg: 'ES256', kid: keyId, typ: 'JWT' })}.${encode({
    exp: now + 10 * 60,
    iat: now,
    iss: teamId,
    scope: 'server_api',
  })}`
  const signature = crypto.sign('sha256', Buffer.from(unsigned), {
    // JWTs need the raw r||s signature, not Node's default DER encoding
    dsaEncoding: 'ieee-p1363',
    key: signingKey(),
  })

  return `${unsigned}.${signature.toString('base64url')}`
}

/**
 * The contents of the .p8 file from Apple: as is, with `\n` instead of line breaks (a .env value
 * is one line), or only the lines between BEGIN and END joined together.
 */
function signingKey() {
  const text = privateKey.replace(/\\n/g, '\n').trim()
  const body = text.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '')
  const pem = `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----\n`

  try {
    return crypto.createPrivateKey(pem)
  } catch {
    throw new Error('APPLE_MAPS_PRIVATE_KEY is not a valid private key (the .p8 file from Apple).')
  }
}

async function errorMessage(res: Response) {
  if (res.status === 429) {
    return "Apple Maps' daily limit of 25,000 calls is used up; try again tomorrow."
  }

  const text = await res.text().catch(() => '')
  let message = text

  try {
    const { error } = JSON.parse(text) as { error?: { details?: string[]; message?: string } }
    message = [error?.message, ...(error?.details ?? [])].filter(Boolean).join(' ') || text
  } catch {
    // Not JSON: keep the text
  }

  return `Apple Maps answered ${res.status} ${res.statusText}${message ? `: ${message}` : ''}.`
}
