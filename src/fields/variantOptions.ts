import type { Field } from 'payload'

// Shared by Products.ts and Sets.ts: three admin-optional variant sections
// (Pack / Dimension / Couleur), each just an array of {label, image, priceTND}
// rows. A section with zero rows simply doesn't render on the storefront
// product page (see VariantSelector.tsx) — there's no separate "enabled"
// toggle, leaving the array empty IS "disabled". `image` and `priceTND` are
// both optional per row: an option without one is still shown as a pickable
// pill, it just doesn't swap the gallery's active photo / the displayed price
// when clicked (see ProductDetailLayout.tsx) — the base product/set price
// stays in effect until an option that DOES set its own price is selected.
function variantOptionRow(): Field[] {
  return [
    { name: 'label', type: 'text', required: true, localized: true },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Facultatif — l’image affichée quand le client sélectionne cette option. Laisser vide si elle ne change pas la photo.',
      },
    },
    {
      name: 'priceTND',
      label: 'Prix (TND)',
      type: 'number',
      min: 0,
      admin: {
        step: 0.001,
        description:
          'Facultatif — remplace le prix affiché quand le client sélectionne cette option (ex. un pack avec plus de pièces). Laisser vide pour garder le prix de base.',
      },
    },
  ]
}

/** Spread into a collection's `fields` array (see Products.ts/Sets.ts). Grouped
 * under `variants` so the data lands as `doc.variants.{couleurs,dimensions,packs}`
 * — one nested shape shared by both collections and by the frontend query layer. */
export function variantsField(): Field {
  return {
    name: 'variants',
    type: 'group',
    label: 'Variantes (Pack / Dimension / Couleur)',
    admin: {
      description:
        'Chaque section n’apparaît sur la fiche produit que si elle contient au moins une option — inutile de la « désactiver », laissez-la simplement vide.',
    },
    fields: [
      {
        name: 'couleurs',
        label: 'Couleur',
        type: 'array',
        labels: { singular: 'Couleur', plural: 'Couleurs' },
        fields: variantOptionRow(),
      },
      {
        name: 'dimensions',
        label: 'Dimension',
        type: 'array',
        labels: { singular: 'Dimension', plural: 'Dimensions' },
        fields: variantOptionRow(),
      },
      {
        name: 'packs',
        label: 'Pack',
        type: 'array',
        labels: { singular: 'Pack', plural: 'Packs' },
        fields: variantOptionRow(),
      },
    ],
  }
}
