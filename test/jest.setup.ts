module.exports = () => {
  process.env.PAYLOAD_DISABLE_ADMIN = 'true'

  if (process.env.PAYLOAD_DATABASE) {
    console.log('\n\nUsing database:', process.env.PAYLOAD_DATABASE)
    if (process.env.PAYLOAD_DATABASE === 'postgres') {
      process.env.PAYLOAD_DROP_DATABASE = 'true'
    }
  } else {
    console.log('\n\nNo database specified, using default')
  }

  process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER = 's3'
}
