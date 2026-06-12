import nextBuild from 'next/dist/build/index.js'

const build = async () => {
  await nextBuild.default(process.env.NEXTJS_DIR, false, false, false, true, true, false, 'compile')
}

build()
