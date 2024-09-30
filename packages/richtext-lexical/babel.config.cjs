const fs = require('fs')

// Plugin options can be found here: https://github.com/facebook/react/blob/main/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts#L38
const ReactCompilerConfig = {
  sources: (filename) => {
    const isInNodeModules = filename.includes('node_modules')
    if (
      isInNodeModules ||
      (!filename.endsWith('.tsx') && !filename.endsWith('.jsx') && !filename.endsWith('.js'))
    ) {
      return false
    }

    // Only compile files with 'use client' directives. We do not want to
    // accidentally compile React Server Components
    const file = fs.readFileSync(filename, 'utf8')
    if (file.includes("'use client'")) {
      return true
    }
    console.log('React compiler - skipping file: ' + filename)
    return false
  },
}

module.exports = function (api) {
  api.cache(false)

  return {
    plugins: [
      ['babel-plugin-react-compiler', ReactCompilerConfig], // must run first!
      /* [
         'babel-plugin-transform-remove-imports',
         {
           test: '\\.(scss|css)$',
         },
       ],*/
    ],
  }
}
