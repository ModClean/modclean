'use strict';

const path = require('path'),
  CleanWebpackPlugin = require('clean-webpack-plugin'),
  webpack = require('webpack'),
  UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  cache: true,
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),
    new UglifyJsPlugin({
      parallel: 2,
      uglifyOptions: {
        ie8: false,
        ecma: 8,
        compress: true,
        mangle: true,
        output: {
          comments: false,
          beautify: false,
        },
      },
      sourceMap: true,
    }),
    new CleanWebpackPlugin(['dist']),
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
  target: 'node',
  node: {},
  module: {
    rules: [],
  },
  // externals: nodeModules,
};
