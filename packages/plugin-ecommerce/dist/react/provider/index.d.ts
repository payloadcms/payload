import type { DefaultDocumentIDType } from 'payload';
import React from 'react';
import type { AddressesCollection, CartsCollection, ContextProps, Currency, EcommerceConfig, EcommerceContextType } from '../../types/index.js';
export declare const EcommerceProvider: React.FC<ContextProps>;
export declare const useEcommerce: () => EcommerceContextType;
export declare const useEcommerceConfig: () => EcommerceConfig;
export declare const useCurrency: () => {
    currency: Currency;
    formatCurrency: (value?: null | number, options?: {
        currency?: Currency;
    }) => string;
    setCurrency: (currency: string) => void;
    supportedCurrencies: Currency[];
};
export declare function useCart<T extends CartsCollection>(): {
    addItem: (item: {
        product: DefaultDocumentIDType;
        variant?: DefaultDocumentIDType;
    }, quantity?: number) => Promise<void>;
    cart: T;
    clearCart: () => Promise<void>;
    decrementItem: (item: string) => Promise<void>;
    incrementItem: (item: string) => Promise<void>;
    isLoading: boolean;
    refreshCart: () => Promise<void>;
    removeItem: (item: string) => Promise<void>;
};
export declare const usePayments: () => {
    confirmOrder: (paymentMethodID: string, options?: {
        additionalData: Record<string, unknown>;
    }) => Promise<unknown>;
    initiatePayment: (paymentMethodID: string, options?: {
        additionalData: Record<string, unknown>;
    }) => Promise<unknown>;
    isLoading: boolean;
    paymentMethods: import("../../types/index.js").PaymentAdapterClient[];
    selectedPaymentMethod: string | null | undefined;
};
export declare function useAddresses<T extends AddressesCollection>(): {
    addresses: T[];
    createAddress: (data: Partial<{
        [key: string]: any;
        id: DefaultDocumentIDType;
    }>) => Promise<void>;
    isLoading: boolean;
    updateAddress: (addressID: DefaultDocumentIDType, data: Partial<{
        [key: string]: any;
        id: DefaultDocumentIDType;
    }>) => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map