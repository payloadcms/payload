'use client'

import React, { useId } from 'react'

type DocumentPlaceholderProps = {
  size?: 'default' | 'small'
  variant?: 'auth' | 'document'
}

export function DocumentPlaceholder({
  size = 'default',
  variant = 'document',
}: DocumentPlaceholderProps) {
  const id = useId()

  if (variant === 'auth' && size === 'small') {
    return (
      <svg
        aria-hidden="true"
        className="document-placeholder"
        fill="none"
        focusable="false"
        height="46"
        viewBox="0 0 36 46"
        width="36"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter={`url(#${id}-filter0_dd_16147_94796)`}>
          <mask
            height="41"
            id={`${id}-mask0_16147_94796`}
            maskUnits="userSpaceOnUse"
            style={{ maskType: 'alpha' }}
            width="31"
            x="2"
            y="2"
          >
            <path
              d="M2.85742 3.80949C2.85742 2.88902 3.60361 2.14282 4.52409 2.14282H22.8574L32.8574 12.1428V40.4762C32.8574 41.3966 32.1112 42.1428 31.1908 42.1428H4.52409C3.60361 42.1428 2.85742 41.3966 2.85742 40.4762V3.80949Z"
              fill="black"
            />
          </mask>
          <g mask={`url(#${id}-mask0_16147_94796)`}>
            <g filter={`url(#${id}-filter1_d_16147_94796)`}>
              <path
                d="M2.85742 3.80949C2.85742 2.88902 3.60361 2.14282 4.52409 2.14282H22.8574L32.8574 12.1428V40.4762C32.8574 41.3966 32.1112 42.1428 31.1908 42.1428H4.52409C3.60361 42.1428 2.85742 41.3966 2.85742 40.4762V3.80949Z"
                fill={`url(#${id}-paint0_linear_16147_94796)`}
              />
            </g>
            <g filter={`url(#${id}-filter2_d_16147_94796)`}>
              <path
                d="M22.8574 2.14282L32.8574 12.1428H24.5241C23.6036 12.1428 22.8574 11.3966 22.8574 10.4762V2.14282Z"
                fill={`url(#${id}-paint1_linear_16147_94796)`}
              />
            </g>
          </g>
        </g>
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="10"
          x="7.02344"
          y="7.14282"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="10"
          x="7.02344"
          y="9.47607"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="6"
          x="7.02344"
          y="11.8096"
        />
        <g clipPath={`url(#${id}-clip0_16147_94796)`}>
          <rect fill="#E6E6E6" height="18.5714" rx="1.66429" width="21.4286" x="7.14355" y="20" />
          <g filter={`url(#${id}-filter3_d_16147_94796)`}>
            <circle
              cx="3.21429"
              cy="3.21429"
              fill="white"
              r="3.21429"
              transform="matrix(1 0 0 -1 14.6436 29.2856)"
            />
            <path
              d="M17.8581 30C15.3753 30 13.287 32.0268 12.6795 34.7769C12.4812 35.6744 13.2461 36.4286 14.1653 36.4286H21.551C22.4701 36.4286 23.2351 35.6744 23.0368 34.7769C22.4293 32.0268 20.3409 30 17.8581 30Z"
              fill="white"
            />
          </g>
        </g>
        <defs>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="45.7143"
            id={`${id}-filter0_dd_16147_94796`}
            width="35.7143"
            x="0.00027895"
            y="-3.49283e-05"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="0.714286" />
            <feGaussianBlur stdDeviation="1.42857" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow_16147_94796"
            />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="0.357143" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
            <feBlend
              in2="effect1_dropShadow_16147_94796"
              mode="normal"
              result="effect2_dropShadow_16147_94796"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect2_dropShadow_16147_94796"
              mode="normal"
              result="shape"
            />
          </filter>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="42.8571"
            id={`${id}-filter1_d_16147_94796`}
            width="32.8571"
            x="1.42885"
            y="1.42854"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="0.714286" />
            <feGaussianBlur stdDeviation="0.714286" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow_16147_94796"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect1_dropShadow_16147_94796"
              mode="normal"
              result="shape"
            />
          </filter>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="15.3333"
            id={`${id}-filter2_d_16147_94796`}
            width="15.3333"
            x="20.1908"
            y="-0.523844"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="1.33333" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow_16147_94796"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect1_dropShadow_16147_94796"
              mode="normal"
              result="shape"
            />
          </filter>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="16.4287"
            id={`${id}-filter3_d_16147_94796`}
            width="13.571"
            x="11.0724"
            y="22.1429"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="0.714286" />
            <feGaussianBlur stdDeviation="0.714286" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow_16147_94796"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect1_dropShadow_16147_94796"
              mode="normal"
              result="shape"
            />
          </filter>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={`${id}-paint0_linear_16147_94796`}
            x1="32.8574"
            x2="-7.18424"
            y1="2.14282"
            y2="42.1845"
          >
            <stop stopColor="#E6E6E6" />
            <stop offset="0.293269" stopColor="white" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={`${id}-paint1_linear_16147_94796`}
            x1="32.8574"
            x2="22.8574"
            y1="2.14282"
            y2="12.1428"
          >
            <stop offset="0.45" stopColor="#E6E6E6" />
            <stop offset="0.75" stopColor="white" />
          </linearGradient>
          <clipPath id={`${id}-clip0_16147_94796`}>
            <rect fill="white" height="18.5714" rx="1.66429" width="21.4286" x="7.14355" y="20" />
          </clipPath>
        </defs>
      </svg>
    )
  }

  if (variant === 'auth') {
    return (
      <svg
        aria-hidden="true"
        className="document-placeholder"
        fill="none"
        focusable="false"
        height="64"
        viewBox="0 0 50 64"
        width="50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter={`url(#${id}-filter0_dd_15817_393609)`}>
          <mask
            height="56"
            id={`${id}-mask0_15817_393609`}
            maskUnits="userSpaceOnUse"
            style={{ maskType: 'alpha' }}
            width="42"
            x="4"
            y="3"
          >
            <path
              d="M4 5.33333C4 4.04467 5.04467 3 6.33333 3H32L46 17V56.6667C46 57.9553 44.9553 59 43.6667 59H6.33333C5.04467 59 4 57.9553 4 56.6667V5.33333Z"
              fill="black"
            />
          </mask>
          <g mask={`url(#${id}-mask0_15817_393609)`}>
            <g filter={`url(#${id}-filter1_d_15817_393609)`}>
              <path
                d="M4 5.33333C4 4.04467 5.04467 3 6.33333 3H32L46 17V56.6667C46 57.9553 44.9553 59 43.6667 59H6.33333C5.04467 59 4 57.9553 4 56.6667V5.33333Z"
                fill={`url(#${id}-paint0_linear_15817_393609)`}
              />
            </g>
            <g filter={`url(#${id}-filter2_d_15817_393609)`}>
              <path
                d="M32 3L46 17H34.3333C33.0447 17 32 15.9553 32 14.6667V3Z"
                fill={`url(#${id}-paint1_linear_15817_393609)`}
              />
            </g>
          </g>
        </g>
        <rect fill="black" fillOpacity="0.1" height="1.4" rx="0.7" width="14" x="9.83301" y="10" />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1.4"
          rx="0.7"
          width="14"
          x="9.83301"
          y="13.2666"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1.4"
          rx="0.7"
          width="8.4"
          x="9.83301"
          y="16.5334"
        />
        <rect fill="#E6E6E6" height="26" rx="2.33" width="30" x="10" y="28" />
        <g filter={`url(#${id}-filter3_d_15817_393609)`}>
          <circle cx="4.5" cy="4.5" fill="white" r="4.5" transform="matrix(1 0 0 -1 20.5 41)" />
          <path
            d="M25 42C21.5241 42 18.6004 44.8375 17.7499 48.6876C17.4723 49.9441 18.5432 51 19.83 51H30.17C31.4568 51 32.5277 49.9441 32.2501 48.6876C31.3996 44.8375 28.4759 42 25 42Z"
            fill="white"
          />
        </g>
        <defs>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="64"
            id={`${id}-filter0_dd_15817_393609`}
            width="50"
            x="0"
            y="0"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="1" />
            <feGaussianBlur stdDeviation="2" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow_15817_393609"
            />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="0.5" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
            <feBlend
              in2="effect1_dropShadow_15817_393609"
              mode="normal"
              result="effect2_dropShadow_15817_393609"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect2_dropShadow_15817_393609"
              mode="normal"
              result="shape"
            />
          </filter>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="60"
            id={`${id}-filter1_d_15817_393609`}
            width="46"
            x="2"
            y="2"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="1" />
            <feGaussianBlur stdDeviation="1" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow_15817_393609"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect1_dropShadow_15817_393609"
              mode="normal"
              result="shape"
            />
          </filter>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="21.4667"
            id={`${id}-filter2_d_15817_393609`}
            width="21.4667"
            x="28.2667"
            y="-0.733333"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="1.86667" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow_15817_393609"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect1_dropShadow_15817_393609"
              mode="normal"
              result="shape"
            />
          </filter>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="23"
            id={`${id}-filter3_d_15817_393609`}
            width="19"
            x="15.5"
            y="31"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="1" />
            <feGaussianBlur stdDeviation="1" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow_15817_393609"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect1_dropShadow_15817_393609"
              mode="normal"
              result="shape"
            />
          </filter>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={`${id}-paint0_linear_15817_393609`}
            x1="46"
            x2="-10.0583"
            y1="3"
            y2="59.0583"
          >
            <stop stopColor="#E6E6E6" />
            <stop offset="0.293269" stopColor="white" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={`${id}-paint1_linear_15817_393609`}
            x1="46"
            x2="32"
            y1="3"
            y2="17"
          >
            <stop offset="0.45" stopColor="#E6E6E6" />
            <stop offset="0.75" stopColor="white" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  if (size === 'small') {
    return (
      <svg
        aria-hidden="true"
        className="document-placeholder"
        fill="none"
        focusable="false"
        height="46"
        viewBox="0 0 36 46"
        width="36"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter={`url(#${id}-filter0_dd_16147_94777)`}>
          <mask
            height="41"
            id={`${id}-mask0_16147_94777`}
            maskUnits="userSpaceOnUse"
            style={{ maskType: 'alpha' }}
            width="31"
            x="2"
            y="2"
          >
            <path
              d="M2.85742 3.80949C2.85742 2.88902 3.60361 2.14282 4.52409 2.14282H22.8574L32.8574 12.1428V40.4762C32.8574 41.3966 32.1112 42.1428 31.1908 42.1428H4.52409C3.60361 42.1428 2.85742 41.3966 2.85742 40.4762V3.80949Z"
              fill="black"
            />
          </mask>
          <g mask={`url(#${id}-mask0_16147_94777)`}>
            <path
              d="M2.85742 3.80949C2.85742 2.88902 3.60361 2.14282 4.52409 2.14282H22.8574L32.8574 12.1428V40.4762C32.8574 41.3966 32.1112 42.1428 31.1908 42.1428H4.52409C3.60361 42.1428 2.85742 41.3966 2.85742 40.4762V3.80949Z"
              fill={`url(#${id}-paint0_linear_16147_94777)`}
            />
            <g filter={`url(#${id}-filter1_d_16147_94777)`}>
              <path
                d="M22.8574 2.14282L32.8574 12.1428H24.5241C23.6036 12.1428 22.8574 11.3966 22.8574 10.4762V2.14282Z"
                fill={`url(#${id}-paint1_linear_16147_94777)`}
              />
            </g>
          </g>
        </g>
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="10"
          x="7.02344"
          y="7.14282"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="10"
          x="7.02344"
          y="9.47607"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="6"
          x="7.02344"
          y="11.8096"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="21.6667"
          x="7.02344"
          y="19.8096"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="21.6667"
          x="7.02344"
          y="22.1428"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="21.6667"
          x="7.02344"
          y="24.4763"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="21.6667"
          x="7.02344"
          y="26.8096"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="17.3333"
          x="7.02344"
          y="29.1428"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="21.6667"
          x="7.02344"
          y="31.4763"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="21.6667"
          x="7.02344"
          y="33.8096"
        />
        <rect
          fill="black"
          fillOpacity="0.1"
          height="1"
          rx="0.5"
          width="13"
          x="7.02344"
          y="36.1428"
        />
        <defs>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="45.7143"
            id={`${id}-filter0_dd_16147_94777`}
            width="35.7143"
            x="0.00027895"
            y="-3.49283e-05"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="0.714286" />
            <feGaussianBlur stdDeviation="1.42857" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow_16147_94777"
            />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="0.357143" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
            <feBlend
              in2="effect1_dropShadow_16147_94777"
              mode="normal"
              result="effect2_dropShadow_16147_94777"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect2_dropShadow_16147_94777"
              mode="normal"
              result="shape"
            />
          </filter>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="15.3333"
            id={`${id}-filter1_d_16147_94777`}
            width="15.3333"
            x="20.1908"
            y="-0.523844"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="1.33333" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow_16147_94777"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect1_dropShadow_16147_94777"
              mode="normal"
              result="shape"
            />
          </filter>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={`${id}-paint0_linear_16147_94777`}
            x1="32.8574"
            x2="-7.18424"
            y1="2.14282"
            y2="42.1845"
          >
            <stop stopColor="#E6E6E6" />
            <stop offset="0.293269" stopColor="white" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={`${id}-paint1_linear_16147_94777`}
            x1="32.8574"
            x2="22.8574"
            y1="2.14282"
            y2="12.1428"
          >
            <stop offset="0.45" stopColor="#E6E6E6" />
            <stop offset="0.75" stopColor="white" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="document-placeholder"
      fill="none"
      focusable="false"
      height="64"
      viewBox="0 0 50 64"
      width="50"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter={`url(#${id}-filter0_dd_15817_393608)`}>
        <mask
          height="56"
          id={`${id}-mask0_15817_393608`}
          maskUnits="userSpaceOnUse"
          style={{ maskType: 'alpha' }}
          width="42"
          x="4"
          y="3"
        >
          <path
            d="M4 5.33333C4 4.04467 5.04467 3 6.33333 3H32L46 17V56.6667C46 57.9553 44.9553 59 43.6667 59H6.33333C5.04467 59 4 57.9553 4 56.6667V5.33333Z"
            fill="black"
          />
        </mask>
        <g mask={`url(#${id}-mask0_15817_393608)`}>
          <path
            d="M4 5.33333C4 4.04467 5.04467 3 6.33333 3H32L46 17V56.6667C46 57.9553 44.9553 59 43.6667 59H6.33333C5.04467 59 4 57.9553 4 56.6667V5.33333Z"
            fill={`url(#${id}-paint0_linear_15817_393608)`}
          />
          <g filter={`url(#${id}-filter1_d_15817_393608)`}>
            <path
              d="M32 3L46 17H34.3333C33.0447 17 32 15.9553 32 14.6667V3Z"
              fill={`url(#${id}-paint1_linear_15817_393608)`}
            />
          </g>
        </g>
      </g>
      <rect fill="black" fillOpacity="0.1" height="1.4" rx="0.7" width="14" x="9.83301" y="10" />
      <rect
        fill="black"
        fillOpacity="0.1"
        height="1.4"
        rx="0.7"
        width="14"
        x="9.83301"
        y="13.2666"
      />
      <rect
        fill="black"
        fillOpacity="0.1"
        height="1.4"
        rx="0.7"
        width="8.4"
        x="9.83301"
        y="16.5334"
      />
      <rect
        fill="black"
        fillOpacity="0.1"
        height="1.4"
        rx="0.7"
        width="30.3333"
        x="9.83301"
        y="27.7334"
      />
      <rect
        fill="black"
        fillOpacity="0.1"
        height="1.4"
        rx="0.7"
        width="30.3333"
        x="9.83301"
        y="31"
      />
      <rect
        fill="black"
        fillOpacity="0.1"
        height="1.4"
        rx="0.7"
        width="30.3333"
        x="9.83301"
        y="34.2668"
      />
      <rect
        fill="black"
        fillOpacity="0.1"
        height="1.4"
        rx="0.7"
        width="30.3333"
        x="9.83301"
        y="37.5334"
      />
      <rect
        fill="black"
        fillOpacity="0.1"
        height="1.4"
        rx="0.7"
        width="24.2667"
        x="9.83301"
        y="40.8"
      />
      <rect
        fill="black"
        fillOpacity="0.1"
        height="1.4"
        rx="0.7"
        width="30.3333"
        x="9.83301"
        y="44.0667"
      />
      <rect
        fill="black"
        fillOpacity="0.1"
        height="1.4"
        rx="0.7"
        width="30.3333"
        x="9.83301"
        y="47.3335"
      />
      <rect
        fill="black"
        fillOpacity="0.1"
        height="1.4"
        rx="0.7"
        width="18.2"
        x="9.83301"
        y="50.6001"
      />
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="64"
          id={`${id}-filter0_dd_15817_393608`}
          width="50"
          x="0"
          y="0"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="2" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend
            in2="BackgroundImageFix"
            mode="normal"
            result="effect1_dropShadow_15817_393608"
          />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="0.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend
            in2="effect1_dropShadow_15817_393608"
            mode="normal"
            result="effect2_dropShadow_15817_393608"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect2_dropShadow_15817_393608"
            mode="normal"
            result="shape"
          />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="21.4667"
          id={`${id}-filter1_d_15817_393608`}
          width="21.4667"
          x="28.2667"
          y="-0.733333"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="1.86667" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend
            in2="BackgroundImageFix"
            mode="normal"
            result="effect1_dropShadow_15817_393608"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_15817_393608"
            mode="normal"
            result="shape"
          />
        </filter>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={`${id}-paint0_linear_15817_393608`}
          x1="46"
          x2="-10.0583"
          y1="3"
          y2="59.0583"
        >
          <stop stopColor="#E6E6E6" />
          <stop offset="0.293269" stopColor="white" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={`${id}-paint1_linear_15817_393608`}
          x1="46"
          x2="32"
          y1="3"
          y2="17"
        >
          <stop offset="0.45" stopColor="#E6E6E6" />
          <stop offset="0.75" stopColor="white" />
        </linearGradient>
      </defs>
    </svg>
  )
}
