import { generateEmailHTML } from './generateEmailHTML'

type User = {
  email: string
  name?: string
}

type GenerateVerificationEmailArgs = {
  token: string
  user: User
}

export const generateVerificationEmail = async (
  args: GenerateVerificationEmailArgs,
): Promise<string> => {
  const { token, user } = args

  return generateEmailHTML({
    content: `<p>Hi${user.name ? ' ' + user.name : ''}! Validate your account by clicking the button below.</p>`,
    cta: {
      buttonLabel: 'Verify',
      url: `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/verify?token=${token}&email=${user.email}`,
    },
    headline: 'Verify your account',
  })
}
