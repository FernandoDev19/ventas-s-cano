export const PaymentMethods = {
  CASH: 'cash',
  CARD: 'card',
  NEQUI: 'Nequi',
} as const;

export type PaymentMethodsType = typeof PaymentMethods[keyof typeof PaymentMethods];
