'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cssFontStyleKeywords = require('css-font-style-keywords');

var _cssFontStyleKeywords2 = _interopRequireDefault(_cssFontStyleKeywords);

var _cssFontWeightKeywords = require('css-font-weight-keywords');

var _cssFontWeightKeywords2 = _interopRequireDefault(_cssFontWeightKeywords);

var _cssFontWeightNames = require('css-font-weight-names');

var _cssFontWeightNames2 = _interopRequireDefault(_cssFontWeightNames);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _replaceExt = require('replace-ext');

var _replaceExt2 = _interopRequireDefault(_replaceExt);

var _pluginError = require('plugin-error');

var _pluginError2 = _interopRequireDefault(_pluginError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Extract the `font-family` from the font's file name.
 * @param  {String} basename Font base filename.
 * @param  {number} count    Count of guessed information to extract.
 * @return {String}          `font-family` property and value.
 */
function getFontFamily(basename, count) {
  var basenameParts = basename.split('-');
  if (basenameParts.length === 1 || count === 0) {
    return 'font-family:"' + basename + '";';
  }
  return 'font-family:"' + basenameParts.slice(0, -count).join('-') + '";';
}

/**
 * Guess the `font-style` property from the font file name.
 * @param  {String} basename Font base filename.
 * @return {String}          `font-style` property and guessed value.
 */
function guessFontStyle(basename) {
  return basename.split('-').slice(1).map(function (item) {
    return item.toLowerCase();
  }).reduce(function (prev, item) {
    if (_cssFontStyleKeywords2.default.indexOf(item) >= 0) {
      return 'font-style:' + item + ';';
    }

    return prev;
  }, '');
}

/**
 * Guess the `font-weight` property from the font file name.
 * @param  {String} basename Font base filename.
 * @return {String}          `font-weight` property and guessed value.
 */
function guessFontWeight(basename) {
  return basename.split('-').slice(1).map(function (item) {
    return item.toLowerCase();
  }).reduce(function (prev, item) {
    if (item === 'normal') {
      return prev;
    }

    if (_cssFontWeightNames2.default[item]) {
      return 'font-weight:' + _cssFontWeightNames2.default[item] + ';';
    }

    if (_cssFontWeightKeywords2.default.indexOf(item) >= 0) {
      return 'font-weight:' + item + ';';
    }

    return prev;
  }, '');
}

/**
 * Write src attribute from font files.
 * @param  {Object} file File object.
 * @return {String}      src attribute.
 */
function getSrc(file) {
  var fileExtName = _path2.default.extname(file.path);
  var format = fileExtName.includes('woff2') ? 'woff2' : fileExtName.includes('woff') ? 'woff' : 'truetype';
  return 'src:url("../fonts/' + _path2.default.basename(file.history[0]) + '") format("' + format + '");';
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
  return _through2.default.obj(function (file, enc, callback) {
    if (file.isNull()) {
      this.push(file);
      return callback();
    }

    if (file.isStream()) {
      this.emit('error', new _pluginError2.default('gulp-font2cssfontface', 'Streaming is not supported'));
      return callback();
    }

    if (file.isBuffer()) {
      var basename = _path2.default.basename(file.path, _path2.default.extname(file.path));

      var attributes = [];
      var fontStyle = guessFontStyle(basename);
      var fontWeight = guessFontWeight(basename);

      attributes.push(getFontFamily(basename, attributes.length));
      attributes.push(getSrc(file));

      if (fontStyle !== '') {
        attributes.push(fontStyle);
      }
      if (fontWeight !== '') {
        attributes.push(fontWeight);
      }

      var contents = '@font-face{' + attributes.join('') + 'font-display:swap;}';

      file.contents = new Buffer.from(contents);
      file.path = (0, _replaceExt2.default)(file.path, '.css');

      return callback(null, file);
    }
  });
}

exports.default = font2cssfontface;