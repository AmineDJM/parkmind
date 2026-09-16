import { makeFrenchCity } from './_factory';

export const lille = makeFrenchCity({
  slug: 'lille',
  name: 'Lille',
  operators: ['PAYBYPHONE', 'INDIGO_NEO', 'MOCK'],
  residentFlatCents: 100,
  visitorPerHourCents: 230,
  zones: [
    { code: 'lille-centre', name: 'Lille Centre', kind: 'ROTATING', aliases: ['centre', '59000'] },
    { code: 'lille-vieux-lille', name: 'Vieux-Lille', kind: 'RESIDENTIAL', aliases: ['vieux-lille'] },
    { code: 'lille-wazemmes', name: 'Wazemmes', kind: 'RESIDENTIAL', aliases: ['wazemmes'] },
  ],
});
