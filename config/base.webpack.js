const path = require('path');
const babelOptions = require('./babel-options');

module.exports = ({ publicPath, production, serve, customConfig }) => {
  let folders = process.cwd().split('/');
  let pluginFolderName = folders[folders.length - 1];

  //merge custom babel options and presets
  if (customConfig.babelOptions) {
    babelOptions = {
      plugins: [...babelOptions.plugins, ...customConfig.babelOptions.plugins],
      presets: [...babelOptions.presets, ...customConfig.babelOptions.presets],
    };
    delete customConfig.babelOptions;
  }

  //merge custom rules
  let module = {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('./loader'),
          },
          {
            loader: require.resolve('babel-loader'),
            options: babelOptions,
          },
        ],
      },
    ],
  };

  if (customConfig.module && customConfig.module.rules) {
    module = {
      ...module,
      rules: [...customConfig.module.rules, ...module.rules],
    };
  }
  delete customConfig.module;

  return {
    mode: production ? 'production' : 'development',
    context: __dirname,
    entry: ['@babel/polyfill', process.cwd() + '/./index.js'],
    output: {
      chunkFilename: '[name].chunk.js',
      filename: '[name].js',
      path: process.cwd() + '/build',
      publicPath: production
        ? `/wp-content/plugins/${pluginFolderName}/build/`
        : 'http://localhost:8080/',
    },
    serve: {
      add: (app, middleware) => {
        app.use((ctx, next) => {
          ctx.set('Access-Control-Allow-Origin', '*');
          next();
        });
        middleware.webpack();
        middleware.content();
      },
      dev: { publicPath: 'http://localhost:8080/' },
    },
    module,
    ...customConfig,
  };
};
