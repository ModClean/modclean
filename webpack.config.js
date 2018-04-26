'use strict';

const // webpackDev  = require('./webpack.dev'),
  webpackProd = require('./webpack.prod');

const webpack = { // dev: webpackDev,
  prod: webpackProd,
};

module.exports = env => webpack[env];

