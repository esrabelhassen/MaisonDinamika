import type { CollectionConfig } from 'payload'
import { admins } from '../access/admins'
import { governorates } from '../lib/governorates'

// Money is handled in millimes (integer) for sums, because the Tunisian dinar has
// 3 decimals and repeated float addition drifts. Line prices are FROZEN at add-to-cart
// time by the storefront (unitPriceTND) — we never re-read live prices here.
const toMillimes = (tnd: number) => Math.round((tnd || 0) * 1000)
const toTND = (m: number) => m / 1000

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Commande', plural: 'Commandes' },
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Boutique',
    defaultColumns: ['orderNumber', 'customer', 'totalTND', 'status', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => Boolean(user), // a logged-in customer places their order
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { customer: { equals: user.id } }
    },
    update: admins,
    delete: admins,
  },
  fields: [
    { name: 'orderNumber', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'customer', type: 'relationship', relationTo: 'customers', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'placee',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Placée', value: 'placee' },
        { label: 'Confirmée', value: 'confirmee' },
        { label: 'Expédiée', value: 'expediee' },
        { label: 'Livrée', value: 'livree' },
        { label: 'Retournée', value: 'retournee' },
        { label: 'Annulée', value: 'annulee' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Ligne', plural: 'Lignes' },
      fields: [
        {
          name: 'itemType',
          type: 'select',
          required: true,
          options: [
            { label: 'Produit', value: 'product' },
            { label: 'Ensemble', value: 'set' },
          ],
        },
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          admin: { condition: (_, sibling) => sibling?.itemType === 'product' },
        },
        {
          name: 'set',
          type: 'relationship',
          relationTo: 'sets',
          admin: { condition: (_, sibling) => sibling?.itemType === 'set' },
        },
        { name: 'nameSnapshot', type: 'text', required: true },
        {
          name: 'unitPriceTND',
          type: 'number',
          required: true,
          min: 0,
          admin: { step: 0.001, description: 'Prix figé au moment de l’ajout au panier' },
        },
        { name: 'qty', type: 'number', required: true, defaultValue: 1, min: 1 },
      ],
    },
    { name: 'governorate', type: 'select', options: governorates, required: true },
    { name: 'deliveryFeeTND', type: 'number', min: 0, defaultValue: 0, admin: { step: 0.001 } },
    { name: 'subtotalTND', type: 'number', admin: { readOnly: true } },
    { name: 'totalTND', type: 'number', admin: { readOnly: true } },
    {
      name: 'shippingAddress',
      type: 'group',
      label: 'Adresse de livraison',
      fields: [
        { name: 'fullName', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true },
        { name: 'line1', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
      ],
    },
    { name: 'notes', type: 'textarea' },
    {
      name: 'paymentMethod',
      type: 'text',
      defaultValue: 'Paiement à la livraison',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && !data.orderNumber) {
          data.orderNumber = 'MD-' + Date.now().toString(36).toUpperCase()
        }

        const items: Array<{ unitPriceTND?: number; qty?: number }> = Array.isArray(data.items)
          ? data.items
          : []
        const subM = items.reduce((s, it) => s + toMillimes(it.unitPriceTND || 0) * (it.qty || 1), 0)

        // SiteSettings is read at most once, lazily — most updates (status changes
        // etc.) never touch governorate/items and shouldn't pay for the lookup.
        type Settings = {
          deliveryFees?: Array<{ governorate?: string; feeTND?: number }> | null
          freeDeliveryThresholdTND?: number | null
        }
        let settings: Settings | null = null
        let settingsLoaded = false
        async function loadSettings(): Promise<Settings | null> {
          if (settingsLoaded) return settings
          settingsLoaded = true
          try {
            settings = await req.payload.findGlobal({ slug: 'site-settings', req })
          } catch {
            settings = null // global may not be seeded yet
          }
          return settings
        }

        // Fill delivery fee from SiteSettings ONLY when truly unset — an explicit 0
        // (e.g. free delivery already applied upstream, by us below or by the
        // storefront) must never be silently overwritten back to a paid fee.
        if (data.deliveryFeeTND == null && data.governorate) {
          const s = await loadSettings()
          const match = (s?.deliveryFees || []).find((f) => f.governorate === data.governorate)
          if (match?.feeTND != null) data.deliveryFeeTND = match.feeTND
        }

        // Free-delivery threshold is the single source of truth for the final fee:
        // applies whenever the subtotal clears it, regardless of whether the fee
        // above was just filled, sent explicitly by the storefront, or typed by an
        // admin creating/editing an order directly in /admin.
        const s = await loadSettings()
        if (s?.freeDeliveryThresholdTND != null) {
          const thresholdM = toMillimes(s.freeDeliveryThresholdTND)
          if (subM >= thresholdM) data.deliveryFeeTND = 0
        }

        const totM = subM + toMillimes(data.deliveryFeeTND || 0)
        data.subtotalTND = toTND(subM)
        data.totalTND = toTND(totM)
        return data
      },
    ],
  },
}
