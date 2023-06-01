let email

if (process.env.NODE_ENV === 'production') {
  email = {
    fromName: 'Payload',
    fromAddress: 'info@payloadcms.com',
    transportOptions: {
      // Configure a custom transport here
    },
  }

} else {
  email = {
    fromName: 'Ethereal Email',
    fromAddress: 'example@ethereal.com',
    logMockCredentials: true,
  }
}

export default email
