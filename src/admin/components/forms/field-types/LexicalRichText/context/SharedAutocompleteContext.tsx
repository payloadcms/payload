/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Suggestion = null | string;
type CallbackFn = (newSuggestion: Suggestion) => void;
type SubscribeFn = (callbackFn: CallbackFn) => () => void;
type PublishFn = (newSuggestion: Suggestion) => void;
type ContextShape = [SubscribeFn, PublishFn];
type HookShape = [suggestion: Suggestion, setSuggestion: PublishFn];

const Context: React.Context<ContextShape> = createContext([
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  (_cb) => () => {

  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  (_newSuggestion: Suggestion) => {

  },
]);

export const SharedAutocompleteContext = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const context: ContextShape = useMemo(() => {
    let suggestion: Suggestion | null = null;
    const listeners: Set<CallbackFn> = new Set();
    return [
      (cb: (newSuggestion: Suggestion) => void) => {
        cb(suggestion);
        listeners.add(cb);
        return () => {
          listeners.delete(cb);
        };
      },
      (newSuggestion: Suggestion) => {
        suggestion = newSuggestion;
        // eslint-disable-next-line no-restricted-syntax
        for (const listener of listeners) {
          listener(newSuggestion);
        }
      },
    ];
  }, []);
  return <Context.Provider value={context}>{children}</Context.Provider>;
};

export const useSharedAutocompleteContext = (): HookShape => {
  const [subscribe, publish]: ContextShape = useContext(Context);
  const [suggestion, setSuggestion] = useState<Suggestion>(null);
  useEffect(() => {
    return subscribe((newSuggestion: Suggestion) => {
      setSuggestion(newSuggestion);
    });
  }, [subscribe]);
  return [suggestion, publish];
};
