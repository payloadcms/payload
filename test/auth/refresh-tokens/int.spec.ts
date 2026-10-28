import type { RESTClient } from '../../__helpers/shared/RESTClient.js'

import { wait } from 'payload/shared'
import { expect, onTestFinished, vi } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import { devUser } from '../../credentials.js'
import { collectionSlug } from './shared.js'

const refresh = ({ refreshToken, restClient }: { refreshToken: string; restClient: RESTClient }) =>
  restClient.POST(`/${collectionSlug}/refresh-token`, {
    auth: false,
    body: JSON.stringify({ refreshToken }),
  })

const getUser = ({ restClient, token }: { restClient: RESTClient; token: string }) =>
  restClient
    .GET(`/${collectionSlug}/me`, { auth: false, headers: { Authorization: `JWT ${token}` } })
    .then((res) => res.json())
    .then(({ user }) => user)

const moveClockForward = (milliseconds: number) => {
  vi.useFakeTimers({ now: Date.now() + milliseconds, toFake: ['Date'] })
  onTestFinished(() => vi.useRealTimers())
}

test.suite('Refresh tokens', { config: './config.ts' }, () => {
  test.beforeEach(async ({ restClient }) => {
    await restClient.POST(`/${collectionSlug}/first-register`, {
      body: JSON.stringify({ ...devUser, 'confirm-password': devUser.password }),
    })
  })

  test('should trade a refresh token for new tokens after the token expired', async ({
    restClient,
  }) => {
    const login = await restClient.login({ slug: collectionSlug, credentials: devUser })

    moveClockForward(3 * 60 * 60 * 1000)

    const response = await refresh({ refreshToken: login.refreshToken, restClient })
    const refreshed = await response.json()

    expect(response.status).toBe(200)
    expect(refreshed.refreshToken).not.toBe(login.refreshToken)
    expect(await getUser({ restClient, token: login.token })).toBeNull()
    expect(await getUser({ restClient, token: refreshed.refreshedToken })).toMatchObject({
      email: devUser.email,
    })
  })

  test('should log out the session when a used refresh token comes back later', async ({
    restClient,
  }) => {
    const login = await restClient.login({ slug: collectionSlug, credentials: devUser })

    moveClockForward(3 * 60 * 60 * 1000)

    const refreshed = await refresh({ refreshToken: login.refreshToken, restClient }).then((res) =>
      res.json(),
    )

    // Right after a refresh, the client may be refreshing twice at once
    expect((await refresh({ refreshToken: login.refreshToken, restClient })).status).toBe(200)

    moveClockForward(60 * 1000)

    expect((await refresh({ refreshToken: login.refreshToken, restClient })).status).toBe(403)
    expect((await refresh({ refreshToken: refreshed.refreshToken, restClient })).status).toBe(403)
    expect(await getUser({ restClient, token: refreshed.refreshedToken })).toBeNull()
  })

  test('should stay logged in after refreshing twice at once', async ({ payload, restClient }) => {
    const login = await restClient.login({ slug: collectionSlug, credentials: devUser })

    // A database that takes a moment to save, so both refreshes read the session before either saves
    const updateOne = payload.db.updateOne.bind(payload.db)
    vi.spyOn(payload.db, 'updateOne').mockImplementation(async (args) => {
      await wait(100)
      return updateOne(args)
    })
    onTestFinished(() => vi.restoreAllMocks())

    // Like two requests a few milliseconds apart that both found the token expired
    const first = refresh({ refreshToken: login.refreshToken, restClient }).then((res) => res.json())
    await wait(10)
    await refresh({ refreshToken: login.refreshToken, restClient })

    const { refreshToken } = await first

    moveClockForward(60 * 1000)

    expect((await refresh({ refreshToken, restClient })).status).toBe(200)
  })

  test('should keep the refresh token working when refreshing with the token', async ({
    restClient,
  }) => {
    const login = await restClient.login({ slug: collectionSlug, credentials: devUser })

    expect((await restClient.POST(`/${collectionSlug}/refresh-token`)).status).toBe(200)
    expect((await refresh({ refreshToken: login.refreshToken, restClient })).status).toBe(200)
  })

  test('should refresh with a refresh token through GraphQL', async ({ restClient }) => {
    const { data } = await restClient
      .GRAPHQL_POST({
        auth: false,
        body: JSON.stringify({
          query: `mutation {
            loginUser(email: "${devUser.email}", password: "${devUser.password}") { refreshToken }
          }`,
        }),
      })
      .then((res) => res.json())

    const refreshed = await restClient
      .GRAPHQL_POST({
        auth: false,
        body: JSON.stringify({
          query: `mutation {
            refreshTokenUser(refreshToken: "${data.loginUser.refreshToken}") { refreshedToken refreshToken }
          }`,
        }),
      })
      .then((res) => res.json())

    expect(refreshed.data.refreshTokenUser.refreshedToken).toEqual(expect.any(String))
    expect(refreshed.data.refreshTokenUser.refreshToken).not.toBe(data.loginUser.refreshToken)
  })
})
