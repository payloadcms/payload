import type { Header, Page, Profile, Project } from '../../payload/payload-types'
import type { DraftOptions } from './preview'

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
  if (!process.env.PAYLOAD_PUBLIC_SERVER_URL) throw new Error('PAYLOAD_PUBLIC_SERVER_URL not found')

  const url = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/globals/profile?locale=en`

  const profile: Profile = await fetch(url, {
    cache: 'force-cache',
    next: { tags: ['global.profile'] },
  }).then(res => {
    if (!res.ok) throw new Error('Error fetching profile doc')
    return res.json()
  })

  return profile
}

export const fetchHeader = async (): Promise<Header> => {
  if (!process.env.PAYLOAD_PUBLIC_SERVER_URL) throw new Error('PAYLOAD_PUBLIC_SERVER_URL not found')

  const url = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/globals/header?locale=en`
  const header: Header = await fetch(url, {
    cache: 'force-cache',
    next: { tags: ['global.header'] },
  }).then(res => {
    if (!res.ok) throw new Error('Error fetching header doc')
    return res.json()
  })

  return header
}

type FetchPageOptions = DraftOptions

export const fetchPage = async (
  slug: string,
  options: FetchPageOptions,
): Promise<Page | undefined> => {
  if (!process.env.PAYLOAD_PUBLIC_SERVER_URL) throw new Error('PAYLOAD_PUBLIC_SERVER_URL not found')

  const qs = new URLSearchParams({ 'where[slug][equals]': slug })
  const init: RequestInit = { next: { tags: [`pages/${slug}`] } }
  if (options.draft) {
    initPreviewRequest(init, qs, options.payloadToken)
  }

  const url = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/pages?${qs.toString()}`
  const page: Page = await fetch(url, init)
    .then(res => {
      if (!res.ok) throw new Error('Error fetching page doc')
      return res.json()
    })
    .then(res => res?.docs?.[0])

  return page
}

type FetchProjectOptions = DraftOptions

export const fetchProject = async (
  slug: string,
  options: FetchProjectOptions,
): Promise<Project> => {
  if (!process.env.PAYLOAD_PUBLIC_SERVER_URL) throw new Error('PAYLOAD_PUBLIC_SERVER_URL not found')

  const qs = new URLSearchParams(`where[slug][equals]=${slug}`)
  const init: RequestInit = {}

  if (options.draft) {
    initPreviewRequest(init, qs, options.payloadToken)
  } else {
    init.next = { tags: [`projects/${slug}`] }
  }

  const url = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/projects?${qs.toString()}`
  const project: Project = await fetch(url, init)
    .then(res => {
      if (!res.ok) throw new Error('Error fetching project doc')
      return res.json()
    })
    .then(res => res?.docs?.[0])

  return project
}

export const fetchPages = async (options?: FetchPageOptions): Promise<Page[]> => {
  if (!process.env.PAYLOAD_PUBLIC_SERVER_URL) throw new Error('PAYLOAD_PUBLIC_SERVER_URL not found')

  const qs = new URLSearchParams()

  const init: RequestInit = { next: { tags: ['pages'] } }
  if (options?.draft) {
    initPreviewRequest(init, qs, options.payloadToken)
  }

  const url = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/pages`
  const pages: Page[] = await fetch(url, init)
    .then(res => {
      if (!res.ok) throw new Error('Error fetching pages doc')
      return res.json()
    })
    .then(res => res?.docs || [])

  return pages
}

export const fetchProjects = async (options?: FetchProjectOptions): Promise<Project[]> => {
  if (!process.env.PAYLOAD_PUBLIC_SERVER_URL) throw new Error('PAYLOAD_PUBLIC_SERVER_URL not found')

  const init: RequestInit = {}

  if (options.draft) {
    initPreviewRequest(init, undefined, options.payloadToken)
  } else {
    init.next = { tags: ['projects'] }
  }

  const url = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/projects`
  const projects: Project[] = await fetch(url, init)
    .then(res => {
      if (!res.ok) throw new Error('Error fetching projects doc')
      return res.json()
    })
    .then(res => res?.docs || [])

  return projects
}
