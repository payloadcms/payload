const ReactCompilerConfig = {
  /*sources: (filename) => {
    if(filename.indexOf('src/providers') !== -1) {
      console.log('Babl.', filename)
      return true
    }
    return false
  },*/
  //runtimeModule: "react"
}

module.exports = function (api) {
  api.cache(false);

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
