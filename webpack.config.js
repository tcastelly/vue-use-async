const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  target: 'web',
  context: __dirname,
  entry: ['./src/index.js'],
  // un-comment to generate source-map in the build
  // devtool: 'eval-source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    filename: 'index.js',
  },
  externals: {
    '@vue/composition-api': '@vue/composition-api',
    Vue: 'vue',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
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
  plugins: [
    new CleanWebpackPlugin(),
  ],
};
