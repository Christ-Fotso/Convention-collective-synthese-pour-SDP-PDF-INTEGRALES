import { type Category } from '@/types';

export const CATEGORIES: Category[] = [
  {
    id: 'informations-generales',
    name: 'Informations Générales',
    subcategories: [
      { id: 'generale', name: 'Informations Générales' }
    ]
  },
  {
    id: 'embauche',
    name: 'Embauche',
    subcategories: [
      { id: 'delai-prevenance', name: 'Délai de Prévenance' },
      { id: 'duree-travail', name: 'Durée du Temps de Travail' },
      { id: 'periode-essai', name: 'Période d\'essai' }
    ]
  },
  {
    id: 'conges',
    name: 'Congés',
    subcategories: [
      { id: 'cet', name: 'CET' },
      { id: 'conges-payes', name: 'Congés Payés' },
      { id: 'evenement-familial', name: 'Evènement Familial' }
    ]
  },
  {
    id: 'classification',
    name: 'Classification',
    subcategories: [
      { id: 'classification-details', name: 'Classification Con + Détails' }
    ]
  },
  {
    id: 'cotisations',
    name: 'Cotisations',
    subcategories: [
      { id: 'prevoyance', name: 'Cotisation Prévoyance' },
      { id: 'retraite', name: 'Cotisation Retraite' },
      { id: 'mutuelle', name: 'Cotisation Mutuelle' }
    ]
  },
  {
    id: 'maintien-salaire',
    name: 'Maintien de Salaire',
    subcategories: [
      { id: 'accident-travail', name: 'Accident de Travail' },
      { id: 'maladie', name: 'Maladie' },
      { id: 'maternite-paternite', name: 'Maternité / Paternité' }
    ]
  },
  {
    id: 'remuneration',
    name: 'Rémunération',
    subcategories: [
      { id: 'apprenti', name: 'Apprenti / Contrat Pro / Stagiaire' },
      { id: 'prime', name: 'Prime' },
      { id: 'grille', name: 'Grille de Rémunération' },
      { id: 'majoration-dimanche', name: 'Majoration Dimanche' },
      { id: 'majoration-ferie', name: 'Majoration Férié' },
      { id: 'majoration-nuit', name: 'Majoration Nuit' }
    ]
  },
  {
    id: 'depart',
    name: 'Départ',
    subcategories: [
      { id: 'indemnite-licenciement', name: 'Indemnité de Licenciement' },
      { id: 'indemnite-mise-retraite', name: 'Indemnité de Mise a la Retraite' },
      { id: 'indemnite-depart-retraite', name: 'Indemnité de Départ a la Retraite' },
      { id: 'indemnite-rupture', name: 'Indemnité de Rupture Conventionnelle' },
      { id: 'indemnite-precarite', name: 'Indemnité de Précarité' },
      { id: 'preavis', name: 'Préavis' }
    ]
  }
];