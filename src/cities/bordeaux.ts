import { makeFrenchCity } from './_factory';

export const bordeaux = makeFrenchCity({
  slug: 'bordeaux',
  name: 'Bordeaux',
  operators: ['PAYBYPHONE', 'EASYPARK', 'FLOWBIRD', 'MOCK'],
  residentFlatCents: 100,
  visitorPerHourCents: 250,
  zones: [
    { code: 'bordeaux-centre', name: 'Bordeaux Centre', kind: 'ROTATING', aliases: ['centre', '33000'] },
    { code: 'bordeaux-chartrons', name: 'Chartrons', kind: 'RESIDENTIAL', aliases: ['chartrons'] },
    { code: 'bordeaux-bastide', name: 'La Bastide', kind: 'RESIDENTIAL', aliases: ['bastide', '33100'] },
  ],
});
