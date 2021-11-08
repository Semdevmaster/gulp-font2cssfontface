import path from 'path'
import {createRequire} from 'module'
import through from 'through2'
import replaceExt from 'replace-ext'
import PluginError from 'plugin-error'

const require = createRequire(import.meta.url);
const fontStyleKeywords = require('./css-font-style-keywords.json')
const fontWeightKeywords = require('./css-font-weight-keywords.json')
const fontWeightNames = require('./css-font-weight-names.json')

/**
 * Extract the `font-family` from the font's file name.
 * @param  {String} basename Font base filename.
 * @param  {number} count    Count of guessed information to extract.
 * @return {String}          `font-family` property and value.
 */
function getFontFamily(basename, count) {
  const basenameParts = basename.split('-')
  if (basenameParts.length === 1 || count === 0) {
    return `font-family:"${basename}";`
  }
  return `font-family:"${basenameParts.slice(0, -count).join('-')}";`
}

/**
 * Guess the `font-style` property from the font file name.
 * @param  {String} basename Font base filename.
 * @return {String}          `font-style` property and guessed value.
 */
function guessFontStyle(basename) {
  return basename
    .split('-')
    .slice(1)
    .map(item => item.toLowerCase())
    .reduce((prev, item) => {
      if (fontStyleKeywords.indexOf(item) >= 0) {
        return `font-style:${item};`
      }

      return prev
    }, '')
}

/**
 * Guess the `font-weight` property from the font file name.
 * @param  {String} basename Font base filename.
 * @return {String}          `font-weight` property and guessed value.
 */
function guessFontWeight(basename) {
  return basename
    .split('-')
    .slice(1)
    .map(item => item.toLowerCase())
    .reduce((prev, item) => {
      if (item === 'normal') {
        return prev
      }

      if (fontWeightNames[item]) {
        return `font-weight:${fontWeightNames[item]};`
      }

      if (fontWeightKeywords.indexOf(item) >= 0) {
        return `font-weight:${item};`
      }

      return prev
    }, '')
}

/**
 * Write src attribute from font files.
 * @param  {Object} file File object.
 * @return {String}      src attribute.
 */
function getSrc(file) {
  const fileExtName = path.extname(file.path)
  let format = fileExtName.includes('woff2') ? 'woff2' : fileExtName.includes('woff') ? 'woff' : 'truetype'
  return `src:url("../fonts/${path.basename(file.history[0])}") format("${format}");`
}

/**
 * Convert fonts to CSS using Gulp.
 *
 * Encodes font files inside a CSS `@font-face` rule. The plugin
 * attempts to guess `font-family`, `font-style` and  `font-weight` attributes
 * from the name of each file provided.
 *
 * @return {Object} CSS file object.
 */
function font2cssfontface() {
  return through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      this.push(file)
      return callback()
    }

    if (file.isStream()) {
      this.emit('error', new PluginError('gulp-font2cssfontface', 'Streaming is not supported'))
      return callback()
    }

    if (file.isBuffer()) {
      const basename = path.basename(file.path, path.extname(file.path))

      let attributes = []
      const fontStyle = guessFontStyle(basename)
      const fontWeight = guessFontWeight(basename)

      if (fontStyle !== '') {
        attributes.push(fontStyle)
      }
      if (fontWeight !== '') {
        attributes.push(fontWeight)
      }

      attributes.push(getFontFamily(basename, attributes.length))
      attributes.push(getSrc(file))

      const contents = `@font-face{${attributes.join('')}font-display:swap;}`

      file.contents = new Buffer.from(contents)
      file.path = replaceExt(file.path, '.css')

      return callback(null, file)
    }
  })
}

export default font2cssfontface
