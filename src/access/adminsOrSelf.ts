import type { Access } from 'payload'
// Admins see everything; a customer sees only their own record.
export const adminsOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.collection === 'users') return true
  return { id: { equals: user.id } }
}
