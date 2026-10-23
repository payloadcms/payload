import type {
  OAuthClientInformationFull,
  OAuthTokens,
  OpenIdProviderDiscoveryMetadata,
} from '@modelcontextprotocol/server'
import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'

import { OAuthErrorCode } from '@modelcontextprotocol/server'
import { createHash } from 'crypto'
import { formatAdminURL } from 'payload/shared'

import type { MCPBuiltinOAuthConfig, MCPOAuthTokens } from '../types.js'

import { getPluginConfig } from '../utils/getPluginConfig.js'
import { getMCPURL } from './oauth.js'
import { issueLoginToken, refreshLoginToken } from './oauthLoginToken.js'

type Client = { name: string; redirectURIs: string[] }

type Consent = {
  clientID: string
  codeChallenge: string
  collection: string
  redirectURI: string
  state: null | string
  userID: number | string
}

type Code = {
  clientID: string
  codeChallenge: string
  redirectURI: string
  tokens: MCPOAuthTokens
}

type RefreshToken = {
  clientID: string
  refreshToken: string
}

/**
 * Turns Payload into the OAuth authorization server for MCP clients when `oauth.type` is
 * `'builtin'`. Clients register, the user allows them after logging in to the admin panel, and
 * the client receives the tokens `issueToken` creates.
 *
 * Clients, consent forms, authorization codes, and refresh tokens are encrypted and handed to the
 * client instead of being stored. Only the default tokens write to the database, to the user's
 * login sessions.
 */
export const oauthServerEndpoints: Endpoint[] = [
  {
    disableAuth: true,
    handler: (req) => withIssuer(req, (issuer) => metadataResponse(issuer)),
    method: 'get',
    // OpenID discovery is the only metadata location MCP clients check below the issuer's path,
    // which lets this work under /api without a route at the site root
    path: '/mcp/oauth/.well-known/openid-configuration',
  },
  {
    disableAuth: true,
    handler: (req) => withIssuer(req, () => Response.json({ keys: [] })),
    method: 'get',
    path: '/mcp/oauth/jwks',
  },
  {
    disableAuth: true,
    handler: (req) => withIssuer(req, () => register(req)),
    method: 'post',
    path: '/mcp/oauth/register',
  },
  {
    handler: (req) => withIssuer(req, () => authorize(req)),
    method: 'get',
    path: '/mcp/oauth/authorize',
  },
  {
    handler: (req) => withIssuer(req, () => approve(req)),
    method: 'post',
    path: '/mcp/oauth/authorize',
  },
  {
    disableAuth: true,
    handler: (req) => withIssuer(req, () => token(req)),
    method: 'post',
    path: '/mcp/oauth/token',
  },
]

/** The authorization server URL, or `undefined` when Payload isn't the authorization server. */
const getIssuer = (req: PayloadRequest): string | undefined =>
  getPluginConfig({ config: req.payload.config }).oauth?.type === 'builtin'
    ? `${getMCPURL({ config: req.payload.config, url: req.url! })}/oauth`
    : undefined

const withIssuer = (
  req: PayloadRequest,
  handler: (issuer: string) => Promise<Response> | Response,
): Promise<Response> | Response => {
  const issuer = getIssuer(req)
  return issuer ? handler(issuer) : new Response(null, { status: 404 })
}

/**
 * The user logged in to this browser, who can allow MCP clients. Tokens and API keys in the
 * `Authorization` header can't, or an MCP client could use its access token to approve itself a
 * new, separate login.
 */
const getBrowserUser = (req: PayloadRequest): PayloadRequest['user'] =>
  req.headers.has('Authorization') ? null : req.user

const metadataResponse = (issuer: string): Response =>
  Response.json(
    {
      authorization_endpoint: `${issuer}/authorize`,
      code_challenge_methods_supported: ['S256'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      // Required by OpenID discovery. No ID tokens are issued.
      id_token_signing_alg_values_supported: ['RS256'],
      issuer,
      jwks_uri: `${issuer}/jwks`,
      registration_endpoint: `${issuer}/register`,
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      token_endpoint: `${issuer}/token`,
      token_endpoint_auth_methods_supported: ['none'],
    } satisfies OpenIdProviderDiscoveryMetadata,
    // Not cached, since without `serverURL` its URLs come from the request
    { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } },
  )

const register: PayloadHandler = async (req) => {
  const { client_name, redirect_uris } = await req.json!().catch(() => ({}))

  if (
    !Array.isArray(redirect_uris) ||
    !redirect_uris.length ||
    !redirect_uris.every(
      (uri) => typeof uri === 'string' && URL.canParse(uri) && !uri.includes('#'),
    )
  ) {
    return Response.json({ error: OAuthErrorCode.InvalidRedirectUri }, { status: 400 })
  }

  const client: Client = {
    name: typeof client_name === 'string' ? client_name : 'An MCP client',
    redirectURIs: redirect_uris,
  }

  return Response.json(
    {
      client_id: seal({ type: 'client', data: client, req }),
      client_name: client.name,
      grant_types: ['authorization_code', 'refresh_token'],
      redirect_uris: client.redirectURIs,
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    } satisfies OAuthClientInformationFull,
    { status: 201 },
  )
}

const authorize: PayloadHandler = (req) => {
  const url = new URL(req.url!)
  const params = url.searchParams
  const clientID = params.get('client_id')
  const client = unseal<Client>({ type: 'client', req, value: clientID })
  const redirectURI = params.get('redirect_uri')

  // Never redirect to an address the client didn't register
  if (!client || !redirectURI || !client.redirectURIs.includes(redirectURI)) {
    return page({
      content: '<p>Start the sign-in again from your MCP client.</p>',
      status: 400,
      title: 'This sign-in link is invalid',
    })
  }

  const state = params.get('state')
  const codeChallenge = params.get('code_challenge')

  if (
    params.get('response_type') !== 'code' ||
    params.get('code_challenge_method') !== 'S256' ||
    !codeChallenge
  ) {
    return redirect({ params: { error: OAuthErrorCode.InvalidRequest, state }, redirectURI })
  }

  const user = getBrowserUser(req)

  if (!user) {
    const loginURL = formatAdminURL({ adminRoute: req.payload.config.routes.admin, path: '/login' })

    return new Response(null, {
      headers: {
        Location: `${loginURL}?redirect=${encodeURIComponent(url.pathname + url.search)}`,
      },
      status: 302,
    })
  }

  const consent: Consent = {
    clientID: clientID!,
    codeChallenge,
    collection: user.collection,
    redirectURI,
    state,
    userID: user.id,
  }

  return page({
    content: `<p>It will be able to use this app's MCP tools as ${escapeHTML(String(user.email ?? user.id))}, and you will return to ${escapeHTML(new URL(redirectURI).host || redirectURI)}.</p>
<form method="post">
<input name="consent" type="hidden" value="${seal({ type: 'consent', data: consent, expiresIn: 20 * 60 * 60, req })}">
<button name="decision" type="submit" value="allow">Allow</button>
<button name="decision" type="submit" value="deny">Deny</button>
</form>`,
    status: 200,
    title: `Allow ${client.name} to use your account?`,
  })
}

const approve: PayloadHandler = async (req) => {
  const form = new URLSearchParams(await req.text!())
  const consent = unseal<Consent>({ type: 'consent', req, value: form.get('consent') })
  const user = getBrowserUser(req)

  // The form is only valid for the user it was shown to
  if (!consent || user?.id !== consent.userID || user.collection !== consent.collection) {
    return page({
      content: '<p>Start the sign-in again from your MCP client.</p>',
      status: 400,
      title: 'This sign-in request expired',
    })
  }

  const { clientID, codeChallenge, redirectURI, state } = consent

  if (form.get('decision') !== 'allow') {
    return redirect({ params: { error: OAuthErrorCode.AccessDenied, state }, redirectURI })
  }

  const code: Code = {
    clientID,
    codeChallenge,
    redirectURI,
    tokens: await getTokenHooks(req).issueToken({ req }),
  }

  return redirect({
    params: { code: seal({ type: 'code', data: code, expiresIn: 60, req }), state },
    redirectURI,
  })
}

const token: PayloadHandler = async (req) => {
  const form = new URLSearchParams(await req.text!())
  const clientID = form.get('client_id')
  const tokens =
    clientID &&
    (form.get('grant_type') === 'refresh_token'
      ? await refresh({ clientID, form, req })
      : redeemCode({ clientID, form, req }))

  if (!clientID || !tokens) {
    return Response.json({ error: OAuthErrorCode.InvalidGrant }, { status: 400 })
  }

  return Response.json(
    {
      access_token: tokens.accessToken,
      expires_in: tokens.expiresIn,
      refresh_token:
        tokens.refreshToken &&
        seal({
          type: 'refresh',
          data: { clientID, refreshToken: tokens.refreshToken } satisfies RefreshToken,
          req,
        }),
      token_type: 'Bearer',
    } satisfies OAuthTokens,
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

const redeemCode = ({
  clientID,
  form,
  req,
}: {
  clientID: string
  form: URLSearchParams
  req: PayloadRequest
}): MCPOAuthTokens | undefined => {
  const code = unseal<Code>({ type: 'code', req, value: form.get('code') })

  if (
    form.get('grant_type') === 'authorization_code' &&
    code?.clientID === clientID &&
    code.redirectURI === form.get('redirect_uri') &&
    // PKCE: only the client that started the sign-in knows the verifier
    createHash('sha256')
      .update(form.get('code_verifier') ?? '')
      .digest('base64url') === code.codeChallenge
  ) {
    return code.tokens
  }
}

const refresh = async ({
  clientID,
  form,
  req,
}: {
  clientID: string
  form: URLSearchParams
  req: PayloadRequest
}): Promise<MCPOAuthTokens | null | undefined> => {
  const refreshToken = unseal<RefreshToken>({
    type: 'refresh',
    req,
    value: form.get('refresh_token'),
  })

  // Only the client a refresh token was issued to can use it
  if (refreshToken?.clientID === clientID) {
    return await getTokenHooks(req).refreshToken?.({
      refreshToken: refreshToken.refreshToken,
      req,
    })
  }
}

/** `issueToken` and `refreshToken`, or the defaults for Payload login tokens. */
const getTokenHooks = (req: PayloadRequest) => {
  const oauth = getPluginConfig({ config: req.payload.config }).oauth as MCPBuiltinOAuthConfig

  return oauth.issueToken
    ? { issueToken: oauth.issueToken, refreshToken: oauth.refreshToken }
    : { issueToken: issueLoginToken, refreshToken: refreshLoginToken }
}

/**
 * Encrypts data for the client to hold, so it doesn't need to be stored. `type` keeps one kind
 * from being used as another, e.g. a client ID as an authorization code.
 */
const seal = ({
  type,
  data,
  expiresIn,
  req,
}: {
  data: object
  /** Seconds */
  expiresIn?: number
  req: PayloadRequest
  type: string
}): string =>
  req.payload.encrypt(
    JSON.stringify({ ...data, type, exp: expiresIn && Date.now() + expiresIn * 1000 }),
  )

const unseal = <T>({
  type,
  req,
  value,
}: {
  req: PayloadRequest
  type: string
  value: null | string
}): T | undefined => {
  // Only the v1 format is authenticated. Older formats decrypt anything without an error.
  if (!value?.startsWith('v1:')) {
    return undefined
  }

  try {
    // Previous secrets can be public, like a default secret from source code, so only client IDs
    // accept them. Client IDs grant nothing, and this keeps clients registered when the secret changes.
    const secret = type === 'client' ? undefined : req.payload.config.secret
    const data = JSON.parse(req.payload.decrypt(value, { secret }))
    return data.type === type && (!data.exp || data.exp > Date.now()) ? data : undefined
  } catch {
    return undefined
  }
}

const redirect = ({
  params,
  redirectURI,
}: {
  params: Record<string, null | string>
  redirectURI: string
}): Response => {
  const location = new URL(redirectURI)

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      location.searchParams.set(key, value)
    }
  }

  return new Response(null, { headers: { Location: location.href }, status: 302 })
}

const page = ({
  content,
  status,
  title,
}: {
  content: string
  status: number
  title: string
}): Response =>
  new Response(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(title)}</title>
<style>
body { font-family: system-ui, sans-serif; margin: 4rem auto; max-width: 32rem; overflow-wrap: anywhere; padding: 0 1rem }
button { font: inherit; margin-inline-end: 0.5rem; padding: 0.5rem 1rem }
</style>
</head>
<body><h1>${escapeHTML(title)}</h1>${content}</body>
</html>`,
    {
      headers: {
        // Stop other sites from framing the page to trick users into clicking Allow
        'Content-Security-Policy': "frame-ancestors 'none'",
        'Content-Type': 'text/html; charset=utf-8',
      },
      status,
    },
  )

const escapeHTML = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`)
