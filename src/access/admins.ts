import type { Access } from 'payload'
// Only dashboard users (the `users` collection), not authenticated storefront customers.
export const admins: Access = ({ req: { user } }) => user?.collection === 'users'
