var path = require('path');
 var webpack = require('webpack');
 module.exports = {
     entry: './src/',
     output: {
         path: path.resolve(__dirname, 'functions'),
         filename: 'index.js'
     },
     module: {
         loaders: [
             {
                 test: /\.js$/,
                 loader: 'babel-loader',
                 query: {
                     presets: ['es2015']
                 }
             }
         ]
     },
     stats: {
         colors: true
     },
     devtool: 'source-map'
 };
