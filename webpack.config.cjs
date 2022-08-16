// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  target: 'web',
  context: __dirname,
  entry: {
    index: './src/index.ts',
    tests: './tests/index.ts',
  },
  // un-comment to generate source-map in the build
  // devtool: 'eval-source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    filename: '[name].js',
  },
  externals: {
    vue: 'vue',
    Vue: 'vue',
  },
  resolve: {
    extensions: ['.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/env'],
          },
        },
      },
    ],
  },
};
