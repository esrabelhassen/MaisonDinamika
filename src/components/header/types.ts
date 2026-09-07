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
  /** Category itself has no page/slug worth linking to anymore — it's a
   * grouping label in the menu; only its sous-catégories are clickable. */
  sousCategories: NavItem[]
}

export type ContactData = {
  facebook: string | null
  instagram: string | null
  phone: string | null
  email: string | null
}
