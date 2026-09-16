import { makeFrenchCity } from './_factory';

export const lyon = makeFrenchCity({
  slug: 'lyon',
  name: 'Lyon',
  operators: ['PAYBYPHONE', 'EASYPARK', 'MOCK'],
  residentFlatCents: 120,
  visitorPerHourCents: 270,
  zones: [
    { code: 'lyon-presquile', name: 'Presqu’île', kind: 'ROTATING', aliases: ['presquile', '69002'] },
    { code: 'lyon-croix-rousse', name: 'Croix-Rousse', kind: 'RESIDENTIAL', aliases: ['croix-rousse', '69004'] },
    { code: 'lyon-part-dieu', name: 'Part-Dieu', kind: 'MIXED', aliases: ['part-dieu', '69003'] },
  ],
});
