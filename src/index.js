const mix  = require('laravel-mix')
const argv = require('yargs').argv

let browserSync

class Jigsaw {
  /**
   * The optional name to be used when called by Mix.
   *
   * @return {Array}
   */
  name() {
    return ['jigSaw', 'jigsaw']
  }

  /**
   * Register the Jigsaw component.
   *
   * @param  {Object} options
   * @return {void}
   */
  register(options = {}) {
    this.env = argv.env || 'local'
    this.port = argv.port || 3000

    this.options = Object.assign({
      browserSync: true,
      disableSuccessNotifications: true,
      publicPath: 'source/assets/build',
      watched: [
        'source/**/*.md',
        'source/**/*.php',
        'source/**/*.scss',
        '!source/**/_tmp/*',
      ],
    }, options)
  }

  /**
   * Boot the Jigsaw component.
   *
   * @return {void}
   */
  boot() {
    if (this.options.disableSuccessNotifications) {
      mix.disableSuccessNotifications()
    }

    if (this.options.publicPath) {
      mix.setPublicPath(this.options.publicPath)
    }

    this.compile()
  }

  /**
   * Webpack Plugins
   *
   * @return {Array}
   */
  webpackPlugins() {
    return [
      this.options.browserSync ? this.browserSync() : null,
      this.options.watched ? this.watch(this.options.watched) : null,
    ]
  }

  /**
    * Returns the working path to the jigsaw bin.
    *
    * @return {String|void}
    */
  path() {
    if (require('fs').existsSync('./vendor/bin/jigsaw')) {
      return require('path').normalize('./vendor/bin/jigsaw')
    }

    if (require('hasbin').sync('jigsaw')) {
      return 'jigsaw'
    }

    console.error('Could not find Jigsaw; please install it via Composer.')
    process.exit()
  }

  /**
   * Compiles Jigsaw's views and reloads BrowserSync.
   *
   * @return {void}
   */
  compile() {
    return require('node-cmd').get(
      this.path() + ' build -q ' + this.env, (error, stdout, stderr) => {
        if (browserSync) {
          browserSync.reload()
        }

        console.log(error ? stderr : stdout)
      }
    )
  }

  /**
   * Returns an instance of ExtraWatchWebpackPlugin with our paths.
   *
   * @param  {Array} paths
   * @return {void}
   */
  watch(paths) {
    const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin')

    return new ExtraWatchWebpackPlugin({
      files: paths,
    })
  }

  /**
   * Returns an instance of BrowserSyncPlugin with our proxy.
   *
   * @param  {String} proxy
   * @return {void}
   */
  browserSync(proxy) {
    const BrowserSyncPlugin = require('browser-sync-webpack-plugin')

    return new BrowserSyncPlugin({
      notify: false,
      port: this.port,
      proxy: proxy,
      server: proxy ? null : { baseDir: 'build_' + this.env + '/' },
    }, {
      reload: false,
      callback: () => {
        browserSync = require('browser-sync').get('bs-webpack-plugin')
      },
    })
  }
}

mix.extend('jigsaw', new Jigsaw())