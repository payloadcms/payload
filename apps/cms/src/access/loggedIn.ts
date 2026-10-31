import type { Access } from 'payload'

/** Only logged-in users, e.g. for internal records that must never be public */
export const loggedIn: Access = ({ req }) => Boolean(req.user)
