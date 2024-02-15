module.exports = () => {
  process.env.PAYLOAD_DISABLE_ADMIN = 'true'
  process.env.PAYLOAD_DROP_DATABASE = 'true'

  if (process.env.PAYLOAD_DATABASE) {
    console.log('\n\nUsing database:', process.env.PAYLOAD_DATABASE)
  } else {
    console.log('\n\nNo database specified, using default')
  }
}
