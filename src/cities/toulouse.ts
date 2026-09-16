import { makeFrenchCity } from './_factory';

export const toulouse = makeFrenchCity({
  slug: 'toulouse',
  name: 'Toulouse',
  operators: ['PAYBYPHONE', 'EASYPARK', 'INDIGO_NEO', 'MOCK'],
  residentFlatCents: 110,
  visitorPerHourCents: 240,
  zones: [
    { code: 'toulouse-capitole', name: 'Capitole', kind: 'ROTATING', aliases: ['capitole', '31000'] },
    { code: 'toulouse-saint-cyprien', name: 'Saint-Cyprien', kind: 'RESIDENTIAL', aliases: ['saint-cyprien'] },
    { code: 'toulouse-carmes', name: 'Carmes', kind: 'MIXED', aliases: ['carmes'] },
  ],
});
