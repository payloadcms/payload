import type { Access } from 'payload'

/** Logged-in users see drafts; everyone else (e.g. the website) only sees published documents */
export const publishedOrLoggedIn: Access = ({ req }) =>
  req.user ? true : { _status: { equals: 'published' } }
