import React from 'react';
import { User } from '../../../../auth/types';
import { AuthContext } from './types';
export declare const AuthProvider: React.FC<{
    children: React.ReactNode;
}>;
type UseAuth<T = User> = () => AuthContext<T>;
export declare const useAuth: UseAuth;
export {};
