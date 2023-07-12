import generateEmailHTML from './generateEmailHTML'

const generateVerificationEmail = async (args): Promise<string> => {
  const { user, token } = args

  return generateEmailHTML({
    headline: 'Verify your account',
    content: `<p>Hi${user.name ? ' ' + user.name : ''}! Validate your account by clicking the button below.</p>`,
    cta: {
      buttonLabel: 'Verify',
      url: `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/verify?token=${token}&email=${user.email}`,
    },
  })
}

export default generateVerificationEmail
