'use client'

import type React from 'react'

import { useLexicalFeature } from '../../../useLexicalFeature'
import { ParagraphFeature, key } from './index'

export const ParagraphFeatureComponent: React.FC = () => {
  useLexicalFeature(key, ParagraphFeature)
  return null
}
