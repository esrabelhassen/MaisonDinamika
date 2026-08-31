export const formatSlug = (val: string): string =>
  val
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
