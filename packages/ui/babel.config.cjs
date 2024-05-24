
const excludeToBeCompiled = [
  'src/providers/ComponentMap', 'src/elements/DocumentHeader', 'src/elements/withMergedProps', 'src/elements/Gutter', 'src/elements/WithServerSideProps', 'src/elements/RenderCustomComponent', 'src/elements/Nav',  'src/templates', 'src/graphics/Logo'
]

const ReactCompilerConfig = {
  sources: (filename) => {
      for(const exclude of excludeToBeCompiled) {
        if(filename.includes(exclude)) {
          return false
        }
      }
      console.log("Compiling: " + filename)
      return true

  },
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
