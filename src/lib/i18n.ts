// Locale plumbing for the storefront. Adding a real Arabic/English translation later
// only means filling in the dictionaries below — no routing/structure changes needed.

export const locales = ['fr', 'ar', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'fr'

export function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

/** Text direction for a locale — drives <html dir> and logical CSS in RTL. */
export function dirFor(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

// Despite the name (kept to avoid touching working header call sites), this now
// covers all app-owned UI chrome/microcopy, not just the nav bar — content that
// belongs to the admin (names, prices, descriptions) never lives here.
type NavDict = {
  accueil: string
  aPropos: string
  produits: string
  collection: string
  contact: string
  panier: string
  ensemble: string
  fermer: string
  ouvrirMenu: string
  ajouterAuPanier: string
  ruptureDeStock: string
  ajouteAuPanier: string
  diminuerQuantite: string
  augmenterQuantite: string
  contenuDeLEnsemble: string
  aucuneCategorie: string
  aucunProduit: string
  // Auth
  seConnecter: string
  monCompte: string
  seDeconnecter: string
  connexionTitre: string
  inscriptionTitre: string
  email: string
  motDePasse: string
  confirmerMotDePasse: string
  nomComplet: string
  telephone: string
  champRequis: string
  emailInvalide: string
  motsDePasseDifferents: string
  erreurConnexion: string
  emailDejaUtilise: string
  erreurGenerique: string
  connexionEnCours: string
  creationEnCours: string
  pasDeCompte: string
  creerUnCompte: string
  dejaUnCompte: string
  // Panier / checkout
  panierVide: string
  voirLesProduits: string
  retirer: string
  quantiteLimiteeParStock: string
  sousTotal: string
  livraison: string
  total: string
  livraisonOfferte: string
  choisirGouvernorat: string
  fraisCalculesEtapeSuivante: string
  passerLaCommande: string
  commandeEtapeSuivante: string
  commandeTitre: string
  fraisNonDisponibles: string
  adresseLivraison: string
  ligne1: string
  ville: string
  gouvernorat: string
  notes: string
  notesOptionnelles: string
  paiementLivraison: string
  paiementLivraisonNotice: string
  confirmerLaCommande: string
  commandeEnCours: string
  changementsDetectes: string
  jaiVuContinuer: string
  numeroDeCommande: string
  recapitulatif: string
  quantiteAbbr: string
  paiementLivraisonConfirmation: string
  statut: string
  statutPlacee: string
  statutConfirmee: string
  statutExpediee: string
  statutLivree: string
  statutRetournee: string
  statutAnnulee: string
  // Account area
  mesCommandes: string
  mesAdresses: string
  monProfil: string
  aucuneCommande: string
  commandeDu: string
  ajouterUneAdresse: string
  modifier: string
  supprimer: string
  enregistrer: string
  annuler: string
  aucuneAdresseEnregistree: string
  definirParDefaut: string
  adresseParDefaut: string
  libelleAdresse: string
  libelleAdressePlaceholder: string
  confirmerSuppressionAdresse: string
  informationsPersonnelles: string
  emailNonModifiable: string
  profilMisAJour: string
  changerMotDePasse: string
  motDePasseActuel: string
  nouveauMotDePasse: string
  confirmerNouveauMotDePasse: string
  motDePasseModifie: string
  motDePasseActuelIncorrect: string
  motDePasseTropCourt: string
  enregistrementEnCours: string
  // Collection showcase
  collectionBientot: string
  // Footer promo cards + coming-soon pages
  parrainageTitre: string
  parrainageAccroche: string
  parrainageCta: string
  espaceProTitre: string
  espaceProAccroche: string
  espaceProCta: string
  fideliteTitre: string
  fideliteAccroche: string
  fideliteCta: string
  bientotDisponible: string
  bientotDisponibleTexte: string
  retourAlAccueil: string
  droitsReserves: string
}

// FR is the only real copy for now. ar/en intentionally fall back to it — this is
// structure only, not translation work.
const fr: NavDict = {
  accueil: 'Accueil',
  aPropos: 'À propos',
  produits: 'Produits',
  collection: 'Collection',
  contact: 'Contact',
  panier: 'Panier',
  ensemble: 'Ensemble',
  fermer: 'Fermer',
  ouvrirMenu: 'Ouvrir le menu',
  ajouterAuPanier: 'Ajouter au panier',
  ruptureDeStock: 'Rupture de stock',
  ajouteAuPanier: 'Ajouté au panier',
  diminuerQuantite: 'Réduire la quantité',
  augmenterQuantite: 'Augmenter la quantité',
  contenuDeLEnsemble: 'Contenu de l’ensemble',
  aucuneCategorie: 'Aucune catégorie pour l’instant.',
  aucunProduit: 'Aucun produit dans cette catégorie pour l’instant.',
  seConnecter: 'Se connecter',
  monCompte: 'Mon compte',
  seDeconnecter: 'Se déconnecter',
  connexionTitre: 'Connexion',
  inscriptionTitre: 'Créer un compte',
  email: 'Email',
  motDePasse: 'Mot de passe',
  confirmerMotDePasse: 'Confirmer le mot de passe',
  nomComplet: 'Nom complet',
  telephone: 'Téléphone',
  champRequis: 'Ce champ est requis.',
  emailInvalide: 'Adresse email invalide.',
  motsDePasseDifferents: 'Les mots de passe ne correspondent pas.',
  erreurConnexion: 'Email ou mot de passe incorrect.',
  emailDejaUtilise: 'Cet email est déjà utilisé.',
  erreurGenerique: 'Une erreur est survenue. Réessayez.',
  connexionEnCours: 'Connexion…',
  creationEnCours: 'Création du compte…',
  pasDeCompte: 'Pas encore de compte ?',
  creerUnCompte: 'Créer un compte',
  dejaUnCompte: 'Déjà un compte ?',
  panierVide: 'Votre panier est vide.',
  voirLesProduits: 'Voir les produits',
  retirer: 'Retirer',
  quantiteLimiteeParStock: 'Quantité limitée par le stock disponible.',
  sousTotal: 'Sous-total',
  livraison: 'Livraison',
  total: 'Total',
  livraisonOfferte: 'Livraison offerte',
  choisirGouvernorat: 'Choisir un gouvernorat',
  fraisCalculesEtapeSuivante: 'Frais de livraison calculés à l’étape suivante.',
  passerLaCommande: 'Passer la commande',
  commandeEtapeSuivante: 'Commande — étape suivante',
  commandeTitre: 'Commande',
  fraisNonDisponibles: 'Frais de livraison non disponibles pour ce gouvernorat — contactez-nous.',
  adresseLivraison: 'Adresse de livraison',
  ligne1: 'Adresse',
  ville: 'Ville',
  gouvernorat: 'Gouvernorat',
  notes: 'Notes',
  notesOptionnelles: 'Notes (optionnel)',
  paiementLivraison: 'Paiement à la livraison',
  paiementLivraisonNotice: 'Paiement à la livraison — c’est le seul mode de paiement proposé pour le moment.',
  confirmerLaCommande: 'Confirmer la commande',
  commandeEnCours: 'Commande en cours…',
  changementsDetectes: 'Votre panier a été mis à jour :',
  jaiVuContinuer: 'J’ai vu, continuer',
  numeroDeCommande: 'Commande',
  recapitulatif: 'Récapitulatif',
  quantiteAbbr: 'Qté',
  paiementLivraisonConfirmation: 'Paiement à la livraison — nous vous appellerons pour confirmer.',
  statut: 'Statut',
  statutPlacee: 'Placée',
  statutConfirmee: 'Confirmée',
  statutExpediee: 'Expédiée',
  statutLivree: 'Livrée',
  statutRetournee: 'Retournée',
  statutAnnulee: 'Annulée',
  mesCommandes: 'Commandes',
  mesAdresses: 'Adresses',
  monProfil: 'Profil',
  aucuneCommande: 'Aucune commande pour le moment.',
  commandeDu: 'du',
  ajouterUneAdresse: 'Ajouter une adresse',
  modifier: 'Modifier',
  supprimer: 'Supprimer',
  enregistrer: 'Enregistrer',
  annuler: 'Annuler',
  aucuneAdresseEnregistree: 'Aucune adresse enregistrée.',
  definirParDefaut: 'Définir par défaut',
  adresseParDefaut: 'Par défaut',
  libelleAdresse: 'Libellé (optionnel)',
  libelleAdressePlaceholder: 'Maison, bureau…',
  confirmerSuppressionAdresse: 'Supprimer cette adresse ?',
  informationsPersonnelles: 'Informations personnelles',
  emailNonModifiable: 'L’adresse email ne peut pas être modifiée pour le moment.',
  profilMisAJour: 'Profil mis à jour.',
  changerMotDePasse: 'Changer le mot de passe',
  motDePasseActuel: 'Mot de passe actuel',
  nouveauMotDePasse: 'Nouveau mot de passe',
  confirmerNouveauMotDePasse: 'Confirmer le nouveau mot de passe',
  motDePasseModifie: 'Mot de passe modifié.',
  motDePasseActuelIncorrect: 'Mot de passe actuel incorrect.',
  motDePasseTropCourt: 'Le mot de passe doit contenir au moins 8 caractères.',
  enregistrementEnCours: 'Enregistrement…',
  collectionBientot: 'Bientôt.',
  parrainageTitre: 'Parrainage',
  parrainageAccroche: 'Partagez Maison Dinamika et profitez d’avantages.',
  parrainageCta: 'Parrainer un proche',
  espaceProTitre: 'Espace PRO',
  espaceProAccroche: 'Des solutions pensées pour les professionnels.',
  espaceProCta: 'Découvrir',
  fideliteTitre: 'Fidélité',
  fideliteAccroche: 'Cumulez vos avantages et profitez de vos achats.',
  fideliteCta: 'Découvrir',
  bientotDisponible: 'Bientôt disponible',
  bientotDisponibleTexte: 'Cette page est en cours de préparation — revenez bientôt pour la découvrir.',
  retourAlAccueil: 'Retour à l’accueil',
  droitsReserves: 'Tous droits réservés.',
}

const dictionaries: Record<Locale, NavDict> = {
  fr,
  ar: fr,
  en: fr,
}

export function getNavDict(locale: Locale): NavDict {
  return dictionaries[locale]
}

/** Path helpers — the single source of truth for the storefront's URL scheme. */
export const paths = {
  home: (l: Locale) => `/${l}`,
  aPropos: (l: Locale) => `/${l}/a-propos`,
  produits: (l: Locale) => `/${l}/produits`,
  categorie: (l: Locale, slug: string) => `/${l}/produits/${slug}`,
  produit: (l: Locale, slug: string) => `/${l}/produit/${slug}`,
  ensemble: (l: Locale, slug: string) => `/${l}/ensemble/${slug}`,
  collection: (l: Locale) => `/${l}/collection`,
  panier: (l: Locale) => `/${l}/panier`,
  contact: (l: Locale) => `/${l}#contact`,
  connexion: (l: Locale) => `/${l}/connexion`,
  inscription: (l: Locale) => `/${l}/inscription`,
  commande: (l: Locale) => `/${l}/commande`,
  compte: (l: Locale) => `/${l}/compte`,
  compteAdresses: (l: Locale) => `/${l}/compte/adresses`,
  compteProfil: (l: Locale) => `/${l}/compte/profil`,
  compteCommande: (l: Locale, orderNumber: string) => `/${l}/compte/commande/${orderNumber}`,
  confirmation: (l: Locale, orderNumber: string) => `/${l}/commande/confirmation/${orderNumber}`,
  parrainage: (l: Locale) => `/${l}/parrainage`,
  espacePro: (l: Locale) => `/${l}/espace-pro`,
  fidelite: (l: Locale) => `/${l}/fidelite`,
}
