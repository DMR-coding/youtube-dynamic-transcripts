// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: [
    './src/index.ts',
    './src/index.scss',
  ],
  mode: 'development',
  devtool: 'source-map',
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'static/*', to: '[name][ext]' },
      ],
    }),
  ],
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
              name: 'youtube-dynamic-transcripts.min.css',
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
    filename: 'youtube-dynamic-transcripts.min.js',
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
