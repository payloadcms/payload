'use client'

import React from 'react'

import { Form } from '../../../payload-types'
import RichText from '../../RichText'
import { Width } from '../Width'

import classes from './index.module.scss'

type MessageField = Extract<Form['fields'][0], { blockType: 'message' }>

export const Message: React.FC<MessageField> = ({ message }) => {
  return (
    <Width width={100}>
      <RichText content={message} className={classes.message} />
    </Width>
  )
}
