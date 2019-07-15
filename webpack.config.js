const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// Phaser webpack config
const path = require('path');
const phaserModule = path.join(__dirname, '/node_modules/phaser-ce/');
const phaser = path.join(phaserModule, 'build/custom/phaser-split.js');
const pixi = path.join(phaserModule, 'build/custom/pixi.js');
const p2 = path.join(phaserModule, 'build/custom/p2.js');

module.exports = {
  entry: {
    main: './src/index.tsx',
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].[chunkhash].js'
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true
        }
      })
    ],
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          enforce: true,
          chunks: 'all'
        }
      }
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Cycle',
      template: './src/index.html'
    }),
    new CopyPlugin([
      { from: 'src/resources', to: 'resources' },
    ])
  ],
  devServer: {
    contentBase: __dirname + '/dist',
    compress: true,
    port: 9000
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      { test: /pixi\.js/, use: ['expose-loader?PIXI'] },
      { test: /phaser-split\.js$/, use: ['expose-loader?Phaser'] },
      { test: /p2\.js/, use: ['expose-loader?p2'] },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      { test: /\.tsx?$/, loader: "ts-loader" },
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
    ]
  },
  resolve: {
    alias: {
      'phaser-ce': phaser,
      'pixi': pixi,
      'p2': p2
    },
    extensions: [".ts", ".tsx", ".js"]
  }
};
