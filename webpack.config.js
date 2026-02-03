const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

var nodeModules = {};

new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': JSON.stringify('test'),
    'NODE_TEST': JSON.stringify('false')
  }
});

fs.readdirSync('node_modules')
  .filter(function (x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function (mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: ['core-js/stable', 'regenerator-runtime/runtime', './index.ts'],
  target: 'node',
  output: {
    path: path.join(__dirname, ''),
    filename: 'server.js'
  },
  externals: nodeModules,
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  module: {
    rules: [{
      // Include ts, tsx, js, and jsx files.
      test: /\.(ts|js)x?$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
    }],
  }
}