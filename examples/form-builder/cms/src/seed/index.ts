import { Payload } from 'payload';
import { home } from './home';
import { contact } from './contact';
import { advanced } from './advanced';
import { signUp } from './signUp';
import { basicForm } from './basicForm';
import { contactForm } from './contactForm';
import { advancedForm } from './advancedForm';
import { signUpForm } from './signUpForm';

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  });

  const basicFormJSON = JSON.parse(JSON.stringify(basicForm));

  const { id: basicFormID } = await payload.create({
    collection: 'forms',
    data: basicFormJSON,
  });

  const contactFormJSON = JSON.parse(JSON.stringify(contactForm));

  const { id: contactFormID } = await payload.create({
    collection: 'forms',
    data: contactFormJSON,
  });

  const advancedFormJSON = JSON.parse(JSON.stringify(advancedForm));

  const { id: advancedFormID } = await payload.create({
    collection: 'forms',
    data: advancedFormJSON,
  });

  const signUpFormJSON = JSON.parse(JSON.stringify(signUpForm));

  const { id: signUpFormID } = await payload.create({
    collection: 'forms',
    data: signUpFormJSON,
  });

  const homePageJSON = JSON.parse(
    JSON.stringify(home).replace(/{{BASIC_FORM_ID}}/g, basicFormID),
  );

  const contactPageJSON = JSON.parse(
    JSON.stringify(contact).replace(/{{CONTACT_FORM_ID}}/g, contactFormID),
  );

  const advancedPageJSON = JSON.parse(
    JSON.stringify(advanced).replace(/{{ADVANCED_FORM_ID}}/g, advancedFormID),
  );

  const signupPageJSON = JSON.parse(
    JSON.stringify(signUp).replace(/{{SIGNUP_FORM_ID}}/g, signUpFormID),
  );

  await payload.create({
    collection: 'pages',
    data: homePageJSON,
  });

  const { id: contactPageID } = await payload.create({
    collection: 'pages',
    data: contactPageJSON,
  });

  const { id: advancedPageID } = await payload.create({
    collection: 'pages',
    data: advancedPageJSON,
  });

  const { id: signupPageID } = await payload.create({
    collection: 'pages',
    data: signupPageJSON,
  });

  await payload.updateGlobal({
    slug: 'main-menu',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: contactPageID,
            },
            label: 'Contact Form',
          },
        },
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: advancedPageID,
            },
            label: 'Advanced Form',
          },
        },
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: signupPageID,
            },
            label: 'Signup Form',
          },
        },
      ],
    },
  });
};
