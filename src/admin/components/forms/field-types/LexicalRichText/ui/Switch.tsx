/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import {useMemo} from 'react';

export default function Switch({
  checked,
  onClick,
  text,
  id,
}: Readonly<{
  checked: boolean;
  id?: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  text: string;
}>): JSX.Element {
  const buttonId = useMemo(() => 'id_' + Math.floor(Math.random() * 10000), []);
  return (
    <div className="switch" id={id}>
      <label htmlFor={buttonId}>{text}</label>
      <button
        role="switch"
        aria-checked={checked}
        id={buttonId}
        onClick={onClick}>
        <span />
      </button>
    </div>
  );
}
