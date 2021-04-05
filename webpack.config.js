// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');

module.exports = {
  entry: [
    './src/index.ts',
    './src/index.scss',
  ],
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'babel-loader',
      },
      {
        test: /\.s[ca]ss$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'bundle.css',
            },
          },
          'extract-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader',

        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    contentBase: [
      path.join(__dirname, 'dist'),
      path.join(__dirname, 'static'),
    ],
    port: 9000,
    https: true,
  },
};
