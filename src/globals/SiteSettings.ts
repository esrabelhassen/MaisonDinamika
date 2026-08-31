import type { GlobalConfig } from 'payload'
import { admins } from '../access/admins'
import { anyone } from '../access/anyone'
import { governorates } from '../lib/governorates'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Paramètres',
  admin: { group: 'Système' },
  access: { read: anyone, update: admins },
  fields: [
    { name: 'brandName', type: 'text', defaultValue: 'Maison Dinamika' },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'freeDeliveryThresholdTND',
      type: 'number',
      admin: { step: 0.001, description: 'Livraison offerte au-dessus de ce montant (optionnel)' },
    },
    {
      name: 'deliveryFees',
      label: 'Frais de livraison par gouvernorat',
      type: 'array',
      fields: [
        { name: 'governorate', type: 'select', options: governorates, required: true },
        { name: 'feeTND', type: 'number', required: true, min: 0, admin: { step: 0.001 } },
      ],
    },
  ],
}
