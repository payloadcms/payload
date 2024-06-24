const fs = require('fs')

const ReactCompilerConfig = {
  sources: (filename) => {
    if (!filename.endsWith('.tsx') && !filename.endsWith('.jsx')) {
      return false
    }

    // read file and check if 'use client' is at top. if not, return false
    // if it is, return true
    const file = fs.readFileSync(filename, 'utf8')
    if (file.includes("'use client'")) {
      //console.log("Compiling: " + filename)
      return true
    }
    console.log('Skipping: ' + filename)
    return false
  },
  //runtimeModule: "react"
}

module.exports = function (api) {
  api.cache(false)

  return {
    plugins: [
      ['babel-plugin-react-compiler', ReactCompilerConfig], // must run first!
      [
        'babel-plugin-transform-remove-imports',
        {
          test: '\\.(scss|css)$',
        },
      ],
    ],
    presets: [
      [
        '@babel/preset-env',
        {
          modules: false,
          useBuiltIns: 'usage',
          corejs: '3.22',
        },
      ],
      [
        '@babel/preset-react',
        {
          throwIfNamespace: false,
          runtime: 'automatic',
        },
      ],
      '@babel/preset-typescript',
    ],
  }
}
