// Plain-data shapes handed from the server (Header.tsx) to the client shell —
// deliberately not the full Payload types, just what the nav needs to render.

export type NavItem = {
  id: number
  name: string
  slug: string
}

export type CategoryNav = {
  id: number
  name: string
  slug: string
  products: NavItem[]
  sets: NavItem[]
}

export type ContactData = {
  facebook: string | null
  instagram: string | null
  phone: string | null
  email: string | null
}
