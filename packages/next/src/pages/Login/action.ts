'use server'

export async function login(formData: FormData) {
  try {
    console.log(formData)
    // await signIn('credentials', formData);
  } catch (error) {
    throw error
  }
}
