import type { AdminViewServerProps } from 'payload'

import { Button } from '@payloadcms/ui'
import { FormHeader, Logo, MinimalTemplate } from '@payloadcms/ui/rsc'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { AuthorizeViewError, Client, Consent } from '../../endpoint/oauthServer.js'

import { unseal } from '../../utils/seal.js'
import './index.css'

const baseClass = 'mcp-authorize'

const errorTitles: Record<AuthorizeViewError, string> = {
  expired: 'This sign-in request expired',
  'invalid-link': 'This sign-in link is invalid',
}

/**
 * The admin page where users allow an MCP client to use their account, for the built-in OAuth
 * server. Its authorize endpoint sends users here with the consent to show, or with an error.
 */
export function MCPAuthorizeView({
  initPageResult,
  params,
  searchParams,
  server,
  user,
}: AdminViewServerProps) {
  const { locale, permissions, req } = initPageResult
  const { i18n, payload } = req
  const sealedConsent = getSearchParam(searchParams?.consent)
  const consent = unseal<Consent>({ type: 'consent', req, value: sealedConsent })
  const client = consent && unseal<Client>({ type: 'client', req, value: consent.clientID })
  // The consent is only valid for the user it was made for
  const isConsentValid =
    client &&
    consent &&
    req.user?.id === consent.userID &&
    req.user.collection === consent.collection
  const error: AuthorizeViewError =
    getSearchParam(searchParams?.error) === 'invalid-link' ? 'invalid-link' : 'expired'
  const account = String(user?.email ?? consent?.userID)
  const returnHost = consent && (new URL(consent.redirectURI).host || consent.redirectURI)

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__brand`}>
        <Logo
          i18n={i18n}
          locale={locale}
          params={params}
          payload={payload}
          permissions={permissions}
          searchParams={searchParams}
          server={server}
          user={user}
        />
      </div>
      {/* Not translated yet, so screen readers in other admin languages read it as English */}
      <div lang="en">
        {isConsentValid ? (
          <>
            <FormHeader
              description={`It will be able to use this app's MCP tools as ${account}, and you will return to ${returnHost}.`}
              heading={`Allow ${client.name} to use your account?`}
            />
            <form
              action={formatAdminURL({
                apiRoute: payload.config.routes.api,
                path: '/mcp/oauth/authorize',
              })}
              method="post"
            >
              <input name="consent" type="hidden" value={sealedConsent!} />
              <div className={`${baseClass}__actions`}>
                <Button
                  buttonStyle="primary"
                  extraButtonProps={{ name: 'decision', value: 'allow' }}
                  margin={false}
                  type="submit"
                >
                  Allow
                </Button>
                <Button
                  buttonStyle="secondary"
                  extraButtonProps={{ name: 'decision', value: 'deny' }}
                  margin={false}
                  type="submit"
                >
                  Deny
                </Button>
              </div>
            </form>
          </>
        ) : (
          <FormHeader
            description="Start the sign-in again from your MCP client."
            heading={errorTitles[error]}
          />
        )}
      </div>
    </MinimalTemplate>
  )
}

const getSearchParam = (value: string | string[] | undefined): null | string =>
  typeof value === 'string' ? value : null
