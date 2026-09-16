import { makeFrenchCity } from './_factory';

export const marseille = makeFrenchCity({
  slug: 'marseille',
  name: 'Marseille',
  operators: ['PAYBYPHONE', 'FLOWBIRD', 'MOCK'],
  residentFlatCents: 90,
  visitorPerHourCents: 200,
  zones: [
    { code: 'marseille-vieux-port', name: 'Vieux-Port', kind: 'ROTATING', aliases: ['vieux-port', '13001'] },
    { code: 'marseille-prado', name: 'Prado', kind: 'MIXED', aliases: ['prado', '13008'] },
    { code: 'marseille-joliette', name: 'Joliette', kind: 'RESIDENTIAL', aliases: ['joliette', '13002'] },
  ],
});
