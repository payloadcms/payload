import type { Payload } from 'payload'

import { advanced } from './advanced'
import { advancedForm } from './advancedForm'
import { basicForm } from './basicForm'
import { contact } from './contact'
import { contactForm } from './contactForm'
import { home } from './home'
import { signUp } from './signUp'
import { signUpForm } from './signUpForm'

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'demo@payloadcms.com',
      password: 'demo',
    },
  })

  const basicFormJSON = JSON.parse(JSON.stringify(basicForm))

  const { id: basicFormID } = await payload.create({
    collection: 'forms',
    data: basicFormJSON,
  })

  const contactFormJSON = JSON.parse(JSON.stringify(contactForm))

  const { id: contactFormID } = await payload.create({
    collection: 'forms',
    data: contactFormJSON,
  })

  const advancedFormJSON = JSON.parse(JSON.stringify(advancedForm))

  const { id: advancedFormID } = await payload.create({
    collection: 'forms',
    data: advancedFormJSON,
  })

  const signUpFormJSON = JSON.parse(JSON.stringify(signUpForm))

  const { id: signUpFormID } = await payload.create({
    collection: 'forms',
    data: signUpFormJSON,
  })

  const homePageJSON = JSON.parse(
    JSON.stringify(home).replace(/\{\{BASIC_FORM_ID\}\}/g, basicFormID.toString()),
  )

  const contactPageJSON = JSON.parse(
    JSON.stringify(contact).replace(/\{\{CONTACT_FORM_ID\}\}/g, contactFormID.toString()),
  )

  const advancedPageJSON = JSON.parse(
    JSON.stringify(advanced).replace(/\{\{ADVANCED_FORM_ID\}\}/g, advancedFormID.toString()),
  )

  const signupPageJSON = JSON.parse(
    JSON.stringify(signUp).replace(/\{\{SIGNUP_FORM_ID\}\}/g, signUpFormID.toString()),
  )

  await payload.create({
    collection: 'pages',
    data: homePageJSON,
  })

  const { id: contactPageID } = await payload.create({
    collection: 'pages',
    data: contactPageJSON,
  })

  const { id: advancedPageID } = await payload.create({
    collection: 'pages',
    data: advancedPageJSON,
  })

  const { id: signupPageID } = await payload.create({
    collection: 'pages',
    data: signupPageJSON,
  })

  await payload.updateGlobal({
    slug: 'main-menu',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            label: 'Contact Form',
            reference: {
              relationTo: 'pages',
              value: contactPageID,
            },
          },
        },
        {
          link: {
            type: 'reference',
            label: 'Advanced Form',
            reference: {
              relationTo: 'pages',
              value: advancedPageID,
            },
          },
        },
        {
          link: {
            type: 'reference',
            label: 'Signup Form',
            reference: {
              relationTo: 'pages',
              value: signupPageID,
            },
          },
        },
      ],
    },
  })
}
