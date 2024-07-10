import type { Access } from "payload";

export const isAccessingSelf: Access = ({ req, id }) => {
  if (!req?.user) return false
  return req.user.id === id
}