/* eslint-disable react/require-default-props  */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-use-before-define */
import React, { useState, useEffect, Fragment } from 'react';
import { Pill } from './Pill';

export const LengthIndicator: React.FC<{
  text?: string
  minLength?: number
  maxLength?: number
}> = (props) => {
  const {
    text,
    minLength,
    maxLength,
  } = props;

  const [labelStyle, setLabelStyle] = useState({
    color: '',
    backgroundColor: '',
  });

  const [label, setLabel] = useState('');
  const [barWidth, setBarWidth] = useState<number>(0);

  useEffect(() => {
    const textLength = text?.length || 0;
    const progress = (textLength - minLength) / (maxLength - minLength);

    if (progress < 0) {
      const ratioUntilMin = textLength / minLength;

      if (ratioUntilMin > 0.9) {
        setLabel('Almost there');
        setLabelStyle({
          backgroundColor: 'yellow',
          color: 'black',
        });
      } else {
        setLabel('Too short');
        setLabelStyle({
          backgroundColor: 'red',
          color: 'white',
        });
      }

      setBarWidth(ratioUntilMin);
    }

    if (progress >= 0 && progress <= 1) {
      setLabel('Good');
      setLabelStyle({
        backgroundColor: 'green',
        color: 'white',
      });
      setBarWidth(progress);
    }

    if (progress > 1) {
      setLabel('Too long');
      setLabelStyle({
        backgroundColor: 'red',
        color: 'white',
      });
      setBarWidth(1);
    }
  }, [
    minLength,
    maxLength,
    text,
  ]);

  const charsUntilMax = maxLength - text?.length || 0;
  const charsUntilMin = minLength - text?.length || 0;

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Pill
        label={label}
        color={labelStyle.color}
        backgroundColor={labelStyle.backgroundColor}
      />
      <div
        style={{
          marginRight: '10px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <small>
          {`${text?.length || 0}/${minLength}-${maxLength} chars, `}
          {charsUntilMin > 0 && (
            <Fragment>
              {`${charsUntilMin} to go`}
            </Fragment>
          )}
          {charsUntilMin <= 0 && charsUntilMax >= 0 && (
            <Fragment>
              {`${charsUntilMax} left over`}
            </Fragment>
          )}
          {charsUntilMax < 0 && (
            <Fragment>
              {`${charsUntilMax * -1} too many`}
            </Fragment>
          )}
        </small>
      </div>
      <div
        style={{
          height: '2px',
          width: '100%',
          backgroundColor: '#F3F3F3',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${barWidth * 100}%`,
            backgroundColor: labelStyle.backgroundColor,
            position: 'absolute',
            left: 0,
            top: 0,
          }}
        />
      </div>
    </div>
  );
};
