const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
  entry: './src/main-template.js',
  output: {
    filename: 'graphhopper-client.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  mode: isProduction ? 'production' : 'development',
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
      },
      {
        directory: path.join(__dirname, 'js'),
        publicPath: '/js',
      },
      {
        directory: path.join(__dirname, 'css'),
        publicPath: '/css',
      },
      {
        directory: path.join(__dirname, 'img'),
        publicPath: '/img',
      },
      {
        directory: path.join(__dirname, 'route-optimization-examples'),
        publicPath: '/route-optimization-examples',
      },
      {
        directory: path.join(__dirname, 'map-matching-examples'),
        publicPath: '/map-matching-examples',
      },
    ],
    compress: true,
    port: 3000,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
}};