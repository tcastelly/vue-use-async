const path = require('path');

module.exports = {
  target: 'web',
  context: __dirname,
  entry: ['./src/index.ts'],
  // un-comment to generate source-map in the build
  // devtool: 'eval-source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    filename: 'index.js',
  },
  externals: {
    Vue: 'vue',
  },
  resolve: {
    extensions: ['.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        loader: 'babel-loader',
      },
    ],
  },
};
