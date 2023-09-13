import type { Header, Page, Profile, Project } from '../../payload-types'
import type { DraftOptions } from './preview'

export const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

const initPreviewRequest = (init: RequestInit, qs: URLSearchParams, token: string): void => {
  if (!token) {
    throw new Error('No token provided when attempting to preview content')
  }

  qs.append('draft', 'true')
  init.cache = 'no-store'
  init.headers = {
    cookie: `payload-token=${token};path=/;HttpOnly`,
  }
}

export const fetchProfile = async (): Promise<Profile> => {
  const url = `${serverUrl}/api/globals/profile?locale=en`

  const profile: Profile = await fetch(url, {
    cache: 'force-cache',
    next: { tags: ['global.profile'] },
  }).then(res => {
    return res.json()
  })

  return profile
}

export const fetchHeader = async (): Promise<Header> => {
  const url = `${serverUrl}/api/globals/header?locale=en`
  const header: Header = await fetch(url, {
    cache: 'force-cache',
    next: { tags: ['global.header'] },
  }).then(res => res.json())

  return header
}

type FetchPageOptions = DraftOptions

export const fetchPage = async (
  slug: string,
  options: FetchPageOptions,
): Promise<Page | undefined> => {
  const qs = new URLSearchParams({ 'where[slug][equals]': slug })
  const init: RequestInit = { next: { tags: [`pages/${slug}`] } }
  if (options.draft) {
    initPreviewRequest(init, qs, options.payloadToken)
  }

  const url = `${serverUrl}/api/pages?${qs.toString()}`
  const page: Page = await fetch(url, init)
    .then(res => res.json())
    .then(res => res?.docs?.[0])

  return page
}

type FetchProjectOptions = DraftOptions

export const fetchProject = async (
  slug: string,
  options: FetchProjectOptions,
): Promise<Project> => {
  const qs = new URLSearchParams(`where[slug][equals]=${slug}`)
  const init: RequestInit = {}

  if (options.draft) {
    initPreviewRequest(init, qs, options.payloadToken)
  } else {
    init.next = { tags: [`projects/${slug}`] }
  }

  const url = `${serverUrl}/api/projects?${qs.toString()}`
  const project: Project = await fetch(url, init)
    .then(res => res.json())
    .then(res => res?.docs?.[0])

  return project
}
