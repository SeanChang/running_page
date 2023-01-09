exports.id = "component---src-pages-index-jsxhead";
exports.ids = ["component---src-pages-index-jsxhead"];
exports.modules = {

/***/ "./assets lazy recursive ^\\.\\/year_.*\\.svg$":
/*!**********************************************************!*\
  !*** ./assets/ lazy ^\.\/year_.*\.svg$ namespace object ***!
  \**********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var map = {
	"./year_2022.svg": [
		"./assets/year_2022.svg",
		"assets_year_2022_svg"
	]
};
function webpackAsyncContext(req) {
	if(!__webpack_require__.o(map, req)) {
		return Promise.resolve().then(() => {
			var e = new Error("Cannot find module '" + req + "'");
			e.code = 'MODULE_NOT_FOUND';
			throw e;
		});
	}

	var ids = map[req], id = ids[0];
	return __webpack_require__.e(ids[1]).then(() => {
		return __webpack_require__.t(id, 7 | 16);
	});
}
webpackAsyncContext.keys = () => (Object.keys(map));
webpackAsyncContext.id = "./assets lazy recursive ^\\.\\/year_.*\\.svg$";
module.exports = webpackAsyncContext;

/***/ }),

/***/ "./node_modules/@mapbox/mapbox-gl-language/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-gl-language/index.js ***!
  \**********************************************************/
/***/ ((module) => {

/**
 * Create a new [Mapbox GL JS plugin](https://www.mapbox.com/blog/build-mapbox-gl-js-plugins/) that
 * modifies the layers of the map style to use the `text-field` that matches the browser language.
 * As of Mapbox GL Language v1.0.0, this plugin no longer supports token values (e.g. `{name}`). v1.0+ expects the `text-field`
 * property of a style to use an [expression](https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/) of the form `['get', 'name_en']` or `['get', 'name']`; these expressions can be nested. Note that `get` expressions used as inputs to other expressions may not be handled by this plugin. For example:
 * ```
 * ["match",
 *   ["get", "name"],
 *   "California",
 *   "Golden State",
 *   ["coalesce",
 *     ["get", "name_en"],
 *     ["get", "name"]
 *   ]
 * ]
 * ```
 * Only styles based on [Mapbox v8 styles](https://docs.mapbox.com/help/troubleshooting/streets-v8-migration-guide/) are supported.
 *
 * @constructor
 * @param {object} options - Options to configure the plugin.
 * @param {string[]} [options.supportedLanguages] - List of supported languages
 * @param {Function} [options.languageTransform] - Custom style transformation to apply
 * @param {RegExp} [options.languageField=/^name_/] - RegExp to match if a text-field is a language field
 * @param {Function} [options.getLanguageField] - Given a language choose the field in the vector tiles
 * @param {string} [options.languageSource] - Name of the source that contains the different languages.
 * @param {string} [options.defaultLanguage] - Name of the default language to initialize style after loading.
 * @param {string[]} [options.excludedLayerIds] - Name of the layers that should be excluded from translation.
 */
function MapboxLanguage(options) {
  options = Object.assign({}, options);
  if (!(this instanceof MapboxLanguage)) {
    throw new Error('MapboxLanguage needs to be called with the new keyword');
  }

  this.setLanguage = this.setLanguage.bind(this);
  this._initialStyleUpdate = this._initialStyleUpdate.bind(this);

  this._defaultLanguage = options.defaultLanguage;
  this._isLanguageField = options.languageField || /^name_/;
  this._getLanguageField = options.getLanguageField || function nameField(language) {
    return language === 'mul' ? 'name' : `name_${language}`;
  };
  this._languageSource = options.languageSource || null;
  this._languageTransform = options.languageTransform;
  this._excludedLayerIds = options.excludedLayerIds || [];
  this.supportedLanguages = options.supportedLanguages || ['ar', 'de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'mul', 'pt', 'ru', 'vi', 'zh-Hans', 'zh-Hant'];
}

const isTokenField = /^\{name/;
function isFlatExpressionField(isLangField, property) {
  const isGetExpression = Array.isArray(property) && property[0] === 'get';
  if (isGetExpression && isTokenField.test(property[1])) {
    console.warn('This plugin no longer supports the use of token syntax (e.g. {name}). Please use a get expression. See https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/ for more details.');
  }

  return isGetExpression && isLangField.test(property[1]);
}

function adaptNestedExpressionField(isLangField, property, languageFieldName) {
  if (Array.isArray(property)) {
    for (let i = 1; i < property.length; i++) {
      if (Array.isArray(property[i])) {
        if (isFlatExpressionField(isLangField, property[i])) {
          property[i][1] = languageFieldName;
        }
        adaptNestedExpressionField(isLangField, property[i], languageFieldName);
      }
    }
  }
}

function adaptPropertyLanguage(isLangField, property, languageFieldName) {
  if (isFlatExpressionField(isLangField, property)) {
    property[1] = languageFieldName;
  }

  adaptNestedExpressionField(isLangField, property, languageFieldName);

  // handle special case of bare ['get', 'name'] expression by wrapping it in a coalesce statement
  if (property[0] === 'get' && property[1] === 'name') {
    const defaultProp = property.slice();
    const adaptedProp = ['get', languageFieldName];
    property = ['coalesce', adaptedProp, defaultProp];
  }

  return property;
}

function changeLayerTextProperty(isLangField, layer, languageFieldName, excludedLayerIds) {
  if (layer.layout && layer.layout['text-field'] && excludedLayerIds.indexOf(layer.id) === -1) {
    return Object.assign({}, layer, {
      layout: Object.assign({}, layer.layout, {
        'text-field': adaptPropertyLanguage(isLangField, layer.layout['text-field'], languageFieldName)
      })
    });
  }
  return layer;
}

function findStreetsSource(style) {
  const sources = Object.keys(style.sources).filter((sourceName) => {
    const url = style.sources[sourceName].url;
    // the source URL can reference the source version or the style version
    // this check and the error forces users to migrate to styles using source version 8
    return url && url.indexOf('mapbox.mapbox-streets-v8') > -1 || /mapbox-streets-v[1-9][1-9]/.test(url);
  });
  if (!sources.length) throw new Error('If using MapboxLanguage with a Mapbox style, the style must be based on vector tile version 8, e.g. "streets-v11"');
  return sources[0];
}

/**
 * Explicitly change the language for a style.
 * @param {object} style - Mapbox GL style to modify
 * @param {string} language - The language iso code
 * @returns {object} the modified style
 */
MapboxLanguage.prototype.setLanguage = function (style, language) {
  if (this.supportedLanguages.indexOf(language) < 0) throw new Error(`Language ${  language  } is not supported`);
  const streetsSource = this._languageSource || findStreetsSource(style);
  if (!streetsSource) return style;

  const field = this._getLanguageField(language);
  const isLangField = this._isLanguageField;
  const excludedLayerIds = this._excludedLayerIds;
  const changedLayers = style.layers.map((layer) => {
    if (layer.source === streetsSource) return changeLayerTextProperty(isLangField, layer, field, excludedLayerIds);
    return layer;
  });

  const languageStyle = Object.assign({}, style, {
    layers: changedLayers
  });

  return this._languageTransform ? this._languageTransform(languageStyle, language) : languageStyle;
};

MapboxLanguage.prototype._initialStyleUpdate = function () {
  const style = this._map.getStyle();
  const language = this._defaultLanguage || browserLanguage(this.supportedLanguages);

  this._map.setStyle(this.setLanguage(style, language));
};

function browserLanguage(supportedLanguages) {
  const language = navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage);
  const parts = language && language.split('-');
  let languageCode = language;
  if (parts.length > 1) {
    languageCode = parts[0];
  }
  if (supportedLanguages.indexOf(languageCode) > -1) {
    return languageCode;
  }
  return null;
}

MapboxLanguage.prototype.onAdd = function (map) {
  this._map = map;
  this._map.on('style.load', this._initialStyleUpdate);
  this._container = document.createElement('div');
  return this._container;
};

MapboxLanguage.prototype.onRemove = function () {
  this._map.off('style.load', this._initialStyleUpdate);
  this._map = undefined;
};

if ( true && typeof module.exports !== 'undefined') {
  module.exports = MapboxLanguage;
} else {
  window.MapboxLanguage = MapboxLanguage;
}


/***/ }),

/***/ "./node_modules/@mapbox/polyline/src/polyline.js":
/*!*******************************************************!*\
  !*** ./node_modules/@mapbox/polyline/src/polyline.js ***!
  \*******************************************************/
/***/ ((module) => {

"use strict";


/**
 * Based off of [the offical Google document](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
 *
 * Some parts from [this implementation](http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoder.js)
 * by [Mark McClure](http://facstaff.unca.edu/mcmcclur/)
 *
 * @module polyline
 */

var polyline = {};

function py2_round(value) {
    // Google's polyline algorithm uses the same rounding strategy as Python 2, which is different from JS for negative values
    return Math.floor(Math.abs(value) + 0.5) * (value >= 0 ? 1 : -1);
}

function encode(current, previous, factor) {
    current = py2_round(current * factor);
    previous = py2_round(previous * factor);
    var coordinate = current - previous;
    coordinate <<= 1;
    if (current - previous < 0) {
        coordinate = ~coordinate;
    }
    var output = '';
    while (coordinate >= 0x20) {
        output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
        coordinate >>= 5;
    }
    output += String.fromCharCode(coordinate + 63);
    return output;
}

/**
 * Decodes to a [latitude, longitude] coordinates array.
 *
 * This is adapted from the implementation in Project-OSRM.
 *
 * @param {String} str
 * @param {Number} precision
 * @returns {Array}
 *
 * @see https://github.com/Project-OSRM/osrm-frontend/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
 */
polyline.decode = function(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, Number.isInteger(precision) ? precision : 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

/**
 * Encodes the given [latitude, longitude] coordinates array.
 *
 * @param {Array.<Array.<Number>>} coordinates
 * @param {Number} precision
 * @returns {String}
 */
polyline.encode = function(coordinates, precision) {
    if (!coordinates.length) { return ''; }

    var factor = Math.pow(10, Number.isInteger(precision) ? precision : 5),
        output = encode(coordinates[0][0], 0, factor) + encode(coordinates[0][1], 0, factor);

    for (var i = 1; i < coordinates.length; i++) {
        var a = coordinates[i], b = coordinates[i - 1];
        output += encode(a[0], b[0], factor);
        output += encode(a[1], b[1], factor);
    }

    return output;
};

function flipped(coords) {
    var flipped = [];
    for (var i = 0; i < coords.length; i++) {
        var coord = coords[i].slice();
        flipped.push([coord[1], coord[0]]);
    }
    return flipped;
}

/**
 * Encodes a GeoJSON LineString feature/geometry.
 *
 * @param {Object} geojson
 * @param {Number} precision
 * @returns {String}
 */
polyline.fromGeoJSON = function(geojson, precision) {
    if (geojson && geojson.type === 'Feature') {
        geojson = geojson.geometry;
    }
    if (!geojson || geojson.type !== 'LineString') {
        throw new Error('Input must be a GeoJSON LineString');
    }
    return polyline.encode(flipped(geojson.coordinates), precision);
};

/**
 * Decodes to a GeoJSON LineString geometry.
 *
 * @param {String} str
 * @param {Number} precision
 * @returns {Object}
 */
polyline.toGeoJSON = function(str, precision) {
    var coords = polyline.decode(str, precision);
    return {
        type: 'LineString',
        coordinates: flipped(coords)
    };
};

if ( true && module.exports) {
    module.exports = polyline;
}


/***/ }),

/***/ "./node_modules/@math.gl/web-mercator/dist/esm/assert.js":
/*!***************************************************************!*\
  !*** ./node_modules/@math.gl/web-mercator/dist/esm/assert.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ assert)
/* harmony export */ });
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '@math.gl/web-mercator: assertion failed.');
  }
}
//# sourceMappingURL=assert.js.map

/***/ }),

/***/ "./node_modules/@math.gl/web-mercator/dist/esm/fit-bounds.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@math.gl/web-mercator/dist/esm/fit-bounds.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ fitBounds)
/* harmony export */ });
/* harmony import */ var _assert__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./assert */ "./node_modules/@math.gl/web-mercator/dist/esm/assert.js");
/* harmony import */ var _math_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./math-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/math-utils.js");
/* harmony import */ var _web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./web-mercator-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/web-mercator-utils.js");



function fitBounds(options) {
  const {
    width,
    height,
    bounds,
    minExtent = 0,
    maxZoom = 24,
    offset = [0, 0]
  } = options;
  const [[west, south], [east, north]] = bounds;
  const padding = getPaddingObject(options.padding);
  const nw = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.lngLatToWorld)([west, (0,_math_utils__WEBPACK_IMPORTED_MODULE_1__.clamp)(north, -_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.MAX_LATITUDE, _web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.MAX_LATITUDE)]);
  const se = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.lngLatToWorld)([east, (0,_math_utils__WEBPACK_IMPORTED_MODULE_1__.clamp)(south, -_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.MAX_LATITUDE, _web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.MAX_LATITUDE)]);
  const size = [Math.max(Math.abs(se[0] - nw[0]), minExtent), Math.max(Math.abs(se[1] - nw[1]), minExtent)];
  const targetSize = [width - padding.left - padding.right - Math.abs(offset[0]) * 2, height - padding.top - padding.bottom - Math.abs(offset[1]) * 2];
  (0,_assert__WEBPACK_IMPORTED_MODULE_0__["default"])(targetSize[0] > 0 && targetSize[1] > 0);
  const scaleX = targetSize[0] / size[0];
  const scaleY = targetSize[1] / size[1];
  const offsetX = (padding.right - padding.left) / 2 / scaleX;
  const offsetY = (padding.top - padding.bottom) / 2 / scaleY;
  const center = [(se[0] + nw[0]) / 2 + offsetX, (se[1] + nw[1]) / 2 + offsetY];
  const centerLngLat = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.worldToLngLat)(center);
  const zoom = Math.min(maxZoom, (0,_math_utils__WEBPACK_IMPORTED_MODULE_1__.log2)(Math.abs(Math.min(scaleX, scaleY))));
  (0,_assert__WEBPACK_IMPORTED_MODULE_0__["default"])(Number.isFinite(zoom));
  return {
    longitude: centerLngLat[0],
    latitude: centerLngLat[1],
    zoom
  };
}

function getPaddingObject(padding = 0) {
  if (typeof padding === 'number') {
    return {
      top: padding,
      bottom: padding,
      left: padding,
      right: padding
    };
  }

  (0,_assert__WEBPACK_IMPORTED_MODULE_0__["default"])(Number.isFinite(padding.top) && Number.isFinite(padding.bottom) && Number.isFinite(padding.left) && Number.isFinite(padding.right));
  return padding;
}
//# sourceMappingURL=fit-bounds.js.map

/***/ }),

/***/ "./node_modules/@math.gl/web-mercator/dist/esm/fly-to-viewport.js":
/*!************************************************************************!*\
  !*** ./node_modules/@math.gl/web-mercator/dist/esm/fly-to-viewport.js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ flyToViewport),
/* harmony export */   "getFlyToDuration": () => (/* binding */ getFlyToDuration)
/* harmony export */ });
/* harmony import */ var _math_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./math-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/math-utils.js");
/* harmony import */ var _web_mercator_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./web-mercator-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/web-mercator-utils.js");
/* harmony import */ var gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! gl-matrix/vec2 */ "./node_modules/gl-matrix/esm/vec2.js");



const EPSILON = 0.01;
const VIEWPORT_TRANSITION_PROPS = ['longitude', 'latitude', 'zoom'];
const DEFAULT_OPTS = {
  curve: 1.414,
  speed: 1.2
};
function flyToViewport(startProps, endProps, t, options) {
  const {
    startZoom,
    startCenterXY,
    uDelta,
    w0,
    u1,
    S,
    rho,
    rho2,
    r0
  } = getFlyToTransitionParams(startProps, endProps, options);

  if (u1 < EPSILON) {
    const viewport = {};

    for (const key of VIEWPORT_TRANSITION_PROPS) {
      const startValue = startProps[key];
      const endValue = endProps[key];
      viewport[key] = (0,_math_utils__WEBPACK_IMPORTED_MODULE_0__.lerp)(startValue, endValue, t);
    }

    return viewport;
  }

  const s = t * S;
  const w = Math.cosh(r0) / Math.cosh(r0 + rho * s);
  const u = w0 * ((Math.cosh(r0) * Math.tanh(r0 + rho * s) - Math.sinh(r0)) / rho2) / u1;
  const scaleIncrement = 1 / w;
  const newZoom = startZoom + (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_1__.scaleToZoom)(scaleIncrement);
  const newCenterWorld = gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_2__.scale([], uDelta, u);
  gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_2__.add(newCenterWorld, newCenterWorld, startCenterXY);
  const newCenter = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_1__.worldToLngLat)(newCenterWorld);
  return {
    longitude: newCenter[0],
    latitude: newCenter[1],
    zoom: newZoom
  };
}
function getFlyToDuration(startProps, endProps, options) {
  const opts = { ...DEFAULT_OPTS,
    ...options
  };
  const {
    screenSpeed,
    speed,
    maxDuration
  } = opts;
  const {
    S,
    rho
  } = getFlyToTransitionParams(startProps, endProps, opts);
  const length = 1000 * S;
  let duration;

  if (Number.isFinite(screenSpeed)) {
    duration = length / (screenSpeed / rho);
  } else {
    duration = length / speed;
  }

  return Number.isFinite(maxDuration) && duration > maxDuration ? 0 : duration;
}

function getFlyToTransitionParams(startProps, endProps, opts) {
  opts = Object.assign({}, DEFAULT_OPTS, opts);
  const rho = opts.curve;
  const startZoom = startProps.zoom;
  const startCenter = [startProps.longitude, startProps.latitude];
  const startScale = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_1__.zoomToScale)(startZoom);
  const endZoom = endProps.zoom;
  const endCenter = [endProps.longitude, endProps.latitude];
  const scale = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_1__.zoomToScale)(endZoom - startZoom);
  const startCenterXY = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_1__.lngLatToWorld)(startCenter);
  const endCenterXY = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_1__.lngLatToWorld)(endCenter);
  const uDelta = gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_2__.sub([], endCenterXY, startCenterXY);
  const w0 = Math.max(startProps.width, startProps.height);
  const w1 = w0 / scale;
  const u1 = gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_2__.length(uDelta) * startScale;

  const _u1 = Math.max(u1, EPSILON);

  const rho2 = rho * rho;
  const b0 = (w1 * w1 - w0 * w0 + rho2 * rho2 * _u1 * _u1) / (2 * w0 * rho2 * _u1);
  const b1 = (w1 * w1 - w0 * w0 - rho2 * rho2 * _u1 * _u1) / (2 * w1 * rho2 * _u1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (r1 - r0) / rho;
  return {
    startZoom,
    startCenterXY,
    uDelta,
    w0,
    u1,
    S,
    rho,
    rho2,
    r0,
    r1
  };
}
//# sourceMappingURL=fly-to-viewport.js.map

/***/ }),

/***/ "./node_modules/@math.gl/web-mercator/dist/esm/get-bounds.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@math.gl/web-mercator/dist/esm/get-bounds.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ getBounds)
/* harmony export */ });
/* harmony import */ var _web_mercator_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./web-mercator-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/web-mercator-utils.js");
/* harmony import */ var gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! gl-matrix/vec2 */ "./node_modules/gl-matrix/esm/vec2.js");
/* harmony import */ var _math_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./math-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/math-utils.js");



const DEGREES_TO_RADIANS = Math.PI / 180;
function getBounds(viewport, z = 0) {
  const {
    width,
    height,
    unproject
  } = viewport;
  const unprojectOps = {
    targetZ: z
  };
  const bottomLeft = unproject([0, height], unprojectOps);
  const bottomRight = unproject([width, height], unprojectOps);
  let topLeft;
  let topRight;
  const halfFov = viewport.fovy ? 0.5 * viewport.fovy * DEGREES_TO_RADIANS : Math.atan(0.5 / viewport.altitude);
  const angleToGround = (90 - viewport.pitch) * DEGREES_TO_RADIANS;

  if (halfFov > angleToGround - 0.01) {
    topLeft = unprojectOnFarPlane(viewport, 0, z);
    topRight = unprojectOnFarPlane(viewport, width, z);
  } else {
    topLeft = unproject([0, 0], unprojectOps);
    topRight = unproject([width, 0], unprojectOps);
  }

  return [bottomLeft, bottomRight, topRight, topLeft];
}

function unprojectOnFarPlane(viewport, x, targetZ) {
  const {
    pixelUnprojectionMatrix
  } = viewport;
  const coord0 = (0,_math_utils__WEBPACK_IMPORTED_MODULE_1__.transformVector)(pixelUnprojectionMatrix, [x, 0, 1, 1]);
  const coord1 = (0,_math_utils__WEBPACK_IMPORTED_MODULE_1__.transformVector)(pixelUnprojectionMatrix, [x, viewport.height, 1, 1]);
  const z = targetZ * viewport.distanceScales.unitsPerMeter[2];
  const t = (z - coord0[2]) / (coord1[2] - coord0[2]);
  const coord = gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_2__.lerp([], coord0, coord1, t);
  const result = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_0__.worldToLngLat)(coord);
  result.push(targetZ);
  return result;
}
//# sourceMappingURL=get-bounds.js.map

/***/ }),

/***/ "./node_modules/@math.gl/web-mercator/dist/esm/index.js":
/*!**************************************************************!*\
  !*** ./node_modules/@math.gl/web-mercator/dist/esm/index.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MAX_LATITUDE": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.MAX_LATITUDE),
/* harmony export */   "WebMercatorViewport": () => (/* reexport safe */ _web_mercator_viewport__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "addMetersToLngLat": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.addMetersToLngLat),
/* harmony export */   "altitudeToFovy": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.altitudeToFovy),
/* harmony export */   "default": () => (/* reexport safe */ _web_mercator_viewport__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "fitBounds": () => (/* reexport safe */ _fit_bounds__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "flyToViewport": () => (/* reexport safe */ _fly_to_viewport__WEBPACK_IMPORTED_MODULE_4__["default"]),
/* harmony export */   "fovyToAltitude": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.fovyToAltitude),
/* harmony export */   "getBounds": () => (/* reexport safe */ _get_bounds__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "getDistanceScales": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.getDistanceScales),
/* harmony export */   "getFlyToDuration": () => (/* reexport safe */ _fly_to_viewport__WEBPACK_IMPORTED_MODULE_4__.getFlyToDuration),
/* harmony export */   "getMeterZoom": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.getMeterZoom),
/* harmony export */   "getProjectionMatrix": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.getProjectionMatrix),
/* harmony export */   "getProjectionParameters": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.getProjectionParameters),
/* harmony export */   "getViewMatrix": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.getViewMatrix),
/* harmony export */   "lngLatToWorld": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.lngLatToWorld),
/* harmony export */   "normalizeViewportProps": () => (/* reexport safe */ _normalize_viewport_props__WEBPACK_IMPORTED_MODULE_3__["default"]),
/* harmony export */   "pixelsToWorld": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.pixelsToWorld),
/* harmony export */   "scaleToZoom": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.scaleToZoom),
/* harmony export */   "unitsPerMeter": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.unitsPerMeter),
/* harmony export */   "worldToLngLat": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.worldToLngLat),
/* harmony export */   "worldToPixels": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.worldToPixels),
/* harmony export */   "zoomToScale": () => (/* reexport safe */ _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__.zoomToScale)
/* harmony export */ });
/* harmony import */ var _web_mercator_viewport__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./web-mercator-viewport */ "./node_modules/@math.gl/web-mercator/dist/esm/web-mercator-viewport.js");
/* harmony import */ var _get_bounds__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./get-bounds */ "./node_modules/@math.gl/web-mercator/dist/esm/get-bounds.js");
/* harmony import */ var _fit_bounds__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./fit-bounds */ "./node_modules/@math.gl/web-mercator/dist/esm/fit-bounds.js");
/* harmony import */ var _normalize_viewport_props__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./normalize-viewport-props */ "./node_modules/@math.gl/web-mercator/dist/esm/normalize-viewport-props.js");
/* harmony import */ var _fly_to_viewport__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./fly-to-viewport */ "./node_modules/@math.gl/web-mercator/dist/esm/fly-to-viewport.js");
/* harmony import */ var _web_mercator_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./web-mercator-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/web-mercator-utils.js");







//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@math.gl/web-mercator/dist/esm/math-utils.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@math.gl/web-mercator/dist/esm/math-utils.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "clamp": () => (/* binding */ clamp),
/* harmony export */   "createMat4": () => (/* binding */ createMat4),
/* harmony export */   "lerp": () => (/* binding */ lerp),
/* harmony export */   "log2": () => (/* binding */ log2),
/* harmony export */   "mod": () => (/* binding */ mod),
/* harmony export */   "transformVector": () => (/* binding */ transformVector)
/* harmony export */ });
/* harmony import */ var gl_matrix_vec4__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! gl-matrix/vec4 */ "./node_modules/gl-matrix/esm/vec4.js");

function createMat4() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function transformVector(matrix, vector) {
  const result = (0,gl_matrix_vec4__WEBPACK_IMPORTED_MODULE_0__.transformMat4)([], vector, matrix);
  (0,gl_matrix_vec4__WEBPACK_IMPORTED_MODULE_0__.scale)(result, result, 1 / result[3]);
  return result;
}
function mod(value, divisor) {
  const modulus = value % divisor;
  return modulus < 0 ? divisor + modulus : modulus;
}
function lerp(start, end, step) {
  return step * end + (1 - step) * start;
}
function clamp(x, min, max) {
  return x < min ? min : x > max ? max : x;
}

function ieLog2(x) {
  return Math.log(x) * Math.LOG2E;
}

const log2 = Math.log2 || ieLog2;
//# sourceMappingURL=math-utils.js.map

/***/ }),

/***/ "./node_modules/@math.gl/web-mercator/dist/esm/normalize-viewport-props.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/@math.gl/web-mercator/dist/esm/normalize-viewport-props.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ normalizeViewportProps)
/* harmony export */ });
/* harmony import */ var _web_mercator_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./web-mercator-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/web-mercator-utils.js");
/* harmony import */ var _math_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./math-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/math-utils.js");


const TILE_SIZE = 512;
function normalizeViewportProps(props) {
  const {
    width,
    height,
    pitch = 0
  } = props;
  let {
    longitude,
    latitude,
    zoom,
    bearing = 0
  } = props;

  if (longitude < -180 || longitude > 180) {
    longitude = (0,_math_utils__WEBPACK_IMPORTED_MODULE_1__.mod)(longitude + 180, 360) - 180;
  }

  if (bearing < -180 || bearing > 180) {
    bearing = (0,_math_utils__WEBPACK_IMPORTED_MODULE_1__.mod)(bearing + 180, 360) - 180;
  }

  const minZoom = (0,_math_utils__WEBPACK_IMPORTED_MODULE_1__.log2)(height / TILE_SIZE);

  if (zoom <= minZoom) {
    zoom = minZoom;
    latitude = 0;
  } else {
    const halfHeightPixels = height / 2 / Math.pow(2, zoom);
    const minLatitude = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_0__.worldToLngLat)([0, halfHeightPixels])[1];

    if (latitude < minLatitude) {
      latitude = minLatitude;
    } else {
      const maxLatitude = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_0__.worldToLngLat)([0, TILE_SIZE - halfHeightPixels])[1];

      if (latitude > maxLatitude) {
        latitude = maxLatitude;
      }
    }
  }

  return {
    width,
    height,
    longitude,
    latitude,
    zoom,
    pitch,
    bearing
  };
}
//# sourceMappingURL=normalize-viewport-props.js.map

/***/ }),

/***/ "./node_modules/@math.gl/web-mercator/dist/esm/web-mercator-utils.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@math.gl/web-mercator/dist/esm/web-mercator-utils.js ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DEFAULT_ALTITUDE": () => (/* binding */ DEFAULT_ALTITUDE),
/* harmony export */   "MAX_LATITUDE": () => (/* binding */ MAX_LATITUDE),
/* harmony export */   "addMetersToLngLat": () => (/* binding */ addMetersToLngLat),
/* harmony export */   "altitudeToFovy": () => (/* binding */ altitudeToFovy),
/* harmony export */   "fovyToAltitude": () => (/* binding */ fovyToAltitude),
/* harmony export */   "getDistanceScales": () => (/* binding */ getDistanceScales),
/* harmony export */   "getMeterZoom": () => (/* binding */ getMeterZoom),
/* harmony export */   "getProjectionMatrix": () => (/* binding */ getProjectionMatrix),
/* harmony export */   "getProjectionParameters": () => (/* binding */ getProjectionParameters),
/* harmony export */   "getViewMatrix": () => (/* binding */ getViewMatrix),
/* harmony export */   "lngLatToWorld": () => (/* binding */ lngLatToWorld),
/* harmony export */   "pixelsToWorld": () => (/* binding */ pixelsToWorld),
/* harmony export */   "scaleToZoom": () => (/* binding */ scaleToZoom),
/* harmony export */   "unitsPerMeter": () => (/* binding */ unitsPerMeter),
/* harmony export */   "worldToLngLat": () => (/* binding */ worldToLngLat),
/* harmony export */   "worldToPixels": () => (/* binding */ worldToPixels),
/* harmony export */   "zoomToScale": () => (/* binding */ zoomToScale)
/* harmony export */ });
/* harmony import */ var _math_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./math-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/math-utils.js");
/* harmony import */ var gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! gl-matrix/mat4 */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! gl-matrix/vec2 */ "./node_modules/gl-matrix/esm/vec2.js");
/* harmony import */ var gl_matrix_vec3__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! gl-matrix/vec3 */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var _assert__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./assert */ "./node_modules/@math.gl/web-mercator/dist/esm/assert.js");





const PI = Math.PI;
const PI_4 = PI / 4;
const DEGREES_TO_RADIANS = PI / 180;
const RADIANS_TO_DEGREES = 180 / PI;
const TILE_SIZE = 512;
const EARTH_CIRCUMFERENCE = 40.03e6;
const MAX_LATITUDE = 85.051129;
const DEFAULT_ALTITUDE = 1.5;
function zoomToScale(zoom) {
  return Math.pow(2, zoom);
}
function scaleToZoom(scale) {
  return (0,_math_utils__WEBPACK_IMPORTED_MODULE_0__.log2)(scale);
}
function lngLatToWorld(lngLat) {
  const [lng, lat] = lngLat;
  (0,_assert__WEBPACK_IMPORTED_MODULE_1__["default"])(Number.isFinite(lng));
  (0,_assert__WEBPACK_IMPORTED_MODULE_1__["default"])(Number.isFinite(lat) && lat >= -90 && lat <= 90, 'invalid latitude');
  const lambda2 = lng * DEGREES_TO_RADIANS;
  const phi2 = lat * DEGREES_TO_RADIANS;
  const x = TILE_SIZE * (lambda2 + PI) / (2 * PI);
  const y = TILE_SIZE * (PI + Math.log(Math.tan(PI_4 + phi2 * 0.5))) / (2 * PI);
  return [x, y];
}
function worldToLngLat(xy) {
  const [x, y] = xy;
  const lambda2 = x / TILE_SIZE * (2 * PI) - PI;
  const phi2 = 2 * (Math.atan(Math.exp(y / TILE_SIZE * (2 * PI) - PI)) - PI_4);
  return [lambda2 * RADIANS_TO_DEGREES, phi2 * RADIANS_TO_DEGREES];
}
function getMeterZoom(options) {
  const {
    latitude
  } = options;
  (0,_assert__WEBPACK_IMPORTED_MODULE_1__["default"])(Number.isFinite(latitude));
  const latCosine = Math.cos(latitude * DEGREES_TO_RADIANS);
  return scaleToZoom(EARTH_CIRCUMFERENCE * latCosine) - 9;
}
function unitsPerMeter(latitude) {
  const latCosine = Math.cos(latitude * DEGREES_TO_RADIANS);
  return TILE_SIZE / EARTH_CIRCUMFERENCE / latCosine;
}
function getDistanceScales(options) {
  const {
    latitude,
    longitude,
    highPrecision = false
  } = options;
  (0,_assert__WEBPACK_IMPORTED_MODULE_1__["default"])(Number.isFinite(latitude) && Number.isFinite(longitude));
  const worldSize = TILE_SIZE;
  const latCosine = Math.cos(latitude * DEGREES_TO_RADIANS);
  const unitsPerDegreeX = worldSize / 360;
  const unitsPerDegreeY = unitsPerDegreeX / latCosine;
  const altUnitsPerMeter = worldSize / EARTH_CIRCUMFERENCE / latCosine;
  const result = {
    unitsPerMeter: [altUnitsPerMeter, altUnitsPerMeter, altUnitsPerMeter],
    metersPerUnit: [1 / altUnitsPerMeter, 1 / altUnitsPerMeter, 1 / altUnitsPerMeter],
    unitsPerDegree: [unitsPerDegreeX, unitsPerDegreeY, altUnitsPerMeter],
    degreesPerUnit: [1 / unitsPerDegreeX, 1 / unitsPerDegreeY, 1 / altUnitsPerMeter]
  };

  if (highPrecision) {
    const latCosine2 = DEGREES_TO_RADIANS * Math.tan(latitude * DEGREES_TO_RADIANS) / latCosine;
    const unitsPerDegreeY2 = unitsPerDegreeX * latCosine2 / 2;
    const altUnitsPerDegree2 = worldSize / EARTH_CIRCUMFERENCE * latCosine2;
    const altUnitsPerMeter2 = altUnitsPerDegree2 / unitsPerDegreeY * altUnitsPerMeter;
    result.unitsPerDegree2 = [0, unitsPerDegreeY2, altUnitsPerDegree2];
    result.unitsPerMeter2 = [altUnitsPerMeter2, 0, altUnitsPerMeter2];
  }

  return result;
}
function addMetersToLngLat(lngLatZ, xyz) {
  const [longitude, latitude, z0] = lngLatZ;
  const [x, y, z] = xyz;
  const {
    unitsPerMeter,
    unitsPerMeter2
  } = getDistanceScales({
    longitude,
    latitude,
    highPrecision: true
  });
  const worldspace = lngLatToWorld(lngLatZ);
  worldspace[0] += x * (unitsPerMeter[0] + unitsPerMeter2[0] * y);
  worldspace[1] += y * (unitsPerMeter[1] + unitsPerMeter2[1] * y);
  const newLngLat = worldToLngLat(worldspace);
  const newZ = (z0 || 0) + (z || 0);
  return Number.isFinite(z0) || Number.isFinite(z) ? [newLngLat[0], newLngLat[1], newZ] : newLngLat;
}
function getViewMatrix(options) {
  const {
    height,
    pitch,
    bearing,
    altitude,
    scale,
    center
  } = options;
  const vm = (0,_math_utils__WEBPACK_IMPORTED_MODULE_0__.createMat4)();
  gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_2__.translate(vm, vm, [0, 0, -altitude]);
  gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_2__.rotateX(vm, vm, -pitch * DEGREES_TO_RADIANS);
  gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_2__.rotateZ(vm, vm, bearing * DEGREES_TO_RADIANS);
  const relativeScale = scale / height;
  gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_2__.scale(vm, vm, [relativeScale, relativeScale, relativeScale]);

  if (center) {
    gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_2__.translate(vm, vm, gl_matrix_vec3__WEBPACK_IMPORTED_MODULE_3__.negate([], center));
  }

  return vm;
}
function getProjectionParameters(options) {
  const {
    width,
    height,
    altitude,
    pitch = 0,
    offset,
    center,
    scale,
    nearZMultiplier = 1,
    farZMultiplier = 1
  } = options;
  let {
    fovy = altitudeToFovy(DEFAULT_ALTITUDE)
  } = options;

  if (altitude !== undefined) {
    fovy = altitudeToFovy(altitude);
  }

  const fovRadians = fovy * DEGREES_TO_RADIANS;
  const pitchRadians = pitch * DEGREES_TO_RADIANS;
  const focalDistance = fovyToAltitude(fovy);
  let cameraToSeaLevelDistance = focalDistance;

  if (center) {
    cameraToSeaLevelDistance += center[2] * scale / Math.cos(pitchRadians) / height;
  }

  const fovAboveCenter = fovRadians * (0.5 + (offset ? offset[1] : 0) / height);
  const topHalfSurfaceDistance = Math.sin(fovAboveCenter) * cameraToSeaLevelDistance / Math.sin((0,_math_utils__WEBPACK_IMPORTED_MODULE_0__.clamp)(Math.PI / 2 - pitchRadians - fovAboveCenter, 0.01, Math.PI - 0.01));
  const furthestDistance = Math.sin(pitchRadians) * topHalfSurfaceDistance + cameraToSeaLevelDistance;
  const horizonDistance = cameraToSeaLevelDistance * 10;
  const farZ = Math.min(furthestDistance * farZMultiplier, horizonDistance);
  return {
    fov: fovRadians,
    aspect: width / height,
    focalDistance,
    near: nearZMultiplier,
    far: farZ
  };
}
function getProjectionMatrix(options) {
  const {
    fov,
    aspect,
    near,
    far
  } = getProjectionParameters(options);
  const projectionMatrix = gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_2__.perspective([], fov, aspect, near, far);
  return projectionMatrix;
}
function altitudeToFovy(altitude) {
  return 2 * Math.atan(0.5 / altitude) * RADIANS_TO_DEGREES;
}
function fovyToAltitude(fovy) {
  return 0.5 / Math.tan(0.5 * fovy * DEGREES_TO_RADIANS);
}
function worldToPixels(xyz, pixelProjectionMatrix) {
  const [x, y, z = 0] = xyz;
  (0,_assert__WEBPACK_IMPORTED_MODULE_1__["default"])(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z));
  return (0,_math_utils__WEBPACK_IMPORTED_MODULE_0__.transformVector)(pixelProjectionMatrix, [x, y, z, 1]);
}
function pixelsToWorld(xyz, pixelUnprojectionMatrix, targetZ = 0) {
  const [x, y, z] = xyz;
  (0,_assert__WEBPACK_IMPORTED_MODULE_1__["default"])(Number.isFinite(x) && Number.isFinite(y), 'invalid pixel coordinate');

  if (Number.isFinite(z)) {
    const coord = (0,_math_utils__WEBPACK_IMPORTED_MODULE_0__.transformVector)(pixelUnprojectionMatrix, [x, y, z, 1]);
    return coord;
  }

  const coord0 = (0,_math_utils__WEBPACK_IMPORTED_MODULE_0__.transformVector)(pixelUnprojectionMatrix, [x, y, 0, 1]);
  const coord1 = (0,_math_utils__WEBPACK_IMPORTED_MODULE_0__.transformVector)(pixelUnprojectionMatrix, [x, y, 1, 1]);
  const z0 = coord0[2];
  const z1 = coord1[2];
  const t = z0 === z1 ? 0 : ((targetZ || 0) - z0) / (z1 - z0);
  return gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_4__.lerp([], coord0, coord1, t);
}
//# sourceMappingURL=web-mercator-utils.js.map

/***/ }),

/***/ "./node_modules/@math.gl/web-mercator/dist/esm/web-mercator-viewport.js":
/*!******************************************************************************!*\
  !*** ./node_modules/@math.gl/web-mercator/dist/esm/web-mercator-viewport.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ WebMercatorViewport)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _math_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./math-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/math-utils.js");
/* harmony import */ var _web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./web-mercator-utils */ "./node_modules/@math.gl/web-mercator/dist/esm/web-mercator-utils.js");
/* harmony import */ var _fit_bounds__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./fit-bounds */ "./node_modules/@math.gl/web-mercator/dist/esm/fit-bounds.js");
/* harmony import */ var _get_bounds__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./get-bounds */ "./node_modules/@math.gl/web-mercator/dist/esm/get-bounds.js");
/* harmony import */ var gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! gl-matrix/mat4 */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! gl-matrix/vec2 */ "./node_modules/gl-matrix/esm/vec2.js");
/* harmony import */ var gl_matrix_vec3__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! gl-matrix/vec3 */ "./node_modules/gl-matrix/esm/vec3.js");








class WebMercatorViewport {
  constructor(props = {
    width: 1,
    height: 1
  }) {
    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "latitude", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "longitude", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "zoom", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "pitch", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "bearing", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "altitude", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "fovy", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "meterOffset", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "center", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "width", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "height", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "scale", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "distanceScales", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "viewMatrix", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "projectionMatrix", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "viewProjectionMatrix", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "pixelProjectionMatrix", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "pixelUnprojectionMatrix", void 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "equals", viewport => {
      if (!(viewport instanceof WebMercatorViewport)) {
        return false;
      }

      return viewport.width === this.width && viewport.height === this.height && gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_5__.equals(viewport.projectionMatrix, this.projectionMatrix) && gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_5__.equals(viewport.viewMatrix, this.viewMatrix);
    });

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "project", (lngLatZ, options = {}) => {
      const {
        topLeft = true
      } = options;
      const worldPosition = this.projectPosition(lngLatZ);
      const coord = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.worldToPixels)(worldPosition, this.pixelProjectionMatrix);
      const [x, y] = coord;
      const y2 = topLeft ? y : this.height - y;
      return lngLatZ.length === 2 ? [x, y2] : [x, y2, coord[2]];
    });

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "unproject", (xyz, options = {}) => {
      const {
        topLeft = true,
        targetZ = undefined
      } = options;
      const [x, y, z] = xyz;
      const y2 = topLeft ? y : this.height - y;
      const targetZWorld = targetZ && targetZ * this.distanceScales.unitsPerMeter[2];
      const coord = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.pixelsToWorld)([x, y2, z], this.pixelUnprojectionMatrix, targetZWorld);
      const [X, Y, Z] = this.unprojectPosition(coord);

      if (Number.isFinite(z)) {
        return [X, Y, Z];
      }

      return Number.isFinite(targetZ) ? [X, Y, targetZ] : [X, Y];
    });

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "projectPosition", xyz => {
      const [X, Y] = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.lngLatToWorld)(xyz);
      const Z = (xyz[2] || 0) * this.distanceScales.unitsPerMeter[2];
      return [X, Y, Z];
    });

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(this, "unprojectPosition", xyz => {
      const [X, Y] = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.worldToLngLat)(xyz);
      const Z = (xyz[2] || 0) * this.distanceScales.metersPerUnit[2];
      return [X, Y, Z];
    });

    let {
      width,
      height,
      altitude = null,
      fovy = null
    } = props;
    const {
      latitude = 0,
      longitude = 0,
      zoom = 0,
      pitch = 0,
      bearing = 0,
      position = null,
      nearZMultiplier = 0.02,
      farZMultiplier = 1.01
    } = props;
    width = width || 1;
    height = height || 1;

    if (fovy === null && altitude === null) {
      altitude = _web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.DEFAULT_ALTITUDE;
      fovy = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.altitudeToFovy)(altitude);
    } else if (fovy === null) {
      fovy = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.altitudeToFovy)(altitude);
    } else if (altitude === null) {
      altitude = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.fovyToAltitude)(fovy);
    }

    const scale = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.zoomToScale)(zoom);
    altitude = Math.max(0.75, altitude);
    const distanceScales = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.getDistanceScales)({
      longitude,
      latitude
    });
    const center = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.lngLatToWorld)([longitude, latitude]);
    center.push(0);

    if (position) {
      gl_matrix_vec3__WEBPACK_IMPORTED_MODULE_6__.add(center, center, gl_matrix_vec3__WEBPACK_IMPORTED_MODULE_6__.mul([], position, distanceScales.unitsPerMeter));
    }

    this.projectionMatrix = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.getProjectionMatrix)({
      width,
      height,
      scale,
      center,
      pitch,
      fovy,
      nearZMultiplier,
      farZMultiplier
    });
    this.viewMatrix = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.getViewMatrix)({
      height,
      scale,
      center,
      pitch,
      bearing,
      altitude
    });
    this.width = width;
    this.height = height;
    this.scale = scale;
    this.latitude = latitude;
    this.longitude = longitude;
    this.zoom = zoom;
    this.pitch = pitch;
    this.bearing = bearing;
    this.altitude = altitude;
    this.fovy = fovy;
    this.center = center;
    this.meterOffset = position || [0, 0, 0];
    this.distanceScales = distanceScales;

    this._initMatrices();

    Object.freeze(this);
  }

  _initMatrices() {
    const {
      width,
      height,
      projectionMatrix,
      viewMatrix
    } = this;
    const vpm = (0,_math_utils__WEBPACK_IMPORTED_MODULE_1__.createMat4)();
    gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_5__.multiply(vpm, vpm, projectionMatrix);
    gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_5__.multiply(vpm, vpm, viewMatrix);
    this.viewProjectionMatrix = vpm;
    const m = (0,_math_utils__WEBPACK_IMPORTED_MODULE_1__.createMat4)();
    gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_5__.scale(m, m, [width / 2, -height / 2, 1]);
    gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_5__.translate(m, m, [1, -1, 0]);
    gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_5__.multiply(m, m, vpm);
    const mInverse = gl_matrix_mat4__WEBPACK_IMPORTED_MODULE_5__.invert((0,_math_utils__WEBPACK_IMPORTED_MODULE_1__.createMat4)(), m);

    if (!mInverse) {
      throw new Error('Pixel project matrix not invertible');
    }

    this.pixelProjectionMatrix = m;
    this.pixelUnprojectionMatrix = mInverse;
  }

  projectFlat(lngLat) {
    return (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.lngLatToWorld)(lngLat);
  }

  unprojectFlat(xy) {
    return (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.worldToLngLat)(xy);
  }

  getMapCenterByLngLatPosition({
    lngLat,
    pos
  }) {
    const fromLocation = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.pixelsToWorld)(pos, this.pixelUnprojectionMatrix);
    const toLocation = (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.lngLatToWorld)(lngLat);
    const translate = gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_7__.add([], toLocation, gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_7__.negate([], fromLocation));
    const newCenter = gl_matrix_vec2__WEBPACK_IMPORTED_MODULE_7__.add([], this.center, translate);
    return (0,_web_mercator_utils__WEBPACK_IMPORTED_MODULE_2__.worldToLngLat)(newCenter);
  }

  fitBounds(bounds, options = {}) {
    const {
      width,
      height
    } = this;
    const {
      longitude,
      latitude,
      zoom
    } = (0,_fit_bounds__WEBPACK_IMPORTED_MODULE_3__["default"])(Object.assign({
      width,
      height,
      bounds
    }, options));
    return new WebMercatorViewport({
      width,
      height,
      longitude,
      latitude,
      zoom
    });
  }

  getBounds(options) {
    const corners = this.getBoundingRegion(options);
    const west = Math.min(...corners.map(p => p[0]));
    const east = Math.max(...corners.map(p => p[0]));
    const south = Math.min(...corners.map(p => p[1]));
    const north = Math.max(...corners.map(p => p[1]));
    return [[west, south], [east, north]];
  }

  getBoundingRegion(options = {}) {
    return (0,_get_bounds__WEBPACK_IMPORTED_MODULE_4__["default"])(this, options.z || 0);
  }

  getLocationAtPoint({
    lngLat,
    pos
  }) {
    return this.getMapCenterByLngLatPosition({
      lngLat,
      pos
    });
  }

}
//# sourceMappingURL=web-mercator-viewport.js.map

/***/ }),

/***/ "./src/components/Layout/style.module.scss":
/*!*************************************************!*\
  !*** ./src/components/Layout/style.module.scss ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
	"body": "style-module--body--a1572"
});


/***/ }),

/***/ "./src/components/RunMap/style.module.scss":
/*!*************************************************!*\
  !*** ./src/components/RunMap/style.module.scss ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
	"locationSVG": "style-module--locationSVG--2adbd",
	"buttons": "style-module--buttons--4da44",
	"button": "style-module--button--1573e",
	"fullscreenButton": "style-module--fullscreenButton--4aa1d",
	"runTitle": "style-module--runTitle--09504"
});


/***/ }),

/***/ "./src/components/RunTable/style.module.scss":
/*!***************************************************!*\
  !*** ./src/components/RunTable/style.module.scss ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
	"runTable": "style-module--runTable--84570",
	"runRow": "style-module--runRow--42c85",
	"tableContainer": "style-module--tableContainer--b302a",
	"runDate": "style-module--runDate--b8f52"
});


/***/ }),

/***/ "./src/components/SVGStat/style.module.scss":
/*!**************************************************!*\
  !*** ./src/components/SVGStat/style.module.scss ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
	"runSVG": "style-module--runSVG--e35c5"
});


/***/ }),

/***/ "./src/components/YearStat/style.module.scss":
/*!***************************************************!*\
  !*** ./src/components/YearStat/style.module.scss ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
	"yearSVG": "style-module--yearSVG--347ec"
});


/***/ }),

/***/ "./src/components/Header/index.jsx":
/*!*****************************************!*\
  !*** ./src/components/Header/index.jsx ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var gatsby__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! gatsby */ "./.cache/gatsby-browser-entry.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var src_hooks_useSiteMetadata__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/hooks/useSiteMetadata */ "./src/hooks/useSiteMetadata.js");



const Header = () => {
  const {
    logo,
    siteUrl,
    navLinks
  } = (0,src_hooks_useSiteMetadata__WEBPACK_IMPORTED_MODULE_2__["default"])();
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("nav", {
    className: "db flex justify-between w-100 ph5-l",
    style: {
      marginTop: '3rem'
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", {
    className: "dib w-25 v-mid"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(gatsby__WEBPACK_IMPORTED_MODULE_0__.Link, {
    to: siteUrl,
    className: "link dim"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("picture", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("img", {
    className: "dib w3 h3 br-100",
    alt: "logo",
    src: logo
  })))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", {
    className: "dib w-75 v-mid tr"
  }, navLinks.map((n, i) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("a", {
    key: i,
    href: n.url,
    className: "light-gray link dim f6 f5-l mr3 mr4-l"
  }, n.name)))));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Header);

/***/ }),

/***/ "./src/components/Layout/index.jsx":
/*!*****************************************!*\
  !*** ./src/components/Layout/index.jsx ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-helmet */ "./node_modules/react-helmet/es/Helmet.js");
/* harmony import */ var src_components_Header__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/components/Header */ "./src/components/Header/index.jsx");
/* harmony import */ var src_hooks_useSiteMetadata__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/hooks/useSiteMetadata */ "./src/hooks/useSiteMetadata.js");
/* harmony import */ var src_styles_index_scss__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/styles/index.scss */ "./src/styles/index.scss");
/* harmony import */ var src_styles_index_scss__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(src_styles_index_scss__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _style_module_scss__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./style.module.scss */ "./src/components/Layout/style.module.scss");







const Layout = ({
  children
}) => {
  const {
    siteTitle,
    description
  } = (0,src_hooks_useSiteMetadata__WEBPACK_IMPORTED_MODULE_3__["default"])();
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(react_helmet__WEBPACK_IMPORTED_MODULE_1__.Helmet, {
    bodyAttributes: {
      class: _style_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].body
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("html", {
    lang: "en"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("title", null, siteTitle), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("meta", {
    name: "description",
    content: description
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("meta", {
    name: "keywords",
    content: "running"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("meta", {
    name: "viewport",
    content: "width=device-width, initial-scale=1, shrink-to-fit=no"
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Header__WEBPACK_IMPORTED_MODULE_2__["default"], {
    title: siteTitle
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "pa3 pa5-l"
  }, children));
};
Layout.propTypes = {
  children: (prop_types__WEBPACK_IMPORTED_MODULE_6___default().node.isRequired)
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Layout);

/***/ }),

/***/ "./src/components/LocationStat/CitiesStat.jsx":
/*!****************************************************!*\
  !*** ./src/components/LocationStat/CitiesStat.jsx ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_components_Stat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/components/Stat */ "./src/components/Stat/index.jsx");
/* harmony import */ var src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/hooks/useActivities */ "./src/hooks/useActivities.js");




// only support China for now
const CitiesStat = ({
  onClick
}) => {
  const {
    cities
  } = (0,src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_2__["default"])();
  const citiesArr = Object.entries(cities);
  citiesArr.sort((a, b) => b[1] - a[1]);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", null, citiesArr.map(([city, distance]) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    key: city,
    value: city,
    description: ` ${(distance / 1000).toFixed(0)} KM`,
    citySize: 3,
    onClick: () => onClick(city)
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("hr", {
    color: "red"
  }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (CitiesStat);

/***/ }),

/***/ "./src/components/LocationStat/LocationSummary.jsx":
/*!*********************************************************!*\
  !*** ./src/components/LocationStat/LocationSummary.jsx ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_components_Stat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/components/Stat */ "./src/components/Stat/index.jsx");
/* harmony import */ var src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/hooks/useActivities */ "./src/hooks/useActivities.js");




// only support China for now
const LocationSummary = () => {
  const {
    years,
    countries,
    provinces,
    cities
  } = (0,src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_2__["default"])();
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", null, years && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    value: `${years.length}`,
    description: " \u5E74\u91CC\u6211\u8DD1\u8FC7"
  }), countries && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    value: countries.length,
    description: " \u4E2A\u56FD\u5BB6"
  }), provinces && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    value: provinces.length,
    description: " \u4E2A\u7701\u4EFD"
  }), cities && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    value: Object.keys(cities).length,
    description: " \u4E2A\u57CE\u5E02"
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("hr", {
    color: "red"
  }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (LocationSummary);

/***/ }),

/***/ "./src/components/LocationStat/PeriodStat.jsx":
/*!****************************************************!*\
  !*** ./src/components/LocationStat/PeriodStat.jsx ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_components_Stat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/components/Stat */ "./src/components/Stat/index.jsx");
/* harmony import */ var src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/hooks/useActivities */ "./src/hooks/useActivities.js");



const PeriodStat = ({
  onClick
}) => {
  const {
    runPeriod
  } = (0,src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_2__["default"])();
  const periodArr = Object.entries(runPeriod);
  periodArr.sort((a, b) => b[1] - a[1]);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", null, periodArr.map(([period, times]) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    key: period,
    value: period,
    description: ` ${times} Runs`,
    citySize: 3,
    onClick: () => onClick(period)
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("hr", {
    color: "red"
  }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PeriodStat);

/***/ }),

/***/ "./src/components/LocationStat/index.jsx":
/*!***********************************************!*\
  !*** ./src/components/LocationStat/index.jsx ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_components_YearStat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/components/YearStat */ "./src/components/YearStat/index.jsx");
/* harmony import */ var _utils_const__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/const */ "./src/utils/const.js");
/* harmony import */ var _CitiesStat__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./CitiesStat */ "./src/components/LocationStat/CitiesStat.jsx");
/* harmony import */ var _LocationSummary__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./LocationSummary */ "./src/components/LocationStat/LocationSummary.jsx");
/* harmony import */ var _PeriodStat__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./PeriodStat */ "./src/components/LocationStat/PeriodStat.jsx");






const LocationStat = ({
  changeYear,
  changeCity,
  changeTitle
}) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
  className: "fl w-100 w-30-l pb5 pr5-l"
}, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
  className: "pb4",
  style: {
    paddingBottom: '0rem'
  }
}, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
  style: {
    lineHeight: 1.8
  }
}, _utils_const__WEBPACK_IMPORTED_MODULE_2__.CHINESE_LOCATION_INFO_MESSAGE_FIRST, ".", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), _utils_const__WEBPACK_IMPORTED_MODULE_2__.CHINESE_LOCATION_INFO_MESSAGE_SECOND, ".", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), "Yesterday you said tomorrow.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("hr", {
  color: "red"
}), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_LocationSummary__WEBPACK_IMPORTED_MODULE_4__["default"], null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_CitiesStat__WEBPACK_IMPORTED_MODULE_3__["default"], {
  onClick: changeCity
}), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_PeriodStat__WEBPACK_IMPORTED_MODULE_5__["default"], {
  onClick: changeTitle
}), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_YearStat__WEBPACK_IMPORTED_MODULE_1__["default"], {
  year: "Total",
  onClick: changeYear
}));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (LocationStat);

/***/ }),

/***/ "./src/components/RunMap/RunMaker.jsx":
/*!********************************************!*\
  !*** ./src/components/RunMap/RunMaker.jsx ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var assets_end_svg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! assets/end.svg */ "./assets/end.svg");
/* harmony import */ var assets_end_svg__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(assets_end_svg__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var assets_start_svg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! assets/start.svg */ "./assets/start.svg");
/* harmony import */ var assets_start_svg__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(assets_start_svg__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_map_gl__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-map-gl */ "./node_modules/react-map-gl/dist/esm/index.js");
/* harmony import */ var _style_module_scss__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./style.module.scss */ "./src/components/RunMap/style.module.scss");





const RunMarker = ({
  startLon,
  startLat,
  endLon,
  endLat
}) => {
  const size = 20;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement(react_map_gl__WEBPACK_IMPORTED_MODULE_3__.Marker, {
    key: "maker_start",
    longitude: startLon,
    latitude: startLat
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("div", {
    style: {
      transform: `translate(${-size / 2}px,${-size}px)`,
      maxWidth: '25px'
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement((assets_start_svg__WEBPACK_IMPORTED_MODULE_1___default()), {
    className: _style_module_scss__WEBPACK_IMPORTED_MODULE_4__["default"].locationSVG
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement(react_map_gl__WEBPACK_IMPORTED_MODULE_3__.Marker, {
    key: "maker_end",
    longitude: endLon,
    latitude: endLat
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("div", {
    style: {
      transform: `translate(${-size / 2}px,${-size}px)`,
      maxWidth: '25px'
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement((assets_end_svg__WEBPACK_IMPORTED_MODULE_0___default()), {
    className: _style_module_scss__WEBPACK_IMPORTED_MODULE_4__["default"].locationSVG
  }))));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (RunMarker);

/***/ }),

/***/ "./src/components/RunMap/RunMapButtons.jsx":
/*!*************************************************!*\
  !*** ./src/components/RunMap/RunMapButtons.jsx ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/hooks/useActivities */ "./src/hooks/useActivities.js");
/* harmony import */ var src_utils_const__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/utils/const */ "./src/utils/const.js");
/* harmony import */ var _style_module_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./style.module.scss */ "./src/components/RunMap/style.module.scss");




const RunMapButtons = ({
  changeYear,
  thisYear,
  mapButtonYear
}) => {
  const elements = document.getElementsByClassName(_style_module_scss__WEBPACK_IMPORTED_MODULE_3__["default"].button);
  const {
    years
  } = (0,src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_1__["default"])();
  const yearsButtons = years.slice();
  yearsButtons.push('Total');
  const {
    0: index,
    1: setIndex
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const handleClick = (e, year) => {
    const elementIndex = yearsButtons.indexOf(year);
    e.target.style.color = src_utils_const__WEBPACK_IMPORTED_MODULE_2__.MAIN_COLOR;
    if (index !== elementIndex) {
      elements[index].style.color = 'white';
    }
    setIndex(elementIndex);
  };
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: _style_module_scss__WEBPACK_IMPORTED_MODULE_3__["default"].buttons
  }, yearsButtons.map(year => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: `${year}button`,
    style: {
      color: year === thisYear ? src_utils_const__WEBPACK_IMPORTED_MODULE_2__.MAIN_COLOR : 'white'
    },
    year: year,
    onClick: e => {
      changeYear(year);
      handleClick(e, year);
    },
    className: _style_module_scss__WEBPACK_IMPORTED_MODULE_3__["default"].button
  }, year))));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (RunMapButtons);

/***/ }),

/***/ "./src/components/RunMap/index.jsx":
/*!*****************************************!*\
  !*** ./src/components/RunMap/index.jsx ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _mapbox_mapbox_gl_language__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @mapbox/mapbox-gl-language */ "./node_modules/@mapbox/mapbox-gl-language/index.js");
/* harmony import */ var _mapbox_mapbox_gl_language__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_mapbox_mapbox_gl_language__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_map_gl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-map-gl */ "./node_modules/react-map-gl/dist/esm/index.js");
/* harmony import */ var src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/hooks/useActivities */ "./src/hooks/useActivities.js");
/* harmony import */ var src_utils_const__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/utils/const */ "./src/utils/const.js");
/* harmony import */ var src_utils_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! src/utils/utils */ "./src/utils/utils.js");
/* harmony import */ var _RunMaker__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./RunMaker */ "./src/components/RunMap/RunMaker.jsx");
/* harmony import */ var _RunMapButtons__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./RunMapButtons */ "./src/components/RunMap/RunMapButtons.jsx");
/* harmony import */ var _style_module_scss__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./style.module.scss */ "./src/components/RunMap/style.module.scss");









const RunMap = ({
  title,
  viewport,
  setViewport,
  changeYear,
  geoData,
  thisYear,
  mapButtonYear
}) => {
  const {
    provinces
  } = (0,src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_3__["default"])();
  const mapRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)();
  const mapRefCallback = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(ref => {
    if (ref !== null) {
      mapRef.current = ref;
      const map = ref.getMap();
      if (map && src_utils_const__WEBPACK_IMPORTED_MODULE_4__.IS_CHINESE) {
        map.addControl(new (_mapbox_mapbox_gl_language__WEBPACK_IMPORTED_MODULE_0___default())({
          defaultLanguage: 'zh-Hans'
        }));
      }
    }
  }, [mapRef]);
  const filterProvinces = provinces.slice();
  // for geojson format
  filterProvinces.unshift('in', 'name');
  const isBigMap = viewport.zoom <= 3;
  if (isBigMap && src_utils_const__WEBPACK_IMPORTED_MODULE_4__.IS_CHINESE) {
    geoData = (0,src_utils_utils__WEBPACK_IMPORTED_MODULE_5__.geoJsonForMap)();
  }
  const isSingleRun = geoData.features.length === 1 && geoData.features[0].geometry.coordinates.length;
  let startLon;
  let startLat;
  let endLon;
  let endLat;
  if (isSingleRun) {
    const points = geoData.features[0].geometry.coordinates;
    [startLon, startLat] = points[0];
    [endLon, endLat] = points[points.length - 1];
  }
  let dash = src_utils_const__WEBPACK_IMPORTED_MODULE_4__.USE_DASH_LINE && !isSingleRun ? [2, 2] : [2, 0];
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(react_map_gl__WEBPACK_IMPORTED_MODULE_2__["default"], Object.assign({}, viewport, {
    width: "100%",
    height: src_utils_const__WEBPACK_IMPORTED_MODULE_4__.MAP_HEIGHT,
    mapStyle: "mapbox://styles/mapbox/dark-v10",
    onViewportChange: setViewport,
    ref: mapRefCallback,
    mapboxApiAccessToken: src_utils_const__WEBPACK_IMPORTED_MODULE_4__.MAPBOX_TOKEN
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_RunMapButtons__WEBPACK_IMPORTED_MODULE_7__["default"], {
    changeYear: changeYear,
    thisYear: thisYear,
    mapButtonYear: mapButtonYear
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(react_map_gl__WEBPACK_IMPORTED_MODULE_2__.FullscreenControl, {
    className: _style_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].fullscreenButton
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(react_map_gl__WEBPACK_IMPORTED_MODULE_2__.Source, {
    id: "data",
    type: "geojson",
    data: geoData
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(react_map_gl__WEBPACK_IMPORTED_MODULE_2__.Layer, {
    id: "province",
    type: "fill",
    paint: {
      'fill-color': src_utils_const__WEBPACK_IMPORTED_MODULE_4__.PROVINCE_FILL_COLOR
    },
    filter: filterProvinces
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(react_map_gl__WEBPACK_IMPORTED_MODULE_2__.Layer, {
    id: "runs2",
    type: "line",
    paint: {
      'line-color': src_utils_const__WEBPACK_IMPORTED_MODULE_4__.MAIN_COLOR,
      'line-width': isBigMap ? 1 : 2,
      'line-dasharray': dash,
      'line-opacity': isSingleRun ? 1 : src_utils_const__WEBPACK_IMPORTED_MODULE_4__.LINE_OPACITY
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    }
  })), isSingleRun && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_RunMaker__WEBPACK_IMPORTED_MODULE_6__["default"], {
    startLat: startLat,
    startLon: startLon,
    endLat: endLat,
    endLon: endLon
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", {
    className: _style_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].runTitle
  }, title));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (RunMap);

/***/ }),

/***/ "./src/components/RunTable/RunRow.jsx":
/*!********************************************!*\
  !*** ./src/components/RunTable/RunRow.jsx ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_utils_const__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/utils/const */ "./src/utils/const.js");
/* harmony import */ var src_utils_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/utils/utils */ "./src/utils/utils.js");
/* harmony import */ var _style_module_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./style.module.scss */ "./src/components/RunTable/style.module.scss");




const RunRow = ({
  runs,
  run,
  locateActivity,
  runIndex,
  setRunIndex
}) => {
  const distance = (run.distance / 1000.0).toFixed(1);
  const pace = run.average_speed;
  const paceParts = pace ? (0,src_utils_utils__WEBPACK_IMPORTED_MODULE_2__.formatPace)(pace) : null;
  const heartRate = run.average_heartrate;
  const runTime = (0,src_utils_utils__WEBPACK_IMPORTED_MODULE_2__.formatRunTime)(distance, pace);

  // change click color
  const handleClick = (e, runs, run) => {
    const elementIndex = runs.indexOf(run);
    e.target.parentElement.style.color = 'red';
    const elements = document.getElementsByClassName(_style_module_scss__WEBPACK_IMPORTED_MODULE_3__["default"].runRow);
    if (runIndex !== -1 && elementIndex !== runIndex) {
      elements[runIndex].style.color = src_utils_const__WEBPACK_IMPORTED_MODULE_1__.MAIN_COLOR;
    }
    setRunIndex(elementIndex);
  };
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("tr", {
    className: _style_module_scss__WEBPACK_IMPORTED_MODULE_3__["default"].runRow,
    key: run.start_date_local,
    onClick: e => {
      handleClick(e, runs, run);
      locateActivity(run);
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("td", null, (0,src_utils_utils__WEBPACK_IMPORTED_MODULE_2__.titleForRun)(run)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("td", null, distance), pace && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("td", null, paceParts), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("td", null, heartRate && heartRate.toFixed(0)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("td", null, runTime), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("td", {
    className: _style_module_scss__WEBPACK_IMPORTED_MODULE_3__["default"].runDate
  }, run.start_date_local));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (RunRow);

/***/ }),

/***/ "./src/components/RunTable/index.jsx":
/*!*******************************************!*\
  !*** ./src/components/RunTable/index.jsx ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_utils_const__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/utils/const */ "./src/utils/const.js");
/* harmony import */ var src_utils_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/utils/utils */ "./src/utils/utils.js");
/* harmony import */ var _RunRow__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./RunRow */ "./src/components/RunTable/RunRow.jsx");
/* harmony import */ var _style_module_scss__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./style.module.scss */ "./src/components/RunTable/style.module.scss");





const RunTable = ({
  runs,
  locateActivity,
  setActivity,
  runIndex,
  setRunIndex
}) => {
  const {
    0: sortFuncInfo,
    1: setSortFuncInfo
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  // TODO refactor?
  const sortKMFunc = (a, b) => sortFuncInfo === 'KM' ? a.distance - b.distance : b.distance - a.distance;
  const sortPaceFunc = (a, b) => sortFuncInfo === 'Pace' ? a.average_speed - b.average_speed : b.average_speed - a.average_speed;
  const sortBPMFunc = (a, b) => sortFuncInfo === 'BPM' ? a.average_heartrate - b.average_heartrate : b.average_heartrate - a.average_heartrate;
  const sortRunTimeFunc = (a, b) => {
    if (Number.isNaN(a.distance) || Number.isNaN(b.distance) || Number.isNaN(a.average_speed) || Number.isNaN(b.average_speed)) {
      return 0;
    }
    const aDistance = (a.distance / 1000.0).toFixed(1);
    const bDistance = (b.distance / 1000.0).toFixed(1);
    const aPace = 1000.0 / 60.0 * (1.0 / a.average_speed);
    const bPace = 1000.0 / 60.0 * (1.0 / b.average_speed);
    if (sortFuncInfo === 'Time') {
      return aDistance * aPace - bDistance * bPace;
    } else {
      return bDistance * bPace - aDistance * aPace;
    }
  };
  const sortDateFuncClick = sortFuncInfo === 'Date' ? src_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sortDateFunc : src_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sortDateFuncReverse;
  const sortFuncMap = new Map([['KM', sortKMFunc], ['Pace', sortPaceFunc], ['BPM', sortBPMFunc], ['Time', sortRunTimeFunc], ['Date', sortDateFuncClick]]);
  const handleClick = e => {
    const funcName = e.target.innerHTML;
    if (sortFuncInfo === funcName) {
      setSortFuncInfo('');
    } else {
      setSortFuncInfo(funcName);
    }
    const f = sortFuncMap.get(e.target.innerHTML);
    if (runIndex !== -1) {
      const el = document.getElementsByClassName(_style_module_scss__WEBPACK_IMPORTED_MODULE_4__["default"].runRow);
      el[runIndex].style.color = src_utils_const__WEBPACK_IMPORTED_MODULE_1__.MAIN_COLOR;
    }
    setActivity(runs.sort(f));
  };
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _style_module_scss__WEBPACK_IMPORTED_MODULE_4__["default"].tableContainer
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("table", {
    className: _style_module_scss__WEBPACK_IMPORTED_MODULE_4__["default"].runTable,
    cellSpacing: "0",
    cellPadding: "0"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("thead", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("tr", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("th", null), Array.from(sortFuncMap.keys()).map(k => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("th", {
    key: k,
    onClick: e => handleClick(e)
  }, k)))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("tbody", null, runs.map(run => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_RunRow__WEBPACK_IMPORTED_MODULE_3__["default"], {
    runs: runs,
    run: run,
    key: run.run_id,
    locateActivity: locateActivity,
    runIndex: runIndex,
    setRunIndex: setRunIndex
  })))));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (RunTable);

/***/ }),

/***/ "./src/components/SVGStat/index.jsx":
/*!******************************************!*\
  !*** ./src/components/SVGStat/index.jsx ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var assets_github_svg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! assets/github.svg */ "./assets/github.svg");
/* harmony import */ var assets_github_svg__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(assets_github_svg__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var assets_grid_svg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! assets/grid.svg */ "./assets/grid.svg");
/* harmony import */ var assets_grid_svg__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(assets_grid_svg__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _style_module_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./style.module.scss */ "./src/components/SVGStat/style.module.scss");




const SVGStat = () => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((assets_github_svg__WEBPACK_IMPORTED_MODULE_1___default()), {
  className: _style_module_scss__WEBPACK_IMPORTED_MODULE_3__["default"].runSVG
}), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((assets_grid_svg__WEBPACK_IMPORTED_MODULE_2___default()), {
  className: _style_module_scss__WEBPACK_IMPORTED_MODULE_3__["default"].runSVG
}));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SVGStat);

/***/ }),

/***/ "./src/components/Stat/index.jsx":
/*!***************************************!*\
  !*** ./src/components/Stat/index.jsx ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_utils_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/utils/utils */ "./src/utils/utils.js");


const divStyle = {
  fontWeight: '700'
};
const Stat = ({
  value,
  description,
  className,
  citySize,
  onClick
}) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
  className: `${className} pb2 w-100`,
  onClick: onClick
}, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
  className: `f${citySize || 1} fw9 i`,
  style: divStyle
}, (0,src_utils_utils__WEBPACK_IMPORTED_MODULE_1__.intComma)(value)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
  className: "f3 fw6 i"
}, description));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Stat);

/***/ }),

/***/ "./src/components/YearStat/index.jsx":
/*!*******************************************!*\
  !*** ./src/components/YearStat/index.jsx ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_components_Stat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/components/Stat */ "./src/components/Stat/index.jsx");
/* harmony import */ var src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/hooks/useActivities */ "./src/hooks/useActivities.js");
/* harmony import */ var src_hooks_useHover__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/hooks/useHover */ "./src/hooks/useHover.js");
/* harmony import */ var src_utils_utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/utils/utils */ "./src/utils/utils.js");
/* harmony import */ var _style_module_scss__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./style.module.scss */ "./src/components/YearStat/style.module.scss");






const YearStat = ({
  year,
  onClick
}) => {
  let {
    activities: runs,
    years
  } = (0,src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_2__["default"])();
  // for hover
  const [hovered, eventHandlers] = (0,src_hooks_useHover__WEBPACK_IMPORTED_MODULE_3__["default"])();
  // lazy Component
  const YearSVG = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().lazy(() => __webpack_require__("./assets lazy recursive ^\\.\\/year_.*\\.svg$")(`./year_${year}.svg`).catch(() => ({
    default: () => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null)
  })));
  if (years.includes(year)) {
    runs = runs.filter(run => run.start_date_local.slice(0, 4) === year);
  }
  let sumDistance = 0;
  let streak = 0;
  let pace = 0;
  let paceNullCount = 0;
  let heartRate = 0;
  let heartRateNullCount = 0;
  runs.forEach(run => {
    sumDistance += run.distance || 0;
    if (run.average_speed) {
      pace += run.average_speed;
    } else {
      paceNullCount++;
    }
    if (run.average_heartrate) {
      heartRate += run.average_heartrate;
    } else {
      heartRateNullCount++;
    }
    if (run.streak) {
      streak = Math.max(streak, run.streak);
    }
  });
  sumDistance = (sumDistance / 1000.0).toFixed(1);
  const avgPace = (0,src_utils_utils__WEBPACK_IMPORTED_MODULE_4__.formatPace)(pace / (runs.length - paceNullCount));
  const hasHeartRate = !(heartRate === 0);
  const avgHeartRate = (heartRate / (runs.length - heartRateNullCount)).toFixed(0);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", Object.assign({
    style: {
      cursor: 'pointer'
    },
    onClick: () => onClick(year)
  }, eventHandlers), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    value: year,
    description: " Journey"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    value: runs.length,
    description: " Runs"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    value: sumDistance,
    description: " KM"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    value: avgPace,
    description: " Avg Pace"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    value: `${streak} day`,
    description: " Streak",
    className: "mb0 pb0"
  }), hasHeartRate && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Stat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    value: avgHeartRate,
    description: " Avg Heart Rate"
  })), hovered && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Suspense), {
    fallback: "loading..."
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(YearSVG, {
    className: _style_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].yearSVG
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("hr", {
    color: "red"
  }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (YearStat);

/***/ }),

/***/ "./src/components/YearsStat/index.jsx":
/*!********************************************!*\
  !*** ./src/components/YearsStat/index.jsx ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_components_YearStat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/components/YearStat */ "./src/components/YearStat/index.jsx");
/* harmony import */ var src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/hooks/useActivities */ "./src/hooks/useActivities.js");
/* harmony import */ var src_utils_const__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/utils/const */ "./src/utils/const.js");




const YearsStat = ({
  year,
  onClick
}) => {
  const {
    years
  } = (0,src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_2__["default"])();
  // make sure the year click on front
  let yearsArrayUpdate = years.slice();
  yearsArrayUpdate.push('Total');
  yearsArrayUpdate = yearsArrayUpdate.filter(x => x !== year);
  yearsArrayUpdate.unshift(year);

  // for short solution need to refactor
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "fl w-100-l pb5 pr5-l"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "pb4",
    style: {
      paddingBottom: '0rem'
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    style: {
      lineHeight: 1.8
    }
  }, (0,src_utils_const__WEBPACK_IMPORTED_MODULE_3__.INFO_MESSAGE)(years.length, year), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("hr", {
    color: "red"
  }), yearsArrayUpdate.map(year => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_YearStat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    key: year,
    year: year,
    onClick: onClick
  })), yearsArrayUpdate.hasOwnProperty('Total') ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_YearStat__WEBPACK_IMPORTED_MODULE_1__["default"], {
    key: "Total",
    year: "Total",
    onClick: onClick
  }) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (YearsStat);

/***/ }),

/***/ "./src/hooks/useActivities.js":
/*!************************************!*\
  !*** ./src/hooks/useActivities.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _public_page_data_sq_d_3278082143_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../public/page-data/sq/d/3278082143.json */ "./public/page-data/sq/d/3278082143.json");
/* harmony import */ var src_utils_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/utils/utils */ "./src/utils/utils.js");


const useActivities = () => {
  const {
    allActivitiesJson
  } = _public_page_data_sq_d_3278082143_json__WEBPACK_IMPORTED_MODULE_0__.data;
  const activities = allActivitiesJson.nodes;
  const cities = {};
  const runPeriod = {};
  const provinces = new Set();
  const countries = new Set();
  let years = new Set();
  let thisYear = '';
  activities.forEach(run => {
    const location = (0,src_utils_utils__WEBPACK_IMPORTED_MODULE_1__.locationForRun)(run);
    const periodName = (0,src_utils_utils__WEBPACK_IMPORTED_MODULE_1__.titleForRun)(run);
    if (periodName) {
      runPeriod[periodName] = runPeriod[periodName] ? runPeriod[periodName] + 1 : 1;
    }
    const {
      city,
      province,
      country
    } = location;
    // drop only one char city
    if (city.length > 1) {
      cities[city] = cities[city] ? cities[city] + run.distance : run.distance;
    }
    if (province) provinces.add(province);
    if (country) countries.add(country);
    const year = run.start_date_local.slice(0, 4);
    years.add(year);
  });
  years = [...years].sort().reverse();
  if (years) [thisYear] = years; // set current year as first one of years array

  return {
    activities,
    years,
    countries: [...countries],
    provinces: [...provinces],
    cities,
    runPeriod,
    thisYear
  };
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (useActivities);

/***/ }),

/***/ "./src/hooks/useHover.js":
/*!*******************************!*\
  !*** ./src/hooks/useHover.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

const useHover = () => {
  const {
    0: hovered,
    1: setHovered
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)();
  const {
    0: timer,
    1: setTimer
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)();
  const eventHandlers = {
    onMouseOver() {
      setTimer(setTimeout(() => setHovered(true), 700));
    },
    onMouseOut() {
      clearTimeout(timer);
      setHovered(false);
    }
  };
  return [hovered, eventHandlers];
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (useHover);

/***/ }),

/***/ "./src/hooks/useSiteMetadata.js":
/*!**************************************!*\
  !*** ./src/hooks/useSiteMetadata.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _public_page_data_sq_d_666401299_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../public/page-data/sq/d/666401299.json */ "./public/page-data/sq/d/666401299.json");

const useSiteMetadata = () => {
  const {
    site
  } = _public_page_data_sq_d_666401299_json__WEBPACK_IMPORTED_MODULE_0__.data;
  return site.siteMetadata;
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (useSiteMetadata);

/***/ }),

/***/ "./src/pages/index.jsx?export=head":
/*!*****************************************!*\
  !*** ./src/pages/index.jsx?export=head ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_components_Layout__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/components/Layout */ "./src/components/Layout/index.jsx");
/* harmony import */ var src_components_LocationStat__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/components/LocationStat */ "./src/components/LocationStat/index.jsx");
/* harmony import */ var src_components_RunMap__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/components/RunMap */ "./src/components/RunMap/index.jsx");
/* harmony import */ var src_components_RunTable__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/components/RunTable */ "./src/components/RunTable/index.jsx");
/* harmony import */ var src_components_SVGStat__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! src/components/SVGStat */ "./src/components/SVGStat/index.jsx");
/* harmony import */ var src_components_YearsStat__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! src/components/YearsStat */ "./src/components/YearsStat/index.jsx");
/* harmony import */ var src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! src/hooks/useActivities */ "./src/hooks/useActivities.js");
/* harmony import */ var src_hooks_useSiteMetadata__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! src/hooks/useSiteMetadata */ "./src/hooks/useSiteMetadata.js");
/* harmony import */ var src_utils_const__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! src/utils/const */ "./src/utils/const.js");
/* harmony import */ var src_utils_utils__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! src/utils/utils */ "./src/utils/utils.js");











const Index = () => {
  const {
    siteTitle
  } = (0,src_hooks_useSiteMetadata__WEBPACK_IMPORTED_MODULE_8__["default"])();
  const {
    activities,
    thisYear
  } = (0,src_hooks_useActivities__WEBPACK_IMPORTED_MODULE_7__["default"])();
  const {
    0: year,
    1: setYear
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(thisYear);
  const {
    0: runIndex,
    1: setRunIndex
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(-1);
  const {
    0: runs,
    1: setActivity
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)((0,src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.filterAndSortRuns)(activities, year, src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.filterYearRuns, src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.sortDateFunc));
  const {
    0: title,
    1: setTitle
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const {
    0: geoData,
    1: setGeoData
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)((0,src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.geoJsonForRuns)(runs));
  // for auto zoom
  const bounds = (0,src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.getBoundsForGeoData)(geoData);
  const {
    0: intervalId,
    1: setIntervalId
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)();
  const {
    0: viewport,
    1: setViewport
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
    ...bounds
  });
  const changeByItem = (item, name, func, isChanged) => {
    (0,src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.scrollToMap)();
    setActivity((0,src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.filterAndSortRuns)(activities, item, func, src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.sortDateFunc));
    // if the year not change, we do not need to setYear
    if (!isChanged) {
      setRunIndex(-1);
      setTitle(`${item} ${name} Running Heatmap`);
    }
  };
  const changeYear = y => {
    const isChanged = y === year;
    // default year
    setYear(y);
    if (viewport.zoom > 3) {
      setViewport({
        ...bounds
      });
    }
    changeByItem(y, 'Year', src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.filterYearRuns, isChanged);
    clearInterval(intervalId);
  };
  const changeCity = city => {
    changeByItem(city, 'City', src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.filterCityRuns, false);
  };
  const changeTitle = title => {
    changeByItem(title, 'Title', src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.filterTitleRuns, false);
  };
  const locateActivity = run => {
    setGeoData((0,src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.geoJsonForRuns)([run]));
    setTitle((0,src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.titleForShow)(run));
    clearInterval(intervalId);
    (0,src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.scrollToMap)();
  };
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    setViewport({
      ...bounds
    });
  }, [geoData]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const runsNum = runs.length;
    // maybe change 20 ?
    const sliceNume = runsNum >= 20 ? runsNum / 20 : 1;
    let i = sliceNume;
    const id = setInterval(() => {
      if (i >= runsNum) {
        clearInterval(id);
      }
      const tempRuns = runs.slice(0, i);
      setGeoData((0,src_utils_utils__WEBPACK_IMPORTED_MODULE_10__.geoJsonForRuns)(tempRuns));
      i += sliceNume;
    }, 100);
    setIntervalId(id);
  }, [runs]);

  // TODO refactor
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (year !== 'Total') {
      return;
    }
    let rectArr = document.querySelectorAll('rect');
    if (rectArr.length !== 0) {
      rectArr = Array.from(rectArr).slice(1);
    }
    rectArr.forEach(rect => {
      const rectColor = rect.getAttribute('fill');

      // not run has no click event
      if (rectColor !== '#444444') {
        const runDate = rect.innerHTML;
        // ingnore the error
        const [runName] = runDate.match(/\d{4}-\d{1,2}-\d{1,2}/) || [];
        const runLocate = runs.filter(r => r.start_date_local.slice(0, 10) === runName).sort((a, b) => b.distance - a.distance)[0];

        // do not add the event next time
        // maybe a better way?
        if (runLocate) {
          rect.addEventListener('click', () => locateActivity(runLocate), false);
        }
      }
    });
    let polylineArr = document.querySelectorAll('polyline');
    if (polylineArr.length !== 0) {
      polylineArr = Array.from(polylineArr).slice(1);
    }

    // add picked runs svg event
    polylineArr.forEach(polyline => {
      // not run has no click event
      const runDate = polyline.innerHTML;
      // `${+thisYear + 1}` ==> 2021
      const [runName] = runDate.match(/\d{4}-\d{1,2}-\d{1,2}/) || [`${+thisYear + 1}`];
      const run = runs.filter(r => r.start_date_local.slice(0, 10) === runName).sort((a, b) => b.distance - a.distance)[0];

      // do not add the event next time
      // maybe a better way?
      if (run) {
        polyline.addEventListener('click', () => locateActivity(run), false);
      }
    });
  }, [year]);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Layout__WEBPACK_IMPORTED_MODULE_1__["default"], null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "mb5"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "fl w-30-l"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h1", {
    className: "f1 fw9 i"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "/"
  }, siteTitle)), viewport.zoom <= 3 && src_utils_const__WEBPACK_IMPORTED_MODULE_9__.IS_CHINESE ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_LocationStat__WEBPACK_IMPORTED_MODULE_2__["default"], {
    changeYear: changeYear,
    changeCity: changeCity,
    changeTitle: changeTitle
  }) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_YearsStat__WEBPACK_IMPORTED_MODULE_6__["default"], {
    year: year,
    onClick: changeYear
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "fl w-100 w-70-l"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_RunMap__WEBPACK_IMPORTED_MODULE_3__["default"], {
    runs: runs,
    year: year,
    title: title,
    viewport: viewport,
    geoData: geoData,
    setViewport: setViewport,
    changeYear: changeYear,
    thisYear: year
  }), year === 'Total' ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_SVGStat__WEBPACK_IMPORTED_MODULE_5__["default"], null) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_RunTable__WEBPACK_IMPORTED_MODULE_4__["default"], {
    runs: runs,
    year: year,
    locateActivity: locateActivity,
    setActivity: setActivity,
    runIndex: runIndex,
    setRunIndex: setRunIndex
  }))));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Index);

/***/ }),

/***/ "./src/static/city.js":
/*!****************************!*\
  !*** ./src/static/city.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "chinaCities": () => (/* binding */ chinaCities)
/* harmony export */ });
const chinaCities = [{
  "code": "130100",
  "name": "石家庄市",
  "province": "13",
  "city": "01"
}, {
  "code": "130200",
  "name": "唐山市",
  "province": "13",
  "city": "02"
}, {
  "code": "130300",
  "name": "秦皇岛市",
  "province": "13",
  "city": "03"
}, {
  "code": "130400",
  "name": "邯郸市",
  "province": "13",
  "city": "04"
}, {
  "code": "130500",
  "name": "邢台市",
  "province": "13",
  "city": "05"
}, {
  "code": "130600",
  "name": "保定市",
  "province": "13",
  "city": "06"
}, {
  "code": "130700",
  "name": "张家口市",
  "province": "13",
  "city": "07"
}, {
  "code": "130800",
  "name": "承德市",
  "province": "13",
  "city": "08"
}, {
  "code": "130900",
  "name": "沧州市",
  "province": "13",
  "city": "09"
}, {
  "code": "131000",
  "name": "廊坊市",
  "province": "13",
  "city": "10"
}, {
  "code": "131100",
  "name": "衡水市",
  "province": "13",
  "city": "11"
}, {
  "code": "140100",
  "name": "太原市",
  "province": "14",
  "city": "01"
}, {
  "code": "140200",
  "name": "大同市",
  "province": "14",
  "city": "02"
}, {
  "code": "140300",
  "name": "阳泉市",
  "province": "14",
  "city": "03"
}, {
  "code": "140400",
  "name": "长治市",
  "province": "14",
  "city": "04"
}, {
  "code": "140500",
  "name": "晋城市",
  "province": "14",
  "city": "05"
}, {
  "code": "140600",
  "name": "朔州市",
  "province": "14",
  "city": "06"
}, {
  "code": "140700",
  "name": "晋中市",
  "province": "14",
  "city": "07"
}, {
  "code": "140800",
  "name": "运城市",
  "province": "14",
  "city": "08"
}, {
  "code": "140900",
  "name": "忻州市",
  "province": "14",
  "city": "09"
}, {
  "code": "141000",
  "name": "临汾市",
  "province": "14",
  "city": "10"
}, {
  "code": "141100",
  "name": "吕梁市",
  "province": "14",
  "city": "11"
}, {
  "code": "150100",
  "name": "呼和浩特市",
  "province": "15",
  "city": "01"
}, {
  "code": "150200",
  "name": "包头市",
  "province": "15",
  "city": "02"
}, {
  "code": "150300",
  "name": "乌海市",
  "province": "15",
  "city": "03"
}, {
  "code": "150400",
  "name": "赤峰市",
  "province": "15",
  "city": "04"
}, {
  "code": "150500",
  "name": "通辽市",
  "province": "15",
  "city": "05"
}, {
  "code": "150600",
  "name": "鄂尔多斯市",
  "province": "15",
  "city": "06"
}, {
  "code": "150700",
  "name": "呼伦贝尔市",
  "province": "15",
  "city": "07"
}, {
  "code": "150800",
  "name": "巴彦淖尔市",
  "province": "15",
  "city": "08"
}, {
  "code": "150900",
  "name": "乌兰察布市",
  "province": "15",
  "city": "09"
}, {
  "code": "152200",
  "name": "兴安盟",
  "province": "15",
  "city": "22"
}, {
  "code": "152500",
  "name": "锡林郭勒盟",
  "province": "15",
  "city": "25"
}, {
  "code": "152900",
  "name": "阿拉善盟",
  "province": "15",
  "city": "29"
}, {
  "code": "210100",
  "name": "沈阳市",
  "province": "21",
  "city": "01"
}, {
  "code": "210200",
  "name": "大连市",
  "province": "21",
  "city": "02"
}, {
  "code": "210300",
  "name": "鞍山市",
  "province": "21",
  "city": "03"
}, {
  "code": "210400",
  "name": "抚顺市",
  "province": "21",
  "city": "04"
}, {
  "code": "210500",
  "name": "本溪市",
  "province": "21",
  "city": "05"
}, {
  "code": "210600",
  "name": "丹东市",
  "province": "21",
  "city": "06"
}, {
  "code": "210700",
  "name": "锦州市",
  "province": "21",
  "city": "07"
}, {
  "code": "210800",
  "name": "营口市",
  "province": "21",
  "city": "08"
}, {
  "code": "210900",
  "name": "阜新市",
  "province": "21",
  "city": "09"
}, {
  "code": "211000",
  "name": "辽阳市",
  "province": "21",
  "city": "10"
}, {
  "code": "211100",
  "name": "盘锦市",
  "province": "21",
  "city": "11"
}, {
  "code": "211200",
  "name": "铁岭市",
  "province": "21",
  "city": "12"
}, {
  "code": "211300",
  "name": "朝阳市",
  "province": "21",
  "city": "13"
}, {
  "code": "211400",
  "name": "葫芦岛市",
  "province": "21",
  "city": "14"
}, {
  "code": "220100",
  "name": "长春市",
  "province": "22",
  "city": "01"
}, {
  "code": "220200",
  "name": "吉林市",
  "province": "22",
  "city": "02"
}, {
  "code": "220300",
  "name": "四平市",
  "province": "22",
  "city": "03"
}, {
  "code": "220400",
  "name": "辽源市",
  "province": "22",
  "city": "04"
}, {
  "code": "220500",
  "name": "通化市",
  "province": "22",
  "city": "05"
}, {
  "code": "220600",
  "name": "白山市",
  "province": "22",
  "city": "06"
}, {
  "code": "220700",
  "name": "松原市",
  "province": "22",
  "city": "07"
}, {
  "code": "220800",
  "name": "白城市",
  "province": "22",
  "city": "08"
}, {
  "code": "222400",
  "name": "延边朝鲜族自治州",
  "province": "22",
  "city": "24"
}, {
  "code": "230100",
  "name": "哈尔滨市",
  "province": "23",
  "city": "01"
}, {
  "code": "230200",
  "name": "齐齐哈尔市",
  "province": "23",
  "city": "02"
}, {
  "code": "230300",
  "name": "鸡西市",
  "province": "23",
  "city": "03"
}, {
  "code": "230400",
  "name": "鹤岗市",
  "province": "23",
  "city": "04"
}, {
  "code": "230500",
  "name": "双鸭山市",
  "province": "23",
  "city": "05"
}, {
  "code": "230600",
  "name": "大庆市",
  "province": "23",
  "city": "06"
}, {
  "code": "230700",
  "name": "伊春市",
  "province": "23",
  "city": "07"
}, {
  "code": "230800",
  "name": "佳木斯市",
  "province": "23",
  "city": "08"
}, {
  "code": "230900",
  "name": "七台河市",
  "province": "23",
  "city": "09"
}, {
  "code": "231000",
  "name": "牡丹江市",
  "province": "23",
  "city": "10"
}, {
  "code": "231100",
  "name": "黑河市",
  "province": "23",
  "city": "11"
}, {
  "code": "231200",
  "name": "绥化市",
  "province": "23",
  "city": "12"
}, {
  "code": "232700",
  "name": "大兴安岭地区",
  "province": "23",
  "city": "27"
}, {
  "code": "320100",
  "name": "南京市",
  "province": "32",
  "city": "01"
}, {
  "code": "320200",
  "name": "无锡市",
  "province": "32",
  "city": "02"
}, {
  "code": "320300",
  "name": "徐州市",
  "province": "32",
  "city": "03"
}, {
  "code": "320400",
  "name": "常州市",
  "province": "32",
  "city": "04"
}, {
  "code": "320500",
  "name": "苏州市",
  "province": "32",
  "city": "05"
}, {
  "code": "320600",
  "name": "南通市",
  "province": "32",
  "city": "06"
}, {
  "code": "320700",
  "name": "连云港市",
  "province": "32",
  "city": "07"
}, {
  "code": "320800",
  "name": "淮安市",
  "province": "32",
  "city": "08"
}, {
  "code": "320900",
  "name": "盐城市",
  "province": "32",
  "city": "09"
}, {
  "code": "321000",
  "name": "扬州市",
  "province": "32",
  "city": "10"
}, {
  "code": "321100",
  "name": "镇江市",
  "province": "32",
  "city": "11"
}, {
  "code": "321200",
  "name": "泰州市",
  "province": "32",
  "city": "12"
}, {
  "code": "321300",
  "name": "宿迁市",
  "province": "32",
  "city": "13"
}, {
  "code": "330100",
  "name": "杭州市",
  "province": "33",
  "city": "01"
}, {
  "code": "330200",
  "name": "宁波市",
  "province": "33",
  "city": "02"
}, {
  "code": "330300",
  "name": "温州市",
  "province": "33",
  "city": "03"
}, {
  "code": "330400",
  "name": "嘉兴市",
  "province": "33",
  "city": "04"
}, {
  "code": "330500",
  "name": "湖州市",
  "province": "33",
  "city": "05"
}, {
  "code": "330600",
  "name": "绍兴市",
  "province": "33",
  "city": "06"
}, {
  "code": "330700",
  "name": "金华市",
  "province": "33",
  "city": "07"
}, {
  "code": "330800",
  "name": "衢州市",
  "province": "33",
  "city": "08"
}, {
  "code": "330900",
  "name": "舟山市",
  "province": "33",
  "city": "09"
}, {
  "code": "331000",
  "name": "台州市",
  "province": "33",
  "city": "10"
}, {
  "code": "331100",
  "name": "丽水市",
  "province": "33",
  "city": "11"
}, {
  "code": "340100",
  "name": "合肥市",
  "province": "34",
  "city": "01"
}, {
  "code": "340200",
  "name": "芜湖市",
  "province": "34",
  "city": "02"
}, {
  "code": "340300",
  "name": "蚌埠市",
  "province": "34",
  "city": "03"
}, {
  "code": "340400",
  "name": "淮南市",
  "province": "34",
  "city": "04"
}, {
  "code": "340500",
  "name": "马鞍山市",
  "province": "34",
  "city": "05"
}, {
  "code": "340600",
  "name": "淮北市",
  "province": "34",
  "city": "06"
}, {
  "code": "340700",
  "name": "铜陵市",
  "province": "34",
  "city": "07"
}, {
  "code": "340800",
  "name": "安庆市",
  "province": "34",
  "city": "08"
}, {
  "code": "341000",
  "name": "黄山市",
  "province": "34",
  "city": "10"
}, {
  "code": "341100",
  "name": "滁州市",
  "province": "34",
  "city": "11"
}, {
  "code": "341200",
  "name": "阜阳市",
  "province": "34",
  "city": "12"
}, {
  "code": "341300",
  "name": "宿州市",
  "province": "34",
  "city": "13"
}, {
  "code": "341500",
  "name": "六安市",
  "province": "34",
  "city": "15"
}, {
  "code": "341600",
  "name": "亳州市",
  "province": "34",
  "city": "16"
}, {
  "code": "341700",
  "name": "池州市",
  "province": "34",
  "city": "17"
}, {
  "code": "341800",
  "name": "宣城市",
  "province": "34",
  "city": "18"
}, {
  "code": "350100",
  "name": "福州市",
  "province": "35",
  "city": "01"
}, {
  "code": "350200",
  "name": "厦门市",
  "province": "35",
  "city": "02"
}, {
  "code": "350300",
  "name": "莆田市",
  "province": "35",
  "city": "03"
}, {
  "code": "350400",
  "name": "三明市",
  "province": "35",
  "city": "04"
}, {
  "code": "350500",
  "name": "泉州市",
  "province": "35",
  "city": "05"
}, {
  "code": "350600",
  "name": "漳州市",
  "province": "35",
  "city": "06"
}, {
  "code": "350700",
  "name": "南平市",
  "province": "35",
  "city": "07"
}, {
  "code": "350800",
  "name": "龙岩市",
  "province": "35",
  "city": "08"
}, {
  "code": "350900",
  "name": "宁德市",
  "province": "35",
  "city": "09"
}, {
  "code": "360100",
  "name": "南昌市",
  "province": "36",
  "city": "01"
}, {
  "code": "360200",
  "name": "景德镇市",
  "province": "36",
  "city": "02"
}, {
  "code": "360300",
  "name": "萍乡市",
  "province": "36",
  "city": "03"
}, {
  "code": "360400",
  "name": "九江市",
  "province": "36",
  "city": "04"
}, {
  "code": "360500",
  "name": "新余市",
  "province": "36",
  "city": "05"
}, {
  "code": "360600",
  "name": "鹰潭市",
  "province": "36",
  "city": "06"
}, {
  "code": "360700",
  "name": "赣州市",
  "province": "36",
  "city": "07"
}, {
  "code": "360800",
  "name": "吉安市",
  "province": "36",
  "city": "08"
}, {
  "code": "360900",
  "name": "宜春市",
  "province": "36",
  "city": "09"
}, {
  "code": "361000",
  "name": "抚州市",
  "province": "36",
  "city": "10"
}, {
  "code": "361100",
  "name": "上饶市",
  "province": "36",
  "city": "11"
}, {
  "code": "370100",
  "name": "济南市",
  "province": "37",
  "city": "01"
}, {
  "code": "370200",
  "name": "青岛市",
  "province": "37",
  "city": "02"
}, {
  "code": "370300",
  "name": "淄博市",
  "province": "37",
  "city": "03"
}, {
  "code": "370400",
  "name": "枣庄市",
  "province": "37",
  "city": "04"
}, {
  "code": "370500",
  "name": "东营市",
  "province": "37",
  "city": "05"
}, {
  "code": "370600",
  "name": "烟台市",
  "province": "37",
  "city": "06"
}, {
  "code": "370700",
  "name": "潍坊市",
  "province": "37",
  "city": "07"
}, {
  "code": "370800",
  "name": "济宁市",
  "province": "37",
  "city": "08"
}, {
  "code": "370900",
  "name": "泰安市",
  "province": "37",
  "city": "09"
}, {
  "code": "371000",
  "name": "威海市",
  "province": "37",
  "city": "10"
}, {
  "code": "371100",
  "name": "日照市",
  "province": "37",
  "city": "11"
}, {
  "code": "371300",
  "name": "临沂市",
  "province": "37",
  "city": "13"
}, {
  "code": "371400",
  "name": "德州市",
  "province": "37",
  "city": "14"
}, {
  "code": "371500",
  "name": "聊城市",
  "province": "37",
  "city": "15"
}, {
  "code": "371600",
  "name": "滨州市",
  "province": "37",
  "city": "16"
}, {
  "code": "371700",
  "name": "菏泽市",
  "province": "37",
  "city": "17"
}, {
  "code": "410100",
  "name": "郑州市",
  "province": "41",
  "city": "01"
}, {
  "code": "410200",
  "name": "开封市",
  "province": "41",
  "city": "02"
}, {
  "code": "410300",
  "name": "洛阳市",
  "province": "41",
  "city": "03"
}, {
  "code": "410400",
  "name": "平顶山市",
  "province": "41",
  "city": "04"
}, {
  "code": "410500",
  "name": "安阳市",
  "province": "41",
  "city": "05"
}, {
  "code": "410600",
  "name": "鹤壁市",
  "province": "41",
  "city": "06"
}, {
  "code": "410700",
  "name": "新乡市",
  "province": "41",
  "city": "07"
}, {
  "code": "410800",
  "name": "焦作市",
  "province": "41",
  "city": "08"
}, {
  "code": "410900",
  "name": "濮阳市",
  "province": "41",
  "city": "09"
}, {
  "code": "411000",
  "name": "许昌市",
  "province": "41",
  "city": "10"
}, {
  "code": "411100",
  "name": "漯河市",
  "province": "41",
  "city": "11"
}, {
  "code": "411200",
  "name": "三门峡市",
  "province": "41",
  "city": "12"
}, {
  "code": "411300",
  "name": "南阳市",
  "province": "41",
  "city": "13"
}, {
  "code": "411400",
  "name": "商丘市",
  "province": "41",
  "city": "14"
}, {
  "code": "411500",
  "name": "信阳市",
  "province": "41",
  "city": "15"
}, {
  "code": "411600",
  "name": "周口市",
  "province": "41",
  "city": "16"
}, {
  "code": "411700",
  "name": "驻马店市",
  "province": "41",
  "city": "17"
}, {
  "code": "420100",
  "name": "武汉市",
  "province": "42",
  "city": "01"
}, {
  "code": "420200",
  "name": "黄石市",
  "province": "42",
  "city": "02"
}, {
  "code": "420300",
  "name": "十堰市",
  "province": "42",
  "city": "03"
}, {
  "code": "420500",
  "name": "宜昌市",
  "province": "42",
  "city": "05"
}, {
  "code": "420600",
  "name": "襄阳市",
  "province": "42",
  "city": "06"
}, {
  "code": "420700",
  "name": "鄂州市",
  "province": "42",
  "city": "07"
}, {
  "code": "420800",
  "name": "荆门市",
  "province": "42",
  "city": "08"
}, {
  "code": "420900",
  "name": "孝感市",
  "province": "42",
  "city": "09"
}, {
  "code": "421000",
  "name": "荆州市",
  "province": "42",
  "city": "10"
}, {
  "code": "421100",
  "name": "黄冈市",
  "province": "42",
  "city": "11"
}, {
  "code": "421200",
  "name": "咸宁市",
  "province": "42",
  "city": "12"
}, {
  "code": "421300",
  "name": "随州市",
  "province": "42",
  "city": "13"
}, {
  "code": "422800",
  "name": "恩施土家族苗族自治州",
  "province": "42",
  "city": "28"
}, {
  "code": "430100",
  "name": "长沙市",
  "province": "43",
  "city": "01"
}, {
  "code": "430200",
  "name": "株洲市",
  "province": "43",
  "city": "02"
}, {
  "code": "430300",
  "name": "湘潭市",
  "province": "43",
  "city": "03"
}, {
  "code": "430400",
  "name": "衡阳市",
  "province": "43",
  "city": "04"
}, {
  "code": "430500",
  "name": "邵阳市",
  "province": "43",
  "city": "05"
}, {
  "code": "430600",
  "name": "岳阳市",
  "province": "43",
  "city": "06"
}, {
  "code": "430700",
  "name": "常德市",
  "province": "43",
  "city": "07"
}, {
  "code": "430800",
  "name": "张家界市",
  "province": "43",
  "city": "08"
}, {
  "code": "430900",
  "name": "益阳市",
  "province": "43",
  "city": "09"
}, {
  "code": "431000",
  "name": "郴州市",
  "province": "43",
  "city": "10"
}, {
  "code": "431100",
  "name": "永州市",
  "province": "43",
  "city": "11"
}, {
  "code": "431200",
  "name": "怀化市",
  "province": "43",
  "city": "12"
}, {
  "code": "431300",
  "name": "娄底市",
  "province": "43",
  "city": "13"
}, {
  "code": "433100",
  "name": "湘西土家族苗族自治州",
  "province": "43",
  "city": "31"
}, {
  "code": "440100",
  "name": "广州市",
  "province": "44",
  "city": "01"
}, {
  "code": "440200",
  "name": "韶关市",
  "province": "44",
  "city": "02"
}, {
  "code": "440300",
  "name": "深圳市",
  "province": "44",
  "city": "03"
}, {
  "code": "440400",
  "name": "珠海市",
  "province": "44",
  "city": "04"
}, {
  "code": "440500",
  "name": "汕头市",
  "province": "44",
  "city": "05"
}, {
  "code": "440600",
  "name": "佛山市",
  "province": "44",
  "city": "06"
}, {
  "code": "440700",
  "name": "江门市",
  "province": "44",
  "city": "07"
}, {
  "code": "440800",
  "name": "湛江市",
  "province": "44",
  "city": "08"
}, {
  "code": "440900",
  "name": "茂名市",
  "province": "44",
  "city": "09"
}, {
  "code": "441200",
  "name": "肇庆市",
  "province": "44",
  "city": "12"
}, {
  "code": "441300",
  "name": "惠州市",
  "province": "44",
  "city": "13"
}, {
  "code": "441400",
  "name": "梅州市",
  "province": "44",
  "city": "14"
}, {
  "code": "441500",
  "name": "汕尾市",
  "province": "44",
  "city": "15"
}, {
  "code": "441600",
  "name": "河源市",
  "province": "44",
  "city": "16"
}, {
  "code": "441700",
  "name": "阳江市",
  "province": "44",
  "city": "17"
}, {
  "code": "441800",
  "name": "清远市",
  "province": "44",
  "city": "18"
}, {
  "code": "441900",
  "name": "东莞市",
  "province": "44",
  "city": "19"
}, {
  "code": "442000",
  "name": "中山市",
  "province": "44",
  "city": "20"
}, {
  "code": "445100",
  "name": "潮州市",
  "province": "44",
  "city": "51"
}, {
  "code": "445200",
  "name": "揭阳市",
  "province": "44",
  "city": "52"
}, {
  "code": "445300",
  "name": "云浮市",
  "province": "44",
  "city": "53"
}, {
  "code": "450100",
  "name": "南宁市",
  "province": "45",
  "city": "01"
}, {
  "code": "450200",
  "name": "柳州市",
  "province": "45",
  "city": "02"
}, {
  "code": "450300",
  "name": "桂林市",
  "province": "45",
  "city": "03"
}, {
  "code": "450400",
  "name": "梧州市",
  "province": "45",
  "city": "04"
}, {
  "code": "450500",
  "name": "北海市",
  "province": "45",
  "city": "05"
}, {
  "code": "450600",
  "name": "防城港市",
  "province": "45",
  "city": "06"
}, {
  "code": "450700",
  "name": "钦州市",
  "province": "45",
  "city": "07"
}, {
  "code": "450800",
  "name": "贵港市",
  "province": "45",
  "city": "08"
}, {
  "code": "450900",
  "name": "玉林市",
  "province": "45",
  "city": "09"
}, {
  "code": "451000",
  "name": "百色市",
  "province": "45",
  "city": "10"
}, {
  "code": "451100",
  "name": "贺州市",
  "province": "45",
  "city": "11"
}, {
  "code": "451200",
  "name": "河池市",
  "province": "45",
  "city": "12"
}, {
  "code": "451300",
  "name": "来宾市",
  "province": "45",
  "city": "13"
}, {
  "code": "451400",
  "name": "崇左市",
  "province": "45",
  "city": "14"
}, {
  "code": "460100",
  "name": "海口市",
  "province": "46",
  "city": "01"
}, {
  "code": "460200",
  "name": "三亚市",
  "province": "46",
  "city": "02"
}, {
  "code": "460300",
  "name": "三沙市",
  "province": "46",
  "city": "03"
}, {
  "code": "460400",
  "name": "儋州市",
  "province": "46",
  "city": "04"
}, {
  "code": "510100",
  "name": "成都市",
  "province": "51",
  "city": "01"
}, {
  "code": "510300",
  "name": "自贡市",
  "province": "51",
  "city": "03"
}, {
  "code": "510400",
  "name": "攀枝花市",
  "province": "51",
  "city": "04"
}, {
  "code": "510500",
  "name": "泸州市",
  "province": "51",
  "city": "05"
}, {
  "code": "510600",
  "name": "德阳市",
  "province": "51",
  "city": "06"
}, {
  "code": "510700",
  "name": "绵阳市",
  "province": "51",
  "city": "07"
}, {
  "code": "510800",
  "name": "广元市",
  "province": "51",
  "city": "08"
}, {
  "code": "510900",
  "name": "遂宁市",
  "province": "51",
  "city": "09"
}, {
  "code": "511000",
  "name": "内江市",
  "province": "51",
  "city": "10"
}, {
  "code": "511100",
  "name": "乐山市",
  "province": "51",
  "city": "11"
}, {
  "code": "511300",
  "name": "南充市",
  "province": "51",
  "city": "13"
}, {
  "code": "511400",
  "name": "眉山市",
  "province": "51",
  "city": "14"
}, {
  "code": "511500",
  "name": "宜宾市",
  "province": "51",
  "city": "15"
}, {
  "code": "511600",
  "name": "广安市",
  "province": "51",
  "city": "16"
}, {
  "code": "511700",
  "name": "达州市",
  "province": "51",
  "city": "17"
}, {
  "code": "511800",
  "name": "雅安市",
  "province": "51",
  "city": "18"
}, {
  "code": "511900",
  "name": "巴中市",
  "province": "51",
  "city": "19"
}, {
  "code": "512000",
  "name": "资阳市",
  "province": "51",
  "city": "20"
}, {
  "code": "513200",
  "name": "阿坝藏族羌族自治州",
  "province": "51",
  "city": "32"
}, {
  "code": "513300",
  "name": "甘孜藏族自治州",
  "province": "51",
  "city": "33"
}, {
  "code": "513400",
  "name": "凉山彝族自治州",
  "province": "51",
  "city": "34"
}, {
  "code": "520100",
  "name": "贵阳市",
  "province": "52",
  "city": "01"
}, {
  "code": "520200",
  "name": "六盘水市",
  "province": "52",
  "city": "02"
}, {
  "code": "520300",
  "name": "遵义市",
  "province": "52",
  "city": "03"
}, {
  "code": "520400",
  "name": "安顺市",
  "province": "52",
  "city": "04"
}, {
  "code": "520500",
  "name": "毕节市",
  "province": "52",
  "city": "05"
}, {
  "code": "520600",
  "name": "铜仁市",
  "province": "52",
  "city": "06"
}, {
  "code": "522300",
  "name": "黔西南布依族苗族自治州",
  "province": "52",
  "city": "23"
}, {
  "code": "522600",
  "name": "黔东南苗族侗族自治州",
  "province": "52",
  "city": "26"
}, {
  "code": "522700",
  "name": "黔南布依族苗族自治州",
  "province": "52",
  "city": "27"
}, {
  "code": "530100",
  "name": "昆明市",
  "province": "53",
  "city": "01"
}, {
  "code": "530300",
  "name": "曲靖市",
  "province": "53",
  "city": "03"
}, {
  "code": "530400",
  "name": "玉溪市",
  "province": "53",
  "city": "04"
}, {
  "code": "530500",
  "name": "保山市",
  "province": "53",
  "city": "05"
}, {
  "code": "530600",
  "name": "昭通市",
  "province": "53",
  "city": "06"
}, {
  "code": "530700",
  "name": "丽江市",
  "province": "53",
  "city": "07"
}, {
  "code": "530800",
  "name": "普洱市",
  "province": "53",
  "city": "08"
}, {
  "code": "530900",
  "name": "临沧市",
  "province": "53",
  "city": "09"
}, {
  "code": "532300",
  "name": "楚雄彝族自治州",
  "province": "53",
  "city": "23"
}, {
  "code": "532500",
  "name": "红河哈尼族彝族自治州",
  "province": "53",
  "city": "25"
}, {
  "code": "532600",
  "name": "文山壮族苗族自治州",
  "province": "53",
  "city": "26"
}, {
  "code": "532800",
  "name": "西双版纳傣族自治州",
  "province": "53",
  "city": "28"
}, {
  "code": "532900",
  "name": "大理白族自治州",
  "province": "53",
  "city": "29"
}, {
  "code": "533100",
  "name": "德宏傣族景颇族自治州",
  "province": "53",
  "city": "31"
}, {
  "code": "533300",
  "name": "怒江傈僳族自治州",
  "province": "53",
  "city": "33"
}, {
  "code": "533400",
  "name": "迪庆藏族自治州",
  "province": "53",
  "city": "34"
}, {
  "code": "540100",
  "name": "拉萨市",
  "province": "54",
  "city": "01"
}, {
  "code": "540200",
  "name": "日喀则市",
  "province": "54",
  "city": "02"
}, {
  "code": "540300",
  "name": "昌都市",
  "province": "54",
  "city": "03"
}, {
  "code": "540400",
  "name": "林芝市",
  "province": "54",
  "city": "04"
}, {
  "code": "540500",
  "name": "山南市",
  "province": "54",
  "city": "05"
}, {
  "code": "540600",
  "name": "那曲市",
  "province": "54",
  "city": "06"
}, {
  "code": "542500",
  "name": "阿里地区",
  "province": "54",
  "city": "25"
}, {
  "code": "610100",
  "name": "西安市",
  "province": "61",
  "city": "01"
}, {
  "code": "610200",
  "name": "铜川市",
  "province": "61",
  "city": "02"
}, {
  "code": "610300",
  "name": "宝鸡市",
  "province": "61",
  "city": "03"
}, {
  "code": "610400",
  "name": "咸阳市",
  "province": "61",
  "city": "04"
}, {
  "code": "610500",
  "name": "渭南市",
  "province": "61",
  "city": "05"
}, {
  "code": "610600",
  "name": "延安市",
  "province": "61",
  "city": "06"
}, {
  "code": "610700",
  "name": "汉中市",
  "province": "61",
  "city": "07"
}, {
  "code": "610800",
  "name": "榆林市",
  "province": "61",
  "city": "08"
}, {
  "code": "610900",
  "name": "安康市",
  "province": "61",
  "city": "09"
}, {
  "code": "611000",
  "name": "商洛市",
  "province": "61",
  "city": "10"
}, {
  "code": "620100",
  "name": "兰州市",
  "province": "62",
  "city": "01"
}, {
  "code": "620200",
  "name": "嘉峪关市",
  "province": "62",
  "city": "02"
}, {
  "code": "620300",
  "name": "金昌市",
  "province": "62",
  "city": "03"
}, {
  "code": "620400",
  "name": "白银市",
  "province": "62",
  "city": "04"
}, {
  "code": "620500",
  "name": "天水市",
  "province": "62",
  "city": "05"
}, {
  "code": "620600",
  "name": "武威市",
  "province": "62",
  "city": "06"
}, {
  "code": "620700",
  "name": "张掖市",
  "province": "62",
  "city": "07"
}, {
  "code": "620800",
  "name": "平凉市",
  "province": "62",
  "city": "08"
}, {
  "code": "620900",
  "name": "酒泉市",
  "province": "62",
  "city": "09"
}, {
  "code": "621000",
  "name": "庆阳市",
  "province": "62",
  "city": "10"
}, {
  "code": "621100",
  "name": "定西市",
  "province": "62",
  "city": "11"
}, {
  "code": "621200",
  "name": "陇南市",
  "province": "62",
  "city": "12"
}, {
  "code": "622900",
  "name": "临夏回族自治州",
  "province": "62",
  "city": "29"
}, {
  "code": "623000",
  "name": "甘南藏族自治州",
  "province": "62",
  "city": "30"
}, {
  "code": "630100",
  "name": "西宁市",
  "province": "63",
  "city": "01"
}, {
  "code": "630200",
  "name": "海东市",
  "province": "63",
  "city": "02"
}, {
  "code": "632200",
  "name": "海北藏族自治州",
  "province": "63",
  "city": "22"
}, {
  "code": "632300",
  "name": "黄南藏族自治州",
  "province": "63",
  "city": "23"
}, {
  "code": "632500",
  "name": "海南藏族自治州",
  "province": "63",
  "city": "25"
}, {
  "code": "632600",
  "name": "果洛藏族自治州",
  "province": "63",
  "city": "26"
}, {
  "code": "632700",
  "name": "玉树藏族自治州",
  "province": "63",
  "city": "27"
}, {
  "code": "632800",
  "name": "海西蒙古族藏族自治州",
  "province": "63",
  "city": "28"
}, {
  "code": "640100",
  "name": "银川市",
  "province": "64",
  "city": "01"
}, {
  "code": "640200",
  "name": "石嘴山市",
  "province": "64",
  "city": "02"
}, {
  "code": "640300",
  "name": "吴忠市",
  "province": "64",
  "city": "03"
}, {
  "code": "640400",
  "name": "固原市",
  "province": "64",
  "city": "04"
}, {
  "code": "640500",
  "name": "中卫市",
  "province": "64",
  "city": "05"
}, {
  "code": "650100",
  "name": "乌鲁木齐市",
  "province": "65",
  "city": "01"
}, {
  "code": "650200",
  "name": "克拉玛依市",
  "province": "65",
  "city": "02"
}, {
  "code": "650400",
  "name": "吐鲁番市",
  "province": "65",
  "city": "04"
}, {
  "code": "650500",
  "name": "哈密市",
  "province": "65",
  "city": "05"
}, {
  "code": "652300",
  "name": "昌吉回族自治州",
  "province": "65",
  "city": "23"
}, {
  "code": "652700",
  "name": "博尔塔拉蒙古自治州",
  "province": "65",
  "city": "27"
}, {
  "code": "652800",
  "name": "巴音郭楞蒙古自治州",
  "province": "65",
  "city": "28"
}, {
  "code": "652900",
  "name": "阿克苏地区",
  "province": "65",
  "city": "29"
}, {
  "code": "653000",
  "name": "克孜勒苏柯尔克孜自治州",
  "province": "65",
  "city": "30"
}, {
  "code": "653100",
  "name": "喀什地区",
  "province": "65",
  "city": "31"
}, {
  "code": "653200",
  "name": "和田地区",
  "province": "65",
  "city": "32"
}, {
  "code": "654000",
  "name": "伊犁哈萨克自治州",
  "province": "65",
  "city": "40"
}, {
  "code": "654200",
  "name": "塔城地区",
  "province": "65",
  "city": "42"
}, {
  "code": "654300",
  "name": "阿勒泰地区",
  "province": "65",
  "city": "43"
}, {
  "code": "429000",
  "name": "湖北省-自治区直辖县级行政区划",
  "province": "42",
  "city": "90"
}, {
  "code": "469000",
  "name": "海南省-自治区直辖县级行政区划",
  "province": "46",
  "city": "90"
}, {
  "code": "659000",
  "name": "新疆维吾尔自治区-自治区直辖县级行政区划",
  "province": "65",
  "city": "90"
}, {
  "code": "419000",
  "name": "河南省-省直辖县级行政区划",
  "province": "41",
  "city": "90"
}, {
  "code": "110000",
  "name": "北京市",
  "province": "11"
}, {
  "code": "120000",
  "name": "天津市",
  "province": "12"
}, {
  "code": "130000",
  "name": "河北省",
  "province": "13"
}, {
  "code": "140000",
  "name": "山西省",
  "province": "14"
}, {
  "code": "150000",
  "name": "内蒙古自治区",
  "province": "15"
}, {
  "code": "210000",
  "name": "辽宁省",
  "province": "21"
}, {
  "code": "220000",
  "name": "吉林省",
  "province": "22"
}, {
  "code": "230000",
  "name": "黑龙江省",
  "province": "23"
}, {
  "code": "310000",
  "name": "上海市",
  "province": "31"
}, {
  "code": "320000",
  "name": "江苏省",
  "province": "32"
}, {
  "code": "330000",
  "name": "浙江省",
  "province": "33"
}, {
  "code": "340000",
  "name": "安徽省",
  "province": "34"
}, {
  "code": "350000",
  "name": "福建省",
  "province": "35"
}, {
  "code": "360000",
  "name": "江西省",
  "province": "36"
}, {
  "code": "370000",
  "name": "山东省",
  "province": "37"
}, {
  "code": "410000",
  "name": "河南省",
  "province": "41"
}, {
  "code": "420000",
  "name": "湖北省",
  "province": "42"
}, {
  "code": "430000",
  "name": "湖南省",
  "province": "43"
}, {
  "code": "440000",
  "name": "广东省",
  "province": "44"
}, {
  "code": "450000",
  "name": "广西壮族自治区",
  "province": "45"
}, {
  "code": "460000",
  "name": "海南省",
  "province": "46"
}, {
  "code": "500000",
  "name": "重庆市",
  "province": "50"
}, {
  "code": "510000",
  "name": "四川省",
  "province": "51"
}, {
  "code": "520000",
  "name": "贵州省",
  "province": "52"
}, {
  "code": "530000",
  "name": "云南省",
  "province": "53"
}, {
  "code": "540000",
  "name": "西藏自治区",
  "province": "54"
}, {
  "code": "610000",
  "name": "陕西省",
  "province": "61"
}, {
  "code": "620000",
  "name": "甘肃省",
  "province": "62"
}, {
  "code": "630000",
  "name": "青海省",
  "province": "63"
}, {
  "code": "640000",
  "name": "宁夏回族自治区",
  "province": "64"
}, {
  "code": "650000",
  "name": "新疆维吾尔自治区",
  "province": "65"
}, {
  "code": "710000",
  "name": "台湾省",
  "province": "71"
}, {
  "code": "810000",
  "name": "香港特别行政区",
  "province": "81"
}, {
  "code": "820000",
  "name": "澳门特别行政区",
  "province": "82"
}];


/***/ }),

/***/ "./src/static/run_countries.js":
/*!*************************************!*\
  !*** ./src/static/run_countries.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "chinaGeojson": () => (/* binding */ chinaGeojson)
/* harmony export */ });
const chinaGeojson = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: {
      id: '65',
      size: '550',
      name: '新疆维吾尔自治区',
      cp: [84.9023, 42.148],
      childNum: 18
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[96.416, 42.7588], [96.416, 42.7148], [95.9766, 42.4951], [96.0645, 42.3193], [96.2402, 42.2314], [95.9766, 41.9238], [95.2734, 41.6162], [95.1855, 41.792], [94.5703, 41.4844], [94.043, 41.0889], [93.8672, 40.6934], [93.0762, 40.6494], [92.6367, 39.6387], [92.373, 39.3311], [92.373, 39.1113], [92.373, 39.0234], [90.1758, 38.4961], [90.3516, 38.2324], [90.6152, 38.3203], [90.5273, 37.8369], [91.0547, 37.4414], [91.3184, 37.0898], [90.7031, 36.7822], [90.791, 36.6064], [91.0547, 36.5186], [91.0547, 36.0791], [90.8789, 36.0352], [90, 36.2549], [89.9121, 36.0791], [89.7363, 36.0791], [89.209, 36.2988], [88.7695, 36.3428], [88.5938, 36.4746], [87.3633, 36.4307], [86.2207, 36.167], [86.1328, 35.8594], [85.6055, 35.6836], [85.0781, 35.7275], [84.1992, 35.376], [83.1445, 35.4199], [82.8809, 35.6836], [82.4414, 35.7275], [82.002, 35.332], [81.6504, 35.2441], [80.4199, 35.4199], [80.2441, 35.2881], [80.332, 35.1563], [80.2441, 35.2002], [79.8926, 34.8047], [79.8047, 34.4971], [79.1016, 34.4531], [79.0137, 34.3213], [78.2227, 34.7168], [78.0469, 35.2441], [78.0469, 35.5078], [77.4316, 35.4639], [76.8164, 35.6396], [76.5527, 35.8594], [76.2012, 35.8154], [75.9375, 36.0352], [76.0254, 36.4746], [75.8496, 36.6943], [75.498, 36.7383], [75.4102, 36.958], [75.0586, 37.002], [74.8828, 36.9141], [74.7949, 37.0459], [74.5313, 37.0898], [74.5313, 37.2217], [74.8828, 37.2217], [75.1465, 37.4414], [74.8828, 37.5732], [74.9707, 37.749], [74.8828, 38.4521], [74.3555, 38.6719], [74.1797, 38.6719], [74.0918, 38.54], [73.8281, 38.584], [73.7402, 38.8477], [73.8281, 38.9795], [73.4766, 39.375], [73.916, 39.5068], [73.916, 39.6826], [73.8281, 39.7705], [74.0039, 40.0342], [74.8828, 40.3418], [74.7949, 40.5176], [75.2344, 40.4297], [75.5859, 40.6494], [75.7617, 40.2979], [76.377, 40.3857], [76.9043, 41.001], [77.6074, 41.001], [78.1348, 41.2207], [78.1348, 41.3965], [80.1563, 42.0557], [80.2441, 42.2754], [80.1563, 42.627], [80.2441, 42.8467], [80.5078, 42.8906], [80.4199, 43.0664], [80.7715, 43.1982], [80.4199, 44.165], [80.4199, 44.6045], [79.9805, 44.8242], [79.9805, 44.9561], [81.7383, 45.3955], [82.0898, 45.2197], [82.5293, 45.2197], [82.2656, 45.6592], [83.0566, 47.2412], [83.6719, 47.0215], [84.7266, 47.0215], [84.9023, 46.8896], [85.5176, 47.0654], [85.6934, 47.2852], [85.5176, 48.1201], [85.7813, 48.4277], [86.5723, 48.5596], [86.8359, 48.8232], [86.748, 48.9551], [86.8359, 49.1309], [87.8027, 49.1748], [87.8906, 48.999], [87.7148, 48.9111], [88.0664, 48.7354], [87.9785, 48.6035], [88.5059, 48.3838], [88.6816, 48.1641], [89.1211, 47.9883], [89.5605, 48.0322], [89.7363, 47.8564], [90.0879, 47.8564], [90.3516, 47.6807], [90.5273, 47.2412], [90.8789, 46.9775], [91.0547, 46.582], [90.8789, 46.3184], [91.0547, 46.0107], [90.7031, 45.7471], [90.7031, 45.5273], [90.8789, 45.2197], [91.582, 45.0879], [93.5156, 44.9561], [94.7461, 44.3408], [95.3613, 44.2969], [95.3613, 44.0332], [95.5371, 43.9014], [95.8887, 43.2422], [96.3281, 42.9346], [96.416, 42.7588]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '54',
      size: '550',
      name: '西藏自治区',
      cp: [87.8695, 31.6846],
      childNum: 7
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[79.0137, 34.3213], [79.1016, 34.4531], [79.8047, 34.4971], [79.8926, 34.8047], [80.2441, 35.2002], [80.332, 35.1563], [80.2441, 35.2881], [80.4199, 35.4199], [81.6504, 35.2441], [82.002, 35.332], [82.4414, 35.7275], [82.8809, 35.6836], [83.1445, 35.4199], [84.1992, 35.376], [85.0781, 35.7275], [85.6055, 35.6836], [86.1328, 35.8594], [86.2207, 36.167], [87.3633, 36.4307], [88.5938, 36.4746], [88.7695, 36.3428], [89.209, 36.2988], [89.7363, 36.0791], [89.3848, 36.0352], [89.4727, 35.9033], [89.7363, 35.7715], [89.7363, 35.4199], [89.4727, 35.376], [89.4727, 35.2441], [89.5605, 34.8926], [89.8242, 34.8486], [89.7363, 34.6729], [89.8242, 34.3652], [89.6484, 34.0137], [90.0879, 33.4863], [90.7031, 33.1348], [91.4063, 33.1348], [91.9336, 32.8271], [92.1973, 32.8271], [92.2852, 32.7393], [92.9883, 32.7393], [93.5156, 32.4756], [93.7793, 32.5635], [94.1309, 32.4316], [94.6582, 32.6074], [95.1855, 32.4316], [95.0098, 32.2998], [95.1855, 32.3438], [95.2734, 32.2119], [95.3613, 32.168], [95.3613, 31.9922], [95.4492, 31.8164], [95.8008, 31.6846], [95.9766, 31.8164], [96.1523, 31.5967], [96.2402, 31.9482], [96.5039, 31.7285], [96.8555, 31.6846], [96.7676, 31.9922], [97.2949, 32.0801], [97.3828, 32.5635], [97.7344, 32.5195], [98.1738, 32.3438], [98.4375, 31.8604], [98.877, 31.4209], [98.6133, 31.2012], [98.9648, 30.7617], [99.1406, 29.2676], [98.9648, 29.1357], [98.9648, 28.8281], [98.7891, 28.8721], [98.7891, 29.0039], [98.7012, 28.916], [98.6133, 28.5205], [98.7891, 28.3447], [98.7012, 28.2129], [98.3496, 28.125], [98.2617, 28.3887], [98.1738, 28.125], [97.5586, 28.5205], [97.2949, 28.0811], [97.3828, 27.9053], [97.0313, 27.7295], [96.5039, 28.125], [95.7129, 28.2568], [95.3613, 28.125], [95.2734, 27.9492], [94.2188, 27.5537], [93.8672, 27.0264], [93.6035, 26.9385], [92.1094, 26.8506], [92.0215, 27.4658], [91.582, 27.5537], [91.582, 27.9053], [91.4063, 28.0371], [91.0547, 27.8613], [90.7031, 28.0811], [89.8242, 28.2129], [89.6484, 28.1689], [89.1211, 27.5977], [89.1211, 27.334], [89.0332, 27.2021], [88.7695, 27.4219], [88.8574, 27.9932], [88.6816, 28.125], [88.1543, 27.9053], [87.8906, 27.9492], [87.7148, 27.8174], [87.0996, 27.8174], [86.748, 28.125], [86.5723, 28.125], [86.4844, 27.9053], [86.1328, 28.125], [86.0449, 27.9053], [85.6934, 28.3447], [85.6055, 28.2568], [85.166, 28.3447], [85.166, 28.6523], [84.9023, 28.5645], [84.4629, 28.7402], [84.2871, 28.8721], [84.1992, 29.2236], [84.1113, 29.2676], [83.584, 29.1797], [83.2324, 29.5752], [82.1777, 30.0586], [82.0898, 30.3223], [81.3867, 30.3662], [81.2109, 30.0146], [81.0352, 30.2344], [80.0684, 30.5859], [79.7168, 30.9375], [79.0137, 31.0693], [78.75, 31.333], [78.8379, 31.5967], [78.6621, 31.8164], [78.75, 31.9043], [78.4863, 32.124], [78.3984, 32.5195], [78.75, 32.6953], [78.9258, 32.3438], [79.2773, 32.5635], [79.1016, 33.1787], [78.6621, 33.6621], [78.6621, 34.1016], [78.9258, 34.1455], [79.0137, 34.3213]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '15',
      size: '450',
      name: '内蒙古自治区',
      cp: [112.5977, 46.3408],
      childNum: 12
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[97.207, 42.8027], [99.4922, 42.583], [100.8105, 42.6709], [101.7773, 42.4951], [102.041, 42.2314], [102.7441, 42.1436], [103.3594, 41.8799], [103.8867, 41.792], [104.502, 41.8799], [104.502, 41.6602], [105.0293, 41.5723], [105.7324, 41.9238], [107.4023, 42.4512], [109.4238, 42.4512], [110.3906, 42.7588], [111.0059, 43.3301], [111.9727, 43.6816], [111.9727, 43.8135], [111.4453, 44.3848], [111.7969, 45], [111.9727, 45.0879], [113.6426, 44.7363], [114.1699, 44.9561], [114.5215, 45.3955], [115.6641, 45.4395], [116.1914, 45.7031], [116.2793, 45.9668], [116.543, 46.2744], [117.334, 46.3623], [117.4219, 46.582], [117.7734, 46.5381], [118.3008, 46.7578], [118.7402, 46.7139], [118.916, 46.7578], [119.0918, 46.6699], [119.707, 46.626], [119.9707, 46.7139], [119.707, 47.1973], [118.4766, 47.9883], [117.8613, 48.0322], [117.334, 47.6807], [116.8066, 47.9004], [116.1914, 47.8564], [115.9277, 47.6807], [115.5762, 47.9004], [115.4883, 48.1641], [115.8398, 48.252], [115.8398, 48.5596], [116.7188, 49.834], [117.7734, 49.5264], [118.5645, 49.9219], [119.2676, 50.0977], [119.3555, 50.3174], [119.1797, 50.3613], [119.5313, 50.7568], [119.5313, 50.8887], [119.707, 51.0645], [120.1465, 51.6797], [120.6738, 51.9434], [120.7617, 52.1191], [120.7617, 52.251], [120.5859, 52.3389], [120.6738, 52.5146], [120.4102, 52.6465], [120.0586, 52.6025], [120.0586, 52.7344], [120.8496, 53.2617], [121.4648, 53.3496], [121.8164, 53.042], [121.2012, 52.5586], [121.6406, 52.4268], [121.7285, 52.2949], [121.9922, 52.2949], [122.168, 52.5146], [122.6953, 52.251], [122.6074, 52.0752], [122.959, 51.3281], [123.3105, 51.2402], [123.6621, 51.3721], [124.3652, 51.2842], [124.541, 51.3721], [124.8926, 51.3721], [125.0684, 51.6357], [125.332, 51.6357], [126.0352, 51.0205], [125.7715, 50.7568], [125.7715, 50.5371], [125.332, 50.1416], [125.1563, 49.834], [125.2441, 49.1748], [124.8047, 49.1309], [124.4531, 48.1201], [124.2773, 48.5156], [122.4316, 47.373], [123.0469, 46.7139], [123.3984, 46.8896], [123.3984, 46.9775], [123.4863, 46.9775], [123.5742, 46.8457], [123.5742, 46.8896], [123.5742, 46.6699], [123.0469, 46.582], [123.2227, 46.2305], [122.7832, 46.0107], [122.6953, 45.7031], [122.4316, 45.8789], [122.2559, 45.791], [121.8164, 46.0107], [121.7285, 45.7471], [121.9043, 45.7031], [122.2559, 45.2637], [122.0801, 44.8682], [122.3438, 44.2529], [123.1348, 44.4727], [123.4863, 43.7256], [123.3105, 43.5059], [123.6621, 43.374], [123.5742, 43.0225], [123.3105, 42.9785], [123.1348, 42.8027], [122.7832, 42.7148], [122.3438, 42.8467], [122.3438, 42.6709], [121.9922, 42.7148], [121.7285, 42.4512], [121.4648, 42.4951], [120.498, 42.0996], [120.1465, 41.7041], [119.8828, 42.1875], [119.5313, 42.3633], [119.3555, 42.2754], [119.2676, 41.7041], [119.4434, 41.6162], [119.2676, 41.3086], [118.3887, 41.3086], [118.125, 41.748], [118.3008, 41.792], [118.3008, 42.0996], [118.125, 42.0557], [117.9492, 42.2314], [118.0371, 42.4072], [117.7734, 42.627], [117.5098, 42.583], [117.334, 42.4512], [116.8945, 42.4072], [116.8066, 42.0117], [116.2793, 42.0117], [116.0156, 41.792], [115.9277, 41.9238], [115.2246, 41.5723], [114.9609, 41.6162], [114.873, 42.0996], [114.5215, 42.1436], [114.1699, 41.792], [114.2578, 41.5723], [113.9063, 41.4404], [113.9941, 41.2207], [113.9063, 41.1328], [114.082, 40.7373], [114.082, 40.5176], [113.8184, 40.5176], [113.5547, 40.3418], [113.2031, 40.3857], [112.7637, 40.166], [112.3242, 40.2539], [111.9727, 39.5947], [111.4453, 39.6387], [111.3574, 39.4189], [111.0938, 39.375], [111.0938, 39.5947], [110.6543, 39.2871], [110.127, 39.4629], [110.2148, 39.2871], [109.8633, 39.2432], [109.9512, 39.1553], [108.9844, 38.3203], [109.0723, 38.0127], [108.8965, 37.9688], [108.8086, 38.0127], [108.7207, 37.7051], [108.1934, 37.6172], [107.666, 37.8809], [107.3145, 38.1006], [106.7871, 38.1885], [106.5234, 38.3203], [106.9629, 38.9795], [106.7871, 39.375], [106.3477, 39.2871], [105.9082, 38.7158], [105.8203, 37.793], [104.3262, 37.4414], [103.4473, 37.8369], [103.3594, 38.0127], [103.5352, 38.1445], [103.4473, 38.3643], [104.2383, 38.9795], [104.0625, 39.4189], [103.3594, 39.3311], [103.0078, 39.1113], [102.4805, 39.2432], [101.8652, 39.1113], [102.041, 38.8916], [101.7773, 38.6719], [101.3379, 38.7598], [101.25, 39.0234], [100.9863, 38.9355], [100.8105, 39.4189], [100.5469, 39.4189], [100.0195, 39.7705], [99.4922, 39.8584], [100.1074, 40.2539], [100.1953, 40.6494], [99.9316, 41.001], [99.2285, 40.8691], [99.0527, 40.6934], [98.9648, 40.7813], [98.7891, 40.6055], [98.5254, 40.7373], [98.6133, 40.6494], [98.3496, 40.5615], [98.3496, 40.9131], [97.4707, 41.4844], [97.8223, 41.6162], [97.8223, 41.748], [97.207, 42.8027]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '63',
      size: '800',
      name: '青海省',
      cp: [95.2402, 35.4199],
      childNum: 8
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[89.7363, 36.0791], [89.9121, 36.0791], [90, 36.2549], [90.8789, 36.0352], [91.0547, 36.0791], [91.0547, 36.5186], [90.791, 36.6064], [90.7031, 36.7822], [91.3184, 37.0898], [91.0547, 37.4414], [90.5273, 37.8369], [90.6152, 38.3203], [90.3516, 38.2324], [90.1758, 38.4961], [92.373, 39.0234], [92.373, 39.1113], [93.1641, 39.1992], [93.1641, 38.9795], [93.6914, 38.9355], [93.8672, 38.7158], [94.3066, 38.7598], [94.5703, 38.3643], [95.0098, 38.4082], [95.4492, 38.2764], [95.7129, 38.3643], [96.2402, 38.1006], [96.416, 38.2324], [96.6797, 38.1885], [96.6797, 38.4521], [97.1191, 38.584], [97.0313, 39.1992], [98.1738, 38.8037], [98.3496, 39.0234], [98.6133, 38.9355], [98.7891, 39.0674], [99.1406, 38.9355], [99.8438, 38.3643], [100.1953, 38.2764], [100.0195, 38.4521], [100.1074, 38.4961], [100.459, 38.2764], [100.7227, 38.2324], [101.1621, 37.8369], [101.5137, 37.8809], [101.7773, 37.6172], [101.9531, 37.7051], [102.1289, 37.4414], [102.5684, 37.1777], [102.4805, 36.958], [102.6563, 36.8262], [102.5684, 36.7383], [102.832, 36.3428], [103.0078, 36.2549], [102.9199, 36.0791], [102.9199, 35.9033], [102.6563, 35.7715], [102.832, 35.5957], [102.4805, 35.5957], [102.3047, 35.4199], [102.3926, 35.2002], [101.9531, 34.8486], [101.9531, 34.6289], [102.2168, 34.4092], [102.1289, 34.2773], [101.6895, 34.1016], [100.9863, 34.3652], [100.8105, 34.2773], [101.25, 33.6621], [101.5137, 33.7061], [101.6016, 33.5303], [101.7773, 33.5303], [101.6895, 33.3105], [101.7773, 33.2227], [101.6016, 33.1348], [101.1621, 33.2227], [101.25, 32.6953], [100.7227, 32.6514], [100.7227, 32.5195], [100.3711, 32.7393], [100.1074, 32.6514], [100.1074, 32.8711], [99.8438, 33.0029], [99.7559, 32.7393], [99.2285, 32.915], [99.2285, 33.0469], [98.877, 33.1787], [98.4375, 34.0576], [97.8223, 34.1895], [97.6465, 34.1016], [97.7344, 33.9258], [97.3828, 33.8818], [97.4707, 33.5742], [97.7344, 33.3984], [97.3828, 32.8711], [97.4707, 32.6953], [97.7344, 32.5195], [97.3828, 32.5635], [97.2949, 32.0801], [96.7676, 31.9922], [96.8555, 31.6846], [96.5039, 31.7285], [96.2402, 31.9482], [96.1523, 31.5967], [95.9766, 31.8164], [95.8008, 31.6846], [95.4492, 31.8164], [95.3613, 31.9922], [95.3613, 32.168], [95.2734, 32.2119], [95.1855, 32.3438], [95.0098, 32.2998], [95.1855, 32.4316], [94.6582, 32.6074], [94.1309, 32.4316], [93.7793, 32.5635], [93.5156, 32.4756], [92.9883, 32.7393], [92.2852, 32.7393], [92.1973, 32.8271], [91.9336, 32.8271], [91.4063, 33.1348], [90.7031, 33.1348], [90.0879, 33.4863], [89.6484, 34.0137], [89.8242, 34.3652], [89.7363, 34.6729], [89.8242, 34.8486], [89.5605, 34.8926], [89.4727, 35.2441], [89.4727, 35.376], [89.7363, 35.4199], [89.7363, 35.7715], [89.4727, 35.9033], [89.3848, 36.0352], [89.7363, 36.0791]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '51',
      size: '900',
      name: '四川省',
      cp: [101.9199, 30.1904],
      childNum: 21
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[101.7773, 33.5303], [101.8652, 33.5742], [101.9531, 33.4424], [101.8652, 33.0908], [102.4805, 33.4424], [102.2168, 33.9258], [102.9199, 34.3213], [103.0957, 34.1895], [103.1836, 33.7939], [104.1504, 33.6182], [104.2383, 33.3984], [104.4141, 33.3105], [104.3262, 33.2227], [104.4141, 33.0469], [104.3262, 32.8711], [104.4141, 32.7393], [105.2051, 32.6074], [105.3809, 32.7393], [105.3809, 32.8711], [105.4688, 32.915], [105.5566, 32.7393], [106.084, 32.8711], [106.084, 32.7393], [106.3477, 32.6514], [107.0508, 32.6953], [107.1387, 32.4756], [107.2266, 32.4316], [107.4023, 32.5195], [108.0176, 32.168], [108.2813, 32.2559], [108.5449, 32.2119], [108.3691, 32.168], [108.2813, 31.9043], [108.5449, 31.6846], [108.1934, 31.5088], [107.9297, 30.8496], [107.4902, 30.8496], [107.4023, 30.7617], [107.4902, 30.6299], [107.0508, 30.0146], [106.7871, 30.0146], [106.6113, 30.3223], [106.2598, 30.1904], [105.8203, 30.4541], [105.6445, 30.2783], [105.5566, 30.1025], [105.7324, 29.8828], [105.293, 29.5313], [105.4688, 29.3115], [105.7324, 29.2676], [105.8203, 28.96], [106.2598, 28.8721], [106.3477, 28.5205], [105.9961, 28.7402], [105.6445, 28.4326], [105.9082, 28.125], [106.1719, 28.125], [106.3477, 27.8174], [105.6445, 27.6416], [105.5566, 27.7734], [105.293, 27.7295], [105.2051, 27.9932], [105.0293, 28.0811], [104.8535, 27.9053], [104.4141, 27.9492], [104.3262, 28.0371], [104.4141, 28.125], [104.4141, 28.2568], [104.2383, 28.4326], [104.4141, 28.6084], [103.8867, 28.6523], [103.7988, 28.3008], [103.4473, 28.125], [103.4473, 27.7734], [102.9199, 27.29], [103.0078, 26.3672], [102.6563, 26.1914], [102.5684, 26.3672], [102.1289, 26.1035], [101.8652, 26.0596], [101.6016, 26.2354], [101.6895, 26.3672], [101.4258, 26.5869], [101.4258, 26.8066], [101.4258, 26.7188], [101.1621, 27.0264], [101.1621, 27.1582], [100.7227, 27.8613], [100.3711, 27.8174], [100.2832, 27.7295], [100.0195, 28.125], [100.1953, 28.3447], [99.668, 28.8281], [99.4043, 28.5205], [99.4043, 28.1689], [99.2285, 28.3008], [99.1406, 29.2676], [98.9648, 30.7617], [98.6133, 31.2012], [98.877, 31.4209], [98.4375, 31.8604], [98.1738, 32.3438], [97.7344, 32.5195], [97.4707, 32.6953], [97.3828, 32.8711], [97.7344, 33.3984], [97.4707, 33.5742], [97.3828, 33.8818], [97.7344, 33.9258], [97.6465, 34.1016], [97.8223, 34.1895], [98.4375, 34.0576], [98.877, 33.1787], [99.2285, 33.0469], [99.2285, 32.915], [99.7559, 32.7393], [99.8438, 33.0029], [100.1074, 32.8711], [100.1074, 32.6514], [100.3711, 32.7393], [100.7227, 32.5195], [100.7227, 32.6514], [101.25, 32.6953], [101.1621, 33.2227], [101.6016, 33.1348], [101.7773, 33.2227], [101.6895, 33.3105], [101.7773, 33.5303]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '23',
      size: '700',
      name: '黑龙江省',
      cp: [126.1445, 48.7156],
      childNum: 13
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[121.4648, 53.3496], [123.6621, 53.5693], [124.8926, 53.0859], [125.0684, 53.2178], [125.5957, 53.0859], [125.6836, 52.9102], [126.123, 52.7783], [126.0352, 52.6025], [126.2109, 52.5146], [126.3867, 52.2949], [126.3867, 52.207], [126.5625, 52.1631], [126.4746, 51.9434], [126.9141, 51.3721], [126.8262, 51.2842], [127.002, 51.3281], [126.9141, 51.1084], [127.2656, 50.7568], [127.3535, 50.2734], [127.6172, 50.2295], [127.5293, 49.8779], [127.793, 49.6143], [128.7598, 49.5703], [129.1113, 49.3506], [129.4629, 49.4385], [130.2539, 48.8672], [130.6934, 48.8672], [130.5176, 48.6475], [130.8691, 48.2959], [130.6934, 48.1201], [131.0449, 47.6807], [132.5391, 47.7246], [132.627, 47.9443], [133.0664, 48.1201], [133.5059, 48.1201], [134.209, 48.3838], [135.0879, 48.4277], [134.7363, 48.252], [134.5605, 47.9883], [134.7363, 47.6807], [134.5605, 47.4609], [134.3848, 47.4609], [134.209, 47.2852], [134.209, 47.1533], [133.8574, 46.5381], [133.9453, 46.2744], [133.5059, 45.835], [133.418, 45.5713], [133.2422, 45.5273], [133.0664, 45.1318], [132.8906, 45.0439], [131.9238, 45.3516], [131.5723, 45.0439], [131.0449, 44.8682], [131.3086, 44.0771], [131.2207, 43.7256], [131.3086, 43.4619], [130.8691, 43.418], [130.5176, 43.6377], [130.3418, 43.9893], [129.9902, 43.8574], [129.9023, 44.0332], [129.8145, 43.9014], [129.2871, 43.8135], [129.1992, 43.5938], [128.8477, 43.5498], [128.4961, 44.165], [128.4082, 44.4727], [128.0566, 44.3408], [128.0566, 44.1211], [127.7051, 44.1211], [127.5293, 44.6045], [127.0898, 44.6045], [127.002, 44.7803], [127.0898, 45], [126.9141, 45.1318], [126.5625, 45.2637], [126.0352, 45.1758], [125.7715, 45.3076], [125.6836, 45.5273], [125.0684, 45.3955], [124.8926, 45.5273], [124.3652, 45.4395], [124.0137, 45.7471], [123.9258, 46.2305], [123.2227, 46.2305], [123.0469, 46.582], [123.5742, 46.6699], [123.5742, 46.8896], [123.5742, 46.8457], [123.4863, 46.9775], [123.3984, 46.9775], [123.3984, 46.8896], [123.0469, 46.7139], [122.4316, 47.373], [124.2773, 48.5156], [124.4531, 48.1201], [124.8047, 49.1309], [125.2441, 49.1748], [125.1563, 49.834], [125.332, 50.1416], [125.7715, 50.5371], [125.7715, 50.7568], [126.0352, 51.0205], [125.332, 51.6357], [125.0684, 51.6357], [124.8926, 51.3721], [124.541, 51.3721], [124.3652, 51.2842], [123.6621, 51.3721], [123.3105, 51.2402], [122.959, 51.3281], [122.6074, 52.0752], [122.6953, 52.251], [122.168, 52.5146], [121.9922, 52.2949], [121.7285, 52.2949], [121.6406, 52.4268], [121.2012, 52.5586], [121.8164, 53.042], [121.4648, 53.3496]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '62',
      size: '690',
      name: '甘肃省',
      cp: [99.7129, 38.166],
      childNum: 14
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[96.416, 42.7148], [97.207, 42.8027], [97.8223, 41.748], [97.8223, 41.6162], [97.4707, 41.4844], [98.3496, 40.9131], [98.3496, 40.5615], [98.6133, 40.6494], [98.5254, 40.7373], [98.7891, 40.6055], [98.9648, 40.7813], [99.0527, 40.6934], [99.2285, 40.8691], [99.9316, 41.001], [100.1953, 40.6494], [100.1074, 40.2539], [99.4922, 39.8584], [100.0195, 39.7705], [100.5469, 39.4189], [100.8105, 39.4189], [100.9863, 38.9355], [101.25, 39.0234], [101.3379, 38.7598], [101.7773, 38.6719], [102.041, 38.8916], [101.8652, 39.1113], [102.4805, 39.2432], [103.0078, 39.1113], [103.3594, 39.3311], [104.0625, 39.4189], [104.2383, 38.9795], [103.4473, 38.3643], [103.5352, 38.1445], [103.3594, 38.0127], [103.4473, 37.8369], [104.3262, 37.4414], [104.5898, 37.4414], [104.5898, 37.2217], [104.8535, 37.2217], [105.293, 36.8262], [105.2051, 36.6943], [105.4688, 36.123], [105.293, 35.9912], [105.3809, 35.7715], [105.7324, 35.7275], [105.8203, 35.5518], [105.9961, 35.4639], [105.9082, 35.4199], [105.9961, 35.4199], [106.084, 35.376], [106.2598, 35.4199], [106.3477, 35.2441], [106.5234, 35.332], [106.4355, 35.6836], [106.6992, 35.6836], [106.9629, 35.8154], [106.875, 36.123], [106.5234, 36.2549], [106.5234, 36.4746], [106.4355, 36.5625], [106.6113, 36.7822], [106.6113, 37.0898], [107.3145, 37.0898], [107.3145, 36.9141], [108.7207, 36.3428], [108.6328, 35.9912], [108.5449, 35.8594], [108.6328, 35.5518], [108.5449, 35.2881], [107.7539, 35.2881], [107.7539, 35.1123], [107.8418, 35.0244], [107.666, 34.9365], [107.2266, 34.8926], [106.9629, 35.0684], [106.6113, 35.0684], [106.5234, 34.7607], [106.3477, 34.585], [106.6992, 34.3213], [106.5234, 34.2773], [106.6113, 34.1455], [106.4355, 33.9258], [106.5234, 33.5303], [105.9961, 33.6182], [105.7324, 33.3984], [105.9961, 33.1787], [105.9082, 33.0029], [105.4688, 32.915], [105.3809, 32.8711], [105.3809, 32.7393], [105.2051, 32.6074], [104.4141, 32.7393], [104.3262, 32.8711], [104.4141, 33.0469], [104.3262, 33.2227], [104.4141, 33.3105], [104.2383, 33.3984], [104.1504, 33.6182], [103.1836, 33.7939], [103.0957, 34.1895], [102.9199, 34.3213], [102.2168, 33.9258], [102.4805, 33.4424], [101.8652, 33.0908], [101.9531, 33.4424], [101.8652, 33.5742], [101.7773, 33.5303], [101.6016, 33.5303], [101.5137, 33.7061], [101.25, 33.6621], [100.8105, 34.2773], [100.9863, 34.3652], [101.6895, 34.1016], [102.1289, 34.2773], [102.2168, 34.4092], [101.9531, 34.6289], [101.9531, 34.8486], [102.3926, 35.2002], [102.3047, 35.4199], [102.4805, 35.5957], [102.832, 35.5957], [102.6563, 35.7715], [102.9199, 35.9033], [102.9199, 36.0791], [103.0078, 36.2549], [102.832, 36.3428], [102.5684, 36.7383], [102.6563, 36.8262], [102.4805, 36.958], [102.5684, 37.1777], [102.1289, 37.4414], [101.9531, 37.7051], [101.7773, 37.6172], [101.5137, 37.8809], [101.1621, 37.8369], [100.7227, 38.2324], [100.459, 38.2764], [100.1074, 38.4961], [100.0195, 38.4521], [100.1953, 38.2764], [99.8438, 38.3643], [99.1406, 38.9355], [98.7891, 39.0674], [98.6133, 38.9355], [98.3496, 39.0234], [98.1738, 38.8037], [97.0313, 39.1992], [97.1191, 38.584], [96.6797, 38.4521], [96.6797, 38.1885], [96.416, 38.2324], [96.2402, 38.1006], [95.7129, 38.3643], [95.4492, 38.2764], [95.0098, 38.4082], [94.5703, 38.3643], [94.3066, 38.7598], [93.8672, 38.7158], [93.6914, 38.9355], [93.1641, 38.9795], [93.1641, 39.1992], [92.373, 39.1113], [92.373, 39.3311], [92.6367, 39.6387], [93.0762, 40.6494], [93.8672, 40.6934], [94.043, 41.0889], [94.5703, 41.4844], [95.1855, 41.792], [95.2734, 41.6162], [95.9766, 41.9238], [96.2402, 42.2314], [96.0645, 42.3193], [95.9766, 42.4951], [96.416, 42.7148]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '53',
      size: '1200',
      name: '云南省',
      cp: [101.0652, 25.1807],
      childNum: 16
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[98.1738, 28.125], [98.2617, 28.3887], [98.3496, 28.125], [98.7012, 28.2129], [98.7891, 28.3447], [98.6133, 28.5205], [98.7012, 28.916], [98.7891, 29.0039], [98.7891, 28.8721], [98.9648, 28.8281], [98.9648, 29.1357], [99.1406, 29.2676], [99.2285, 28.3008], [99.4043, 28.1689], [99.4043, 28.5205], [99.668, 28.8281], [100.1953, 28.3447], [100.0195, 28.125], [100.2832, 27.7295], [100.3711, 27.8174], [100.7227, 27.8613], [101.1621, 27.1582], [101.1621, 27.0264], [101.4258, 26.7188], [101.4258, 26.8066], [101.4258, 26.5869], [101.6895, 26.3672], [101.6016, 26.2354], [101.8652, 26.0596], [102.1289, 26.1035], [102.5684, 26.3672], [102.6563, 26.1914], [103.0078, 26.3672], [102.9199, 27.29], [103.4473, 27.7734], [103.4473, 28.125], [103.7988, 28.3008], [103.8867, 28.6523], [104.4141, 28.6084], [104.2383, 28.4326], [104.4141, 28.2568], [104.4141, 28.125], [104.3262, 28.0371], [104.4141, 27.9492], [104.8535, 27.9053], [105.0293, 28.0811], [105.2051, 27.9932], [105.293, 27.7295], [105.2051, 27.3779], [104.5898, 27.334], [104.4141, 27.4658], [104.1504, 27.2461], [103.8867, 27.4219], [103.623, 27.0264], [103.7109, 26.9824], [103.7109, 26.7627], [103.8867, 26.543], [104.4141, 26.6748], [104.6777, 26.4111], [104.3262, 25.708], [104.8535, 25.2246], [104.5898, 25.0488], [104.6777, 24.9609], [104.502, 24.7412], [104.6777, 24.3457], [104.7656, 24.4775], [105.0293, 24.4336], [105.2051, 24.082], [105.4688, 24.0381], [105.5566, 24.126], [105.9961, 24.126], [106.1719, 23.8184], [106.1719, 23.5547], [105.6445, 23.4229], [105.5566, 23.2031], [105.293, 23.3789], [104.8535, 23.1592], [104.7656, 22.8516], [104.3262, 22.6758], [104.1504, 22.8076], [103.9746, 22.5439], [103.623, 22.7637], [103.5352, 22.5879], [103.3594, 22.8076], [103.0957, 22.4561], [102.4805, 22.7637], [102.3047, 22.4121], [101.8652, 22.3682], [101.7773, 22.5], [101.6016, 22.1924], [101.8652, 21.6211], [101.7773, 21.1377], [101.6016, 21.2256], [101.25, 21.1816], [101.1621, 21.7529], [100.6348, 21.4453], [100.1074, 21.4893], [99.9316, 22.0605], [99.2285, 22.1484], [99.4043, 22.5879], [99.3164, 22.7197], [99.4922, 23.0713], [98.877, 23.2031], [98.7012, 23.9502], [98.877, 24.126], [98.1738, 24.082], [97.7344, 23.8623], [97.5586, 23.9063], [97.7344, 24.126], [97.6465, 24.4336], [97.5586, 24.4336], [97.5586, 24.7412], [97.7344, 24.8291], [97.8223, 25.2686], [98.1738, 25.4004], [98.1738, 25.6201], [98.3496, 25.5762], [98.5254, 25.8398], [98.7012, 25.8838], [98.6133, 26.0596], [98.7012, 26.1475], [98.7891, 26.5869], [98.7012, 27.5098], [98.5254, 27.6416], [98.3496, 27.5098], [98.1738, 28.125]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '45',
      size: '1450',
      name: '广西壮族自治区',
      cp: [107.7813, 23.6426],
      childNum: 14
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[104.502, 24.7412], [104.6777, 24.6094], [105.2051, 24.9609], [105.9961, 24.6533], [106.1719, 24.7852], [106.1719, 24.9609], [106.875, 25.1807], [107.0508, 25.2686], [106.9629, 25.4883], [107.2266, 25.6201], [107.4902, 25.2246], [107.7539, 25.2246], [107.8418, 25.1367], [108.1055, 25.2246], [108.1934, 25.4443], [108.3691, 25.5322], [108.6328, 25.3125], [108.6328, 25.5762], [109.0723, 25.5322], [108.9844, 25.752], [109.3359, 25.708], [109.5117, 26.0156], [109.7754, 25.8838], [109.9512, 26.1914], [110.2148, 25.9717], [110.5664, 26.3232], [111.1816, 26.3232], [111.2695, 26.2354], [111.2695, 25.8838], [111.4453, 25.8398], [111.0059, 25.0049], [111.0938, 24.9609], [111.3574, 25.1367], [111.5332, 24.6533], [111.709, 24.7852], [112.0605, 24.7412], [111.8848, 24.6533], [112.0605, 24.3457], [111.8848, 24.2139], [111.8848, 23.9941], [111.7969, 23.8184], [111.6211, 23.8184], [111.6211, 23.6865], [111.3574, 23.4668], [111.4453, 23.0273], [111.2695, 22.8076], [110.7422, 22.5439], [110.7422, 22.2803], [110.6543, 22.1484], [110.3027, 22.1484], [110.3027, 21.8848], [109.9512, 21.8408], [109.8633, 21.665], [109.7754, 21.6211], [109.7754, 21.4014], [109.5996, 21.4453], [109.1602, 21.3574], [109.248, 20.874], [109.0723, 20.9619], [109.0723, 21.5332], [108.7207, 21.5332], [108.6328, 21.665], [108.2813, 21.4893], [107.8418, 21.6211], [107.4023, 21.6211], [107.0508, 21.7969], [107.0508, 21.9287], [106.6992, 22.0166], [106.6113, 22.4121], [106.7871, 22.7637], [106.6992, 22.8955], [105.9082, 22.9395], [105.5566, 23.0713], [105.5566, 23.2031], [105.6445, 23.4229], [106.1719, 23.5547], [106.1719, 23.8184], [105.9961, 24.126], [105.5566, 24.126], [105.4688, 24.0381], [105.2051, 24.082], [105.0293, 24.4336], [104.7656, 24.4775], [104.6777, 24.3457], [104.502, 24.7412]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '43',
      size: '1700',
      name: '湖南省',
      cp: [111.5332, 27.3779],
      childNum: 14
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[109.248, 28.4766], [109.248, 29.1357], [109.5117, 29.6191], [109.6875, 29.6191], [109.7754, 29.751], [110.4785, 29.6631], [110.6543, 29.751], [110.4785, 30.0146], [110.8301, 30.1465], [111.7969, 29.9268], [112.2363, 29.5313], [112.5, 29.6191], [112.6758, 29.5752], [112.9395, 29.7949], [113.0273, 29.751], [112.9395, 29.4873], [113.0273, 29.4434], [113.5547, 29.8389], [113.5547, 29.707], [113.7305, 29.5752], [113.6426, 29.3115], [113.7305, 29.0918], [113.9063, 29.0479], [114.1699, 28.8281], [114.082, 28.5645], [114.2578, 28.3447], [113.7305, 27.9492], [113.6426, 27.5977], [113.6426, 27.3779], [113.8184, 27.29], [113.7305, 27.1143], [113.9063, 26.9385], [113.9063, 26.6309], [114.082, 26.5869], [113.9941, 26.1914], [114.2578, 26.1475], [113.9941, 26.0596], [113.9063, 25.4443], [113.6426, 25.3125], [113.2031, 25.5322], [112.8516, 25.3564], [113.0273, 25.2246], [113.0273, 24.9609], [112.8516, 24.917], [112.5879, 25.1367], [112.2363, 25.1807], [112.1484, 24.873], [112.0605, 24.7412], [111.709, 24.7852], [111.5332, 24.6533], [111.3574, 25.1367], [111.0938, 24.9609], [111.0059, 25.0049], [111.4453, 25.8398], [111.2695, 25.8838], [111.2695, 26.2354], [111.1816, 26.3232], [110.5664, 26.3232], [110.2148, 25.9717], [109.9512, 26.1914], [109.7754, 25.8838], [109.5117, 26.0156], [109.4238, 26.2793], [109.248, 26.3232], [109.4238, 26.5869], [109.3359, 26.7188], [109.5117, 26.8066], [109.5117, 27.0264], [109.3359, 27.1582], [108.8965, 27.0264], [108.8086, 27.1143], [109.4238, 27.5977], [109.3359, 27.9053], [109.3359, 28.2568], [109.248, 28.4766]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '61',
      size: '1150',
      name: '陕西省',
      cp: [109.5996, 35.7396],
      childNum: 10
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[105.4688, 32.915], [105.9082, 33.0029], [105.9961, 33.1787], [105.7324, 33.3984], [105.9961, 33.6182], [106.5234, 33.5303], [106.4355, 33.9258], [106.6113, 34.1455], [106.5234, 34.2773], [106.6992, 34.3213], [106.3477, 34.585], [106.5234, 34.7607], [106.6113, 35.0684], [106.9629, 35.0684], [107.2266, 34.8926], [107.666, 34.9365], [107.8418, 35.0244], [107.7539, 35.1123], [107.7539, 35.2881], [108.5449, 35.2881], [108.6328, 35.5518], [108.5449, 35.8594], [108.6328, 35.9912], [108.7207, 36.3428], [107.3145, 36.9141], [107.3145, 37.0898], [107.3145, 37.6172], [107.666, 37.8809], [108.1934, 37.6172], [108.7207, 37.7051], [108.8086, 38.0127], [108.8965, 37.9688], [109.0723, 38.0127], [108.9844, 38.3203], [109.9512, 39.1553], [109.8633, 39.2432], [110.2148, 39.2871], [110.127, 39.4629], [110.6543, 39.2871], [111.0938, 39.5947], [111.0938, 39.375], [111.1816, 39.2432], [110.918, 38.7158], [110.8301, 38.4961], [110.4785, 38.1885], [110.4785, 37.9688], [110.8301, 37.6611], [110.3906, 37.002], [110.4785, 36.123], [110.5664, 35.6396], [110.2148, 34.8926], [110.2148, 34.6729], [110.3906, 34.585], [110.4785, 34.2334], [110.6543, 34.1455], [110.6543, 33.8379], [111.0059, 33.5303], [111.0059, 33.2666], [110.7422, 33.1348], [110.5664, 33.2666], [110.3027, 33.1787], [109.5996, 33.2666], [109.4238, 33.1348], [109.7754, 33.0469], [109.7754, 32.915], [110.127, 32.7393], [110.127, 32.6074], [109.6875, 32.6074], [109.5117, 32.4316], [109.5996, 31.7285], [109.248, 31.7285], [109.0723, 31.9482], [108.5449, 32.2119], [108.2813, 32.2559], [108.0176, 32.168], [107.4023, 32.5195], [107.2266, 32.4316], [107.1387, 32.4756], [107.0508, 32.6953], [106.3477, 32.6514], [106.084, 32.7393], [106.084, 32.8711], [105.5566, 32.7393], [105.4688, 32.915]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '44',
      size: '1600',
      name: '广东省',
      cp: [113.4668, 22.8076],
      childNum: 21
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[109.7754, 21.4014], [109.7754, 21.6211], [109.8633, 21.665], [109.9512, 21.8408], [110.3027, 21.8848], [110.3027, 22.1484], [110.6543, 22.1484], [110.7422, 22.2803], [110.7422, 22.5439], [111.2695, 22.8076], [111.4453, 23.0273], [111.3574, 23.4668], [111.6211, 23.6865], [111.6211, 23.8184], [111.7969, 23.8184], [111.8848, 23.9941], [111.8848, 24.2139], [112.0605, 24.3457], [111.8848, 24.6533], [112.0605, 24.7412], [112.1484, 24.873], [112.2363, 25.1807], [112.5879, 25.1367], [112.8516, 24.917], [113.0273, 24.9609], [113.0273, 25.2246], [112.8516, 25.3564], [113.2031, 25.5322], [113.6426, 25.3125], [113.9063, 25.4443], [113.9941, 25.2686], [114.6094, 25.4004], [114.7852, 25.2686], [114.6973, 25.1367], [114.4336, 24.9609], [114.1699, 24.6973], [114.4336, 24.5215], [115.4004, 24.7852], [115.8398, 24.5654], [115.752, 24.7852], [115.9277, 24.917], [116.2793, 24.7852], [116.3672, 24.873], [116.543, 24.6094], [116.7188, 24.6533], [116.9824, 24.1699], [116.9824, 23.9063], [117.1582, 23.5547], [117.334, 23.2471], [116.8945, 23.3789], [116.6309, 23.1152], [116.543, 22.8516], [115.9277, 22.7197], [115.6641, 22.7637], [115.5762, 22.6318], [115.0488, 22.6758], [114.6094, 22.3682], [114.3457, 22.5439], [113.9941, 22.5], [113.8184, 22.1924], [114.3457, 22.1484], [114.4336, 22.0166], [114.082, 21.9287], [113.9941, 21.7969], [113.5547, 22.0166], [113.1152, 21.8408], [112.9395, 21.5771], [112.4121, 21.4453], [112.2363, 21.5332], [111.5332, 21.4893], [111.2695, 21.3574], [110.7422, 21.3574], [110.6543, 21.2256], [110.7422, 20.918], [110.4785, 20.874], [110.6543, 20.2588], [110.5664, 20.2588], [110.3906, 20.127], [110.0391, 20.127], [109.8633, 20.127], [109.8633, 20.3027], [109.5996, 20.918], [109.7754, 21.4014], [109.7754, 21.4014]], [[113.5986, 22.1649], [113.6096, 22.1265], [113.5547, 22.11], [113.5437, 22.2034], [113.5767, 22.2034], [113.5986, 22.1649]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '22',
      size: '1120',
      name: '吉林省',
      cp: [125.7746, 43.5938],
      childNum: 9
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[123.2227, 46.2305], [123.9258, 46.2305], [124.0137, 45.7471], [124.3652, 45.4395], [124.8926, 45.5273], [125.0684, 45.3955], [125.6836, 45.5273], [125.7715, 45.3076], [126.0352, 45.1758], [126.5625, 45.2637], [126.9141, 45.1318], [127.0898, 45], [127.002, 44.7803], [127.0898, 44.6045], [127.5293, 44.6045], [127.7051, 44.1211], [128.0566, 44.1211], [128.0566, 44.3408], [128.4082, 44.4727], [128.4961, 44.165], [128.8477, 43.5498], [129.1992, 43.5938], [129.2871, 43.8135], [129.8145, 43.9014], [129.9023, 44.0332], [129.9902, 43.8574], [130.3418, 43.9893], [130.5176, 43.6377], [130.8691, 43.418], [131.3086, 43.4619], [131.3086, 43.3301], [131.1328, 42.9346], [130.4297, 42.7148], [130.6055, 42.6709], [130.6055, 42.4512], [130.2539, 42.7588], [130.2539, 42.8906], [130.166, 42.9785], [129.9023, 43.0225], [129.7266, 42.4951], [129.375, 42.4512], [128.9355, 42.0117], [128.0566, 42.0117], [128.3203, 41.5723], [128.1445, 41.3525], [127.0898, 41.5283], [127.1777, 41.5723], [126.9141, 41.792], [126.6504, 41.6602], [126.4746, 41.3965], [126.123, 40.957], [125.6836, 40.8691], [125.5957, 40.9131], [125.7715, 41.2207], [125.332, 41.6602], [125.332, 41.9678], [125.4199, 42.0996], [125.332, 42.1436], [124.8926, 42.8027], [124.8926, 43.0664], [124.7168, 43.0664], [124.4531, 42.8467], [124.2773, 43.2422], [123.8379, 43.4619], [123.6621, 43.374], [123.3105, 43.5059], [123.4863, 43.7256], [123.1348, 44.4727], [122.3438, 44.2529], [122.0801, 44.8682], [122.2559, 45.2637], [121.9043, 45.7031], [121.7285, 45.7471], [121.8164, 46.0107], [122.2559, 45.791], [122.4316, 45.8789], [122.6953, 45.7031], [122.7832, 46.0107], [123.2227, 46.2305]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '13',
      size: '1300',
      name: '河北省',
      cp: [115.4004, 39.4688],
      childNum: 11
    },
    geometry: {
      type: 'MultiPolygon',
      coordinates: [[[[114.5215, 39.5068], [114.3457, 39.8584], [113.9941, 39.9902], [114.5215, 40.3418], [114.3457, 40.3857], [114.2578, 40.6055], [114.082, 40.7373], [113.9063, 41.1328], [113.9941, 41.2207], [113.9063, 41.4404], [114.2578, 41.5723], [114.1699, 41.792], [114.5215, 42.1436], [114.873, 42.0996], [114.9609, 41.6162], [115.2246, 41.5723], [115.9277, 41.9238], [116.0156, 41.792], [116.2793, 42.0117], [116.8066, 42.0117], [116.8945, 42.4072], [117.334, 42.4512], [117.5098, 42.583], [117.7734, 42.627], [118.0371, 42.4072], [117.9492, 42.2314], [118.125, 42.0557], [118.3008, 42.0996], [118.3008, 41.792], [118.125, 41.748], [118.3887, 41.3086], [119.2676, 41.3086], [118.8281, 40.8252], [119.2676, 40.5176], [119.5313, 40.5615], [119.707, 40.1221], [119.8828, 39.9463], [119.5313, 39.6826], [119.4434, 39.4189], [118.916, 39.0674], [118.4766, 38.9355], [118.125, 39.0234], [118.0371, 39.1992], [118.0371, 39.2432], [117.8613, 39.4189], [117.9492, 39.5947], [117.6855, 39.5947], [117.5098, 39.7705], [117.5098, 39.9902], [117.6855, 39.9902], [117.6855, 40.0781], [117.4219, 40.21], [117.2461, 40.5176], [117.4219, 40.6494], [116.9824, 40.6934], [116.6309, 41.0449], [116.3672, 40.9131], [116.4551, 40.7813], [116.1914, 40.7813], [116.1035, 40.6055], [115.752, 40.5615], [115.9277, 40.2539], [115.4004, 39.9463], [115.4883, 39.6387], [115.752, 39.5068], [116.1914, 39.5947], [116.3672, 39.4629], [116.543, 39.5947], [116.8066, 39.5947], [116.8945, 39.1113], [116.7188, 38.9355], [116.7188, 38.8037], [117.2461, 38.54], [117.5977, 38.6279], [117.9492, 38.3203], [117.4219, 37.8369], [116.8066, 37.8369], [116.4551, 37.4854], [116.2793, 37.5732], [116.2793, 37.3535], [116.0156, 37.3535], [115.752, 36.9141], [115.3125, 36.5186], [115.4883, 36.167], [115.3125, 36.0791], [115.1367, 36.2109], [114.9609, 36.0791], [114.873, 36.123], [113.7305, 36.3428], [113.4668, 36.6504], [113.7305, 36.8701], [113.7305, 37.1338], [114.1699, 37.6611], [113.9941, 37.7051], [113.8184, 38.1445], [113.5547, 38.2764], [113.5547, 38.54], [113.8184, 38.8037], [113.8184, 38.9355], [113.9063, 39.0234], [114.3457, 39.0674], [114.5215, 39.5068]]], [[[117.2461, 40.0781], [117.1582, 39.8145], [117.1582, 39.6387], [116.8945, 39.6826], [116.8945, 39.8145], [116.8066, 39.9902], [117.2461, 40.0781]]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '42',
      size: '1500',
      name: '湖北省',
      cp: [112.2363, 31.1572],
      childNum: 17
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[110.2148, 31.1572], [110.127, 31.377], [109.6875, 31.5527], [109.7754, 31.6846], [109.5996, 31.7285], [109.5117, 32.4316], [109.6875, 32.6074], [110.127, 32.6074], [110.127, 32.7393], [109.7754, 32.915], [109.7754, 33.0469], [109.4238, 33.1348], [109.5996, 33.2666], [110.3027, 33.1787], [110.5664, 33.2666], [110.7422, 33.1348], [111.0059, 33.2666], [111.5332, 32.6074], [112.3242, 32.3438], [113.2031, 32.4316], [113.4668, 32.2998], [113.7305, 32.4316], [113.8184, 31.8604], [113.9941, 31.7725], [114.1699, 31.8604], [114.5215, 31.7725], [114.6094, 31.5527], [114.7852, 31.4648], [115.1367, 31.5967], [115.2246, 31.4209], [115.4004, 31.4209], [115.5762, 31.2012], [116.0156, 31.0254], [115.752, 30.6738], [116.1035, 30.1904], [116.1035, 29.8389], [115.9277, 29.707], [115.4883, 29.7949], [114.873, 29.3994], [114.2578, 29.3555], [113.9063, 29.0479], [113.7305, 29.0918], [113.6426, 29.3115], [113.7305, 29.5752], [113.5547, 29.707], [113.5547, 29.8389], [113.0273, 29.4434], [112.9395, 29.4873], [113.0273, 29.751], [112.9395, 29.7949], [112.6758, 29.5752], [112.5, 29.6191], [112.2363, 29.5313], [111.7969, 29.9268], [110.8301, 30.1465], [110.4785, 30.0146], [110.6543, 29.751], [110.4785, 29.6631], [109.7754, 29.751], [109.6875, 29.6191], [109.5117, 29.6191], [109.248, 29.1357], [109.0723, 29.3555], [108.9844, 29.3115], [108.6328, 29.8389], [108.457, 29.7949], [108.5449, 30.2344], [108.457, 30.4102], [108.6328, 30.5859], [108.8086, 30.498], [109.0723, 30.6299], [109.1602, 30.542], [109.248, 30.6299], [109.4238, 30.542], [109.8633, 30.8936], [110.0391, 30.8057], [110.2148, 31.1572]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '52',
      size: '2000',
      name: '贵州省',
      cp: [106.6113, 26.9385],
      childNum: 9
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[104.1504, 27.2461], [104.4141, 27.4658], [104.5898, 27.334], [105.2051, 27.3779], [105.293, 27.7295], [105.5566, 27.7734], [105.6445, 27.6416], [106.3477, 27.8174], [106.1719, 28.125], [105.9082, 28.125], [105.6445, 28.4326], [105.9961, 28.7402], [106.3477, 28.5205], [106.5234, 28.5645], [106.4355, 28.7842], [106.5234, 28.7842], [106.6113, 28.6523], [106.6113, 28.5205], [106.6992, 28.4766], [106.875, 28.7842], [107.4023, 28.8721], [107.4023, 29.1797], [107.5781, 29.2236], [107.8418, 29.1357], [107.8418, 29.0039], [108.2813, 29.0918], [108.3691, 28.6523], [108.5449, 28.6523], [108.5449, 28.3887], [108.7207, 28.4766], [108.7207, 28.2129], [109.0723, 28.2129], [109.248, 28.4766], [109.3359, 28.2568], [109.3359, 27.9053], [109.4238, 27.5977], [108.8086, 27.1143], [108.8965, 27.0264], [109.3359, 27.1582], [109.5117, 27.0264], [109.5117, 26.8066], [109.3359, 26.7188], [109.4238, 26.5869], [109.248, 26.3232], [109.4238, 26.2793], [109.5117, 26.0156], [109.3359, 25.708], [108.9844, 25.752], [109.0723, 25.5322], [108.6328, 25.5762], [108.6328, 25.3125], [108.3691, 25.5322], [108.1934, 25.4443], [108.1055, 25.2246], [107.8418, 25.1367], [107.7539, 25.2246], [107.4902, 25.2246], [107.2266, 25.6201], [106.9629, 25.4883], [107.0508, 25.2686], [106.875, 25.1807], [106.1719, 24.9609], [106.1719, 24.7852], [105.9961, 24.6533], [105.2051, 24.9609], [104.6777, 24.6094], [104.502, 24.7412], [104.6777, 24.9609], [104.5898, 25.0488], [104.8535, 25.2246], [104.3262, 25.708], [104.6777, 26.4111], [104.4141, 26.6748], [103.8867, 26.543], [103.7109, 26.7627], [103.7109, 26.9824], [103.623, 27.0264], [103.8867, 27.4219], [104.1504, 27.2461]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '37',
      size: '1500',
      name: '山东省',
      cp: [118.7402, 36.4307],
      childNum: 17
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[115.4883, 36.167], [115.3125, 36.5186], [115.752, 36.9141], [116.0156, 37.3535], [116.2793, 37.3535], [116.2793, 37.5732], [116.4551, 37.4854], [116.8066, 37.8369], [117.4219, 37.8369], [117.9492, 38.3203], [118.125, 38.1445], [118.916, 38.1445], [119.3555, 37.6611], [119.0039, 37.5293], [119.0039, 37.3535], [119.3555, 37.1338], [119.707, 37.1338], [119.8828, 37.3975], [120.498, 37.8369], [120.5859, 38.1445], [120.9375, 38.4521], [121.0254, 37.8369], [121.2012, 37.6611], [121.9043, 37.4854], [122.168, 37.6172], [122.2559, 37.4854], [122.6074, 37.4854], [122.6953, 37.3535], [122.6074, 36.9141], [122.4316, 36.7822], [121.8164, 36.8701], [121.7285, 36.6943], [121.1133, 36.6064], [121.1133, 36.4307], [121.377, 36.2549], [120.7617, 36.167], [120.9375, 35.8594], [120.6738, 36.0352], [119.707, 35.4639], [119.9707, 34.9805], [119.3555, 35.0244], [119.2676, 35.1123], [118.916, 35.0244], [118.7402, 34.7168], [118.4766, 34.6729], [118.3887, 34.4092], [118.2129, 34.4092], [118.125, 34.6289], [117.9492, 34.6729], [117.5977, 34.4531], [117.334, 34.585], [117.2461, 34.4531], [116.8066, 34.9365], [116.4551, 34.8926], [116.3672, 34.6289], [116.1914, 34.585], [115.5762, 34.585], [115.4004, 34.8486], [114.7852, 35.0684], [115.0488, 35.376], [115.2246, 35.4199], [115.4883, 35.7275], [116.1035, 36.0791], [115.3125, 35.8154], [115.4883, 36.167]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '36',
      size: '1700',
      name: '江西省',
      cp: [116.0156, 27.29],
      childNum: 11
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[114.2578, 28.3447], [114.082, 28.5645], [114.1699, 28.8281], [113.9063, 29.0479], [114.2578, 29.3555], [114.873, 29.3994], [115.4883, 29.7949], [115.9277, 29.707], [116.1035, 29.8389], [116.2793, 29.7949], [116.7188, 30.0586], [116.8945, 29.9268], [116.7188, 29.751], [116.7188, 29.6191], [117.1582, 29.707], [117.0703, 29.8389], [117.1582, 29.9268], [117.5098, 29.6191], [118.0371, 29.5752], [118.2129, 29.3994], [118.0371, 29.1797], [118.0371, 29.0479], [118.3887, 28.7842], [118.4766, 28.3447], [118.4766, 28.3008], [118.3008, 28.0811], [117.7734, 27.8174], [117.5098, 27.9932], [116.9824, 27.6416], [117.1582, 27.29], [117.0703, 27.1143], [116.543, 26.8066], [116.6309, 26.4551], [116.3672, 26.2354], [116.4551, 26.1035], [116.1914, 25.8838], [116.0156, 25.2686], [115.8398, 25.2246], [115.9277, 24.917], [115.752, 24.7852], [115.8398, 24.5654], [115.4004, 24.7852], [114.4336, 24.5215], [114.1699, 24.6973], [114.4336, 24.9609], [114.6973, 25.1367], [114.7852, 25.2686], [114.6094, 25.4004], [113.9941, 25.2686], [113.9063, 25.4443], [113.9941, 26.0596], [114.2578, 26.1475], [113.9941, 26.1914], [114.082, 26.5869], [113.9063, 26.6309], [113.9063, 26.9385], [113.7305, 27.1143], [113.8184, 27.29], [113.6426, 27.3779], [113.6426, 27.5977], [113.7305, 27.9492], [114.2578, 28.3447]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '41',
      size: '1700',
      name: '河南省',
      cp: [113.0668, 33.8818],
      childNum: 17
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[110.3906, 34.585], [110.8301, 34.6289], [111.1816, 34.8047], [111.5332, 34.8486], [111.7969, 35.0684], [112.0605, 35.0684], [112.0605, 35.2881], [112.7637, 35.2002], [113.1152, 35.332], [113.6426, 35.6836], [113.7305, 36.3428], [114.873, 36.123], [114.9609, 36.0791], [115.1367, 36.2109], [115.3125, 36.0791], [115.4883, 36.167], [115.3125, 35.8154], [116.1035, 36.0791], [115.4883, 35.7275], [115.2246, 35.4199], [115.0488, 35.376], [114.7852, 35.0684], [115.4004, 34.8486], [115.5762, 34.585], [116.1914, 34.585], [116.1914, 34.4092], [116.543, 34.2773], [116.6309, 33.9258], [116.1914, 33.7061], [116.0156, 33.9697], [115.6641, 34.0576], [115.5762, 33.9258], [115.5762, 33.6621], [115.4004, 33.5303], [115.3125, 33.1787], [114.873, 33.1348], [114.873, 33.0029], [115.1367, 32.8711], [115.2246, 32.6074], [115.5762, 32.4316], [115.8398, 32.5195], [115.9277, 31.7725], [115.4883, 31.6846], [115.4004, 31.4209], [115.2246, 31.4209], [115.1367, 31.5967], [114.7852, 31.4648], [114.6094, 31.5527], [114.5215, 31.7725], [114.1699, 31.8604], [113.9941, 31.7725], [113.8184, 31.8604], [113.7305, 32.4316], [113.4668, 32.2998], [113.2031, 32.4316], [112.3242, 32.3438], [111.5332, 32.6074], [111.0059, 33.2666], [111.0059, 33.5303], [110.6543, 33.8379], [110.6543, 34.1455], [110.4785, 34.2334], [110.3906, 34.585]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '21',
      size: '1500',
      name: '辽宁省',
      cp: [122.0438, 41.0889],
      childNum: 14
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[119.2676, 41.3086], [119.4434, 41.6162], [119.2676, 41.7041], [119.3555, 42.2754], [119.5313, 42.3633], [119.8828, 42.1875], [120.1465, 41.7041], [120.498, 42.0996], [121.4648, 42.4951], [121.7285, 42.4512], [121.9922, 42.7148], [122.3438, 42.6709], [122.3438, 42.8467], [122.7832, 42.7148], [123.1348, 42.8027], [123.3105, 42.9785], [123.5742, 43.0225], [123.6621, 43.374], [123.8379, 43.4619], [124.2773, 43.2422], [124.4531, 42.8467], [124.7168, 43.0664], [124.8926, 43.0664], [124.8926, 42.8027], [125.332, 42.1436], [125.4199, 42.0996], [125.332, 41.9678], [125.332, 41.6602], [125.7715, 41.2207], [125.5957, 40.9131], [125.6836, 40.8691], [124.541, 40.21], [124.1016, 39.6826], [123.3984, 39.6826], [123.1348, 39.4189], [123.1348, 39.0234], [122.0801, 39.0234], [121.5527, 38.7158], [121.1133, 38.6719], [120.9375, 38.9795], [121.377, 39.1992], [121.2012, 39.5508], [122.0801, 40.3857], [121.9922, 40.6934], [121.7285, 40.8252], [121.2012, 40.8252], [120.5859, 40.21], [119.8828, 39.9463], [119.707, 40.1221], [119.5313, 40.5615], [119.2676, 40.5176], [118.8281, 40.8252], [119.2676, 41.3086]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '14',
      size: '1450',
      name: '山西省',
      cp: [112.4121, 37.6611],
      childNum: 11
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[110.918, 38.7158], [111.1816, 39.2432], [111.0938, 39.375], [111.3574, 39.4189], [111.4453, 39.6387], [111.9727, 39.5947], [112.3242, 40.2539], [112.7637, 40.166], [113.2031, 40.3857], [113.5547, 40.3418], [113.8184, 40.5176], [114.082, 40.5176], [114.082, 40.7373], [114.2578, 40.6055], [114.3457, 40.3857], [114.5215, 40.3418], [113.9941, 39.9902], [114.3457, 39.8584], [114.5215, 39.5068], [114.3457, 39.0674], [113.9063, 39.0234], [113.8184, 38.9355], [113.8184, 38.8037], [113.5547, 38.54], [113.5547, 38.2764], [113.8184, 38.1445], [113.9941, 37.7051], [114.1699, 37.6611], [113.7305, 37.1338], [113.7305, 36.8701], [113.4668, 36.6504], [113.7305, 36.3428], [113.6426, 35.6836], [113.1152, 35.332], [112.7637, 35.2002], [112.0605, 35.2881], [112.0605, 35.0684], [111.7969, 35.0684], [111.5332, 34.8486], [111.1816, 34.8047], [110.8301, 34.6289], [110.3906, 34.585], [110.2148, 34.6729], [110.2148, 34.8926], [110.5664, 35.6396], [110.4785, 36.123], [110.3906, 37.002], [110.8301, 37.6611], [110.4785, 37.9688], [110.4785, 38.1885], [110.8301, 38.4961], [110.918, 38.7158]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '34',
      size: '1700',
      name: '安徽省',
      cp: [117.2461, 32.0361],
      childNum: 17
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[116.6309, 33.9258], [116.543, 34.2773], [116.1914, 34.4092], [116.1914, 34.585], [116.3672, 34.6289], [116.8945, 34.4092], [117.1582, 34.0576], [117.5977, 34.0137], [117.7734, 33.7061], [118.125, 33.75], [117.9492, 33.2227], [118.0371, 33.1348], [118.2129, 33.2227], [118.3008, 32.7832], [118.7402, 32.7393], [118.916, 32.959], [119.1797, 32.8271], [119.1797, 32.4756], [118.5645, 32.5635], [118.6523, 32.2119], [118.4766, 32.168], [118.3887, 31.9482], [118.916, 31.5527], [118.7402, 31.377], [118.8281, 31.2451], [119.3555, 31.2891], [119.4434, 31.1572], [119.6191, 31.1133], [119.6191, 31.0693], [119.4434, 30.6738], [119.2676, 30.6299], [119.3555, 30.4102], [118.916, 30.3223], [118.916, 29.9707], [118.7402, 29.707], [118.2129, 29.3994], [118.0371, 29.5752], [117.5098, 29.6191], [117.1582, 29.9268], [117.0703, 29.8389], [117.1582, 29.707], [116.7188, 29.6191], [116.7188, 29.751], [116.8945, 29.9268], [116.7188, 30.0586], [116.2793, 29.7949], [116.1035, 29.8389], [116.1035, 30.1904], [115.752, 30.6738], [116.0156, 31.0254], [115.5762, 31.2012], [115.4004, 31.4209], [115.4883, 31.6846], [115.9277, 31.7725], [115.8398, 32.5195], [115.5762, 32.4316], [115.2246, 32.6074], [115.1367, 32.8711], [114.873, 33.0029], [114.873, 33.1348], [115.3125, 33.1787], [115.4004, 33.5303], [115.5762, 33.6621], [115.5762, 33.9258], [115.6641, 34.0576], [116.0156, 33.9697], [116.1914, 33.7061], [116.6309, 33.9258]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '35',
      size: '2000',
      name: '福建省',
      cp: [118.3008, 25.9277],
      childNum: 9
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[118.4766, 28.3008], [118.8281, 28.2568], [118.7402, 28.0371], [118.916, 27.4658], [119.2676, 27.4219], [119.6191, 27.6855], [119.7949, 27.29], [120.2344, 27.4219], [120.4102, 27.1582], [120.7617, 27.0264], [120.6738, 26.8945], [120.2344, 26.8506], [120.2344, 26.7188], [120.4102, 26.6748], [120.498, 26.3672], [120.2344, 26.2793], [120.4102, 26.1475], [120.0586, 26.1914], [119.9707, 25.9277], [119.7949, 25.9277], [119.9707, 25.4004], [119.7949, 25.2686], [119.5313, 25.1367], [119.4434, 25.0049], [119.2676, 25.0928], [118.916, 24.8291], [118.6523, 24.5215], [118.4766, 24.5215], [118.4766, 24.4336], [118.2129, 24.3457], [118.2129, 24.1699], [117.8613, 23.9941], [117.7734, 23.7744], [117.5098, 23.5986], [117.1582, 23.5547], [116.9824, 23.9063], [116.9824, 24.1699], [116.7188, 24.6533], [116.543, 24.6094], [116.3672, 24.873], [116.2793, 24.7852], [115.9277, 24.917], [115.8398, 25.2246], [116.0156, 25.2686], [116.1914, 25.8838], [116.4551, 26.1035], [116.3672, 26.2354], [116.6309, 26.4551], [116.543, 26.8066], [117.0703, 27.1143], [117.1582, 27.29], [116.9824, 27.6416], [117.5098, 27.9932], [117.7734, 27.8174], [118.3008, 28.0811], [118.4766, 28.3008]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '33',
      size: '2100',
      name: '浙江省',
      cp: [120.498, 29.0918],
      childNum: 11
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[118.2129, 29.3994], [118.7402, 29.707], [118.916, 29.9707], [118.916, 30.3223], [119.3555, 30.4102], [119.2676, 30.6299], [119.4434, 30.6738], [119.6191, 31.0693], [119.6191, 31.1133], [119.9707, 31.1572], [120.498, 30.8057], [120.9375, 31.0254], [121.2891, 30.6738], [121.9922, 30.8057], [122.6953, 30.8936], [122.8711, 30.7178], [122.959, 30.1465], [122.6074, 30.1025], [122.6074, 29.9268], [122.168, 29.5313], [122.3438, 28.8721], [121.9922, 28.8721], [121.9922, 28.4326], [121.7285, 28.3447], [121.7285, 28.2129], [121.4648, 28.2129], [121.5527, 28.0371], [121.2891, 27.9492], [121.1133, 27.4219], [120.6738, 27.334], [120.6738, 27.1582], [120.9375, 27.0264], [120.7617, 27.0264], [120.4102, 27.1582], [120.2344, 27.4219], [119.7949, 27.29], [119.6191, 27.6855], [119.2676, 27.4219], [118.916, 27.4658], [118.7402, 28.0371], [118.8281, 28.2568], [118.4766, 28.3008], [118.4766, 28.3447], [118.3887, 28.7842], [118.0371, 29.0479], [118.0371, 29.1797], [118.2129, 29.3994]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '32',
      size: '1950',
      name: '江苏省',
      cp: [118.8586, 32.915],
      childNum: 13
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[116.3672, 34.6289], [116.4551, 34.8926], [116.8066, 34.9365], [117.2461, 34.4531], [117.334, 34.585], [117.5977, 34.4531], [117.9492, 34.6729], [118.125, 34.6289], [118.2129, 34.4092], [118.3887, 34.4092], [118.4766, 34.6729], [118.7402, 34.7168], [118.916, 35.0244], [119.2676, 35.1123], [119.3555, 35.0244], [119.3555, 34.8486], [119.707, 34.585], [120.3223, 34.3652], [120.9375, 33.0469], [121.0254, 32.6514], [121.377, 32.4756], [121.4648, 32.168], [121.9043, 31.9922], [121.9922, 31.6846], [121.9922, 31.5967], [121.2012, 31.8604], [121.1133, 31.7285], [121.377, 31.5088], [121.2012, 31.4648], [120.9375, 31.0254], [120.498, 30.8057], [119.9707, 31.1572], [119.6191, 31.1133], [119.4434, 31.1572], [119.3555, 31.2891], [118.8281, 31.2451], [118.7402, 31.377], [118.916, 31.5527], [118.3887, 31.9482], [118.4766, 32.168], [118.6523, 32.2119], [118.5645, 32.5635], [119.1797, 32.4756], [119.1797, 32.8271], [118.916, 32.959], [118.7402, 32.7393], [118.3008, 32.7832], [118.2129, 33.2227], [118.0371, 33.1348], [117.9492, 33.2227], [118.125, 33.75], [117.7734, 33.7061], [117.5977, 34.0137], [117.1582, 34.0576], [116.8945, 34.4092], [116.3672, 34.6289]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '50',
      size: '2380',
      name: '重庆市',
      cp: [107.7539, 30.1904],
      childNum: 40
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[108.5449, 31.6846], [108.2813, 31.9043], [108.3691, 32.168], [108.5449, 32.2119], [109.0723, 31.9482], [109.248, 31.7285], [109.5996, 31.7285], [109.7754, 31.6846], [109.6875, 31.5527], [110.127, 31.377], [110.2148, 31.1572], [110.0391, 30.8057], [109.8633, 30.8936], [109.4238, 30.542], [109.248, 30.6299], [109.1602, 30.542], [109.0723, 30.6299], [108.8086, 30.498], [108.6328, 30.5859], [108.457, 30.4102], [108.5449, 30.2344], [108.457, 29.7949], [108.6328, 29.8389], [108.9844, 29.3115], [109.0723, 29.3555], [109.248, 29.1357], [109.248, 28.4766], [109.0723, 28.2129], [108.7207, 28.2129], [108.7207, 28.4766], [108.5449, 28.3887], [108.5449, 28.6523], [108.3691, 28.6523], [108.2813, 29.0918], [107.8418, 29.0039], [107.8418, 29.1357], [107.5781, 29.2236], [107.4023, 29.1797], [107.4023, 28.8721], [106.875, 28.7842], [106.6992, 28.4766], [106.6113, 28.5205], [106.6113, 28.6523], [106.5234, 28.7842], [106.4355, 28.7842], [106.5234, 28.5645], [106.3477, 28.5205], [106.2598, 28.8721], [105.8203, 28.96], [105.7324, 29.2676], [105.4688, 29.3115], [105.293, 29.5313], [105.7324, 29.8828], [105.5566, 30.1025], [105.6445, 30.2783], [105.8203, 30.4541], [106.2598, 30.1904], [106.6113, 30.3223], [106.7871, 30.0146], [107.0508, 30.0146], [107.4902, 30.6299], [107.4023, 30.7617], [107.4902, 30.8496], [107.9297, 30.8496], [108.1934, 31.5088], [108.5449, 31.6846]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '64',
      size: '2100',
      name: '宁夏回族自治区',
      cp: [105.9961, 37.3096],
      childNum: 5
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[104.3262, 37.4414], [105.8203, 37.793], [105.9082, 38.7158], [106.3477, 39.2871], [106.7871, 39.375], [106.9629, 38.9795], [106.5234, 38.3203], [106.7871, 38.1885], [107.3145, 38.1006], [107.666, 37.8809], [107.3145, 37.6172], [107.3145, 37.0898], [106.6113, 37.0898], [106.6113, 36.7822], [106.4355, 36.5625], [106.5234, 36.4746], [106.5234, 36.2549], [106.875, 36.123], [106.9629, 35.8154], [106.6992, 35.6836], [106.4355, 35.6836], [106.5234, 35.332], [106.3477, 35.2441], [106.2598, 35.4199], [106.084, 35.376], [105.9961, 35.4199], [106.084, 35.4639], [105.9961, 35.4639], [105.8203, 35.5518], [105.7324, 35.7275], [105.3809, 35.7715], [105.293, 35.9912], [105.4688, 36.123], [105.2051, 36.6943], [105.293, 36.8262], [104.8535, 37.2217], [104.5898, 37.2217], [104.5898, 37.4414], [104.3262, 37.4414]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '46',
      size: '4500',
      name: '海南省',
      cp: [109.9512, 19.2041],
      childNum: 18
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[108.6328, 19.3799], [109.0723, 19.6436], [109.248, 19.9512], [109.5996, 20.0391], [110.0391, 20.127], [110.3906, 20.127], [110.5664, 20.2588], [110.6543, 20.2588], [111.0938, 19.9512], [111.2695, 19.9951], [110.6543, 19.1602], [110.5664, 18.6768], [110.2148, 18.5889], [110.0391, 18.3691], [109.8633, 18.3691], [109.6875, 18.1055], [108.9844, 18.2813], [108.6328, 18.457], [108.6328, 19.3799]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '71',
      size: '3000',
      name: '台湾省',
      cp: [120.0254, 23.5986],
      childNum: 1
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[121.9043, 25.0488], [121.9922, 25.0049], [121.8164, 24.7412], [121.9043, 24.5654], [121.6406, 24.0381], [121.377, 23.1152], [121.0254, 22.6758], [120.8496, 22.0605], [120.7617, 21.9287], [120.6738, 22.3242], [120.2344, 22.5879], [120.0586, 23.0713], [120.1465, 23.6865], [121.0254, 25.0488], [121.5527, 25.3125], [121.9043, 25.0488]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '11',
      size: '5000',
      name: '北京市',
      cp: [116.4551, 40.2539],
      childNum: 19
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[117.4219, 40.21], [117.334, 40.1221], [117.2461, 40.0781], [116.8066, 39.9902], [116.8945, 39.8145], [116.8945, 39.6826], [116.8066, 39.5947], [116.543, 39.5947], [116.3672, 39.4629], [116.1914, 39.5947], [115.752, 39.5068], [115.4883, 39.6387], [115.4004, 39.9463], [115.9277, 40.2539], [115.752, 40.5615], [116.1035, 40.6055], [116.1914, 40.7813], [116.4551, 40.7813], [116.3672, 40.9131], [116.6309, 41.0449], [116.9824, 40.6934], [117.4219, 40.6494], [117.2461, 40.5176], [117.4219, 40.21]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '12',
      size: '5000',
      name: '天津市',
      cp: [117.4219, 39.4189],
      childNum: 18
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[116.8066, 39.5947], [116.8945, 39.6826], [117.1582, 39.6387], [117.1582, 39.8145], [117.2461, 40.0781], [117.334, 40.1221], [117.4219, 40.21], [117.6855, 40.0781], [117.6855, 39.9902], [117.5098, 39.9902], [117.5098, 39.7705], [117.6855, 39.5947], [117.9492, 39.5947], [117.8613, 39.4189], [118.0371, 39.2432], [118.0371, 39.1992], [117.8613, 39.1113], [117.5977, 38.6279], [117.2461, 38.54], [116.7188, 38.8037], [116.7188, 38.9355], [116.8945, 39.1113], [116.8066, 39.5947]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '31',
      size: '7500',
      name: '上海市',
      cp: [121.4648, 31.2891],
      childNum: 19
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[120.9375, 31.0254], [121.2012, 31.4648], [121.377, 31.5088], [121.1133, 31.7285], [121.2012, 31.8604], [121.9922, 31.5967], [121.9043, 31.1572], [121.9922, 30.8057], [121.2891, 30.6738], [120.9375, 31.0254]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '81',
      size: '18000',
      name: '香港特别行政区',
      cp: [114.1178, 22.3242],
      childNum: 1
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[114.6094, 22.4121], [114.5215, 22.1484], [114.3457, 22.1484], [113.9063, 22.1484], [113.8184, 22.1924], [113.9063, 22.4121], [114.1699, 22.5439], [114.3457, 22.5439], [114.4336, 22.5439], [114.4336, 22.4121], [114.6094, 22.4121]]]
    }
  }, {
    type: 'Feature',
    properties: {
      id: '82',
      size: '27',
      name: '澳门特别行政区',
      cp: [111.5547, 22.1484],
      childNum: 1
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[113.5986, 22.1649], [113.6096, 22.1265], [113.5547, 22.11], [113.5437, 22.2034], [113.5767, 22.2034], [113.5986, 22.1649]]]
    }
  }]
};


/***/ }),

/***/ "./src/utils/const.js":
/*!****************************!*\
  !*** ./src/utils/const.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CHINESE_LOCATION_INFO_MESSAGE_FIRST": () => (/* binding */ CHINESE_LOCATION_INFO_MESSAGE_FIRST),
/* harmony export */   "CHINESE_LOCATION_INFO_MESSAGE_SECOND": () => (/* binding */ CHINESE_LOCATION_INFO_MESSAGE_SECOND),
/* harmony export */   "INFO_MESSAGE": () => (/* binding */ INFO_MESSAGE),
/* harmony export */   "IS_CHINESE": () => (/* binding */ IS_CHINESE),
/* harmony export */   "LINE_OPACITY": () => (/* binding */ LINE_OPACITY),
/* harmony export */   "MAIN_COLOR": () => (/* binding */ MAIN_COLOR),
/* harmony export */   "MAPBOX_TOKEN": () => (/* binding */ MAPBOX_TOKEN),
/* harmony export */   "MAP_HEIGHT": () => (/* binding */ MAP_HEIGHT),
/* harmony export */   "MUNICIPALITY_CITIES_ARR": () => (/* binding */ MUNICIPALITY_CITIES_ARR),
/* harmony export */   "NEED_FIX_MAP": () => (/* binding */ NEED_FIX_MAP),
/* harmony export */   "PROVINCE_FILL_COLOR": () => (/* binding */ PROVINCE_FILL_COLOR),
/* harmony export */   "RUN_TITLES": () => (/* binding */ RUN_TITLES),
/* harmony export */   "USE_ANIMATION_FOR_GRID": () => (/* binding */ USE_ANIMATION_FOR_GRID),
/* harmony export */   "USE_DASH_LINE": () => (/* binding */ USE_DASH_LINE)
/* harmony export */ });
// const
const MAPBOX_TOKEN = 'pk.eyJ1IjoieWlob25nMDYxOCIsImEiOiJja2J3M28xbG4wYzl0MzJxZm0ya2Fua2p2In0.PNKfkeQwYuyGOTT_x9BJ4Q';
const MUNICIPALITY_CITIES_ARR = ['北京市', '上海市', '天津市', '重庆市', '香港特别行政区', '澳门特别行政区'];

// styling: set to `true` if you want dash-line route
const USE_DASH_LINE = true;
// styling: route line opacity: [0, 1]
const LINE_OPACITY = 0.8;
// styling: map height
const MAP_HEIGHT = 600;

// IF you outside China please make sure IS_CHINESE = false
const IS_CHINESE = true;
const USE_ANIMATION_FOR_GRID = false;
const CHINESE_INFO_MESSAGE = (yearLength, year) => {
  const yearStr = year === 'Total' ? '所有' : ` ${year} `;
  return `我用 App 记录自己徒步 ${yearLength} 年了，下面列表展示的是${yearStr}的数据`;
};
const ENGLISH_INFO_MESSAGE = (yearLength, year) => `Running Journey with ${yearLength} Years, the table shows year ${year} data`;

// not support English for now
const CHINESE_LOCATION_INFO_MESSAGE_FIRST = '我走过了一些地方，希望随着时间推移，地图点亮的地方越来越多';
const CHINESE_LOCATION_INFO_MESSAGE_SECOND = '不要停下来，不要停下攀登的脚步';
const INFO_MESSAGE = IS_CHINESE ? CHINESE_INFO_MESSAGE : ENGLISH_INFO_MESSAGE;
const FULL_MARATHON_RUN_TITLE = IS_CHINESE ? '全程马拉松徒步' : 'Full Marathon';
const HALF_MARATHON_RUN_TITLE = IS_CHINESE ? '半程马拉松徒步' : 'Half Marathon';
const MORNING_RUN_TITLE = IS_CHINESE ? '清晨徒步' : 'Morning Run';
const MIDDAY_RUN_TITLE = IS_CHINESE ? '午间徒步' : 'Midday Run';
const AFTERNOON_RUN_TITLE = IS_CHINESE ? '午后徒步' : 'Afternoon Run';
const EVENING_RUN_TITLE = IS_CHINESE ? '傍晚徒步' : 'Evening Run';
const NIGHT_RUN_TITLE = IS_CHINESE ? '夜晚徒步' : 'Night Run';
const RUN_TITLES = {
  FULL_MARATHON_RUN_TITLE,
  HALF_MARATHON_RUN_TITLE,
  MORNING_RUN_TITLE,
  MIDDAY_RUN_TITLE,
  AFTERNOON_RUN_TITLE,
  EVENING_RUN_TITLE,
  NIGHT_RUN_TITLE
};

const nike = 'rgb(224,237,94)'; // if you want change the main color change here src/styles/variables.scss

// If your map has an offset please change this line
// issues #92 and #198
const NEED_FIX_MAP = false;
const MAIN_COLOR = nike;
const PROVINCE_FILL_COLOR = '#47b8e0';

/***/ }),

/***/ "./src/utils/utils.js":
/*!****************************!*\
  !*** ./src/utils/utils.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "filterAndSortRuns": () => (/* binding */ filterAndSortRuns),
/* harmony export */   "filterCityRuns": () => (/* binding */ filterCityRuns),
/* harmony export */   "filterTitleRuns": () => (/* binding */ filterTitleRuns),
/* harmony export */   "filterYearRuns": () => (/* binding */ filterYearRuns),
/* harmony export */   "formatPace": () => (/* binding */ formatPace),
/* harmony export */   "formatRunTime": () => (/* binding */ formatRunTime),
/* harmony export */   "geoJsonForMap": () => (/* binding */ geoJsonForMap),
/* harmony export */   "geoJsonForRuns": () => (/* binding */ geoJsonForRuns),
/* harmony export */   "getBoundsForGeoData": () => (/* binding */ getBoundsForGeoData),
/* harmony export */   "intComma": () => (/* binding */ intComma),
/* harmony export */   "locationForRun": () => (/* binding */ locationForRun),
/* harmony export */   "pathForRun": () => (/* binding */ pathForRun),
/* harmony export */   "scrollToMap": () => (/* binding */ scrollToMap),
/* harmony export */   "sortDateFunc": () => (/* binding */ sortDateFunc),
/* harmony export */   "sortDateFuncReverse": () => (/* binding */ sortDateFuncReverse),
/* harmony export */   "titleForRun": () => (/* binding */ titleForRun),
/* harmony export */   "titleForShow": () => (/* binding */ titleForShow)
/* harmony export */ });
/* harmony import */ var _mapbox_polyline__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @mapbox/polyline */ "./node_modules/@mapbox/polyline/src/polyline.js");
/* harmony import */ var _mapbox_polyline__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_mapbox_polyline__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var gcoord__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! gcoord */ "./node_modules/gcoord/dist/gcoord.esm.js");
/* harmony import */ var react_map_gl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-map-gl */ "./node_modules/react-map-gl/dist/esm/index.js");
/* harmony import */ var _static_run_countries__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../static/run_countries */ "./src/static/run_countries.js");
/* harmony import */ var _static_city__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../static/city */ "./src/static/city.js");
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./const */ "./src/utils/const.js");






const titleForShow = run => {
  const date = run.start_date_local.slice(0, 11);
  const distance = (run.distance / 1000.0).toFixed(1);
  let name = 'Run';
  if (run.name.slice(0, 7) === 'Running') {
    name = 'run';
  }
  if (run.name) {
    name = run.name;
  }
  return `${name} ${date} ${distance} KM ${!run.summary_polyline ? '(No map data for this run)' : ''}`;
};
const formatPace = d => {
  if (Number.isNaN(d)) return '0';
  const pace = 1000.0 / 60.0 * (1.0 / d);
  const minutes = Math.floor(pace);
  const seconds = Math.floor((pace - minutes) * 60.0);
  return `${minutes}'${seconds.toFixed(0).toString().padStart(2, '0')}"`;
};
const formatRunTime = (distance, pace) => {
  if (Number.isNaN(distance) || Number.isNaN(pace)) {
    return '0min';
  }
  const formatPace = 1000.0 / 60.0 * (1.0 / pace);
  const minutes = Math.floor(formatPace * distance);
  if (minutes === 0) {
    const seconds = Math.floor((formatPace * distance - minutes) * 60.0);
    return seconds + 's';
  }
  return minutes + 'min';
};

// for scroll to the map
const scrollToMap = () => {
  const el = document.querySelector('.fl.w-100.w-70-l');
  const rect = el.getBoundingClientRect();
  window.scroll(rect.left + window.scrollX, rect.top + window.scrollY);
};
const cities = _static_city__WEBPACK_IMPORTED_MODULE_3__.chinaCities.map(c => c.name);
// what about oversea?
const locationForRun = run => {
  let location = run.location_country;
  let [city, province, country] = ['', '', ''];
  if (location) {
    // Only for Chinese now
    // should fiter 臺灣
    if (location.indexOf('臺灣') > -1) {
      const taiwan = '台湾';
      location = location.replace('臺灣', taiwan);
      const _locArr = location.split(',').map(item => item.trim());
      const _locArrLen = _locArr.length;
      // directly repalce last item with 中国
      _locArr[_locArrLen - 1] = '中国';
      // if location not contain '台湾省', insert it before zip code(posistion is _locArrLen-2)
      if (_locArr.indexOf(`${taiwan}省`) === -1) {
        _locArr.splice(_locArrLen - 2, 0, `${taiwan}省`);
      }
      location = _locArr.join(',');
    }
    const cityMatch = location.match(/[\u4e00-\u9fa5]{2,}(市|自治州)/);
    const provinceMatch = location.match(/[\u4e00-\u9fa5]{2,}(省|自治区)/);
    if (cityMatch) {
      [city] = cityMatch;
      if (!cities.includes(city)) {
        city = '';
      }
    }
    if (provinceMatch) {
      [province] = provinceMatch;
    }
    const l = location.split(',');
    // or to handle keep location format
    let countryMatch = l[l.length - 1].match(/[\u4e00-\u9fa5].*[\u4e00-\u9fa5]/);
    if (!countryMatch && l.length >= 3) {
      countryMatch = l[2].match(/[\u4e00-\u9fa5].*[\u4e00-\u9fa5]/);
    }
    if (countryMatch) {
      [country] = countryMatch;
    }
  }
  if (_const__WEBPACK_IMPORTED_MODULE_4__.MUNICIPALITY_CITIES_ARR.includes(city)) {
    province = city;
  }
  return {
    country,
    province,
    city
  };
};
const intComma = (x = '') => {
  if (x.toString().length <= 5) {
    return x;
  }
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
const pathForRun = run => {
  try {
    const c = _mapbox_polyline__WEBPACK_IMPORTED_MODULE_0__.decode(run.summary_polyline);
    // reverse lat long for mapbox
    c.forEach(arr => {
      [arr[0], arr[1]] = !_const__WEBPACK_IMPORTED_MODULE_4__.NEED_FIX_MAP ? [arr[1], arr[0]] : gcoord__WEBPACK_IMPORTED_MODULE_5__["default"].transform([arr[1], arr[0]], gcoord__WEBPACK_IMPORTED_MODULE_5__["default"].GCJ02, gcoord__WEBPACK_IMPORTED_MODULE_5__["default"].WGS84);
    });
    return c;
  } catch (err) {
    return [];
  }
};
const geoJsonForRuns = runs => ({
  type: 'FeatureCollection',
  features: runs.map(run => {
    const points = pathForRun(run);
    if (!points) {
      return null;
    }
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: points
      }
    };
  })
});
const geoJsonForMap = () => _static_run_countries__WEBPACK_IMPORTED_MODULE_2__.chinaGeojson;
const titleForRun = run => {
  const runDistance = run.distance / 1000;
  const runHour = +run.start_date_local.slice(11, 13);
  if (runDistance > 20 && runDistance < 40) {
    return _const__WEBPACK_IMPORTED_MODULE_4__.RUN_TITLES.HALF_MARATHON_RUN_TITLE;
  }
  if (runDistance >= 40) {
    return _const__WEBPACK_IMPORTED_MODULE_4__.RUN_TITLES.FULL_MARATHON_RUN_TITLE;
  }
  if (runHour >= 0 && runHour <= 10) {
    return _const__WEBPACK_IMPORTED_MODULE_4__.RUN_TITLES.MORNING_RUN_TITLE;
  }
  if (runHour > 10 && runHour <= 14) {
    return _const__WEBPACK_IMPORTED_MODULE_4__.RUN_TITLES.MIDDAY_RUN_TITLE;
  }
  if (runHour > 14 && runHour <= 18) {
    return _const__WEBPACK_IMPORTED_MODULE_4__.RUN_TITLES.AFTERNOON_RUN_TITLE;
  }
  if (runHour > 18 && runHour <= 21) {
    return _const__WEBPACK_IMPORTED_MODULE_4__.RUN_TITLES.EVENING_RUN_TITLE;
  }
  return _const__WEBPACK_IMPORTED_MODULE_4__.RUN_TITLES.NIGHT_RUN_TITLE;
};
const applyToArray = (func, array) => func.apply(Math, array);
const getBoundsForGeoData = geoData => {
  const {
    features
  } = geoData;
  let points;
  // find first have data
  for (const f of features) {
    if (f.geometry.coordinates.length) {
      points = f.geometry.coordinates;
      break;
    }
  }
  if (!points) {
    return {};
  }
  // Calculate corner values of bounds
  const pointsLong = points.map(point => point[0]);
  const pointsLat = points.map(point => point[1]);
  const cornersLongLat = [[applyToArray(Math.min, pointsLong), applyToArray(Math.min, pointsLat)], [applyToArray(Math.max, pointsLong), applyToArray(Math.max, pointsLat)]];
  const viewport = new react_map_gl__WEBPACK_IMPORTED_MODULE_1__.WebMercatorViewport({
    width: 800,
    height: 600
  }).fitBounds(cornersLongLat, {
    padding: 200
  });
  let {
    longitude,
    latitude,
    zoom
  } = viewport;
  if (features.length > 1) {
    zoom = 11.5;
  }
  return {
    longitude,
    latitude,
    zoom
  };
};
const filterYearRuns = (run, year) => {
  if (run && run.start_date_local) {
    return run.start_date_local.slice(0, 4) === year;
  }
  return false;
};
const filterCityRuns = (run, city) => {
  if (run && run.location_country) {
    return run.location_country.includes(city);
  }
  return false;
};
const filterTitleRuns = (run, title) => titleForRun(run) === title;
const filterAndSortRuns = (activities, item, filterFunc, sortFunc) => {
  let s = activities;
  if (item !== 'Total') {
    s = activities.filter(run => filterFunc(run, item));
  }
  return s.sort(sortFunc);
};
const sortDateFunc = (a, b) => new Date(b.start_date_local.replace(' ', 'T')) - new Date(a.start_date_local.replace(' ', 'T'));
const sortDateFuncReverse = (a, b) => sortDateFunc(b, a);


/***/ }),

/***/ "./node_modules/gcoord/dist/gcoord.esm.js":
/*!************************************************!*\
  !*** ./node_modules/gcoord/dist/gcoord.esm.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* @preserve
 * gcoord 0.3.2, geographic coordinate library
 * Copyright (c) 2021 Jiulong Hu <me@hujiulong.com>
 */

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var sin$1 = Math.sin, cos$1 = Math.cos, sqrt$1 = Math.sqrt, abs$1 = Math.abs, PI$1 = Math.PI;
var a = 6378245;
var ee = 0.006693421622965823;
// roughly check whether coordinates are in China.
function isInChinaBbox(lon, lat) {
    return lon >= 72.004 && lon <= 137.8347 && lat >= 0.8293 && lat <= 55.8271;
}
function transformLat(x, y) {
    var ret = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * sqrt$1(abs$1(x));
    ret += ((20 * sin$1(6 * x * PI$1) + 20 * sin$1(2 * x * PI$1)) * 2) / 3;
    ret += ((20 * sin$1(y * PI$1) + 40 * sin$1((y / 3) * PI$1)) * 2) / 3;
    ret += ((160 * sin$1((y / 12) * PI$1) + 320 * sin$1((y * PI$1) / 30)) * 2) / 3;
    return ret;
}
function transformLon(x, y) {
    var ret = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * sqrt$1(abs$1(x));
    ret += ((20 * sin$1(6 * x * PI$1) + 20 * sin$1(2 * x * PI$1)) * 2) / 3;
    ret += ((20 * sin$1(x * PI$1) + 40 * sin$1((x / 3) * PI$1)) * 2) / 3;
    ret += ((150 * sin$1((x / 12) * PI$1) + 300 * sin$1((x / 30) * PI$1)) * 2) / 3;
    return ret;
}
function delta(lon, lat) {
    var dLon = transformLon(lon - 105, lat - 35);
    var dLat = transformLat(lon - 105, lat - 35);
    var radLat = (lat / 180) * PI$1;
    var magic = sin$1(radLat);
    magic = 1 - ee * magic * magic;
    var sqrtMagic = sqrt$1(magic);
    dLon = (dLon * 180) / ((a / sqrtMagic) * cos$1(radLat) * PI$1);
    dLat = (dLat * 180) / (((a * (1 - ee)) / (magic * sqrtMagic)) * PI$1);
    return [dLon, dLat];
}
function WGS84ToGCJ02(coord) {
    var lon = coord[0], lat = coord[1];
    if (!isInChinaBbox(lon, lat))
        return [lon, lat];
    var d = delta(lon, lat);
    return [lon + d[0], lat + d[1]];
}
function GCJ02ToWGS84(coord) {
    var lon = coord[0], lat = coord[1];
    if (!isInChinaBbox(lon, lat))
        return [lon, lat];
    var _a = [lon, lat], wgsLon = _a[0], wgsLat = _a[1];
    var tempPoint = WGS84ToGCJ02([wgsLon, wgsLat]);
    var dx = tempPoint[0] - lon;
    var dy = tempPoint[1] - lat;
    while (abs$1(dx) > 1e-6 || abs$1(dy) > 1e-6) {
        wgsLon -= dx;
        wgsLat -= dy;
        tempPoint = WGS84ToGCJ02([wgsLon, wgsLat]);
        dx = tempPoint[0] - lon;
        dy = tempPoint[1] - lat;
    }
    return [wgsLon, wgsLat];
}

var sin = Math.sin, cos = Math.cos, atan2 = Math.atan2, sqrt = Math.sqrt, PI = Math.PI;
var baiduFactor = (PI * 3000.0) / 180.0;
function BD09ToGCJ02(coord) {
    var lon = coord[0], lat = coord[1];
    var x = lon - 0.0065;
    var y = lat - 0.006;
    var z = sqrt(x * x + y * y) - 0.00002 * sin(y * baiduFactor);
    var theta = atan2(y, x) - 0.000003 * cos(x * baiduFactor);
    var newLon = z * cos(theta);
    var newLat = z * sin(theta);
    return [newLon, newLat];
}
function GCJ02ToBD09(coord) {
    var lon = coord[0], lat = coord[1];
    var x = lon;
    var y = lat;
    var z = sqrt(x * x + y * y) + 0.00002 * sin(y * baiduFactor);
    var theta = atan2(y, x) + 0.000003 * cos(x * baiduFactor);
    var newLon = z * cos(theta) + 0.0065;
    var newLat = z * sin(theta) + 0.006;
    return [newLon, newLat];
}

// https://github.com/Turfjs/turf/blob/master/packages/turf-projection/index.ts
var R2D = 180 / Math.PI;
var D2R = Math.PI / 180;
var A = 6378137.0;
var MAXEXTENT = 20037508.342789244;
function ESPG3857ToWGS84(xy) {
    return [
        (xy[0] * R2D) / A,
        (Math.PI * 0.5 - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D,
    ];
}
function WGS84ToEPSG3857(lonLat) {
    // compensate longitudes passing the 180th meridian
    // from https://github.com/proj4js/proj4js/blob/master/lib/common/adjust_lon.js
    var adjusted = Math.abs(lonLat[0]) <= 180
        ? lonLat[0]
        : lonLat[0] - (lonLat[0] < 0 ? -1 : 1) * 360;
    var xy = [
        A * adjusted * D2R,
        A * Math.log(Math.tan(Math.PI * 0.25 + 0.5 * lonLat[1] * D2R)),
    ];
    // if xy value is beyond maxextent (e.g. poles), return maxextent
    if (xy[0] > MAXEXTENT)
        xy[0] = MAXEXTENT;
    if (xy[0] < -MAXEXTENT)
        xy[0] = -MAXEXTENT;
    if (xy[1] > MAXEXTENT)
        xy[1] = MAXEXTENT;
    if (xy[1] < -MAXEXTENT)
        xy[1] = -MAXEXTENT;
    return xy;
}

var abs = Math.abs;
var MCBAND = [12890594.86, 8362377.87, 5591021, 3481989.83, 1678043.12, 0];
var LLBAND = [75, 60, 45, 30, 15, 0];
var MC2LL = [
    [
        1.410526172116255e-8,
        0.00000898305509648872,
        -1.9939833816331,
        200.9824383106796,
        -187.2403703815547,
        91.6087516669843,
        -23.38765649603339,
        2.57121317296198,
        -0.03801003308653,
        17337981.2,
    ],
    [
        -7.435856389565537e-9,
        0.000008983055097726239,
        -0.78625201886289,
        96.32687599759846,
        -1.85204757529826,
        -59.36935905485877,
        47.40033549296737,
        -16.50741931063887,
        2.28786674699375,
        10260144.86,
    ],
    [
        -3.030883460898826e-8,
        0.00000898305509983578,
        0.30071316287616,
        59.74293618442277,
        7.357984074871,
        -25.38371002664745,
        13.45380521110908,
        -3.29883767235584,
        0.32710905363475,
        6856817.37,
    ],
    [
        -1.981981304930552e-8,
        0.000008983055099779535,
        0.03278182852591,
        40.31678527705744,
        0.65659298677277,
        -4.44255534477492,
        0.85341911805263,
        0.12923347998204,
        -0.04625736007561,
        4482777.06,
    ],
    [
        3.09191371068437e-9,
        0.000008983055096812155,
        0.00006995724062,
        23.10934304144901,
        -0.00023663490511,
        -0.6321817810242,
        -0.00663494467273,
        0.03430082397953,
        -0.00466043876332,
        2555164.4,
    ],
    [
        2.890871144776878e-9,
        0.000008983055095805407,
        -3.068298e-8,
        7.47137025468032,
        -0.00000353937994,
        -0.02145144861037,
        -0.00001234426596,
        0.00010322952773,
        -0.00000323890364,
        826088.5,
    ],
];
var LL2MC = [
    [
        -0.0015702102444,
        111320.7020616939,
        1704480524535203,
        -10338987376042340,
        26112667856603880,
        -35149669176653700,
        26595700718403920,
        -10725012454188240,
        1800819912950474,
        82.5,
    ],
    [
        0.0008277824516172526,
        111320.7020463578,
        647795574.6671607,
        -4082003173.641316,
        10774905663.51142,
        -15171875531.51559,
        12053065338.62167,
        -5124939663.577472,
        913311935.9512032,
        67.5,
    ],
    [
        0.00337398766765,
        111320.7020202162,
        4481351.045890365,
        -23393751.19931662,
        79682215.47186455,
        -115964993.2797253,
        97236711.15602145,
        -43661946.33752821,
        8477230.501135234,
        52.5,
    ],
    [
        0.00220636496208,
        111320.7020209128,
        51751.86112841131,
        3796837.749470245,
        992013.7397791013,
        -1221952.21711287,
        1340652.697009075,
        -620943.6990984312,
        144416.9293806241,
        37.5,
    ],
    [
        -0.0003441963504368392,
        111320.7020576856,
        278.2353980772752,
        2485758.690035394,
        6070.750963243378,
        54821.18345352118,
        9540.606633304236,
        -2710.55326746645,
        1405.483844121726,
        22.5,
    ],
    [
        -0.0003218135878613132,
        111320.7020701615,
        0.00369383431289,
        823725.6402795718,
        0.46104986909093,
        2351.343141331292,
        1.58060784298199,
        8.77738589078284,
        0.37238884252424,
        7.45,
    ],
];
function transform$1(x, y, factors) {
    var cc = abs(y) / factors[9];
    var xt = factors[0] + factors[1] * abs(x);
    var yt = factors[2] +
        factors[3] * cc +
        factors[4] * Math.pow(cc, 2) +
        factors[5] * Math.pow(cc, 3) +
        factors[6] * Math.pow(cc, 4) +
        factors[7] * Math.pow(cc, 5) +
        factors[8] * Math.pow(cc, 6);
    xt *= x < 0 ? -1 : 1;
    yt *= y < 0 ? -1 : 1;
    return [xt, yt];
}
function BD09toBD09MC(coord) {
    var lng = coord[0], lat = coord[1];
    var factors = [];
    for (var i = 0; i < LLBAND.length; i++) {
        if (abs(lat) > LLBAND[i]) {
            factors = LL2MC[i];
            break;
        }
    }
    return transform$1(lng, lat, factors);
}
function BD09MCtoBD09(coord) {
    var x = coord[0], y = coord[1];
    var factors = [];
    for (var i = 0; i < MCBAND.length; i++) {
        if (y >= MCBAND[i]) {
            factors = MC2LL[i];
            break;
        }
    }
    return transform$1(x, y, factors);
}

function assert(condition, msg) {
    if (!condition)
        throw new Error(msg);
}
/**
 * isArray
 *
 * @param {*} input variable to validate
 * @returns {boolean} true/false
 */
function isArray(input) {
    return !!input && Object.prototype.toString.call(input) === '[object Array]';
}
/**
 * isNumber
 *
 * @param {*} num Number to validate
 * @returns {boolean} true/false
 * @example
 * isNumber(123)
 * //=true
 * isNumber('foo')
 * //=false
 */
function isNumber(input) {
    return !isNaN(Number(input)) && input !== null && !isArray(input);
}
/**
 * compose
 *
 * @param {function[]} functions
 * @returns {function}
 */
function compose() {
    var funcs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        funcs[_i] = arguments[_i];
    }
    var start = funcs.length - 1;
    /* eslint-disable func-names */
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var i = start;
        var result = funcs[start].apply(null, args);
        while (i--)
            result = funcs[i].call(null, result);
        return result;
    };
}
/**
 * Iterate over coordinates in any GeoJSON object, similar to Array.forEach()
 * https://github.com/Turfjs/turf/blob/master/packages/turf-meta/index.mjs
 *
 * @name coordEach
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentCoord, coordIndex, featureIndex, multiFeatureIndex)
 * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
 * @returns {void}
 * @example
 * let features = featureCollection([
 *   point([26, 37], {"foo": "bar"}),
 *   point([36, 53], {"hello": "world"})
 * ]);
 *
 * coordEach(features, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
 *   //=currentCoord
 *   //=coordIndex
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   //=geometryIndex
 * });
 */
/* eslint-disable no-param-reassign */
function coordEach(geojson, callback, excludeWrapCoord) {
    if (excludeWrapCoord === void 0) { excludeWrapCoord = false; }
    // Handles null Geometry -- Skips this GeoJSON
    if (geojson === null)
        return;
    /* eslint-disable-next-line */
    var j, k, l, geometry, stopG, coords, geometryMaybeCollection, wrapShrink = 0, coordIndex = 0, isGeometryCollection;
    var type = geojson.type;
    var isFeatureCollection = type === 'FeatureCollection';
    var isFeature = type === 'Feature';
    var stop = isFeatureCollection
        ? geojson.features.length
        : 1;
    // This logic may look a little weird. The reason why it is that way
    // is because it's trying to be fast. GeoJSON supports multiple kinds
    // of objects at its root: FeatureCollection, Features, Geometries.
    // This function has the responsibility of handling all of them, and that
    // means that some of the `for` loops you see below actually just don't apply
    // to certain inputs. For instance, if you give this just a
    // Point geometry, then both loops are short-circuited and all we do
    // is gradually rename the input until it's called 'geometry'.
    //
    // This also aims to allocate as few resources as possible: just a
    // few numbers and booleans, rather than any temporary arrays as would
    // be required with the normalization approach.
    for (var featureIndex = 0; featureIndex < stop; featureIndex++) {
        geometryMaybeCollection = isFeatureCollection
            ? geojson.features[featureIndex].geometry
            : isFeature
                ? geojson.geometry
                : geojson;
        isGeometryCollection = geometryMaybeCollection
            ? geometryMaybeCollection.type === 'GeometryCollection'
            : false;
        stopG = isGeometryCollection
            ? geometryMaybeCollection.geometries.length
            : 1;
        for (var geomIndex = 0; geomIndex < stopG; geomIndex++) {
            var multiFeatureIndex = 0;
            var geometryIndex = 0;
            geometry = isGeometryCollection
                ? geometryMaybeCollection.geometries[geomIndex]
                : geometryMaybeCollection;
            // Handles null Geometry -- Skips this geometry
            if (geometry === null)
                continue;
            var geomType = geometry.type;
            wrapShrink =
                excludeWrapCoord &&
                    (geomType === 'Polygon' || geomType === 'MultiPolygon')
                    ? 1
                    : 0;
            switch (geomType) {
                case null:
                    break;
                case 'Point':
                    coords = geometry.coordinates;
                    if (callback(coords, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false)
                        return false;
                    coordIndex++;
                    multiFeatureIndex++;
                    break;
                case 'LineString':
                case 'MultiPoint':
                    coords = geometry.coordinates;
                    for (j = 0; j < coords.length; j++) {
                        if (callback(coords[j], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false)
                            return false;
                        coordIndex++;
                        if (geomType === 'MultiPoint')
                            multiFeatureIndex++;
                    }
                    if (geomType === 'LineString')
                        multiFeatureIndex++;
                    break;
                case 'Polygon':
                case 'MultiLineString':
                    coords = geometry.coordinates;
                    for (j = 0; j < coords.length; j++) {
                        for (k = 0; k < coords[j].length - wrapShrink; k++) {
                            if (callback(coords[j][k], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false)
                                return false;
                            coordIndex++;
                        }
                        if (geomType === 'MultiLineString')
                            multiFeatureIndex++;
                        if (geomType === 'Polygon')
                            geometryIndex++;
                    }
                    if (geomType === 'Polygon')
                        multiFeatureIndex++;
                    break;
                case 'MultiPolygon':
                    coords = geometry.coordinates;
                    for (j = 0; j < coords.length; j++) {
                        geometryIndex = 0;
                        for (k = 0; k < coords[j].length; k++) {
                            for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
                                if (callback(coords[j][k][l], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false)
                                    return false;
                                coordIndex++;
                            }
                            geometryIndex++;
                        }
                        multiFeatureIndex++;
                    }
                    break;
                case 'GeometryCollection':
                    for (j = 0; j < geometry.geometries.length; j++) {
                        if (coordEach(geometry.geometries[j], callback, excludeWrapCoord) === false)
                            return false;
                    }
                    break;
                default:
                    throw new Error('Unknown Geometry Type');
            }
        }
    }
}

var _a, _b, _c, _d, _e;
var CRSTypes;
(function (CRSTypes) {
    // WGS84
    CRSTypes["WGS84"] = "WGS84";
    CRSTypes["WGS1984"] = "WGS84";
    CRSTypes["EPSG4326"] = "WGS84";
    // GCJ02
    CRSTypes["GCJ02"] = "GCJ02";
    CRSTypes["AMap"] = "GCJ02";
    // BD09
    CRSTypes["BD09"] = "BD09";
    CRSTypes["BD09LL"] = "BD09";
    CRSTypes["Baidu"] = "BD09";
    CRSTypes["BMap"] = "BD09";
    // BD09MC
    CRSTypes["BD09MC"] = "BD09MC";
    CRSTypes["BD09Meter"] = "BD09MC";
    // EPSG3857
    CRSTypes["EPSG3857"] = "EPSG3857";
    CRSTypes["EPSG900913"] = "EPSG3857";
    CRSTypes["EPSG102100"] = "EPSG3857";
    CRSTypes["WebMercator"] = "EPSG3857";
    CRSTypes["WM"] = "EPSG3857";
})(CRSTypes || (CRSTypes = {}));
var WGS84 = {
    to: (_a = {},
        _a[CRSTypes.GCJ02] = WGS84ToGCJ02,
        _a[CRSTypes.BD09] = compose(GCJ02ToBD09, WGS84ToGCJ02),
        _a[CRSTypes.BD09MC] = compose(BD09toBD09MC, GCJ02ToBD09, WGS84ToGCJ02),
        _a[CRSTypes.EPSG3857] = WGS84ToEPSG3857,
        _a),
};
var GCJ02 = {
    to: (_b = {},
        _b[CRSTypes.WGS84] = GCJ02ToWGS84,
        _b[CRSTypes.BD09] = GCJ02ToBD09,
        _b[CRSTypes.BD09MC] = compose(BD09toBD09MC, GCJ02ToBD09),
        _b[CRSTypes.EPSG3857] = compose(WGS84ToEPSG3857, GCJ02ToWGS84),
        _b),
};
var BD09 = {
    to: (_c = {},
        _c[CRSTypes.WGS84] = compose(GCJ02ToWGS84, BD09ToGCJ02),
        _c[CRSTypes.GCJ02] = BD09ToGCJ02,
        _c[CRSTypes.EPSG3857] = compose(WGS84ToEPSG3857, GCJ02ToWGS84, BD09ToGCJ02),
        _c[CRSTypes.BD09MC] = BD09toBD09MC,
        _c),
};
var EPSG3857 = {
    to: (_d = {},
        _d[CRSTypes.WGS84] = ESPG3857ToWGS84,
        _d[CRSTypes.GCJ02] = compose(WGS84ToGCJ02, ESPG3857ToWGS84),
        _d[CRSTypes.BD09] = compose(GCJ02ToBD09, WGS84ToGCJ02, ESPG3857ToWGS84),
        _d[CRSTypes.BD09MC] = compose(BD09toBD09MC, GCJ02ToBD09, WGS84ToGCJ02, ESPG3857ToWGS84),
        _d),
};
var BD09MC = {
    to: (_e = {},
        _e[CRSTypes.WGS84] = compose(GCJ02ToWGS84, BD09ToGCJ02, BD09MCtoBD09),
        _e[CRSTypes.GCJ02] = compose(BD09ToGCJ02, BD09MCtoBD09),
        _e[CRSTypes.EPSG3857] = compose(WGS84ToEPSG3857, GCJ02ToWGS84, BD09ToGCJ02, BD09MCtoBD09),
        _e[CRSTypes.BD09] = BD09MCtoBD09,
        _e),
};
var crsMap = {
    WGS84: WGS84,
    GCJ02: GCJ02,
    BD09: BD09,
    EPSG3857: EPSG3857,
    BD09MC: BD09MC,
};

/**
 * transform
 *
 * @param {geojson|position|string} input
 * @returns {geojson|position} output
 */
/* eslint-disable no-param-reassign */
function transform(input, crsFrom, crsTo) {
    assert(!!input, 'The args[0] input coordinate is required');
    assert(!!crsFrom, 'The args[1] original coordinate system is required');
    assert(!!crsTo, 'The args[2] target coordinate system is required');
    if (crsFrom === crsTo)
        return input;
    var from = crsMap[crsFrom];
    assert(!!from, "Invalid original coordinate system: " + crsFrom);
    var to = from.to[crsTo];
    assert(!!to, "Invalid target coordinate system: " + crsTo);
    var type = typeof input;
    assert(type === 'string' || type === 'object', "Invalid input coordinate type: " + type);
    if (type === 'string') {
        try {
            input = JSON.parse(input);
        }
        catch (e) {
            throw new Error("Invalid input coordinate: " + input);
        }
    }
    var isPosition = false;
    if (isArray(input)) {
        assert(input.length >= 2, "Invalid input coordinate: " + input);
        assert(isNumber(input[0]) && isNumber(input[1]), "Invalid input coordinate: " + input);
        input = input.map(Number);
        isPosition = true;
    }
    var convert = to;
    if (isPosition)
        return convert(input);
    // GeoJSON类型直接转换输入
    coordEach(input, function (coord) {
        var _a;
        _a = convert(coord), coord[0] = _a[0], coord[1] = _a[1];
    });
    return input;
}

var exported = __assign(__assign({}, CRSTypes), { // 兼容原来gcoord.WGS84的使用方式
    CRSTypes: CRSTypes,
    transform: transform });

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (exported);
//# sourceMappingURL=gcoord.esm.js.map


/***/ }),

/***/ "./node_modules/gl-matrix/esm/common.js":
/*!**********************************************!*\
  !*** ./node_modules/gl-matrix/esm/common.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ARRAY_TYPE": () => (/* binding */ ARRAY_TYPE),
/* harmony export */   "EPSILON": () => (/* binding */ EPSILON),
/* harmony export */   "RANDOM": () => (/* binding */ RANDOM),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "setMatrixArrayType": () => (/* binding */ setMatrixArrayType),
/* harmony export */   "toRadian": () => (/* binding */ toRadian)
/* harmony export */ });
/**
 * Common utilities
 * @module glMatrix
 */
// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
var RANDOM = Math.random;
/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Float32ArrayConstructor | ArrayConstructor} type Array type, such as Float32Array or Array
 */

function setMatrixArrayType(type) {
  ARRAY_TYPE = type;
}
var degree = Math.PI / 180;
/**
 * Convert Degree To Radian
 *
 * @param {Number} a Angle in Degrees
 */

function toRadian(a) {
  return a * degree;
}
/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a The first number to test.
 * @param {Number} b The second number to test.
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */

function equals(a, b) {
  return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
}
if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};

/***/ }),

/***/ "./node_modules/gl-matrix/esm/mat4.js":
/*!********************************************!*\
  !*** ./node_modules/gl-matrix/esm/mat4.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "add": () => (/* binding */ add),
/* harmony export */   "adjoint": () => (/* binding */ adjoint),
/* harmony export */   "clone": () => (/* binding */ clone),
/* harmony export */   "copy": () => (/* binding */ copy),
/* harmony export */   "create": () => (/* binding */ create),
/* harmony export */   "determinant": () => (/* binding */ determinant),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "exactEquals": () => (/* binding */ exactEquals),
/* harmony export */   "frob": () => (/* binding */ frob),
/* harmony export */   "fromQuat": () => (/* binding */ fromQuat),
/* harmony export */   "fromQuat2": () => (/* binding */ fromQuat2),
/* harmony export */   "fromRotation": () => (/* binding */ fromRotation),
/* harmony export */   "fromRotationTranslation": () => (/* binding */ fromRotationTranslation),
/* harmony export */   "fromRotationTranslationScale": () => (/* binding */ fromRotationTranslationScale),
/* harmony export */   "fromRotationTranslationScaleOrigin": () => (/* binding */ fromRotationTranslationScaleOrigin),
/* harmony export */   "fromScaling": () => (/* binding */ fromScaling),
/* harmony export */   "fromTranslation": () => (/* binding */ fromTranslation),
/* harmony export */   "fromValues": () => (/* binding */ fromValues),
/* harmony export */   "fromXRotation": () => (/* binding */ fromXRotation),
/* harmony export */   "fromYRotation": () => (/* binding */ fromYRotation),
/* harmony export */   "fromZRotation": () => (/* binding */ fromZRotation),
/* harmony export */   "frustum": () => (/* binding */ frustum),
/* harmony export */   "getRotation": () => (/* binding */ getRotation),
/* harmony export */   "getScaling": () => (/* binding */ getScaling),
/* harmony export */   "getTranslation": () => (/* binding */ getTranslation),
/* harmony export */   "identity": () => (/* binding */ identity),
/* harmony export */   "invert": () => (/* binding */ invert),
/* harmony export */   "lookAt": () => (/* binding */ lookAt),
/* harmony export */   "mul": () => (/* binding */ mul),
/* harmony export */   "multiply": () => (/* binding */ multiply),
/* harmony export */   "multiplyScalar": () => (/* binding */ multiplyScalar),
/* harmony export */   "multiplyScalarAndAdd": () => (/* binding */ multiplyScalarAndAdd),
/* harmony export */   "ortho": () => (/* binding */ ortho),
/* harmony export */   "orthoNO": () => (/* binding */ orthoNO),
/* harmony export */   "orthoZO": () => (/* binding */ orthoZO),
/* harmony export */   "perspective": () => (/* binding */ perspective),
/* harmony export */   "perspectiveFromFieldOfView": () => (/* binding */ perspectiveFromFieldOfView),
/* harmony export */   "perspectiveNO": () => (/* binding */ perspectiveNO),
/* harmony export */   "perspectiveZO": () => (/* binding */ perspectiveZO),
/* harmony export */   "rotate": () => (/* binding */ rotate),
/* harmony export */   "rotateX": () => (/* binding */ rotateX),
/* harmony export */   "rotateY": () => (/* binding */ rotateY),
/* harmony export */   "rotateZ": () => (/* binding */ rotateZ),
/* harmony export */   "scale": () => (/* binding */ scale),
/* harmony export */   "set": () => (/* binding */ set),
/* harmony export */   "str": () => (/* binding */ str),
/* harmony export */   "sub": () => (/* binding */ sub),
/* harmony export */   "subtract": () => (/* binding */ subtract),
/* harmony export */   "targetTo": () => (/* binding */ targetTo),
/* harmony export */   "translate": () => (/* binding */ translate),
/* harmony export */   "transpose": () => (/* binding */ transpose)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common.js */ "./node_modules/gl-matrix/esm/common.js");

/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */

function create() {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(16);

  if (_common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }

  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */

function clone(a) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Create a new mat4 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} A new mat4
 */

function fromValues(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(16);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */

function set(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */

function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    var a12 = a[6],
        a13 = a[7];
    var a23 = a[11];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a01;
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a02;
    out[9] = a12;
    out[11] = a[14];
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
  } else {
    out[0] = a[0];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a[1];
    out[5] = a[5];
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a[2];
    out[9] = a[6];
    out[10] = a[10];
    out[11] = a[14];
    out[12] = a[3];
    out[13] = a[7];
    out[14] = a[11];
    out[15] = a[15];
  }

  return out;
}
/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function invert(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}
/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function adjoint(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
  out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
  out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
  out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
  out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
  out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
  out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
  out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
  out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
  out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
  out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
  out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
  out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
  out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
  out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
  out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
  return out;
}
/**
 * Calculates the determinant of a mat4
 *
 * @param {ReadonlyMat4} a the source matrix
 * @returns {Number} determinant of a
 */

function determinant(a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}
/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function multiply(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15]; // Cache only the current line of the second matrix

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */

function translate(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;

  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }

  return out;
}
/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {ReadonlyVec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/

function scale(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  out[0] = a[0] * x;
  out[1] = a[1] * x;
  out[2] = a[2] * x;
  out[3] = a[3] * x;
  out[4] = a[4] * y;
  out[5] = a[5] * y;
  out[6] = a[6] * y;
  out[7] = a[7] * y;
  out[8] = a[8] * z;
  out[9] = a[9] * z;
  out[10] = a[10] * z;
  out[11] = a[11] * z;
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */

function rotate(out, a, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;

  if (len < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11]; // Construct the elements of the rotation matrix

  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c; // Perform rotation-specific matrix multiplication

  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  return out;
}
/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateX(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}
/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateY(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}
/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateZ(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}
/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */

function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Scaling vector
 * @returns {mat4} out
 */

function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */

function fromRotation(out, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;

  if (len < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c; // Perform rotation-specific matrix multiplication

  out[0] = x * x * t + c;
  out[1] = y * x * t + z * s;
  out[2] = z * x * t - y * s;
  out[3] = 0;
  out[4] = x * y * t - z * s;
  out[5] = y * y * t + c;
  out[6] = z * y * t + x * s;
  out[7] = 0;
  out[8] = x * z * t + y * s;
  out[9] = y * z * t - x * s;
  out[10] = z * z * t + c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = c;
  out[6] = s;
  out[7] = 0;
  out[8] = 0;
  out[9] = -s;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = c;
  out[1] = 0;
  out[2] = -s;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = s;
  out[9] = 0;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = 0;
  out[4] = -s;
  out[5] = c;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */

function fromRotationTranslation(out, q, v) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - (yy + zz);
  out[1] = xy + wz;
  out[2] = xz - wy;
  out[3] = 0;
  out[4] = xy - wz;
  out[5] = 1 - (xx + zz);
  out[6] = yz + wx;
  out[7] = 0;
  out[8] = xz + wy;
  out[9] = yz - wx;
  out[10] = 1 - (xx + yy);
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a new mat4 from a dual quat.
 *
 * @param {mat4} out Matrix
 * @param {ReadonlyQuat2} a Dual Quaternion
 * @returns {mat4} mat4 receiving operation result
 */

function fromQuat2(out, a) {
  var translation = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  var bx = -a[0],
      by = -a[1],
      bz = -a[2],
      bw = a[3],
      ax = a[4],
      ay = a[5],
      az = a[6],
      aw = a[7];
  var magnitude = bx * bx + by * by + bz * bz + bw * bw; //Only scale if it makes sense

  if (magnitude > 0) {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
  } else {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  }

  fromRotationTranslation(out, a, translation);
  return out;
}
/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */

function getTranslation(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];
  return out;
}
/**
 * Returns the scaling factor component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslationScale
 *  with a normalized Quaternion paramter, the returned vector will be
 *  the same as the scaling vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive scaling factor component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */

function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out[0] = Math.hypot(m11, m12, m13);
  out[1] = Math.hypot(m21, m22, m23);
  out[2] = Math.hypot(m31, m32, m33);
  return out;
}
/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */

function getRotation(out, mat) {
  var scaling = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  getScaling(scaling, mat);
  var is1 = 1 / scaling[0];
  var is2 = 1 / scaling[1];
  var is3 = 1 / scaling[2];
  var sm11 = mat[0] * is1;
  var sm12 = mat[1] * is2;
  var sm13 = mat[2] * is3;
  var sm21 = mat[4] * is1;
  var sm22 = mat[5] * is2;
  var sm23 = mat[6] * is3;
  var sm31 = mat[8] * is1;
  var sm32 = mat[9] * is2;
  var sm33 = mat[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;

  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }

  return out;
}
/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @returns {mat4} out
 */

function fromRotationTranslationScale(out, q, v, s) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     mat4.translate(dest, origin);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *     mat4.translate(dest, negativeOrigin);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @param {ReadonlyVec3} o The origin vector around which to scale and rotate
 * @returns {mat4} out
 */

function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  var ox = o[0];
  var oy = o[1];
  var oz = o[2];
  var out0 = (1 - (yy + zz)) * sx;
  var out1 = (xy + wz) * sx;
  var out2 = (xz - wy) * sx;
  var out4 = (xy - wz) * sy;
  var out5 = (1 - (xx + zz)) * sy;
  var out6 = (yz + wx) * sy;
  var out8 = (xz + wy) * sz;
  var out9 = (yz - wx) * sz;
  var out10 = (1 - (xx + yy)) * sz;
  out[0] = out0;
  out[1] = out1;
  out[2] = out2;
  out[3] = 0;
  out[4] = out4;
  out[5] = out5;
  out[6] = out6;
  out[7] = 0;
  out[8] = out8;
  out[9] = out9;
  out[10] = out10;
  out[11] = 0;
  out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
  out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
  out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
  out[15] = 1;
  return out;
}
/**
 * Calculates a 4x4 matrix from the given quaternion
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat4} out
 */

function fromQuat(out, q) {
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[1] = yx + wz;
  out[2] = zx - wy;
  out[3] = 0;
  out[4] = yx - wz;
  out[5] = 1 - xx - zz;
  out[6] = zy + wx;
  out[7] = 0;
  out[8] = zx + wy;
  out[9] = zy - wx;
  out[10] = 1 - xx - yy;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */

function frustum(out, left, right, bottom, top, near, far) {
  var rl = 1 / (right - left);
  var tb = 1 / (top - bottom);
  var nf = 1 / (near - far);
  out[0] = near * 2 * rl;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = near * 2 * tb;
  out[6] = 0;
  out[7] = 0;
  out[8] = (right + left) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near * 2 * nf;
  out[15] = 0;
  return out;
}
/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }

  return out;
}
/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */

var perspective = perspectiveNO;
/**
 * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveZO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = far * nf;
    out[14] = far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -near;
  }

  return out;
}
/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
  var xScale = 2.0 / (leftTan + rightTan);
  var yScale = 2.0 / (upTan + downTan);
  out[0] = xScale;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  out[4] = 0.0;
  out[5] = yScale;
  out[6] = 0.0;
  out[7] = 0.0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1.0;
  out[12] = 0.0;
  out[13] = 0.0;
  out[14] = far * near / (near - far);
  out[15] = 0.0;
  return out;
}
/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function orthoNO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}
/**
 * Alias for {@link mat4.orthoNO}
 * @function
 */

var ortho = orthoNO;
/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function orthoZO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = near * nf;
  out[15] = 1;
  return out;
}
/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];

  if (Math.abs(eyex - centerx) < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON && Math.abs(eyey - centery) < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON && Math.abs(eyez - centerz) < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON) {
    return identity(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);

  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.hypot(y0, y1, y2);

  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}
/**
 * Generates a matrix that makes something look at something else.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function targetTo(out, eye, target, up) {
  var eyex = eye[0],
      eyey = eye[1],
      eyez = eye[2],
      upx = up[0],
      upy = up[1],
      upz = up[2];
  var z0 = eyex - target[0],
      z1 = eyey - target[1],
      z2 = eyez - target[2];
  var len = z0 * z0 + z1 * z1 + z2 * z2;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
    z0 *= len;
    z1 *= len;
    z2 *= len;
  }

  var x0 = upy * z2 - upz * z1,
      x1 = upz * z0 - upx * z2,
      x2 = upx * z1 - upy * z0;
  len = x0 * x0 + x1 * x1 + x2 * x2;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  out[0] = x0;
  out[1] = x1;
  out[2] = x2;
  out[3] = 0;
  out[4] = z1 * x2 - z2 * x1;
  out[5] = z2 * x0 - z0 * x2;
  out[6] = z0 * x1 - z1 * x0;
  out[7] = 0;
  out[8] = z0;
  out[9] = z1;
  out[10] = z2;
  out[11] = 0;
  out[12] = eyex;
  out[13] = eyey;
  out[14] = eyez;
  out[15] = 1;
  return out;
}
/**
 * Returns a string representation of a mat4
 *
 * @param {ReadonlyMat4} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */

function str(a) {
  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
}
/**
 * Returns Frobenius norm of a mat4
 *
 * @param {ReadonlyMat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */

function frob(a) {
  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
}
/**
 * Adds two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  out[9] = a[9] + b[9];
  out[10] = a[10] + b[10];
  out[11] = a[11] + b[11];
  out[12] = a[12] + b[12];
  out[13] = a[13] + b[13];
  out[14] = a[14] + b[14];
  out[15] = a[15] + b[15];
  return out;
}
/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  out[9] = a[9] - b[9];
  out[10] = a[10] - b[10];
  out[11] = a[11] - b[11];
  out[12] = a[12] - b[12];
  out[13] = a[13] - b[13];
  out[14] = a[14] - b[14];
  out[15] = a[15] - b[15];
  return out;
}
/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat4} out
 */

function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  out[9] = a[9] * b;
  out[10] = a[10] * b;
  out[11] = a[11] * b;
  out[12] = a[12] * b;
  out[13] = a[13] * b;
  out[14] = a[14] * b;
  out[15] = a[15] * b;
  return out;
}
/**
 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat4} out the receiving vector
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat4} out
 */

function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  out[9] = a[9] + b[9] * scale;
  out[10] = a[10] + b[10] * scale;
  out[11] = a[11] + b[11] * scale;
  out[12] = a[12] + b[12] * scale;
  out[13] = a[13] + b[13] * scale;
  out[14] = a[14] + b[14] * scale;
  out[15] = a[15] + b[15] * scale;
  return out;
}
/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var a4 = a[4],
      a5 = a[5],
      a6 = a[6],
      a7 = a[7];
  var a8 = a[8],
      a9 = a[9],
      a10 = a[10],
      a11 = a[11];
  var a12 = a[12],
      a13 = a[13],
      a14 = a[14],
      a15 = a[15];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  var b4 = b[4],
      b5 = b[5],
      b6 = b[6],
      b7 = b[7];
  var b8 = b[8],
      b9 = b[9],
      b10 = b[10],
      b11 = b[11];
  var b12 = b[12],
      b13 = b[13],
      b14 = b[14],
      b15 = b[15];
  return Math.abs(a0 - b0) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
}
/**
 * Alias for {@link mat4.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link mat4.subtract}
 * @function
 */

var sub = subtract;

/***/ }),

/***/ "./node_modules/gl-matrix/esm/vec2.js":
/*!********************************************!*\
  !*** ./node_modules/gl-matrix/esm/vec2.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "add": () => (/* binding */ add),
/* harmony export */   "angle": () => (/* binding */ angle),
/* harmony export */   "ceil": () => (/* binding */ ceil),
/* harmony export */   "clone": () => (/* binding */ clone),
/* harmony export */   "copy": () => (/* binding */ copy),
/* harmony export */   "create": () => (/* binding */ create),
/* harmony export */   "cross": () => (/* binding */ cross),
/* harmony export */   "dist": () => (/* binding */ dist),
/* harmony export */   "distance": () => (/* binding */ distance),
/* harmony export */   "div": () => (/* binding */ div),
/* harmony export */   "divide": () => (/* binding */ divide),
/* harmony export */   "dot": () => (/* binding */ dot),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "exactEquals": () => (/* binding */ exactEquals),
/* harmony export */   "floor": () => (/* binding */ floor),
/* harmony export */   "forEach": () => (/* binding */ forEach),
/* harmony export */   "fromValues": () => (/* binding */ fromValues),
/* harmony export */   "inverse": () => (/* binding */ inverse),
/* harmony export */   "len": () => (/* binding */ len),
/* harmony export */   "length": () => (/* binding */ length),
/* harmony export */   "lerp": () => (/* binding */ lerp),
/* harmony export */   "max": () => (/* binding */ max),
/* harmony export */   "min": () => (/* binding */ min),
/* harmony export */   "mul": () => (/* binding */ mul),
/* harmony export */   "multiply": () => (/* binding */ multiply),
/* harmony export */   "negate": () => (/* binding */ negate),
/* harmony export */   "normalize": () => (/* binding */ normalize),
/* harmony export */   "random": () => (/* binding */ random),
/* harmony export */   "rotate": () => (/* binding */ rotate),
/* harmony export */   "round": () => (/* binding */ round),
/* harmony export */   "scale": () => (/* binding */ scale),
/* harmony export */   "scaleAndAdd": () => (/* binding */ scaleAndAdd),
/* harmony export */   "set": () => (/* binding */ set),
/* harmony export */   "sqrDist": () => (/* binding */ sqrDist),
/* harmony export */   "sqrLen": () => (/* binding */ sqrLen),
/* harmony export */   "squaredDistance": () => (/* binding */ squaredDistance),
/* harmony export */   "squaredLength": () => (/* binding */ squaredLength),
/* harmony export */   "str": () => (/* binding */ str),
/* harmony export */   "sub": () => (/* binding */ sub),
/* harmony export */   "subtract": () => (/* binding */ subtract),
/* harmony export */   "transformMat2": () => (/* binding */ transformMat2),
/* harmony export */   "transformMat2d": () => (/* binding */ transformMat2d),
/* harmony export */   "transformMat3": () => (/* binding */ transformMat3),
/* harmony export */   "transformMat4": () => (/* binding */ transformMat4),
/* harmony export */   "zero": () => (/* binding */ zero)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common.js */ "./node_modules/gl-matrix/esm/common.js");

/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */

function create() {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(2);

  if (_common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }

  return out;
}
/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {ReadonlyVec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */

function clone(a) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(2);
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */

function fromValues(x, y) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}
/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the source vector
 * @returns {vec2} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */

function set(out, x, y) {
  out[0] = x;
  out[1] = y;
  return out;
}
/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  return out;
}
/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  return out;
}
/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  return out;
}
/**
 * Math.ceil the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to ceil
 * @returns {vec2} out
 */

function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  return out;
}
/**
 * Math.floor the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to floor
 * @returns {vec2} out
 */

function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  return out;
}
/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  return out;
}
/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  return out;
}
/**
 * Math.round the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to round
 * @returns {vec2} out
 */

function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  return out;
}
/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  return out;
}
/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */

function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} distance between a and b
 */

function distance(a, b) {
  var x = b[0] - a[0],
      y = b[1] - a[1];
  return Math.hypot(x, y);
}
/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} squared distance between a and b
 */

function squaredDistance(a, b) {
  var x = b[0] - a[0],
      y = b[1] - a[1];
  return x * x + y * y;
}
/**
 * Calculates the length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0],
      y = a[1];
  return Math.hypot(x, y);
}
/**
 * Calculates the squared length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */

function squaredLength(a) {
  var x = a[0],
      y = a[1];
  return x * x + y * y;
}
/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to negate
 * @returns {vec2} out
 */

function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  return out;
}
/**
 * Returns the inverse of the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to invert
 * @returns {vec2} out
 */

function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  return out;
}
/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to normalize
 * @returns {vec2} out
 */

function normalize(out, a) {
  var x = a[0],
      y = a[1];
  var len = x * x + y * y;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  return out;
}
/**
 * Calculates the dot product of two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}
/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec3} out
 */

function cross(out, a, b) {
  var z = a[0] * b[1] - a[1] * b[0];
  out[0] = out[1] = 0;
  out[2] = z;
  return out;
}
/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec2} out
 */

function lerp(out, a, b, t) {
  var ax = a[0],
      ay = a[1];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */

function random(out, scale) {
  scale = scale || 1.0;
  var r = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2.0 * Math.PI;
  out[0] = Math.cos(r) * scale;
  out[1] = Math.sin(r) * scale;
  return out;
}
/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat2(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[2] * y;
  out[1] = m[1] * x + m[3] * y;
  return out;
}
/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2d} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat2d(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[2] * y + m[4];
  out[1] = m[1] * x + m[3] * y + m[5];
  return out;
}
/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat3} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat3(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[3] * y + m[6];
  out[1] = m[1] * x + m[4] * y + m[7];
  return out;
}
/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat4(out, a, m) {
  var x = a[0];
  var y = a[1];
  out[0] = m[0] * x + m[4] * y + m[12];
  out[1] = m[1] * x + m[5] * y + m[13];
  return out;
}
/**
 * Rotate a 2D vector
 * @param {vec2} out The receiving vec2
 * @param {ReadonlyVec2} a The vec2 point to rotate
 * @param {ReadonlyVec2} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec2} out
 */

function rotate(out, a, b, rad) {
  //Translate point to the origin
  var p0 = a[0] - b[0],
      p1 = a[1] - b[1],
      sinC = Math.sin(rad),
      cosC = Math.cos(rad); //perform rotation and translate to correct position

  out[0] = p0 * cosC - p1 * sinC + b[0];
  out[1] = p0 * sinC + p1 * cosC + b[1];
  return out;
}
/**
 * Get the angle between two 2D vectors
 * @param {ReadonlyVec2} a The first operand
 * @param {ReadonlyVec2} b The second operand
 * @returns {Number} The angle in radians
 */

function angle(a, b) {
  var x1 = a[0],
      y1 = a[1],
      x2 = b[0],
      y2 = b[1],
      // mag is the product of the magnitudes of a and b
  mag = Math.sqrt(x1 * x1 + y1 * y1) * Math.sqrt(x2 * x2 + y2 * y2),
      // mag &&.. short circuits if mag == 0
  cosine = mag && (x1 * x2 + y1 * y2) / mag; // Math.min(Math.max(cosine, -1), 1) clamps the cosine between -1 and 1

  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}
/**
 * Set the components of a vec2 to zero
 *
 * @param {vec2} out the receiving vector
 * @returns {vec2} out
 */

function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec2} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str(a) {
  return "vec2(" + a[0] + ", " + a[1] + ")";
}
/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1];
  var b0 = b[0],
      b1 = b[1];
  return Math.abs(a0 - b0) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1));
}
/**
 * Alias for {@link vec2.length}
 * @function
 */

var len = length;
/**
 * Alias for {@link vec2.subtract}
 * @function
 */

var sub = subtract;
/**
 * Alias for {@link vec2.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link vec2.divide}
 * @function
 */

var div = divide;
/**
 * Alias for {@link vec2.distance}
 * @function
 */

var dist = distance;
/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */

var sqrDist = squaredDistance;
/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */

var sqrLen = squaredLength;
/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 2;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }

    return a;
  };
}();

/***/ }),

/***/ "./node_modules/gl-matrix/esm/vec3.js":
/*!********************************************!*\
  !*** ./node_modules/gl-matrix/esm/vec3.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "add": () => (/* binding */ add),
/* harmony export */   "angle": () => (/* binding */ angle),
/* harmony export */   "bezier": () => (/* binding */ bezier),
/* harmony export */   "ceil": () => (/* binding */ ceil),
/* harmony export */   "clone": () => (/* binding */ clone),
/* harmony export */   "copy": () => (/* binding */ copy),
/* harmony export */   "create": () => (/* binding */ create),
/* harmony export */   "cross": () => (/* binding */ cross),
/* harmony export */   "dist": () => (/* binding */ dist),
/* harmony export */   "distance": () => (/* binding */ distance),
/* harmony export */   "div": () => (/* binding */ div),
/* harmony export */   "divide": () => (/* binding */ divide),
/* harmony export */   "dot": () => (/* binding */ dot),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "exactEquals": () => (/* binding */ exactEquals),
/* harmony export */   "floor": () => (/* binding */ floor),
/* harmony export */   "forEach": () => (/* binding */ forEach),
/* harmony export */   "fromValues": () => (/* binding */ fromValues),
/* harmony export */   "hermite": () => (/* binding */ hermite),
/* harmony export */   "inverse": () => (/* binding */ inverse),
/* harmony export */   "len": () => (/* binding */ len),
/* harmony export */   "length": () => (/* binding */ length),
/* harmony export */   "lerp": () => (/* binding */ lerp),
/* harmony export */   "max": () => (/* binding */ max),
/* harmony export */   "min": () => (/* binding */ min),
/* harmony export */   "mul": () => (/* binding */ mul),
/* harmony export */   "multiply": () => (/* binding */ multiply),
/* harmony export */   "negate": () => (/* binding */ negate),
/* harmony export */   "normalize": () => (/* binding */ normalize),
/* harmony export */   "random": () => (/* binding */ random),
/* harmony export */   "rotateX": () => (/* binding */ rotateX),
/* harmony export */   "rotateY": () => (/* binding */ rotateY),
/* harmony export */   "rotateZ": () => (/* binding */ rotateZ),
/* harmony export */   "round": () => (/* binding */ round),
/* harmony export */   "scale": () => (/* binding */ scale),
/* harmony export */   "scaleAndAdd": () => (/* binding */ scaleAndAdd),
/* harmony export */   "set": () => (/* binding */ set),
/* harmony export */   "sqrDist": () => (/* binding */ sqrDist),
/* harmony export */   "sqrLen": () => (/* binding */ sqrLen),
/* harmony export */   "squaredDistance": () => (/* binding */ squaredDistance),
/* harmony export */   "squaredLength": () => (/* binding */ squaredLength),
/* harmony export */   "str": () => (/* binding */ str),
/* harmony export */   "sub": () => (/* binding */ sub),
/* harmony export */   "subtract": () => (/* binding */ subtract),
/* harmony export */   "transformMat3": () => (/* binding */ transformMat3),
/* harmony export */   "transformMat4": () => (/* binding */ transformMat4),
/* harmony export */   "transformQuat": () => (/* binding */ transformQuat),
/* harmony export */   "zero": () => (/* binding */ zero)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common.js */ "./node_modules/gl-matrix/esm/common.js");

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */

function create() {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);

  if (_common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {ReadonlyVec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */

function clone(a) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */

function fromValues(x, y, z) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the source vector
 * @returns {vec3} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */

function set(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}
/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  return out;
}
/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to ceil
 * @returns {vec3} out
 */

function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out;
}
/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to floor
 * @returns {vec3} out
 */

function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out;
}
/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}
/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}
/**
 * Math.round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to round
 * @returns {vec3} out
 */

function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  return out;
}
/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */

function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} distance between a and b
 */

function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.hypot(x, y, z);
}
/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} squared distance between a and b
 */

function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return x * x + y * y + z * z;
}
/**
 * Calculates the squared length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */

function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return x * x + y * y + z * z;
}
/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to negate
 * @returns {vec3} out
 */

function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  return out;
}
/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to invert
 * @returns {vec3} out
 */

function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */

function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function cross(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2];
  var bx = b[0],
      by = b[1],
      bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  return out;
}
/**
 * Performs a hermite interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function hermite(out, a, b, c, d, t) {
  var factorTimes2 = t * t;
  var factor1 = factorTimes2 * (2 * t - 3) + 1;
  var factor2 = factorTimes2 * (t - 2) + t;
  var factor3 = factorTimes2 * (t - 1);
  var factor4 = factorTimes2 * (3 - 2 * t);
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function bezier(out, a, b, c, d, t) {
  var inverseFactor = 1 - t;
  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
  var factorTimes2 = t * t;
  var factor1 = inverseFactorTimesTwo * inverseFactor;
  var factor2 = 3 * t * inverseFactorTimesTwo;
  var factor3 = 3 * factorTimes2 * inverseFactor;
  var factor4 = factorTimes2 * t;
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */

function random(out, scale) {
  scale = scale || 1.0;
  var r = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2.0 * Math.PI;
  var z = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2.0 - 1.0;
  var zScale = Math.sqrt(1.0 - z * z) * scale;
  out[0] = Math.cos(r) * zScale;
  out[1] = Math.sin(r) * zScale;
  out[2] = z * scale;
  return out;
}
/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec3} out
 */

function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}
/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat3} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */

function transformMat3(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}
/**
 * Transforms the vec3 with a quat
 * Can also be used for dual quaternions. (Multiply it with the real part)
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyQuat} q quaternion to transform with
 * @returns {vec3} out
 */

function transformQuat(out, a, q) {
  // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3];
  var x = a[0],
      y = a[1],
      z = a[2]; // var qvec = [qx, qy, qz];
  // var uv = vec3.cross([], qvec, a);

  var uvx = qy * z - qz * y,
      uvy = qz * x - qx * z,
      uvz = qx * y - qy * x; // var uuv = vec3.cross([], qvec, uv);

  var uuvx = qy * uvz - qz * uvy,
      uuvy = qz * uvx - qx * uvz,
      uuvz = qx * uvy - qy * uvx; // vec3.scale(uv, uv, 2 * w);

  var w2 = qw * 2;
  uvx *= w2;
  uvy *= w2;
  uvz *= w2; // vec3.scale(uuv, uuv, 2);

  uuvx *= 2;
  uuvy *= 2;
  uuvz *= 2; // return vec3.add(out, a, vec3.add(out, uv, uuv));

  out[0] = x + uvx + uuvx;
  out[1] = y + uvy + uuvy;
  out[2] = z + uvz + uuvz;
  return out;
}
/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateX(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0];
  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateY(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateZ(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2]; //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Get the angle between two 3D vectors
 * @param {ReadonlyVec3} a The first operand
 * @param {ReadonlyVec3} b The second operand
 * @returns {Number} The angle in radians
 */

function angle(a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2],
      bx = b[0],
      by = b[1],
      bz = b[2],
      mag1 = Math.sqrt(ax * ax + ay * ay + az * az),
      mag2 = Math.sqrt(bx * bx + by * by + bz * bz),
      mag = mag1 * mag2,
      cosine = mag && dot(a, b) / mag;
  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}
/**
 * Set the components of a vec3 to zero
 *
 * @param {vec3} out the receiving vector
 * @returns {vec3} out
 */

function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec3} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str(a) {
  return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
}
/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2];
  return Math.abs(a0 - b0) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
}
/**
 * Alias for {@link vec3.subtract}
 * @function
 */

var sub = subtract;
/**
 * Alias for {@link vec3.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link vec3.divide}
 * @function
 */

var div = divide;
/**
 * Alias for {@link vec3.distance}
 * @function
 */

var dist = distance;
/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */

var sqrDist = squaredDistance;
/**
 * Alias for {@link vec3.length}
 * @function
 */

var len = length;
/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */

var sqrLen = squaredLength;
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
}();

/***/ }),

/***/ "./node_modules/gl-matrix/esm/vec4.js":
/*!********************************************!*\
  !*** ./node_modules/gl-matrix/esm/vec4.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "add": () => (/* binding */ add),
/* harmony export */   "ceil": () => (/* binding */ ceil),
/* harmony export */   "clone": () => (/* binding */ clone),
/* harmony export */   "copy": () => (/* binding */ copy),
/* harmony export */   "create": () => (/* binding */ create),
/* harmony export */   "cross": () => (/* binding */ cross),
/* harmony export */   "dist": () => (/* binding */ dist),
/* harmony export */   "distance": () => (/* binding */ distance),
/* harmony export */   "div": () => (/* binding */ div),
/* harmony export */   "divide": () => (/* binding */ divide),
/* harmony export */   "dot": () => (/* binding */ dot),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "exactEquals": () => (/* binding */ exactEquals),
/* harmony export */   "floor": () => (/* binding */ floor),
/* harmony export */   "forEach": () => (/* binding */ forEach),
/* harmony export */   "fromValues": () => (/* binding */ fromValues),
/* harmony export */   "inverse": () => (/* binding */ inverse),
/* harmony export */   "len": () => (/* binding */ len),
/* harmony export */   "length": () => (/* binding */ length),
/* harmony export */   "lerp": () => (/* binding */ lerp),
/* harmony export */   "max": () => (/* binding */ max),
/* harmony export */   "min": () => (/* binding */ min),
/* harmony export */   "mul": () => (/* binding */ mul),
/* harmony export */   "multiply": () => (/* binding */ multiply),
/* harmony export */   "negate": () => (/* binding */ negate),
/* harmony export */   "normalize": () => (/* binding */ normalize),
/* harmony export */   "random": () => (/* binding */ random),
/* harmony export */   "round": () => (/* binding */ round),
/* harmony export */   "scale": () => (/* binding */ scale),
/* harmony export */   "scaleAndAdd": () => (/* binding */ scaleAndAdd),
/* harmony export */   "set": () => (/* binding */ set),
/* harmony export */   "sqrDist": () => (/* binding */ sqrDist),
/* harmony export */   "sqrLen": () => (/* binding */ sqrLen),
/* harmony export */   "squaredDistance": () => (/* binding */ squaredDistance),
/* harmony export */   "squaredLength": () => (/* binding */ squaredLength),
/* harmony export */   "str": () => (/* binding */ str),
/* harmony export */   "sub": () => (/* binding */ sub),
/* harmony export */   "subtract": () => (/* binding */ subtract),
/* harmony export */   "transformMat4": () => (/* binding */ transformMat4),
/* harmony export */   "transformQuat": () => (/* binding */ transformQuat),
/* harmony export */   "zero": () => (/* binding */ zero)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common.js */ "./node_modules/gl-matrix/esm/common.js");

/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */

function create() {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(4);

  if (_common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }

  return out;
}
/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {ReadonlyVec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */

function clone(a) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */

function fromValues(x, y, z, w) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the source vector
 * @returns {vec4} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */

function set(out, x, y, z, w) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}
/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  out[3] = a[3] * b[3];
  return out;
}
/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  out[3] = a[3] / b[3];
  return out;
}
/**
 * Math.ceil the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to ceil
 * @returns {vec4} out
 */

function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  out[3] = Math.ceil(a[3]);
  return out;
}
/**
 * Math.floor the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to floor
 * @returns {vec4} out
 */

function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  out[3] = Math.floor(a[3]);
  return out;
}
/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  out[3] = Math.min(a[3], b[3]);
  return out;
}
/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  out[3] = Math.max(a[3], b[3]);
  return out;
}
/**
 * Math.round the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to round
 * @returns {vec4} out
 */

function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  out[3] = Math.round(a[3]);
  return out;
}
/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}
/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */

function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} distance between a and b
 */

function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return Math.hypot(x, y, z, w);
}
/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} squared distance between a and b
 */

function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return x * x + y * y + z * z + w * w;
}
/**
 * Calculates the length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return Math.hypot(x, y, z, w);
}
/**
 * Calculates the squared length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */

function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return x * x + y * y + z * z + w * w;
}
/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to negate
 * @returns {vec4} out
 */

function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = -a[3];
  return out;
}
/**
 * Returns the inverse of the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to invert
 * @returns {vec4} out
 */

function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  out[3] = 1.0 / a[3];
  return out;
}
/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
 * @returns {vec4} out
 */

function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }

  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
  return out;
}
/**
 * Calculates the dot product of two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
/**
 * Returns the cross-product of three vectors in a 4-dimensional space
 *
 * @param {ReadonlyVec4} result the receiving vector
 * @param {ReadonlyVec4} U the first vector
 * @param {ReadonlyVec4} V the second vector
 * @param {ReadonlyVec4} W the third vector
 * @returns {vec4} result
 */

function cross(out, u, v, w) {
  var A = v[0] * w[1] - v[1] * w[0],
      B = v[0] * w[2] - v[2] * w[0],
      C = v[0] * w[3] - v[3] * w[0],
      D = v[1] * w[2] - v[2] * w[1],
      E = v[1] * w[3] - v[3] * w[1],
      F = v[2] * w[3] - v[3] * w[2];
  var G = u[0];
  var H = u[1];
  var I = u[2];
  var J = u[3];
  out[0] = H * F - I * E + J * D;
  out[1] = -(G * F) + I * C - J * B;
  out[2] = G * E - H * C + J * A;
  out[3] = -(G * D) + H * B - I * A;
  return out;
}
/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec4} out
 */

function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  var aw = a[3];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  out[3] = aw + t * (b[3] - aw);
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec4} out
 */

function random(out, scale) {
  scale = scale || 1.0; // Marsaglia, George. Choosing a Point from the Surface of a
  // Sphere. Ann. Math. Statist. 43 (1972), no. 2, 645--646.
  // http://projecteuclid.org/euclid.aoms/1177692644;

  var v1, v2, v3, v4;
  var s1, s2;

  do {
    v1 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    v2 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    s1 = v1 * v1 + v2 * v2;
  } while (s1 >= 1);

  do {
    v3 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    v4 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    s2 = v3 * v3 + v4 * v4;
  } while (s2 >= 1);

  var d = Math.sqrt((1 - s1) / s2);
  out[0] = scale * v1;
  out[1] = scale * v2;
  out[2] = scale * v3 * d;
  out[3] = scale * v4 * d;
  return out;
}
/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec4} out
 */

function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2],
      w = a[3];
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return out;
}
/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyQuat} q quaternion to transform with
 * @returns {vec4} out
 */

function transformQuat(out, a, q) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3]; // calculate quat * vec

  var ix = qw * x + qy * z - qz * y;
  var iy = qw * y + qz * x - qx * z;
  var iz = qw * z + qx * y - qy * x;
  var iw = -qx * x - qy * y - qz * z; // calculate result * inverse quat

  out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  out[3] = a[3];
  return out;
}
/**
 * Set the components of a vec4 to zero
 *
 * @param {vec4} out the receiving vector
 * @returns {vec4} out
 */

function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec4} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str(a) {
  return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}
/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  return Math.abs(a0 - b0) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}
/**
 * Alias for {@link vec4.subtract}
 * @function
 */

var sub = subtract;
/**
 * Alias for {@link vec4.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link vec4.divide}
 * @function
 */

var div = divide;
/**
 * Alias for {@link vec4.distance}
 * @function
 */

var dist = distance;
/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */

var sqrDist = squaredDistance;
/**
 * Alias for {@link vec4.length}
 * @function
 */

var len = length;
/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */

var sqrLen = squaredLength;
/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 4;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
    }

    return a;
  };
}();

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/constants.js":
/*!*******************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/constants.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BASIC_EVENT_ALIASES": () => (/* binding */ BASIC_EVENT_ALIASES),
/* harmony export */   "EVENT_RECOGNIZER_MAP": () => (/* binding */ EVENT_RECOGNIZER_MAP),
/* harmony export */   "GESTURE_EVENT_ALIASES": () => (/* binding */ GESTURE_EVENT_ALIASES),
/* harmony export */   "INPUT_EVENT_TYPES": () => (/* binding */ INPUT_EVENT_TYPES),
/* harmony export */   "RECOGNIZERS": () => (/* binding */ RECOGNIZERS),
/* harmony export */   "RECOGNIZER_COMPATIBLE_MAP": () => (/* binding */ RECOGNIZER_COMPATIBLE_MAP),
/* harmony export */   "RECOGNIZER_FALLBACK_MAP": () => (/* binding */ RECOGNIZER_FALLBACK_MAP)
/* harmony export */ });
/* harmony import */ var _utils_hammer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/hammer */ "./node_modules/mjolnir.js/dist/esm/utils/hammer.js");

// This module contains constants that must be conditionally required
// due to `window`/`document` references downstream.
const RECOGNIZERS = _utils_hammer__WEBPACK_IMPORTED_MODULE_0__["default"]
    ? [
        [_utils_hammer__WEBPACK_IMPORTED_MODULE_0__["default"].Pan, { event: 'tripan', pointers: 3, threshold: 0, enable: false }],
        [_utils_hammer__WEBPACK_IMPORTED_MODULE_0__["default"].Rotate, { enable: false }],
        [_utils_hammer__WEBPACK_IMPORTED_MODULE_0__["default"].Pinch, { enable: false }],
        [_utils_hammer__WEBPACK_IMPORTED_MODULE_0__["default"].Swipe, { enable: false }],
        [_utils_hammer__WEBPACK_IMPORTED_MODULE_0__["default"].Pan, { threshold: 0, enable: false }],
        [_utils_hammer__WEBPACK_IMPORTED_MODULE_0__["default"].Press, { enable: false }],
        [_utils_hammer__WEBPACK_IMPORTED_MODULE_0__["default"].Tap, { event: 'doubletap', taps: 2, enable: false }],
        // TODO - rename to 'tap' and 'singletap' in the next major release
        [_utils_hammer__WEBPACK_IMPORTED_MODULE_0__["default"].Tap, { event: 'anytap', enable: false }],
        [_utils_hammer__WEBPACK_IMPORTED_MODULE_0__["default"].Tap, { enable: false }]
    ]
    : null;
// Recognize the following gestures even if a given recognizer succeeds
const RECOGNIZER_COMPATIBLE_MAP = {
    tripan: ['rotate', 'pinch', 'pan'],
    rotate: ['pinch'],
    pinch: ['pan'],
    pan: ['press', 'doubletap', 'anytap', 'tap'],
    doubletap: ['anytap'],
    anytap: ['tap']
};
// Recognize the folling gestures only if a given recognizer fails
const RECOGNIZER_FALLBACK_MAP = {
    doubletap: ['tap']
};
/**
 * Only one set of basic input events will be fired by Hammer.js:
 * either pointer, touch, or mouse, depending on system support.
 * In order to enable an application to be agnostic of system support,
 * alias basic input events into "classes" of events: down, move, and up.
 * See `_onBasicInput()` for usage of these aliases.
 */
const BASIC_EVENT_ALIASES = {
    pointerdown: 'pointerdown',
    pointermove: 'pointermove',
    pointerup: 'pointerup',
    touchstart: 'pointerdown',
    touchmove: 'pointermove',
    touchend: 'pointerup',
    mousedown: 'pointerdown',
    mousemove: 'pointermove',
    mouseup: 'pointerup'
};
const INPUT_EVENT_TYPES = {
    KEY_EVENTS: ['keydown', 'keyup'],
    MOUSE_EVENTS: ['mousedown', 'mousemove', 'mouseup', 'mouseover', 'mouseout', 'mouseleave'],
    WHEEL_EVENTS: [
        // Chrome, Safari
        'wheel',
        // IE
        'mousewheel'
    ]
};
/**
 * "Gestural" events are those that have semantic meaning beyond the basic input event,
 * e.g. a click or tap is a sequence of `down` and `up` events with no `move` event in between.
 * Hammer.js handles these with its Recognizer system;
 * this block maps event names to the Recognizers required to detect the events.
 */
const EVENT_RECOGNIZER_MAP = {
    tap: 'tap',
    anytap: 'anytap',
    doubletap: 'doubletap',
    press: 'press',
    pinch: 'pinch',
    pinchin: 'pinch',
    pinchout: 'pinch',
    pinchstart: 'pinch',
    pinchmove: 'pinch',
    pinchend: 'pinch',
    pinchcancel: 'pinch',
    rotate: 'rotate',
    rotatestart: 'rotate',
    rotatemove: 'rotate',
    rotateend: 'rotate',
    rotatecancel: 'rotate',
    tripan: 'tripan',
    tripanstart: 'tripan',
    tripanmove: 'tripan',
    tripanup: 'tripan',
    tripandown: 'tripan',
    tripanleft: 'tripan',
    tripanright: 'tripan',
    tripanend: 'tripan',
    tripancancel: 'tripan',
    pan: 'pan',
    panstart: 'pan',
    panmove: 'pan',
    panup: 'pan',
    pandown: 'pan',
    panleft: 'pan',
    panright: 'pan',
    panend: 'pan',
    pancancel: 'pan',
    swipe: 'swipe',
    swipeleft: 'swipe',
    swiperight: 'swipe',
    swipeup: 'swipe',
    swipedown: 'swipe'
};
/**
 * Map gestural events typically provided by browsers
 * that are not reported in 'hammer.input' events
 * to corresponding Hammer.js gestures.
 */
const GESTURE_EVENT_ALIASES = {
    click: 'tap',
    anyclick: 'anytap',
    dblclick: 'doubletap',
    mousedown: 'pointerdown',
    mousemove: 'pointermove',
    mouseup: 'pointerup',
    mouseover: 'pointerover',
    mouseout: 'pointerout',
    mouseleave: 'pointerleave'
};
//# sourceMappingURL=constants.js.map

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/event-manager.js":
/*!***********************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/event-manager.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ EventManager)
/* harmony export */ });
/* harmony import */ var _utils_hammer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/hammer */ "./node_modules/mjolnir.js/dist/esm/utils/hammer.js");
/* harmony import */ var _inputs_wheel_input__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./inputs/wheel-input */ "./node_modules/mjolnir.js/dist/esm/inputs/wheel-input.js");
/* harmony import */ var _inputs_move_input__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./inputs/move-input */ "./node_modules/mjolnir.js/dist/esm/inputs/move-input.js");
/* harmony import */ var _inputs_key_input__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./inputs/key-input */ "./node_modules/mjolnir.js/dist/esm/inputs/key-input.js");
/* harmony import */ var _inputs_contextmenu_input__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./inputs/contextmenu-input */ "./node_modules/mjolnir.js/dist/esm/inputs/contextmenu-input.js");
/* harmony import */ var _utils_event_registrar__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils/event-registrar */ "./node_modules/mjolnir.js/dist/esm/utils/event-registrar.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./constants */ "./node_modules/mjolnir.js/dist/esm/constants.js");







const DEFAULT_OPTIONS = {
    // event handlers
    events: null,
    // custom recognizers
    recognizers: null,
    recognizerOptions: {},
    // Manager class
    Manager: _utils_hammer__WEBPACK_IMPORTED_MODULE_0__.Manager,
    // allow browser default touch action
    // https://github.com/uber/react-map-gl/issues/506
    touchAction: 'none',
    tabIndex: 0
};
// Unified API for subscribing to events about both
// basic input events (e.g. 'mousemove', 'touchstart', 'wheel')
// and gestural input (e.g. 'click', 'tap', 'panstart').
// Delegates gesture related event registration and handling to Hammer.js.
class EventManager {
    constructor(element = null, options) {
        /**
         * Handle basic events using the 'hammer.input' Hammer.js API:
         * Before running Recognizers, Hammer emits a 'hammer.input' event
         * with the basic event info. This function emits all basic events
         * aliased to the "class" of event received.
         * See constants.BASIC_EVENT_CLASSES basic event class definitions.
         */
        this._onBasicInput = (event) => {
            const { srcEvent } = event;
            const alias = _constants__WEBPACK_IMPORTED_MODULE_6__.BASIC_EVENT_ALIASES[srcEvent.type];
            if (alias) {
                // fire all events aliased to srcEvent.type
                this.manager.emit(alias, event);
            }
        };
        /**
         * Handle events not supported by Hammer.js,
         * and pipe back out through same (Hammer) channel used by other events.
         */
        this._onOtherEvent = (event) => {
            // console.log('onotherevent', event.type, event)
            this.manager.emit(event.type, event);
        };
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.events = new Map();
        this.setElement(element);
        // Register all passed events.
        const { events } = this.options;
        if (events) {
            this.on(events);
        }
    }
    getElement() {
        return this.element;
    }
    setElement(element) {
        if (this.element) {
            // unregister all events
            this.destroy();
        }
        this.element = element;
        if (!element) {
            return;
        }
        const { options } = this;
        const ManagerClass = options.Manager;
        this.manager = new ManagerClass(element, {
            touchAction: options.touchAction,
            recognizers: options.recognizers || _constants__WEBPACK_IMPORTED_MODULE_6__.RECOGNIZERS
        }).on('hammer.input', this._onBasicInput);
        if (!options.recognizers) {
            // Set default recognize withs
            // http://hammerjs.github.io/recognize-with/
            Object.keys(_constants__WEBPACK_IMPORTED_MODULE_6__.RECOGNIZER_COMPATIBLE_MAP).forEach(name => {
                const recognizer = this.manager.get(name);
                if (recognizer) {
                    _constants__WEBPACK_IMPORTED_MODULE_6__.RECOGNIZER_COMPATIBLE_MAP[name].forEach(otherName => {
                        recognizer.recognizeWith(otherName);
                    });
                }
            });
        }
        // Set recognizer options
        for (const recognizerName in options.recognizerOptions) {
            const recognizer = this.manager.get(recognizerName);
            if (recognizer) {
                const recognizerOption = options.recognizerOptions[recognizerName];
                // `enable` is managed by the event registrations
                delete recognizerOption.enable;
                recognizer.set(recognizerOption);
            }
        }
        // Handle events not handled by Hammer.js:
        // - mouse wheel
        // - pointer/touch/mouse move
        this.wheelInput = new _inputs_wheel_input__WEBPACK_IMPORTED_MODULE_1__["default"](element, this._onOtherEvent, {
            enable: false
        });
        this.moveInput = new _inputs_move_input__WEBPACK_IMPORTED_MODULE_2__["default"](element, this._onOtherEvent, {
            enable: false
        });
        this.keyInput = new _inputs_key_input__WEBPACK_IMPORTED_MODULE_3__["default"](element, this._onOtherEvent, {
            enable: false,
            tabIndex: options.tabIndex
        });
        this.contextmenuInput = new _inputs_contextmenu_input__WEBPACK_IMPORTED_MODULE_4__["default"](element, this._onOtherEvent, {
            enable: false
        });
        // Register all existing events
        for (const [eventAlias, eventRegistrar] of this.events) {
            if (!eventRegistrar.isEmpty()) {
                // Enable recognizer for this event.
                this._toggleRecognizer(eventRegistrar.recognizerName, true);
                this.manager.on(eventAlias, eventRegistrar.handleEvent);
            }
        }
    }
    // Tear down internal event management implementations.
    destroy() {
        if (this.element) {
            // wheelInput etc. are created in setElement() and therefore
            // cannot exist if there is no element
            this.wheelInput.destroy();
            this.moveInput.destroy();
            this.keyInput.destroy();
            this.contextmenuInput.destroy();
            this.manager.destroy();
            this.wheelInput = null;
            this.moveInput = null;
            this.keyInput = null;
            this.contextmenuInput = null;
            this.manager = null;
            this.element = null;
        }
    }
    /** Register an event handler function to be called on `event` */
    on(event, handler, opts) {
        this._addEventHandler(event, handler, opts, false);
    }
    once(event, handler, opts) {
        this._addEventHandler(event, handler, opts, true);
    }
    watch(event, handler, opts) {
        this._addEventHandler(event, handler, opts, false, true);
    }
    off(event, handler) {
        this._removeEventHandler(event, handler);
    }
    /*
     * Enable/disable recognizer for the given event
     */
    _toggleRecognizer(name, enabled) {
        const { manager } = this;
        if (!manager) {
            return;
        }
        const recognizer = manager.get(name);
        // @ts-ignore
        if (recognizer && recognizer.options.enable !== enabled) {
            recognizer.set({ enable: enabled });
            const fallbackRecognizers = _constants__WEBPACK_IMPORTED_MODULE_6__.RECOGNIZER_FALLBACK_MAP[name];
            if (fallbackRecognizers && !this.options.recognizers) {
                // Set default require failures
                // http://hammerjs.github.io/require-failure/
                fallbackRecognizers.forEach(otherName => {
                    const otherRecognizer = manager.get(otherName);
                    if (enabled) {
                        // Wait for this recognizer to fail
                        otherRecognizer.requireFailure(name);
                        /**
                         * This seems to be a bug in hammerjs:
                         * requireFailure() adds both ways
                         * dropRequireFailure() only drops one way
                         * https://github.com/hammerjs/hammer.js/blob/master/src/recognizerjs/
                           recognizer-constructor.js#L136
                         */
                        recognizer.dropRequireFailure(otherName);
                    }
                    else {
                        // Do not wait for this recognizer to fail
                        otherRecognizer.dropRequireFailure(name);
                    }
                });
            }
        }
        this.wheelInput.enableEventType(name, enabled);
        this.moveInput.enableEventType(name, enabled);
        this.keyInput.enableEventType(name, enabled);
        this.contextmenuInput.enableEventType(name, enabled);
    }
    /**
     * Process the event registration for a single event + handler.
     */
    _addEventHandler(event, handler, opts, once, passive) {
        if (typeof event !== 'string') {
            // @ts-ignore
            opts = handler;
            // If `event` is a map, call `on()` for each entry.
            for (const eventName in event) {
                this._addEventHandler(eventName, event[eventName], opts, once, passive);
            }
            return;
        }
        const { manager, events } = this;
        // Alias to a recognized gesture as necessary.
        const eventAlias = _constants__WEBPACK_IMPORTED_MODULE_6__.GESTURE_EVENT_ALIASES[event] || event;
        let eventRegistrar = events.get(eventAlias);
        if (!eventRegistrar) {
            eventRegistrar = new _utils_event_registrar__WEBPACK_IMPORTED_MODULE_5__["default"](this);
            events.set(eventAlias, eventRegistrar);
            // Enable recognizer for this event.
            eventRegistrar.recognizerName = _constants__WEBPACK_IMPORTED_MODULE_6__.EVENT_RECOGNIZER_MAP[eventAlias] || eventAlias;
            // Listen to the event
            if (manager) {
                manager.on(eventAlias, eventRegistrar.handleEvent);
            }
        }
        eventRegistrar.add(event, handler, opts, once, passive);
        if (!eventRegistrar.isEmpty()) {
            this._toggleRecognizer(eventRegistrar.recognizerName, true);
        }
    }
    /**
     * Process the event deregistration for a single event + handler.
     */
    _removeEventHandler(event, handler) {
        if (typeof event !== 'string') {
            // If `event` is a map, call `off()` for each entry.
            for (const eventName in event) {
                this._removeEventHandler(eventName, event[eventName]);
            }
            return;
        }
        const { events } = this;
        // Alias to a recognized gesture as necessary.
        const eventAlias = _constants__WEBPACK_IMPORTED_MODULE_6__.GESTURE_EVENT_ALIASES[event] || event;
        const eventRegistrar = events.get(eventAlias);
        if (!eventRegistrar) {
            return;
        }
        eventRegistrar.remove(event, handler);
        if (eventRegistrar.isEmpty()) {
            const { recognizerName } = eventRegistrar;
            // Disable recognizer if no more handlers are attached to its events
            let isRecognizerUsed = false;
            for (const eh of events.values()) {
                if (eh.recognizerName === recognizerName && !eh.isEmpty()) {
                    isRecognizerUsed = true;
                    break;
                }
            }
            if (!isRecognizerUsed) {
                this._toggleRecognizer(recognizerName, false);
            }
        }
    }
}
//# sourceMappingURL=event-manager.js.map

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/index.js":
/*!***************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/index.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EventManager": () => (/* reexport safe */ _event_manager__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _event_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./event-manager */ "./node_modules/mjolnir.js/dist/esm/event-manager.js");

//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/inputs/contextmenu-input.js":
/*!**********************************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/inputs/contextmenu-input.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ContextmenuInput)
/* harmony export */ });
/* harmony import */ var _input__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./input */ "./node_modules/mjolnir.js/dist/esm/inputs/input.js");

const EVENT_TYPE = 'contextmenu';
class ContextmenuInput extends _input__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(element, callback, options) {
        super(element, callback, options);
        this.handleEvent = (event) => {
            if (!this.options.enable) {
                return;
            }
            this.callback({
                type: EVENT_TYPE,
                center: {
                    x: event.clientX,
                    y: event.clientY
                },
                srcEvent: event,
                pointerType: 'mouse',
                target: event.target
            });
        };
        element.addEventListener('contextmenu', this.handleEvent);
    }
    destroy() {
        this.element.removeEventListener('contextmenu', this.handleEvent);
    }
    /**
     * Enable this input (begin processing events)
     * if the specified event type is among those handled by this input.
     */
    enableEventType(eventType, enabled) {
        if (eventType === EVENT_TYPE) {
            this.options.enable = enabled;
        }
    }
}
//# sourceMappingURL=contextmenu-input.js.map

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/inputs/input.js":
/*!**********************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/inputs/input.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Input)
/* harmony export */ });
class Input {
    constructor(element, callback, options) {
        this.element = element;
        this.callback = callback;
        this.options = { enable: true, ...options };
    }
}
//# sourceMappingURL=input.js.map

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/inputs/key-input.js":
/*!**************************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/inputs/key-input.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ KeyInput)
/* harmony export */ });
/* harmony import */ var _input__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./input */ "./node_modules/mjolnir.js/dist/esm/inputs/input.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../constants */ "./node_modules/mjolnir.js/dist/esm/constants.js");


const { KEY_EVENTS } = _constants__WEBPACK_IMPORTED_MODULE_1__.INPUT_EVENT_TYPES;
const DOWN_EVENT_TYPE = 'keydown';
const UP_EVENT_TYPE = 'keyup';
class KeyInput extends _input__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(element, callback, options) {
        super(element, callback, options);
        this.handleEvent = (event) => {
            // Ignore if focused on text input
            const targetElement = (event.target || event.srcElement);
            if ((targetElement.tagName === 'INPUT' && targetElement.type === 'text') ||
                targetElement.tagName === 'TEXTAREA') {
                return;
            }
            if (this.enableDownEvent && event.type === 'keydown') {
                this.callback({
                    type: DOWN_EVENT_TYPE,
                    srcEvent: event,
                    key: event.key,
                    target: event.target
                });
            }
            if (this.enableUpEvent && event.type === 'keyup') {
                this.callback({
                    type: UP_EVENT_TYPE,
                    srcEvent: event,
                    key: event.key,
                    target: event.target
                });
            }
        };
        this.enableDownEvent = this.options.enable;
        this.enableUpEvent = this.options.enable;
        this.events = (this.options.events || []).concat(KEY_EVENTS);
        element.tabIndex = this.options.tabIndex || 0;
        element.style.outline = 'none';
        this.events.forEach(event => element.addEventListener(event, this.handleEvent));
    }
    destroy() {
        this.events.forEach(event => this.element.removeEventListener(event, this.handleEvent));
    }
    /**
     * Enable this input (begin processing events)
     * if the specified event type is among those handled by this input.
     */
    enableEventType(eventType, enabled) {
        if (eventType === DOWN_EVENT_TYPE) {
            this.enableDownEvent = enabled;
        }
        if (eventType === UP_EVENT_TYPE) {
            this.enableUpEvent = enabled;
        }
    }
}
//# sourceMappingURL=key-input.js.map

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/inputs/move-input.js":
/*!***************************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/inputs/move-input.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MoveInput)
/* harmony export */ });
/* harmony import */ var _input__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./input */ "./node_modules/mjolnir.js/dist/esm/inputs/input.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../constants */ "./node_modules/mjolnir.js/dist/esm/constants.js");


const { MOUSE_EVENTS } = _constants__WEBPACK_IMPORTED_MODULE_1__.INPUT_EVENT_TYPES;
const MOVE_EVENT_TYPE = 'pointermove';
const OVER_EVENT_TYPE = 'pointerover';
const OUT_EVENT_TYPE = 'pointerout';
const ENTER_EVENT_TYPE = 'pointerenter';
const LEAVE_EVENT_TYPE = 'pointerleave';
/**
 * Hammer.js swallows 'move' events (for pointer/touch/mouse)
 * when the pointer is not down. This class sets up a handler
 * specifically for these events to work around this limitation.
 * Note that this could be extended to more intelligently handle
 * move events across input types, e.g. storing multiple simultaneous
 * pointer/touch events, calculating speed/direction, etc.
 */
class MoveInput extends _input__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(element, callback, options) {
        super(element, callback, options);
        this.handleEvent = (event) => {
            this.handleOverEvent(event);
            this.handleOutEvent(event);
            this.handleEnterEvent(event);
            this.handleLeaveEvent(event);
            this.handleMoveEvent(event);
        };
        this.pressed = false;
        const { enable } = this.options;
        this.enableMoveEvent = enable;
        this.enableLeaveEvent = enable;
        this.enableEnterEvent = enable;
        this.enableOutEvent = enable;
        this.enableOverEvent = enable;
        this.events = (this.options.events || []).concat(MOUSE_EVENTS);
        this.events.forEach(event => element.addEventListener(event, this.handleEvent));
    }
    destroy() {
        this.events.forEach(event => this.element.removeEventListener(event, this.handleEvent));
    }
    /**
     * Enable this input (begin processing events)
     * if the specified event type is among those handled by this input.
     */
    enableEventType(eventType, enabled) {
        if (eventType === MOVE_EVENT_TYPE) {
            this.enableMoveEvent = enabled;
        }
        if (eventType === OVER_EVENT_TYPE) {
            this.enableOverEvent = enabled;
        }
        if (eventType === OUT_EVENT_TYPE) {
            this.enableOutEvent = enabled;
        }
        if (eventType === ENTER_EVENT_TYPE) {
            this.enableEnterEvent = enabled;
        }
        if (eventType === LEAVE_EVENT_TYPE) {
            this.enableLeaveEvent = enabled;
        }
    }
    handleOverEvent(event) {
        if (this.enableOverEvent) {
            if (event.type === 'mouseover') {
                this._emit(OVER_EVENT_TYPE, event);
            }
        }
    }
    handleOutEvent(event) {
        if (this.enableOutEvent) {
            if (event.type === 'mouseout') {
                this._emit(OUT_EVENT_TYPE, event);
            }
        }
    }
    handleEnterEvent(event) {
        if (this.enableEnterEvent) {
            if (event.type === 'mouseenter') {
                this._emit(ENTER_EVENT_TYPE, event);
            }
        }
    }
    handleLeaveEvent(event) {
        if (this.enableLeaveEvent) {
            if (event.type === 'mouseleave') {
                this._emit(LEAVE_EVENT_TYPE, event);
            }
        }
    }
    handleMoveEvent(event) {
        if (this.enableMoveEvent) {
            switch (event.type) {
                case 'mousedown':
                    if (event.button >= 0) {
                        // Button is down
                        this.pressed = true;
                    }
                    break;
                case 'mousemove':
                    // Move events use `which` to track the button being pressed
                    if (event.which === 0) {
                        // Button is not down
                        this.pressed = false;
                    }
                    if (!this.pressed) {
                        // Drag events are emitted by hammer already
                        // we just need to emit the move event on hover
                        this._emit(MOVE_EVENT_TYPE, event);
                    }
                    break;
                case 'mouseup':
                    this.pressed = false;
                    break;
                default:
            }
        }
    }
    _emit(type, event) {
        this.callback({
            type,
            center: {
                x: event.clientX,
                y: event.clientY
            },
            srcEvent: event,
            pointerType: 'mouse',
            target: event.target
        });
    }
}
//# sourceMappingURL=move-input.js.map

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/inputs/wheel-input.js":
/*!****************************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/inputs/wheel-input.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ WheelInput)
/* harmony export */ });
/* harmony import */ var _input__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./input */ "./node_modules/mjolnir.js/dist/esm/inputs/input.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../constants */ "./node_modules/mjolnir.js/dist/esm/constants.js");
/* harmony import */ var _utils_globals__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/globals */ "./node_modules/mjolnir.js/dist/esm/utils/globals.js");



const firefox = _utils_globals__WEBPACK_IMPORTED_MODULE_2__.userAgent.indexOf('firefox') !== -1;
const { WHEEL_EVENTS } = _constants__WEBPACK_IMPORTED_MODULE_1__.INPUT_EVENT_TYPES;
const EVENT_TYPE = 'wheel';
// Constants for normalizing input delta
const WHEEL_DELTA_MAGIC_SCALER = 4.000244140625;
const WHEEL_DELTA_PER_LINE = 40;
// Slow down zoom if shift key is held for more precise zooming
const SHIFT_MULTIPLIER = 0.25;
class WheelInput extends _input__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(element, callback, options) {
        super(element, callback, options);
        /* eslint-disable complexity, max-statements */
        this.handleEvent = (event) => {
            if (!this.options.enable) {
                return;
            }
            let value = event.deltaY;
            if (_utils_globals__WEBPACK_IMPORTED_MODULE_2__.window.WheelEvent) {
                // Firefox doubles the values on retina screens...
                if (firefox && event.deltaMode === _utils_globals__WEBPACK_IMPORTED_MODULE_2__.window.WheelEvent.DOM_DELTA_PIXEL) {
                    value /= _utils_globals__WEBPACK_IMPORTED_MODULE_2__.window.devicePixelRatio;
                }
                if (event.deltaMode === _utils_globals__WEBPACK_IMPORTED_MODULE_2__.window.WheelEvent.DOM_DELTA_LINE) {
                    value *= WHEEL_DELTA_PER_LINE;
                }
            }
            if (value !== 0 && value % WHEEL_DELTA_MAGIC_SCALER === 0) {
                // This one is definitely a mouse wheel event.
                // Normalize this value to match trackpad.
                value = Math.floor(value / WHEEL_DELTA_MAGIC_SCALER);
            }
            if (event.shiftKey && value) {
                value = value * SHIFT_MULTIPLIER;
            }
            this.callback({
                type: EVENT_TYPE,
                center: {
                    x: event.clientX,
                    y: event.clientY
                },
                delta: -value,
                srcEvent: event,
                pointerType: 'mouse',
                target: event.target
            });
        };
        this.events = (this.options.events || []).concat(WHEEL_EVENTS);
        this.events.forEach(event => element.addEventListener(event, this.handleEvent, _utils_globals__WEBPACK_IMPORTED_MODULE_2__.passiveSupported ? { passive: false } : false));
    }
    destroy() {
        this.events.forEach(event => this.element.removeEventListener(event, this.handleEvent));
    }
    /**
     * Enable this input (begin processing events)
     * if the specified event type is among those handled by this input.
     */
    enableEventType(eventType, enabled) {
        if (eventType === EVENT_TYPE) {
            this.options.enable = enabled;
        }
    }
}
//# sourceMappingURL=wheel-input.js.map

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/utils/event-registrar.js":
/*!*******************************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/utils/event-registrar.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ EventRegistrar)
/* harmony export */ });
/* harmony import */ var _event_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./event-utils */ "./node_modules/mjolnir.js/dist/esm/utils/event-utils.js");

const DEFAULT_OPTIONS = {
    srcElement: 'root',
    priority: 0
};
class EventRegistrar {
    constructor(eventManager) {
        /**
         * Handles hammerjs event
         */
        this.handleEvent = (event) => {
            if (this.isEmpty()) {
                return;
            }
            const mjolnirEvent = this._normalizeEvent(event);
            let target = event.srcEvent.target;
            while (target && target !== mjolnirEvent.rootElement) {
                this._emit(mjolnirEvent, target);
                if (mjolnirEvent.handled) {
                    return;
                }
                target = target.parentNode;
            }
            this._emit(mjolnirEvent, 'root');
        };
        this.eventManager = eventManager;
        this.handlers = [];
        // Element -> handler map
        this.handlersByElement = new Map();
        this._active = false;
    }
    // Returns true if there are no non-passive handlers
    isEmpty() {
        return !this._active;
    }
    add(type, handler, options, once = false, passive = false) {
        const { handlers, handlersByElement } = this;
        let opts = DEFAULT_OPTIONS;
        if (typeof options === 'string' || (options && options.addEventListener)) {
            // is DOM element, backward compatibility
            // @ts-ignore
            opts = { ...DEFAULT_OPTIONS, srcElement: options };
        }
        else if (options) {
            opts = { ...DEFAULT_OPTIONS, ...options };
        }
        let entries = handlersByElement.get(opts.srcElement);
        if (!entries) {
            entries = [];
            handlersByElement.set(opts.srcElement, entries);
        }
        const entry = {
            type,
            handler,
            srcElement: opts.srcElement,
            priority: opts.priority
        };
        if (once) {
            entry.once = true;
        }
        if (passive) {
            entry.passive = true;
        }
        handlers.push(entry);
        this._active = this._active || !entry.passive;
        // Sort handlers by descending priority
        // Handlers with the same priority are excuted in the order of registration
        let insertPosition = entries.length - 1;
        while (insertPosition >= 0) {
            if (entries[insertPosition].priority >= entry.priority) {
                break;
            }
            insertPosition--;
        }
        entries.splice(insertPosition + 1, 0, entry);
    }
    remove(type, handler) {
        const { handlers, handlersByElement } = this;
        for (let i = handlers.length - 1; i >= 0; i--) {
            const entry = handlers[i];
            if (entry.type === type && entry.handler === handler) {
                handlers.splice(i, 1);
                const entries = handlersByElement.get(entry.srcElement);
                entries.splice(entries.indexOf(entry), 1);
                if (entries.length === 0) {
                    handlersByElement.delete(entry.srcElement);
                }
            }
        }
        this._active = handlers.some(entry => !entry.passive);
    }
    /**
     * Invoke handlers on a particular element
     */
    _emit(event, srcElement) {
        const entries = this.handlersByElement.get(srcElement);
        if (entries) {
            let immediatePropagationStopped = false;
            // Prevents the current event from bubbling up
            const stopPropagation = () => {
                event.handled = true;
            };
            // Prevent any remaining listeners from being called
            const stopImmediatePropagation = () => {
                event.handled = true;
                immediatePropagationStopped = true;
            };
            const entriesToRemove = [];
            for (let i = 0; i < entries.length; i++) {
                const { type, handler, once } = entries[i];
                handler({
                    ...event,
                    // @ts-ignore
                    type,
                    stopPropagation,
                    stopImmediatePropagation
                });
                if (once) {
                    entriesToRemove.push(entries[i]);
                }
                if (immediatePropagationStopped) {
                    break;
                }
            }
            for (let i = 0; i < entriesToRemove.length; i++) {
                const { type, handler } = entriesToRemove[i];
                this.remove(type, handler);
            }
        }
    }
    /**
     * Normalizes hammerjs and custom events to have predictable fields.
     */
    _normalizeEvent(event) {
        const rootElement = this.eventManager.getElement();
        return {
            ...event,
            ...(0,_event_utils__WEBPACK_IMPORTED_MODULE_0__.whichButtons)(event),
            ...(0,_event_utils__WEBPACK_IMPORTED_MODULE_0__.getOffsetPosition)(event, rootElement),
            preventDefault: () => {
                event.srcEvent.preventDefault();
            },
            stopImmediatePropagation: null,
            stopPropagation: null,
            handled: false,
            rootElement
        };
    }
}
//# sourceMappingURL=event-registrar.js.map

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/utils/event-utils.js":
/*!***************************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/utils/event-utils.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getOffsetPosition": () => (/* binding */ getOffsetPosition),
/* harmony export */   "whichButtons": () => (/* binding */ whichButtons)
/* harmony export */ });
/* Constants */
const DOWN_EVENT = 1;
const MOVE_EVENT = 2;
const UP_EVENT = 4;
const MOUSE_EVENTS = {
    pointerdown: DOWN_EVENT,
    pointermove: MOVE_EVENT,
    pointerup: UP_EVENT,
    mousedown: DOWN_EVENT,
    mousemove: MOVE_EVENT,
    mouseup: UP_EVENT
};
// MouseEvent.which https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/which
const MOUSE_EVENT_WHICH_LEFT = 1;
const MOUSE_EVENT_WHICH_MIDDLE = 2;
const MOUSE_EVENT_WHICH_RIGHT = 3;
// MouseEvent.button https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const MOUSE_EVENT_BUTTON_LEFT = 0;
const MOUSE_EVENT_BUTTON_MIDDLE = 1;
const MOUSE_EVENT_BUTTON_RIGHT = 2;
// MouseEvent.buttons https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
const MOUSE_EVENT_BUTTONS_LEFT_MASK = 1;
const MOUSE_EVENT_BUTTONS_RIGHT_MASK = 2;
const MOUSE_EVENT_BUTTONS_MIDDLE_MASK = 4;
/**
 * Extract the involved mouse button
 */
function whichButtons(event) {
    const eventType = MOUSE_EVENTS[event.srcEvent.type];
    if (!eventType) {
        // Not a mouse evet
        return null;
    }
    const { buttons, button, which } = event.srcEvent;
    let leftButton = false;
    let middleButton = false;
    let rightButton = false;
    if (
    // button is up, need to find out which one was pressed before
    eventType === UP_EVENT ||
        // moving but does not support `buttons` API
        (eventType === MOVE_EVENT && !Number.isFinite(buttons))) {
        leftButton = which === MOUSE_EVENT_WHICH_LEFT;
        middleButton = which === MOUSE_EVENT_WHICH_MIDDLE;
        rightButton = which === MOUSE_EVENT_WHICH_RIGHT;
    }
    else if (eventType === MOVE_EVENT) {
        leftButton = Boolean(buttons & MOUSE_EVENT_BUTTONS_LEFT_MASK);
        middleButton = Boolean(buttons & MOUSE_EVENT_BUTTONS_MIDDLE_MASK);
        rightButton = Boolean(buttons & MOUSE_EVENT_BUTTONS_RIGHT_MASK);
    }
    else if (eventType === DOWN_EVENT) {
        leftButton = button === MOUSE_EVENT_BUTTON_LEFT;
        middleButton = button === MOUSE_EVENT_BUTTON_MIDDLE;
        rightButton = button === MOUSE_EVENT_BUTTON_RIGHT;
    }
    return { leftButton, middleButton, rightButton };
}
/**
 * Calculate event position relative to the root element
 */
function getOffsetPosition(event, rootElement) {
    const center = event.center;
    // `center` is a hammer.js event property
    if (!center) {
        // Not a gestural event
        return null;
    }
    const rect = rootElement.getBoundingClientRect();
    // Fix scale for map affected by a CSS transform.
    // See https://stackoverflow.com/a/26893663/3528533
    const scaleX = rect.width / rootElement.offsetWidth || 1;
    const scaleY = rect.height / rootElement.offsetHeight || 1;
    // Calculate center relative to the root element
    const offsetCenter = {
        x: (center.x - rect.left - rootElement.clientLeft) / scaleX,
        y: (center.y - rect.top - rootElement.clientTop) / scaleY
    };
    return { center, offsetCenter };
}
//# sourceMappingURL=event-utils.js.map

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/utils/globals.js":
/*!***********************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/utils/globals.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "document": () => (/* binding */ document_),
/* harmony export */   "global": () => (/* binding */ global_),
/* harmony export */   "passiveSupported": () => (/* binding */ passiveSupported),
/* harmony export */   "userAgent": () => (/* binding */ userAgent),
/* harmony export */   "window": () => (/* binding */ window_)
/* harmony export */ });
// Purpose: include this in your module to avoids adding dependencies on
// micro modules like 'global'
/* global window, global, document, navigator */
const userAgent = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent.toLowerCase() : '';
const window_ = typeof window !== 'undefined' ? window : global;
const global_ = typeof global !== 'undefined' ? global : window;
const document_ = typeof document !== 'undefined' ? document : {};

/*
 * Detect whether passive option is supported by the current browser.
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
   #Safely_detecting_option_support
 */
let passiveSupported = false;
/* eslint-disable accessor-pairs, no-empty */
try {
    const options = {
        // This function will be called when the browser
        // attempts to access the passive property.
        get passive() {
            passiveSupported = true;
            return true;
        }
    };
    window_.addEventListener('test', null, options);
    window_.removeEventListener('test', null);
}
catch (err) {
    passiveSupported = false;
}

//# sourceMappingURL=globals.js.map

/***/ }),

/***/ "./node_modules/mjolnir.js/dist/esm/utils/hammer.js":
/*!**********************************************************!*\
  !*** ./node_modules/mjolnir.js/dist/esm/utils/hammer.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Manager": () => (/* binding */ Manager),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Hammer.Manager mock for use in environments without `document` / `window`.
class HammerManagerMock {
    constructor() {
        this.get = () => null;
        this.set = () => this;
        this.on = () => this;
        this.off = () => this;
        this.destroy = () => this;
        this.emit = () => this;
    }
}
const Manager = HammerManagerMock;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (null);
//# sourceMappingURL=hammer.js.map

/***/ }),

/***/ "./src/styles/index.scss":
/*!*******************************!*\
  !*** ./src/styles/index.scss ***!
  \*******************************/
/***/ (() => {



/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/attribution-control.js":
/*!******************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/attribution-control.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/mapboxgl */ "./node_modules/react-map-gl/dist/esm/utils/mapboxgl.js");
/* harmony import */ var _use_map_control__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");



function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }






var propTypes = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_4__.mapControlPropTypes, {
  toggleLabel: prop_types__WEBPACK_IMPORTED_MODULE_5__.string,
  className: prop_types__WEBPACK_IMPORTED_MODULE_5__.string,
  style: prop_types__WEBPACK_IMPORTED_MODULE_5__.object,
  compact: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  customAttribution: prop_types__WEBPACK_IMPORTED_MODULE_5__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_5__.string, prop_types__WEBPACK_IMPORTED_MODULE_5__.arrayOf(prop_types__WEBPACK_IMPORTED_MODULE_5__.string)])
});
var defaultProps = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_4__.mapControlDefaultProps, {
  className: '',
  toggleLabel: 'Toggle Attribution'
});

function setupAttributioncontrol(opts, map, container, attributionContainer) {
  var control = new _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_3__["default"].AttributionControl(opts);
  control._map = map;
  control._container = container;
  control._innerContainer = attributionContainer;

  control._updateAttributions();

  control._updateEditLink();

  map.on('styledata', control._updateData);
  map.on('sourcedata', control._updateData);
  return control;
}

function removeAttributionControl(control) {
  control._map.off('styledata', control._updateData);

  control._map.off('sourcedata', control._updateData);
}

function AttributionControl(props) {
  var _useMapControl = (0,_use_map_control__WEBPACK_IMPORTED_MODULE_4__["default"])(props),
      context = _useMapControl.context,
      containerRef = _useMapControl.containerRef;

  var innerContainerRef = (0,react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);

  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false),
      _useState2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState, 2),
      showCompact = _useState2[0],
      setShowCompact = _useState2[1];

  (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(function () {
    var control;

    if (context.map) {
      control = setupAttributioncontrol({
        customAttribution: props.customAttribution
      }, context.map, containerRef.current, innerContainerRef.current);
    }

    return function () {
      return control && removeAttributionControl(control);
    };
  }, [context.map]);
  var compact = props.compact === undefined ? context.viewport.width <= 640 : props.compact;
  (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(function () {
    if (!compact && showCompact) {
      setShowCompact(false);
    }
  }, [compact]);
  var toggleAttribution = (0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)(function () {
    return setShowCompact(function (value) {
      return !value;
    });
  }, []);
  var style = (0,react__WEBPACK_IMPORTED_MODULE_2__.useMemo)(function () {
    return _objectSpread({
      position: 'absolute'
    }, props.style);
  }, [props.style]);
  return react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    style: style,
    className: props.className
  }, react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    ref: containerRef,
    "aria-pressed": showCompact,
    className: "mapboxgl-ctrl mapboxgl-ctrl-attrib ".concat(compact ? 'mapboxgl-compact' : '', " ").concat(showCompact ? 'mapboxgl-compact-show' : '')
  }, react__WEBPACK_IMPORTED_MODULE_2__.createElement("button", {
    type: "button",
    className: "mapboxgl-ctrl-attrib-button",
    title: props.toggleLabel,
    onClick: toggleAttribution
  }), react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    ref: innerContainerRef,
    className: "mapboxgl-ctrl-attrib-inner",
    role: "list"
  })));
}

AttributionControl.propTypes = propTypes;
AttributionControl.defaultProps = defaultProps;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (react__WEBPACK_IMPORTED_MODULE_2__.memo(AttributionControl));
//# sourceMappingURL=attribution-control.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/base-control.js":
/*!***********************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/base-control.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ BaseControl)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/extends */ "./node_modules/@babel/runtime/helpers/esm/extends.js");
/* harmony import */ var _babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/esm/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/esm/assertThisInitialized */ "./node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js");
/* harmony import */ var _babel_runtime_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime/helpers/esm/inherits */ "./node_modules/@babel/runtime/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _use_map_control__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");









function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0,_babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_6__["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0,_babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_6__["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0,_babel_runtime_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_5__["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }





function Control(props) {
  var instance = props.instance;

  var _useMapControl = (0,_use_map_control__WEBPACK_IMPORTED_MODULE_9__["default"])(props),
      context = _useMapControl.context,
      containerRef = _useMapControl.containerRef;

  instance._context = context;
  instance._containerRef = containerRef;
  return instance._render();
}

var BaseControl = function (_PureComponent) {
  (0,_babel_runtime_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_4__["default"])(BaseControl, _PureComponent);

  var _super = _createSuper(BaseControl);

  function BaseControl() {
    var _this;

    (0,_babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__["default"])(this, BaseControl);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__["default"])((0,_babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_3__["default"])(_this), "_context", {});

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__["default"])((0,_babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_3__["default"])(_this), "_containerRef", (0,react__WEBPACK_IMPORTED_MODULE_8__.createRef)());

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__["default"])((0,_babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_3__["default"])(_this), "_onScroll", function (evt) {});

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__["default"])((0,_babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_3__["default"])(_this), "_onDragStart", function (evt) {});

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__["default"])((0,_babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_3__["default"])(_this), "_onDblClick", function (evt) {});

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__["default"])((0,_babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_3__["default"])(_this), "_onClick", function (evt) {});

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__["default"])((0,_babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_3__["default"])(_this), "_onPointerMove", function (evt) {});

    return _this;
  }

  (0,_babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_2__["default"])(BaseControl, [{
    key: "_render",
    value: function _render() {
      throw new Error('_render() not implemented');
    }
  }, {
    key: "render",
    value: function render() {
      return react__WEBPACK_IMPORTED_MODULE_8__.createElement(Control, (0,_babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_0__["default"])({
        instance: this
      }, this.props, {
        onScroll: this._onScroll,
        onDragStart: this._onDragStart,
        onDblClick: this._onDblClick,
        onClick: this._onClick,
        onPointerMove: this._onPointerMove
      }));
    }
  }]);

  return BaseControl;
}(react__WEBPACK_IMPORTED_MODULE_8__.PureComponent);

(0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__["default"])(BaseControl, "propTypes", _use_map_control__WEBPACK_IMPORTED_MODULE_9__.mapControlPropTypes);

(0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__["default"])(BaseControl, "defaultProps", _use_map_control__WEBPACK_IMPORTED_MODULE_9__.mapControlDefaultProps);


//# sourceMappingURL=base-control.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/draggable-control.js":
/*!****************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/draggable-control.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ useDraggableControl),
/* harmony export */   "draggableControlDefaultProps": () => (/* binding */ draggableControlDefaultProps),
/* harmony export */   "draggableControlPropTypes": () => (/* binding */ draggableControlPropTypes)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _use_map_control__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");



function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }




var draggableControlPropTypes = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_3__.mapControlPropTypes, {
  draggable: prop_types__WEBPACK_IMPORTED_MODULE_4__.bool,
  onDrag: prop_types__WEBPACK_IMPORTED_MODULE_4__.func,
  onDragEnd: prop_types__WEBPACK_IMPORTED_MODULE_4__.func,
  onDragStart: prop_types__WEBPACK_IMPORTED_MODULE_4__.func,
  offsetLeft: prop_types__WEBPACK_IMPORTED_MODULE_4__.number,
  offsetTop: prop_types__WEBPACK_IMPORTED_MODULE_4__.number
});
var draggableControlDefaultProps = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_3__.mapControlDefaultProps, {
  draggable: false,
  offsetLeft: 0,
  offsetTop: 0
});

function getDragEventPosition(event) {
  var _event$offsetCenter = event.offsetCenter,
      x = _event$offsetCenter.x,
      y = _event$offsetCenter.y;
  return [x, y];
}

function getDragEventOffset(event, container) {
  var _event$center = event.center,
      x = _event$center.x,
      y = _event$center.y;

  if (container) {
    var rect = container.getBoundingClientRect();
    return [rect.left - x, rect.top - y];
  }

  return null;
}

function getDragLngLat(dragPos, dragOffset, props, context) {
  var x = dragPos[0] + dragOffset[0] - props.offsetLeft;
  var y = dragPos[1] + dragOffset[1] - props.offsetTop;
  return context.viewport.unproject([x, y]);
}

function onDragStart(event, _ref) {
  var props = _ref.props,
      callbacks = _ref.callbacks,
      state = _ref.state,
      context = _ref.context,
      containerRef = _ref.containerRef;
  var draggable = props.draggable;

  if (!draggable) {
    return;
  }

  event.stopPropagation();
  var dragPos = getDragEventPosition(event);
  var dragOffset = getDragEventOffset(event, containerRef.current);
  state.setDragPos(dragPos);
  state.setDragOffset(dragOffset);

  if (callbacks.onDragStart && dragOffset) {
    var callbackEvent = Object.assign({}, event);
    callbackEvent.lngLat = getDragLngLat(dragPos, dragOffset, props, context);
    callbacks.onDragStart(callbackEvent);
  }
}

function onDrag(event, _ref2) {
  var props = _ref2.props,
      callbacks = _ref2.callbacks,
      state = _ref2.state,
      context = _ref2.context;
  event.stopPropagation();
  var dragPos = getDragEventPosition(event);
  state.setDragPos(dragPos);
  var dragOffset = state.dragOffset;

  if (callbacks.onDrag && dragOffset) {
    var callbackEvent = Object.assign({}, event);
    callbackEvent.lngLat = getDragLngLat(dragPos, dragOffset, props, context);
    callbacks.onDrag(callbackEvent);
  }
}

function onDragEnd(event, _ref3) {
  var props = _ref3.props,
      callbacks = _ref3.callbacks,
      state = _ref3.state,
      context = _ref3.context;
  event.stopPropagation();
  var dragPos = state.dragPos,
      dragOffset = state.dragOffset;
  state.setDragPos(null);
  state.setDragOffset(null);

  if (callbacks.onDragEnd && dragPos && dragOffset) {
    var callbackEvent = Object.assign({}, event);
    callbackEvent.lngLat = getDragLngLat(dragPos, dragOffset, props, context);
    callbacks.onDragEnd(callbackEvent);
  }
}

function onDragCancel(event, _ref4) {
  var state = _ref4.state;
  event.stopPropagation();
  state.setDragPos(null);
  state.setDragOffset(null);
}

function registerEvents(thisRef) {
  var eventManager = thisRef.context.eventManager;

  if (!eventManager || !thisRef.state.dragPos) {
    return undefined;
  }

  var events = {
    panmove: function panmove(evt) {
      return onDrag(evt, thisRef);
    },
    panend: function panend(evt) {
      return onDragEnd(evt, thisRef);
    },
    pancancel: function pancancel(evt) {
      return onDragCancel(evt, thisRef);
    }
  };
  eventManager.watch(events);
  return function () {
    eventManager.off(events);
  };
}

function useDraggableControl(props) {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(null),
      _useState2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState, 2),
      dragPos = _useState2[0],
      setDragPos = _useState2[1];

  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(null),
      _useState4 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState3, 2),
      dragOffset = _useState4[0],
      setDragOffset = _useState4[1];

  var thisRef = (0,_use_map_control__WEBPACK_IMPORTED_MODULE_3__["default"])(_objectSpread(_objectSpread({}, props), {}, {
    onDragStart: onDragStart
  }));
  thisRef.callbacks = props;
  thisRef.state.dragPos = dragPos;
  thisRef.state.setDragPos = setDragPos;
  thisRef.state.dragOffset = dragOffset;
  thisRef.state.setDragOffset = setDragOffset;
  (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(function () {
    return registerEvents(thisRef);
  }, [thisRef.context.eventManager, Boolean(dragPos)]);
  return thisRef;
}
//# sourceMappingURL=draggable-control.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/fullscreen-control.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/fullscreen-control.js ***!
  \*****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _utils_globals__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/globals */ "./node_modules/react-map-gl/dist/esm/utils/globals.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/mapboxgl */ "./node_modules/react-map-gl/dist/esm/utils/mapboxgl.js");
/* harmony import */ var _use_map_control__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");



function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }







var propTypes = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_5__.mapControlPropTypes, {
  className: prop_types__WEBPACK_IMPORTED_MODULE_6__.string,
  style: prop_types__WEBPACK_IMPORTED_MODULE_6__.object,
  container: prop_types__WEBPACK_IMPORTED_MODULE_6__.object,
  label: prop_types__WEBPACK_IMPORTED_MODULE_6__.string
});
var defaultProps = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_5__.mapControlDefaultProps, {
  className: '',
  container: null,
  label: 'Toggle fullscreen'
});

function FullscreenControl(props) {
  var _useMapControl = (0,_use_map_control__WEBPACK_IMPORTED_MODULE_5__["default"])(props),
      context = _useMapControl.context,
      containerRef = _useMapControl.containerRef;

  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_3__.useState)(false),
      _useState2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState, 2),
      isFullscreen = _useState2[0],
      setIsFullscreen = _useState2[1];

  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_3__.useState)(false),
      _useState4 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState3, 2),
      showButton = _useState4[0],
      setShowButton = _useState4[1];

  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_3__.useState)(null),
      _useState6 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState5, 2),
      mapboxFullscreenControl = _useState6[0],
      createMapboxFullscreenControl = _useState6[1];

  (0,react__WEBPACK_IMPORTED_MODULE_3__.useEffect)(function () {
    var control = new _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_4__["default"].FullscreenControl();
    createMapboxFullscreenControl(control);
    setShowButton(control._checkFullscreenSupport());

    var onFullscreenChange = function onFullscreenChange() {
      var nextState = !control._fullscreen;
      control._fullscreen = nextState;
      setIsFullscreen(nextState);
    };

    _utils_globals__WEBPACK_IMPORTED_MODULE_2__.document.addEventListener(control._fullscreenchange, onFullscreenChange);
    return function () {
      _utils_globals__WEBPACK_IMPORTED_MODULE_2__.document.removeEventListener(control._fullscreenchange, onFullscreenChange);
    };
  }, []);

  var onClickFullscreen = function onClickFullscreen() {
    if (mapboxFullscreenControl) {
      mapboxFullscreenControl._container = props.container || context.container;

      mapboxFullscreenControl._onClickFullscreen();
    }
  };

  var style = (0,react__WEBPACK_IMPORTED_MODULE_3__.useMemo)(function () {
    return _objectSpread({
      position: 'absolute'
    }, props.style);
  }, [props.style]);

  if (!showButton) {
    return null;
  }

  var className = props.className,
      label = props.label;
  var type = isFullscreen ? 'shrink' : 'fullscreen';
  return react__WEBPACK_IMPORTED_MODULE_3__.createElement("div", {
    style: style,
    className: className
  }, react__WEBPACK_IMPORTED_MODULE_3__.createElement("div", {
    className: "mapboxgl-ctrl mapboxgl-ctrl-group",
    ref: containerRef
  }, react__WEBPACK_IMPORTED_MODULE_3__.createElement("button", {
    key: type,
    className: "mapboxgl-ctrl-icon mapboxgl-ctrl-".concat(type),
    type: "button",
    title: label,
    onClick: onClickFullscreen
  }, react__WEBPACK_IMPORTED_MODULE_3__.createElement("span", {
    className: "mapboxgl-ctrl-icon",
    "aria-hidden": "true"
  }))));
}

FullscreenControl.propTypes = propTypes;
FullscreenControl.defaultProps = defaultProps;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (react__WEBPACK_IMPORTED_MODULE_3__.memo(FullscreenControl));
//# sourceMappingURL=fullscreen-control.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/geolocate-control.js":
/*!****************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/geolocate-control.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var _utils_globals__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/globals */ "./node_modules/react-map-gl/dist/esm/utils/globals.js");
/* harmony import */ var _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/mapboxgl */ "./node_modules/react-map-gl/dist/esm/utils/mapboxgl.js");
/* harmony import */ var _utils_map_state__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/map-state */ "./node_modules/react-map-gl/dist/esm/utils/map-state.js");
/* harmony import */ var _utils_map_controller__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/map-controller */ "./node_modules/react-map-gl/dist/esm/utils/map-controller.js");
/* harmony import */ var _utils_geolocate_utils__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/geolocate-utils */ "./node_modules/react-map-gl/dist/esm/utils/geolocate-utils.js");
/* harmony import */ var _use_map_control__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");



function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }











var noop = function noop() {};

var propTypes = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_8__.mapControlPropTypes, {
  className: prop_types__WEBPACK_IMPORTED_MODULE_9__.string,
  style: prop_types__WEBPACK_IMPORTED_MODULE_9__.object,
  label: prop_types__WEBPACK_IMPORTED_MODULE_9__.string,
  disabledLabel: prop_types__WEBPACK_IMPORTED_MODULE_9__.string,
  auto: prop_types__WEBPACK_IMPORTED_MODULE_9__.bool,
  positionOptions: prop_types__WEBPACK_IMPORTED_MODULE_9__.object,
  fitBoundsOptions: prop_types__WEBPACK_IMPORTED_MODULE_9__.object,
  trackUserLocation: prop_types__WEBPACK_IMPORTED_MODULE_9__.bool,
  showUserLocation: prop_types__WEBPACK_IMPORTED_MODULE_9__.bool,
  showAccuracyCircle: prop_types__WEBPACK_IMPORTED_MODULE_9__.bool,
  showUserHeading: prop_types__WEBPACK_IMPORTED_MODULE_9__.bool,
  onViewStateChange: prop_types__WEBPACK_IMPORTED_MODULE_9__.func,
  onViewportChange: prop_types__WEBPACK_IMPORTED_MODULE_9__.func,
  onGeolocate: prop_types__WEBPACK_IMPORTED_MODULE_9__.func
});
var defaultProps = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_8__.mapControlDefaultProps, {
  className: '',
  label: 'Find My Location',
  disabledLabel: 'Location Not Available',
  auto: false,
  positionOptions: {
    enableHighAccuracy: false,
    timeout: 6000
  },
  fitBoundsOptions: {
    maxZoom: 15
  },
  trackUserLocation: false,
  showUserLocation: true,
  showUserHeading: false,
  showAccuracyCircle: true,
  onGeolocate: function onGeolocate() {}
});

function getBounds(position) {
  var center = new _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_4__["default"].LngLat(position.coords.longitude, position.coords.latitude);
  var radius = position.coords.accuracy;
  var bounds = center.toBounds(radius);
  return [[bounds._ne.lng, bounds._ne.lat], [bounds._sw.lng, bounds._sw.lat]];
}

function setupMapboxGeolocateControl(context, props, geolocateButton) {
  var control = new _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_4__["default"].GeolocateControl(props);
  control._container = _utils_globals__WEBPACK_IMPORTED_MODULE_3__.document.createElement('div');
  control._map = {
    on: function on() {},
    _getUIString: function _getUIString() {
      return '';
    }
  };

  control._setupUI(true);

  control._map = context.map;
  control._geolocateButton = geolocateButton;
  var eventManager = context.eventManager;

  if (control.options.trackUserLocation && eventManager) {
    eventManager.on('panstart', function () {
      if (control._watchState === 'ACTIVE_LOCK') {
        control._watchState = 'BACKGROUND';
        geolocateButton.classList.add('mapboxgl-ctrl-geolocate-background');
        geolocateButton.classList.remove('mapboxgl-ctrl-geolocate-active');
      }
    });
  }

  control.on('geolocate', props.onGeolocate);
  return control;
}

function updateCamera(position, _ref) {
  var context = _ref.context,
      props = _ref.props;
  var bounds = getBounds(position);

  var _context$viewport$fit = context.viewport.fitBounds(bounds, props.fitBoundsOptions),
      longitude = _context$viewport$fit.longitude,
      latitude = _context$viewport$fit.latitude,
      zoom = _context$viewport$fit.zoom;

  var newViewState = Object.assign({}, context.viewport, {
    longitude: longitude,
    latitude: latitude,
    zoom: zoom
  });
  var mapState = new _utils_map_state__WEBPACK_IMPORTED_MODULE_5__["default"](newViewState);
  var viewState = Object.assign({}, mapState.getViewportProps(), _utils_map_controller__WEBPACK_IMPORTED_MODULE_6__.LINEAR_TRANSITION_PROPS);
  var onViewportChange = props.onViewportChange || context.onViewportChange || noop;
  var onViewStateChange = props.onViewStateChange || context.onViewStateChange || noop;
  onViewStateChange({
    viewState: viewState
  });
  onViewportChange(viewState);
}

function GeolocateControl(props) {
  var thisRef = (0,_use_map_control__WEBPACK_IMPORTED_MODULE_8__["default"])(props);
  var context = thisRef.context,
      containerRef = thisRef.containerRef;
  var geolocateButtonRef = (0,react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);

  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(null),
      _useState2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState, 2),
      mapboxGeolocateControl = _useState2[0],
      createMapboxGeolocateControl = _useState2[1];

  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false),
      _useState4 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState3, 2),
      supportsGeolocation = _useState4[0],
      setSupportsGeolocation = _useState4[1];

  (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(function () {
    var control;

    if (context.map) {
      (0,_utils_geolocate_utils__WEBPACK_IMPORTED_MODULE_7__.isGeolocationSupported)().then(function (result) {
        setSupportsGeolocation(result);

        if (geolocateButtonRef.current) {
          control = setupMapboxGeolocateControl(context, props, geolocateButtonRef.current);

          control._updateCamera = function (position) {
            return updateCamera(position, thisRef);
          };

          createMapboxGeolocateControl(control);
        }
      });
    }

    return function () {
      if (control) {
        control._clearWatch();
      }
    };
  }, [context.map]);
  var triggerGeolocate = (0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)(function () {
    if (mapboxGeolocateControl) {
      mapboxGeolocateControl.options = thisRef.props;
      mapboxGeolocateControl.trigger();
    }
  }, [mapboxGeolocateControl]);
  (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(function () {
    if (props.auto) {
      triggerGeolocate();
    }
  }, [mapboxGeolocateControl, props.auto]);
  (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(function () {
    if (mapboxGeolocateControl) {
      mapboxGeolocateControl._onZoom();
    }
  }, [context.viewport.zoom]);
  var className = props.className,
      label = props.label,
      disabledLabel = props.disabledLabel,
      trackUserLocation = props.trackUserLocation;
  var style = (0,react__WEBPACK_IMPORTED_MODULE_2__.useMemo)(function () {
    return _objectSpread({
      position: 'absolute'
    }, props.style);
  }, [props.style]);
  return react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    style: style,
    className: className
  }, react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    key: "geolocate-control",
    className: "mapboxgl-ctrl mapboxgl-ctrl-group",
    ref: containerRef
  }, react__WEBPACK_IMPORTED_MODULE_2__.createElement("button", {
    key: "geolocate",
    className: "mapboxgl-ctrl-icon mapboxgl-ctrl-geolocate",
    ref: geolocateButtonRef,
    disabled: !supportsGeolocation,
    "aria-pressed": !trackUserLocation,
    type: "button",
    title: supportsGeolocation ? label : disabledLabel,
    "aria-label": supportsGeolocation ? label : disabledLabel,
    onClick: triggerGeolocate
  }, react__WEBPACK_IMPORTED_MODULE_2__.createElement("span", {
    className: "mapboxgl-ctrl-icon",
    "aria-hidden": "true"
  }))));
}

GeolocateControl.propTypes = propTypes;
GeolocateControl.defaultProps = defaultProps;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (react__WEBPACK_IMPORTED_MODULE_2__.memo(GeolocateControl));
//# sourceMappingURL=geolocate-control.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/interactive-map.js":
/*!**************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/interactive-map.js ***!
  \**************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/extends */ "./node_modules/@babel/runtime/helpers/esm/extends.js");
/* harmony import */ var _babel_runtime_helpers_esm_toConsumableArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/toConsumableArray */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var _static_map__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./static-map */ "./node_modules/react-map-gl/dist/esm/components/static-map.js");
/* harmony import */ var _utils_map_state__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/map-state */ "./node_modules/react-map-gl/dist/esm/utils/map-state.js");
/* harmony import */ var _utils_transition_manager__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/transition-manager */ "./node_modules/react-map-gl/dist/esm/utils/transition-manager.js");
/* harmony import */ var _map_context__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./map-context */ "./node_modules/react-map-gl/dist/esm/components/map-context.js");
/* harmony import */ var mjolnir_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! mjolnir.js */ "./node_modules/mjolnir.js/dist/esm/index.js");
/* harmony import */ var _utils_map_controller__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../utils/map-controller */ "./node_modules/react-map-gl/dist/esm/utils/map-controller.js");
/* harmony import */ var _utils_use_isomorphic_layout_effect__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../utils/use-isomorphic-layout-effect */ "./node_modules/react-map-gl/dist/esm/utils/use-isomorphic-layout-effect.js");




function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }











var propTypes = Object.assign({}, _static_map__WEBPACK_IMPORTED_MODULE_4__["default"].propTypes, {
  maxZoom: prop_types__WEBPACK_IMPORTED_MODULE_11__.number,
  minZoom: prop_types__WEBPACK_IMPORTED_MODULE_11__.number,
  maxPitch: prop_types__WEBPACK_IMPORTED_MODULE_11__.number,
  minPitch: prop_types__WEBPACK_IMPORTED_MODULE_11__.number,
  onViewStateChange: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onViewportChange: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onInteractionStateChange: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  transitionDuration: prop_types__WEBPACK_IMPORTED_MODULE_11__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_11__.number, prop_types__WEBPACK_IMPORTED_MODULE_11__.string]),
  transitionInterpolator: prop_types__WEBPACK_IMPORTED_MODULE_11__.object,
  transitionInterruption: prop_types__WEBPACK_IMPORTED_MODULE_11__.number,
  transitionEasing: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onTransitionStart: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onTransitionInterrupt: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onTransitionEnd: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  scrollZoom: prop_types__WEBPACK_IMPORTED_MODULE_11__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_11__.bool, prop_types__WEBPACK_IMPORTED_MODULE_11__.object]),
  dragPan: prop_types__WEBPACK_IMPORTED_MODULE_11__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_11__.bool, prop_types__WEBPACK_IMPORTED_MODULE_11__.object]),
  dragRotate: prop_types__WEBPACK_IMPORTED_MODULE_11__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_11__.bool, prop_types__WEBPACK_IMPORTED_MODULE_11__.object]),
  doubleClickZoom: prop_types__WEBPACK_IMPORTED_MODULE_11__.bool,
  touchZoom: prop_types__WEBPACK_IMPORTED_MODULE_11__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_11__.bool, prop_types__WEBPACK_IMPORTED_MODULE_11__.object]),
  touchRotate: prop_types__WEBPACK_IMPORTED_MODULE_11__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_11__.bool, prop_types__WEBPACK_IMPORTED_MODULE_11__.object]),
  keyboard: prop_types__WEBPACK_IMPORTED_MODULE_11__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_11__.bool, prop_types__WEBPACK_IMPORTED_MODULE_11__.object]),
  onHover: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onClick: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onDblClick: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onContextMenu: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onMouseDown: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onMouseMove: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onMouseUp: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onTouchStart: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onTouchMove: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onTouchEnd: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onMouseEnter: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onMouseLeave: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onMouseOut: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  onWheel: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  touchAction: prop_types__WEBPACK_IMPORTED_MODULE_11__.string,
  eventRecognizerOptions: prop_types__WEBPACK_IMPORTED_MODULE_11__.object,
  clickRadius: prop_types__WEBPACK_IMPORTED_MODULE_11__.number,
  interactiveLayerIds: prop_types__WEBPACK_IMPORTED_MODULE_11__.array,
  getCursor: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  controller: prop_types__WEBPACK_IMPORTED_MODULE_11__.instanceOf(_utils_map_controller__WEBPACK_IMPORTED_MODULE_9__["default"])
});

var getDefaultCursor = function getDefaultCursor(_ref) {
  var isDragging = _ref.isDragging,
      isHovering = _ref.isHovering;
  return isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab';
};

var defaultProps = Object.assign({}, _static_map__WEBPACK_IMPORTED_MODULE_4__["default"].defaultProps, _utils_map_state__WEBPACK_IMPORTED_MODULE_5__.MAPBOX_LIMITS, _utils_transition_manager__WEBPACK_IMPORTED_MODULE_6__["default"].defaultProps, {
  onViewStateChange: null,
  onViewportChange: null,
  onClick: null,
  onNativeClick: null,
  onHover: null,
  onContextMenu: function onContextMenu(event) {
    return event.preventDefault();
  },
  scrollZoom: true,
  dragPan: true,
  dragRotate: true,
  doubleClickZoom: true,
  touchZoom: true,
  touchRotate: false,
  keyboard: true,
  touchAction: 'none',
  eventRecognizerOptions: {},
  clickRadius: 0,
  getCursor: getDefaultCursor
});

function normalizeEvent(event) {
  if (event.lngLat || !event.offsetCenter) {
    return event;
  }

  var _event$offsetCenter = event.offsetCenter,
      x = _event$offsetCenter.x,
      y = _event$offsetCenter.y;

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return event;
  }

  var pos = [x, y];
  event.point = pos;
  event.lngLat = this.viewport.unproject(pos);
  return event;
}

function getFeatures(pos) {
  var map = this.map;

  if (!map || !pos) {
    return null;
  }

  var queryParams = {};
  var size = this.props.clickRadius;

  if (this.props.interactiveLayerIds) {
    queryParams.layers = this.props.interactiveLayerIds;
  }

  try {
    return map.queryRenderedFeatures(size ? [[pos[0] - size, pos[1] + size], [pos[0] + size, pos[1] - size]] : pos, queryParams);
  } catch (_unused) {
    return null;
  }
}

function onEvent(callbackName, event) {
  var func = this.props[callbackName];

  if (func) {
    func(normalizeEvent.call(this, event));
  }
}

function onPointerDown(event) {
  onEvent.call(this, event.pointerType === 'touch' ? 'onTouchStart' : 'onMouseDown', event);
}

function onPointerUp(event) {
  onEvent.call(this, event.pointerType === 'touch' ? 'onTouchEnd' : 'onMouseUp', event);
}

function onPointerMove(event) {
  onEvent.call(this, event.pointerType === 'touch' ? 'onTouchMove' : 'onMouseMove', event);

  if (!this.state.isDragging) {
    var _this$props = this.props,
        onHover = _this$props.onHover,
        interactiveLayerIds = _this$props.interactiveLayerIds;
    var features;
    event = normalizeEvent.call(this, event);

    if (interactiveLayerIds || onHover) {
      features = getFeatures.call(this, event.point);
    }

    var isHovering = Boolean(interactiveLayerIds && features && features.length > 0);
    var isEntering = isHovering && !this.state.isHovering;
    var isExiting = !isHovering && this.state.isHovering;

    if (onHover || isEntering) {
      event.features = features;

      if (onHover) {
        onHover(event);
      }
    }

    if (isEntering) {
      onEvent.call(this, 'onMouseEnter', event);
    }

    if (isExiting) {
      onEvent.call(this, 'onMouseLeave', event);
    }

    if (isEntering || isExiting) {
      this.setState({
        isHovering: isHovering
      });
    }
  }
}

function onPointerClick(event) {
  var _this$props2 = this.props,
      onClick = _this$props2.onClick,
      onNativeClick = _this$props2.onNativeClick,
      onDblClick = _this$props2.onDblClick,
      doubleClickZoom = _this$props2.doubleClickZoom;
  var callbacks = [];
  var isDoubleClickEnabled = onDblClick || doubleClickZoom;

  switch (event.type) {
    case 'anyclick':
      callbacks.push(onNativeClick);

      if (!isDoubleClickEnabled) {
        callbacks.push(onClick);
      }

      break;

    case 'click':
      if (isDoubleClickEnabled) {
        callbacks.push(onClick);
      }

      break;

    default:
  }

  callbacks = callbacks.filter(Boolean);

  if (callbacks.length) {
    event = normalizeEvent.call(this, event);
    event.features = getFeatures.call(this, event.point);
    callbacks.forEach(function (cb) {
      return cb(event);
    });
  }
}

function getRefHandles(staticMapRef) {
  return {
    getMap: staticMapRef.current && staticMapRef.current.getMap,
    queryRenderedFeatures: staticMapRef.current && staticMapRef.current.queryRenderedFeatures
  };
}

var InteractiveMap = (0,react__WEBPACK_IMPORTED_MODULE_3__.forwardRef)(function (props, ref) {
  var parentContext = (0,react__WEBPACK_IMPORTED_MODULE_3__.useContext)(_map_context__WEBPACK_IMPORTED_MODULE_7__["default"]);
  var controller = (0,react__WEBPACK_IMPORTED_MODULE_3__.useMemo)(function () {
    return props.controller || new _utils_map_controller__WEBPACK_IMPORTED_MODULE_9__["default"]();
  }, []);
  var eventManager = (0,react__WEBPACK_IMPORTED_MODULE_3__.useMemo)(function () {
    return new mjolnir_js__WEBPACK_IMPORTED_MODULE_8__.EventManager(null, {
      touchAction: props.touchAction,
      recognizerOptions: props.eventRecognizerOptions
    });
  }, []);
  var eventCanvasRef = (0,react__WEBPACK_IMPORTED_MODULE_3__.useRef)(null);
  var staticMapRef = (0,react__WEBPACK_IMPORTED_MODULE_3__.useRef)(null);

  var _thisRef = (0,react__WEBPACK_IMPORTED_MODULE_3__.useRef)({
    width: 0,
    height: 0,
    state: {
      isHovering: false,
      isDragging: false
    }
  });

  var thisRef = _thisRef.current;
  thisRef.props = props;
  thisRef.map = staticMapRef.current && staticMapRef.current.getMap();

  thisRef.setState = function (newState) {
    thisRef.state = _objectSpread(_objectSpread({}, thisRef.state), newState);
    eventCanvasRef.current.style.cursor = props.getCursor(thisRef.state);
  };

  var inRender = true;
  var viewportUpdateRequested;
  var stateUpdateRequested;

  var handleViewportChange = function handleViewportChange(viewState, interactionState, oldViewState) {
    if (inRender) {
      viewportUpdateRequested = [viewState, interactionState, oldViewState];
      return;
    }

    var _thisRef$props = thisRef.props,
        onViewStateChange = _thisRef$props.onViewStateChange,
        onViewportChange = _thisRef$props.onViewportChange;

    if (onViewStateChange) {
      onViewStateChange({
        viewState: viewState,
        interactionState: interactionState,
        oldViewState: oldViewState
      });
    }

    if (onViewportChange) {
      onViewportChange(viewState, interactionState, oldViewState);
    }
  };

  (0,react__WEBPACK_IMPORTED_MODULE_3__.useImperativeHandle)(ref, function () {
    return getRefHandles(staticMapRef);
  }, []);
  var context = (0,react__WEBPACK_IMPORTED_MODULE_3__.useMemo)(function () {
    return _objectSpread(_objectSpread({}, parentContext), {}, {
      eventManager: eventManager,
      container: parentContext.container || eventCanvasRef.current
    });
  }, [parentContext, eventCanvasRef.current]);
  context.onViewportChange = handleViewportChange;
  context.viewport = parentContext.viewport || (0,_static_map__WEBPACK_IMPORTED_MODULE_4__.getViewport)(thisRef);
  thisRef.viewport = context.viewport;

  var handleInteractionStateChange = function handleInteractionStateChange(interactionState) {
    var _interactionState$isD = interactionState.isDragging,
        isDragging = _interactionState$isD === void 0 ? false : _interactionState$isD;

    if (isDragging !== thisRef.state.isDragging) {
      thisRef.setState({
        isDragging: isDragging
      });
    }

    if (inRender) {
      stateUpdateRequested = interactionState;
      return;
    }

    var onInteractionStateChange = thisRef.props.onInteractionStateChange;

    if (onInteractionStateChange) {
      onInteractionStateChange(interactionState);
    }
  };

  var updateControllerOpts = function updateControllerOpts() {
    if (thisRef.width && thisRef.height) {
      controller.setOptions(_objectSpread(_objectSpread(_objectSpread({}, thisRef.props), thisRef.props.viewState), {}, {
        isInteractive: Boolean(thisRef.props.onViewStateChange || thisRef.props.onViewportChange),
        onViewportChange: handleViewportChange,
        onStateChange: handleInteractionStateChange,
        eventManager: eventManager,
        width: thisRef.width,
        height: thisRef.height
      }));
    }
  };

  var onResize = function onResize(_ref2) {
    var width = _ref2.width,
        height = _ref2.height;
    thisRef.width = width;
    thisRef.height = height;
    updateControllerOpts();
    thisRef.props.onResize({
      width: width,
      height: height
    });
  };

  (0,react__WEBPACK_IMPORTED_MODULE_3__.useEffect)(function () {
    eventManager.setElement(eventCanvasRef.current);
    eventManager.on({
      pointerdown: onPointerDown.bind(thisRef),
      pointermove: onPointerMove.bind(thisRef),
      pointerup: onPointerUp.bind(thisRef),
      pointerleave: onEvent.bind(thisRef, 'onMouseOut'),
      click: onPointerClick.bind(thisRef),
      anyclick: onPointerClick.bind(thisRef),
      dblclick: onEvent.bind(thisRef, 'onDblClick'),
      wheel: onEvent.bind(thisRef, 'onWheel'),
      contextmenu: onEvent.bind(thisRef, 'onContextMenu')
    });
    return function () {
      eventManager.destroy();
    };
  }, []);
  (0,_utils_use_isomorphic_layout_effect__WEBPACK_IMPORTED_MODULE_10__["default"])(function () {
    if (viewportUpdateRequested) {
      handleViewportChange.apply(void 0, (0,_babel_runtime_helpers_esm_toConsumableArray__WEBPACK_IMPORTED_MODULE_1__["default"])(viewportUpdateRequested));
    }

    if (stateUpdateRequested) {
      handleInteractionStateChange(stateUpdateRequested);
    }
  });
  updateControllerOpts();
  var width = props.width,
      height = props.height,
      style = props.style,
      getCursor = props.getCursor;
  var eventCanvasStyle = (0,react__WEBPACK_IMPORTED_MODULE_3__.useMemo)(function () {
    return _objectSpread(_objectSpread({
      position: 'relative'
    }, style), {}, {
      width: width,
      height: height,
      cursor: getCursor(thisRef.state)
    });
  }, [style, width, height, getCursor, thisRef.state]);

  if (!viewportUpdateRequested || !thisRef._child) {
    thisRef._child = react__WEBPACK_IMPORTED_MODULE_3__.createElement(_map_context__WEBPACK_IMPORTED_MODULE_7__.MapContextProvider, {
      value: context
    }, react__WEBPACK_IMPORTED_MODULE_3__.createElement("div", {
      key: "event-canvas",
      ref: eventCanvasRef,
      style: eventCanvasStyle
    }, react__WEBPACK_IMPORTED_MODULE_3__.createElement(_static_map__WEBPACK_IMPORTED_MODULE_4__["default"], (0,_babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_0__["default"])({}, props, {
      width: "100%",
      height: "100%",
      style: null,
      onResize: onResize,
      ref: staticMapRef
    }))));
  }

  inRender = false;
  return thisRef._child;
});
InteractiveMap.supported = _static_map__WEBPACK_IMPORTED_MODULE_4__["default"].supported;
InteractiveMap.propTypes = propTypes;
InteractiveMap.defaultProps = defaultProps;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (InteractiveMap);
//# sourceMappingURL=interactive-map.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/layer.js":
/*!****************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/layer.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_esm_objectWithoutProperties__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/esm/objectWithoutProperties */ "./node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _map_context__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./map-context */ "./node_modules/react-map-gl/dist/esm/components/map-context.js");
/* harmony import */ var _utils_assert__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/assert */ "./node_modules/react-map-gl/dist/esm/utils/assert.js");
/* harmony import */ var _utils_deep_equal__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/deep-equal */ "./node_modules/react-map-gl/dist/esm/utils/deep-equal.js");




function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_1__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }






var LAYER_TYPES = ['fill', 'line', 'symbol', 'circle', 'fill-extrusion', 'raster', 'background', 'heatmap', 'hillshade'];
var propTypes = {
  type: prop_types__WEBPACK_IMPORTED_MODULE_7__.oneOf(LAYER_TYPES).isRequired,
  id: prop_types__WEBPACK_IMPORTED_MODULE_7__.string,
  source: prop_types__WEBPACK_IMPORTED_MODULE_7__.string,
  beforeId: prop_types__WEBPACK_IMPORTED_MODULE_7__.string
};

function diffLayerStyles(map, id, props, prevProps) {
  var _props$layout = props.layout,
      layout = _props$layout === void 0 ? {} : _props$layout,
      _props$paint = props.paint,
      paint = _props$paint === void 0 ? {} : _props$paint,
      filter = props.filter,
      minzoom = props.minzoom,
      maxzoom = props.maxzoom,
      beforeId = props.beforeId,
      otherProps = (0,_babel_runtime_helpers_esm_objectWithoutProperties__WEBPACK_IMPORTED_MODULE_2__["default"])(props, ["layout", "paint", "filter", "minzoom", "maxzoom", "beforeId"]);

  if (beforeId !== prevProps.beforeId) {
    map.moveLayer(id, beforeId);
  }

  if (layout !== prevProps.layout) {
    var prevLayout = prevProps.layout || {};

    for (var key in layout) {
      if (!(0,_utils_deep_equal__WEBPACK_IMPORTED_MODULE_6__["default"])(layout[key], prevLayout[key])) {
        map.setLayoutProperty(id, key, layout[key]);
      }
    }

    for (var _key in prevLayout) {
      if (!layout.hasOwnProperty(_key)) {
        map.setLayoutProperty(id, _key, undefined);
      }
    }
  }

  if (paint !== prevProps.paint) {
    var prevPaint = prevProps.paint || {};

    for (var _key2 in paint) {
      if (!(0,_utils_deep_equal__WEBPACK_IMPORTED_MODULE_6__["default"])(paint[_key2], prevPaint[_key2])) {
        map.setPaintProperty(id, _key2, paint[_key2]);
      }
    }

    for (var _key3 in prevPaint) {
      if (!paint.hasOwnProperty(_key3)) {
        map.setPaintProperty(id, _key3, undefined);
      }
    }
  }

  if (!(0,_utils_deep_equal__WEBPACK_IMPORTED_MODULE_6__["default"])(filter, prevProps.filter)) {
    map.setFilter(id, filter);
  }

  if (minzoom !== prevProps.minzoom || maxzoom !== prevProps.maxzoom) {
    map.setLayerZoomRange(id, minzoom, maxzoom);
  }

  for (var _key4 in otherProps) {
    if (!(0,_utils_deep_equal__WEBPACK_IMPORTED_MODULE_6__["default"])(otherProps[_key4], prevProps[_key4])) {
      map.setLayerProperty(id, _key4, otherProps[_key4]);
    }
  }
}

function createLayer(map, id, props) {
  if (map.style && map.style._loaded) {
    var options = _objectSpread(_objectSpread({}, props), {}, {
      id: id
    });

    delete options.beforeId;
    map.addLayer(options, props.beforeId);
  }
}

function updateLayer(map, id, props, prevProps) {
  (0,_utils_assert__WEBPACK_IMPORTED_MODULE_5__["default"])(props.id === prevProps.id, 'layer id changed');
  (0,_utils_assert__WEBPACK_IMPORTED_MODULE_5__["default"])(props.type === prevProps.type, 'layer type changed');

  try {
    diffLayerStyles(map, id, props, prevProps);
  } catch (error) {
    console.warn(error);
  }
}

var layerCounter = 0;

function Layer(props) {
  var context = (0,react__WEBPACK_IMPORTED_MODULE_3__.useContext)(_map_context__WEBPACK_IMPORTED_MODULE_4__["default"]);
  var propsRef = (0,react__WEBPACK_IMPORTED_MODULE_3__.useRef)({
    id: props.id,
    type: props.type
  });

  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_3__.useState)(0),
      _useState2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__["default"])(_useState, 2),
      setStyleLoaded = _useState2[1];

  var id = (0,react__WEBPACK_IMPORTED_MODULE_3__.useMemo)(function () {
    return props.id || "jsx-layer-".concat(layerCounter++);
  }, []);
  var map = context.map;
  (0,react__WEBPACK_IMPORTED_MODULE_3__.useEffect)(function () {
    if (map) {
      var forceUpdate = function forceUpdate() {
        return setStyleLoaded(function (version) {
          return version + 1;
        });
      };

      map.on('styledata', forceUpdate);
      return function () {
        map.off('styledata', forceUpdate);

        if (map.style && map.style._loaded) {
          map.removeLayer(id);
        }
      };
    }

    return undefined;
  }, [map]);
  var layer = map && map.style && map.getLayer(id);

  if (layer) {
    updateLayer(map, id, props, propsRef.current);
  } else {
    createLayer(map, id, props);
  }

  propsRef.current = props;
  return null;
}

Layer.propTypes = propTypes;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Layer);
//# sourceMappingURL=layer.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/map-context.js":
/*!**********************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/map-context.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MapContextProvider": () => (/* binding */ MapContextProvider),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);



function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }



var MapContext = (0,react__WEBPACK_IMPORTED_MODULE_2__.createContext)({
  viewport: null,
  map: null,
  container: null,
  onViewportChange: null,
  onViewStateChange: null,
  eventManager: null
});
var MapContextProvider = MapContext.Provider;

function WrappedProvider(_ref) {
  var value = _ref.value,
      children = _ref.children;

  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(null),
      _useState2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState, 2),
      map = _useState2[0],
      setMap = _useState2[1];

  var context = (0,react__WEBPACK_IMPORTED_MODULE_2__.useContext)(MapContext);
  value = _objectSpread(_objectSpread({
    setMap: setMap
  }, context), {}, {
    map: context && context.map || map
  }, value);
  return react__WEBPACK_IMPORTED_MODULE_2__.createElement(MapContextProvider, {
    value: value
  }, children);
}

MapContext.Provider = WrappedProvider;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MapContext);
//# sourceMappingURL=map-context.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/marker.js":
/*!*****************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/marker.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _draggable_control__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./draggable-control */ "./node_modules/react-map-gl/dist/esm/components/draggable-control.js");
/* harmony import */ var _utils_crisp_pixel__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/crisp-pixel */ "./node_modules/react-map-gl/dist/esm/utils/crisp-pixel.js");



function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }






var propTypes = Object.assign({}, _draggable_control__WEBPACK_IMPORTED_MODULE_3__.draggableControlPropTypes, {
  className: prop_types__WEBPACK_IMPORTED_MODULE_5__.string,
  longitude: prop_types__WEBPACK_IMPORTED_MODULE_5__.number.isRequired,
  latitude: prop_types__WEBPACK_IMPORTED_MODULE_5__.number.isRequired,
  style: prop_types__WEBPACK_IMPORTED_MODULE_5__.object
});
var defaultProps = Object.assign({}, _draggable_control__WEBPACK_IMPORTED_MODULE_3__.draggableControlDefaultProps, {
  className: ''
});

function getPosition(_ref) {
  var props = _ref.props,
      state = _ref.state,
      context = _ref.context;
  var longitude = props.longitude,
      latitude = props.latitude,
      offsetLeft = props.offsetLeft,
      offsetTop = props.offsetTop;
  var dragPos = state.dragPos,
      dragOffset = state.dragOffset;

  if (dragPos && dragOffset) {
    return [dragPos[0] + dragOffset[0], dragPos[1] + dragOffset[1]];
  }

  var _context$viewport$pro = context.viewport.project([longitude, latitude]),
      _context$viewport$pro2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_context$viewport$pro, 2),
      x = _context$viewport$pro2[0],
      y = _context$viewport$pro2[1];

  x += offsetLeft;
  y += offsetTop;
  return [x, y];
}

function Marker(props) {
  var thisRef = (0,_draggable_control__WEBPACK_IMPORTED_MODULE_3__["default"])(props);
  var state = thisRef.state,
      containerRef = thisRef.containerRef;
  var children = props.children,
      className = props.className,
      draggable = props.draggable,
      style = props.style;
  var dragPos = state.dragPos;

  var _getPosition = getPosition(thisRef),
      _getPosition2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_getPosition, 2),
      x = _getPosition2[0],
      y = _getPosition2[1];

  var transform = "translate(".concat((0,_utils_crisp_pixel__WEBPACK_IMPORTED_MODULE_4__.crispPixel)(x), "px, ").concat((0,_utils_crisp_pixel__WEBPACK_IMPORTED_MODULE_4__.crispPixel)(y), "px)");
  var cursor = draggable ? dragPos ? 'grabbing' : 'grab' : 'auto';
  var control = (0,react__WEBPACK_IMPORTED_MODULE_2__.useMemo)(function () {
    var containerStyle = _objectSpread({
      position: 'absolute',
      left: 0,
      top: 0,
      transform: transform,
      cursor: cursor
    }, style);

    return react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
      className: "mapboxgl-marker ".concat(className),
      ref: thisRef.containerRef,
      style: containerStyle
    }, children);
  }, [children, className]);
  var container = containerRef.current;

  if (container) {
    container.style.transform = transform;
    container.style.cursor = cursor;
  }

  return control;
}

Marker.defaultProps = defaultProps;
Marker.propTypes = propTypes;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (react__WEBPACK_IMPORTED_MODULE_2__.memo(Marker));
//# sourceMappingURL=marker.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/navigation-control.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/navigation-control.js ***!
  \*****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _utils_map_state__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/map-state */ "./node_modules/react-map-gl/dist/esm/utils/map-state.js");
/* harmony import */ var _utils_map_controller__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/map-controller */ "./node_modules/react-map-gl/dist/esm/utils/map-controller.js");
/* harmony import */ var _utils_version__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/version */ "./node_modules/react-map-gl/dist/esm/utils/version.js");
/* harmony import */ var _use_map_control__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");


function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }









var noop = function noop() {};

var propTypes = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_5__.mapControlPropTypes, {
  className: prop_types__WEBPACK_IMPORTED_MODULE_6__.string,
  style: prop_types__WEBPACK_IMPORTED_MODULE_6__.object,
  onViewStateChange: prop_types__WEBPACK_IMPORTED_MODULE_6__.func,
  onViewportChange: prop_types__WEBPACK_IMPORTED_MODULE_6__.func,
  showCompass: prop_types__WEBPACK_IMPORTED_MODULE_6__.bool,
  showZoom: prop_types__WEBPACK_IMPORTED_MODULE_6__.bool,
  zoomInLabel: prop_types__WEBPACK_IMPORTED_MODULE_6__.string,
  zoomOutLabel: prop_types__WEBPACK_IMPORTED_MODULE_6__.string,
  compassLabel: prop_types__WEBPACK_IMPORTED_MODULE_6__.string
});
var defaultProps = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_5__.mapControlDefaultProps, {
  className: '',
  showCompass: true,
  showZoom: true,
  zoomInLabel: 'Zoom In',
  zoomOutLabel: 'Zoom Out',
  compassLabel: 'Reset North'
});
var VERSION_LEGACY = 1;
var VERSION_1_6 = 2;

function getUIVersion(mapboxVersion) {
  return (0,_utils_version__WEBPACK_IMPORTED_MODULE_4__.compareVersions)(mapboxVersion, '1.6.0') >= 0 ? VERSION_1_6 : VERSION_LEGACY;
}

function updateViewport(context, props, opts) {
  var viewport = context.viewport;
  var mapState = new _utils_map_state__WEBPACK_IMPORTED_MODULE_2__["default"](Object.assign({}, viewport, opts));
  var viewState = Object.assign({}, mapState.getViewportProps(), _utils_map_controller__WEBPACK_IMPORTED_MODULE_3__.LINEAR_TRANSITION_PROPS);
  var onViewportChange = props.onViewportChange || context.onViewportChange || noop;
  var onViewStateChange = props.onViewStateChange || context.onViewStateChange || noop;
  onViewStateChange({
    viewState: viewState
  });
  onViewportChange(viewState);
}

function renderButton(type, label, callback, children) {
  return react__WEBPACK_IMPORTED_MODULE_1__.createElement("button", {
    key: type,
    className: "mapboxgl-ctrl-icon mapboxgl-ctrl-".concat(type),
    type: "button",
    title: label,
    onClick: callback
  }, children || react__WEBPACK_IMPORTED_MODULE_1__.createElement("span", {
    className: "mapboxgl-ctrl-icon",
    "aria-hidden": "true"
  }));
}

function renderCompass(context) {
  var uiVersion = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(function () {
    return context.map ? getUIVersion(context.map.version) : VERSION_1_6;
  }, [context.map]);
  var bearing = context.viewport.bearing;
  var style = {
    transform: "rotate(".concat(-bearing, "deg)")
  };
  return uiVersion === VERSION_1_6 ? react__WEBPACK_IMPORTED_MODULE_1__.createElement("span", {
    className: "mapboxgl-ctrl-icon",
    "aria-hidden": "true",
    style: style
  }) : react__WEBPACK_IMPORTED_MODULE_1__.createElement("span", {
    className: "mapboxgl-ctrl-compass-arrow",
    style: style
  });
}

function NavigationControl(props) {
  var _useMapControl = (0,_use_map_control__WEBPACK_IMPORTED_MODULE_5__["default"])(props),
      context = _useMapControl.context,
      containerRef = _useMapControl.containerRef;

  var onZoomIn = function onZoomIn() {
    updateViewport(context, props, {
      zoom: context.viewport.zoom + 1
    });
  };

  var onZoomOut = function onZoomOut() {
    updateViewport(context, props, {
      zoom: context.viewport.zoom - 1
    });
  };

  var onResetNorth = function onResetNorth() {
    updateViewport(context, props, {
      bearing: 0,
      pitch: 0
    });
  };

  var className = props.className,
      showCompass = props.showCompass,
      showZoom = props.showZoom,
      zoomInLabel = props.zoomInLabel,
      zoomOutLabel = props.zoomOutLabel,
      compassLabel = props.compassLabel;
  var style = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(function () {
    return _objectSpread({
      position: 'absolute'
    }, props.style);
  }, [props.style]);
  return react__WEBPACK_IMPORTED_MODULE_1__.createElement("div", {
    style: style,
    className: className
  }, react__WEBPACK_IMPORTED_MODULE_1__.createElement("div", {
    className: "mapboxgl-ctrl mapboxgl-ctrl-group",
    ref: containerRef
  }, showZoom && renderButton('zoom-in', zoomInLabel, onZoomIn), showZoom && renderButton('zoom-out', zoomOutLabel, onZoomOut), showCompass && renderButton('compass', compassLabel, onResetNorth, renderCompass(context))));
}

NavigationControl.propTypes = propTypes;
NavigationControl.defaultProps = defaultProps;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (react__WEBPACK_IMPORTED_MODULE_1__.memo(NavigationControl));
//# sourceMappingURL=navigation-control.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/popup.js":
/*!****************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/popup.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _use_map_control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");
/* harmony import */ var _utils_dynamic_position__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/dynamic-position */ "./node_modules/react-map-gl/dist/esm/utils/dynamic-position.js");
/* harmony import */ var _utils_crisp_pixel__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/crisp-pixel */ "./node_modules/react-map-gl/dist/esm/utils/crisp-pixel.js");







var propTypes = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_2__.mapControlPropTypes, {
  className: prop_types__WEBPACK_IMPORTED_MODULE_5__.string,
  longitude: prop_types__WEBPACK_IMPORTED_MODULE_5__.number.isRequired,
  latitude: prop_types__WEBPACK_IMPORTED_MODULE_5__.number.isRequired,
  altitude: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  offsetLeft: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  offsetTop: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  tipSize: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  closeButton: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  closeOnClick: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  anchor: prop_types__WEBPACK_IMPORTED_MODULE_5__.oneOf(Object.keys(_utils_dynamic_position__WEBPACK_IMPORTED_MODULE_3__.ANCHOR_POSITION)),
  dynamicPosition: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  sortByDepth: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  onClose: prop_types__WEBPACK_IMPORTED_MODULE_5__.func
});
var defaultProps = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_2__.mapControlDefaultProps, {
  className: '',
  altitude: 0,
  offsetLeft: 0,
  offsetTop: 0,
  tipSize: 10,
  anchor: 'bottom',
  dynamicPosition: true,
  sortByDepth: false,
  closeButton: true,
  closeOnClick: true,
  onClose: function onClose() {}
});

function getPosition(props, viewport, el, _ref) {
  var _ref2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__["default"])(_ref, 2),
      x = _ref2[0],
      y = _ref2[1];

  var anchor = props.anchor,
      dynamicPosition = props.dynamicPosition,
      tipSize = props.tipSize;

  if (el) {
    return dynamicPosition ? (0,_utils_dynamic_position__WEBPACK_IMPORTED_MODULE_3__.getDynamicPosition)({
      x: x,
      y: y,
      anchor: anchor,
      padding: tipSize,
      width: viewport.width,
      height: viewport.height,
      selfWidth: el.clientWidth,
      selfHeight: el.clientHeight
    }) : anchor;
  }

  return anchor;
}

function getContainerStyle(props, viewport, el, _ref3, positionType) {
  var _ref4 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__["default"])(_ref3, 3),
      x = _ref4[0],
      y = _ref4[1],
      z = _ref4[2];

  var offsetLeft = props.offsetLeft,
      offsetTop = props.offsetTop,
      sortByDepth = props.sortByDepth;
  var anchorPosition = _utils_dynamic_position__WEBPACK_IMPORTED_MODULE_3__.ANCHOR_POSITION[positionType];
  var left = x + offsetLeft;
  var top = y + offsetTop;
  var xPercentage = (0,_utils_crisp_pixel__WEBPACK_IMPORTED_MODULE_4__.crispPercentage)(el, -anchorPosition.x * 100);
  var yPercentage = (0,_utils_crisp_pixel__WEBPACK_IMPORTED_MODULE_4__.crispPercentage)(el, -anchorPosition.y * 100, 'y');
  var style = {
    position: 'absolute',
    transform: "\n      translate(".concat(xPercentage, "%, ").concat(yPercentage, "%)\n      translate(").concat((0,_utils_crisp_pixel__WEBPACK_IMPORTED_MODULE_4__.crispPixel)(left), "px, ").concat((0,_utils_crisp_pixel__WEBPACK_IMPORTED_MODULE_4__.crispPixel)(top), "px)\n    "),
    display: undefined,
    zIndex: undefined
  };

  if (!sortByDepth) {
    return style;
  }

  if (z > 1 || z < -1 || x < 0 || x > viewport.width || y < 0 || y > viewport.height) {
    style.display = 'none';
  } else {
    style.zIndex = Math.floor((1 - z) / 2 * 100000);
  }

  return style;
}

function Popup(props) {
  var contentRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
  var thisRef = (0,_use_map_control__WEBPACK_IMPORTED_MODULE_2__["default"])(props);
  var context = thisRef.context,
      containerRef = thisRef.containerRef;

  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false),
      _useState2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__["default"])(_useState, 2),
      setLoaded = _useState2[1];

  (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
    setLoaded(true);
  }, [contentRef.current]);
  (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
    if (context.eventManager && props.closeOnClick) {
      var clickCallback = function clickCallback() {
        return thisRef.props.onClose();
      };

      context.eventManager.on('anyclick', clickCallback);
      return function () {
        context.eventManager.off('anyclick', clickCallback);
      };
    }

    return undefined;
  }, [context.eventManager, props.closeOnClick]);
  var viewport = context.viewport;
  var className = props.className,
      longitude = props.longitude,
      latitude = props.latitude,
      altitude = props.altitude,
      tipSize = props.tipSize,
      closeButton = props.closeButton,
      children = props.children;
  var position = viewport.project([longitude, latitude, altitude]);
  var positionType = getPosition(props, viewport, contentRef.current, position);
  var containerStyle = getContainerStyle(props, viewport, containerRef.current, position, positionType);
  var onClickCloseButton = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (evt) {
    thisRef.props.onClose();
    var eventManager = thisRef.context.eventManager;

    if (eventManager) {
      eventManager.once('click', function (e) {
        return e.stopPropagation();
      }, evt.target);
    }
  }, []);
  return react__WEBPACK_IMPORTED_MODULE_1__.createElement("div", {
    className: "mapboxgl-popup mapboxgl-popup-anchor-".concat(positionType, " ").concat(className),
    style: containerStyle,
    ref: containerRef
  }, react__WEBPACK_IMPORTED_MODULE_1__.createElement("div", {
    key: "tip",
    className: "mapboxgl-popup-tip",
    style: {
      borderWidth: tipSize
    }
  }), react__WEBPACK_IMPORTED_MODULE_1__.createElement("div", {
    key: "content",
    ref: contentRef,
    className: "mapboxgl-popup-content"
  }, closeButton && react__WEBPACK_IMPORTED_MODULE_1__.createElement("button", {
    key: "close-button",
    className: "mapboxgl-popup-close-button",
    type: "button",
    onClick: onClickCloseButton
  }, "\xD7"), children));
}

Popup.propTypes = propTypes;
Popup.defaultProps = defaultProps;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (react__WEBPACK_IMPORTED_MODULE_1__.memo(Popup));
//# sourceMappingURL=popup.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/scale-control.js":
/*!************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/scale-control.js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/mapboxgl */ "./node_modules/react-map-gl/dist/esm/utils/mapboxgl.js");
/* harmony import */ var _use_map_control__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");



function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }






var propTypes = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_4__.mapControlPropTypes, {
  className: prop_types__WEBPACK_IMPORTED_MODULE_5__.string,
  style: prop_types__WEBPACK_IMPORTED_MODULE_5__.object,
  maxWidth: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  unit: prop_types__WEBPACK_IMPORTED_MODULE_5__.oneOf(['imperial', 'metric', 'nautical'])
});
var defaultProps = Object.assign({}, _use_map_control__WEBPACK_IMPORTED_MODULE_4__.mapControlDefaultProps, {
  className: '',
  maxWidth: 100,
  unit: 'metric'
});

function ScaleControl(props) {
  var _useMapControl = (0,_use_map_control__WEBPACK_IMPORTED_MODULE_4__["default"])(props),
      context = _useMapControl.context,
      containerRef = _useMapControl.containerRef;

  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(null),
      _useState2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_useState, 2),
      mapboxScaleControl = _useState2[0],
      createMapboxScaleControl = _useState2[1];

  (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(function () {
    if (context.map) {
      var control = new _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_3__["default"].ScaleControl();
      control._map = context.map;
      control._container = containerRef.current;
      createMapboxScaleControl(control);
    }
  }, [context.map]);

  if (mapboxScaleControl) {
    mapboxScaleControl.options = props;

    mapboxScaleControl._onMove();
  }

  var style = (0,react__WEBPACK_IMPORTED_MODULE_2__.useMemo)(function () {
    return _objectSpread({
      position: 'absolute'
    }, props.style);
  }, [props.style]);
  return react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    style: style,
    className: props.className
  }, react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    ref: containerRef,
    className: "mapboxgl-ctrl mapboxgl-ctrl-scale"
  }));
}

ScaleControl.propTypes = propTypes;
ScaleControl.defaultProps = defaultProps;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (react__WEBPACK_IMPORTED_MODULE_2__.memo(ScaleControl));
//# sourceMappingURL=scale-control.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/source.js":
/*!*****************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/source.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _map_context__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./map-context */ "./node_modules/react-map-gl/dist/esm/components/map-context.js");
/* harmony import */ var _utils_assert__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/assert */ "./node_modules/react-map-gl/dist/esm/utils/assert.js");
/* harmony import */ var _utils_deep_equal__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/deep-equal */ "./node_modules/react-map-gl/dist/esm/utils/deep-equal.js");



function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_1__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }








var propTypes = {
  type: prop_types__WEBPACK_IMPORTED_MODULE_6__.string.isRequired,
  id: prop_types__WEBPACK_IMPORTED_MODULE_6__.string
};
var sourceCounter = 0;

function createSource(map, id, props) {
  if (map.style && map.style._loaded) {
    var options = _objectSpread({}, props);

    delete options.id;
    delete options.children;
    map.addSource(id, options);
    return map.getSource(id);
  }

  return null;
}

function updateSource(source, props, prevProps) {
  (0,_utils_assert__WEBPACK_IMPORTED_MODULE_4__["default"])(props.id === prevProps.id, 'source id changed');
  (0,_utils_assert__WEBPACK_IMPORTED_MODULE_4__["default"])(props.type === prevProps.type, 'source type changed');
  var changedKey = '';
  var changedKeyCount = 0;

  for (var key in props) {
    if (key !== 'children' && key !== 'id' && !(0,_utils_deep_equal__WEBPACK_IMPORTED_MODULE_5__["default"])(prevProps[key], props[key])) {
      changedKey = key;
      changedKeyCount++;
    }
  }

  if (!changedKeyCount) {
    return;
  }

  var type = props.type;

  if (type === 'geojson') {
    source.setData(props.data);
  } else if (type === 'image') {
    source.updateImage({
      url: props.url,
      coordinates: props.coordinates
    });
  } else if ((type === 'canvas' || type === 'video') && changedKeyCount === 1 && changedKey === 'coordinates') {
    source.setCoordinates(props.coordinates);
  } else if (type === 'vector' && source.setUrl) {
    switch (changedKey) {
      case 'url':
        source.setUrl(props.url);
        break;

      case 'tiles':
        source.setTiles(props.tiles);
        break;

      default:
    }
  } else {
    console.warn("Unable to update <Source> prop: ".concat(changedKey));
  }
}

function Source(props) {
  var context = (0,react__WEBPACK_IMPORTED_MODULE_2__.useContext)(_map_context__WEBPACK_IMPORTED_MODULE_3__["default"]);
  var propsRef = (0,react__WEBPACK_IMPORTED_MODULE_2__.useRef)({
    id: props.id,
    type: props.type
  });

  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(0),
      _useState2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__["default"])(_useState, 2),
      setStyleLoaded = _useState2[1];

  var id = (0,react__WEBPACK_IMPORTED_MODULE_2__.useMemo)(function () {
    return props.id || "jsx-source-".concat(sourceCounter++);
  }, []);
  var map = context.map;
  (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(function () {
    if (map) {
      var forceUpdate = function forceUpdate() {
        return setStyleLoaded(function (version) {
          return version + 1;
        });
      };

      map.on('styledata', forceUpdate);
      return function () {
        map.off('styledata', forceUpdate);
        requestAnimationFrame(function () {
          if (map.style && map.style._loaded && map.getSource(id)) {
            map.removeSource(id);
          }
        });
      };
    }

    return undefined;
  }, [map, id]);
  var source = map && map.style && map.getSource(id);

  if (source) {
    updateSource(source, props, propsRef.current);
  } else {
    source = createSource(map, id, props);
  }

  propsRef.current = props;
  return source && react__WEBPACK_IMPORTED_MODULE_2__.Children.map(props.children, function (child) {
    return child && (0,react__WEBPACK_IMPORTED_MODULE_2__.cloneElement)(child, {
      source: id
    });
  }) || null;
}

Source.propTypes = propTypes;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Source);
//# sourceMappingURL=source.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/static-map.js":
/*!*********************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/static-map.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "getViewport": () => (/* binding */ getViewport)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var viewport_mercator_project__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! viewport-mercator-project */ "./node_modules/viewport-mercator-project/module.js");
/* harmony import */ var resize_observer_polyfill__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! resize-observer-polyfill */ "./node_modules/resize-observer-polyfill/dist/ResizeObserver.es.js");
/* harmony import */ var _mapbox_mapbox__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../mapbox/mapbox */ "./node_modules/react-map-gl/dist/esm/mapbox/mapbox.js");
/* harmony import */ var _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/mapboxgl */ "./node_modules/react-map-gl/dist/esm/utils/mapboxgl.js");
/* harmony import */ var _utils_map_constraints__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/map-constraints */ "./node_modules/react-map-gl/dist/esm/utils/map-constraints.js");
/* harmony import */ var _utils_map_state__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/map-state */ "./node_modules/react-map-gl/dist/esm/utils/map-state.js");
/* harmony import */ var _map_context__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./map-context */ "./node_modules/react-map-gl/dist/esm/components/map-context.js");
/* harmony import */ var _utils_use_isomorphic_layout_effect__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../utils/use-isomorphic-layout-effect */ "./node_modules/react-map-gl/dist/esm/utils/use-isomorphic-layout-effect.js");



function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_1__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }












var TOKEN_DOC_URL = 'https://visgl.github.io/react-map-gl/docs/get-started/mapbox-tokens';
var NO_TOKEN_WARNING = 'A valid API access token is required to use Mapbox data';

function noop() {}

function getViewport(_ref) {
  var props = _ref.props,
      width = _ref.width,
      height = _ref.height;
  return new viewport_mercator_project__WEBPACK_IMPORTED_MODULE_3__["default"](_objectSpread(_objectSpread(_objectSpread({}, props), props.viewState), {}, {
    width: width,
    height: height
  }));
}
var UNAUTHORIZED_ERROR_CODE = 401;
var CONTAINER_STYLE = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  overflow: 'hidden'
};
var propTypes = Object.assign({}, _mapbox_mapbox__WEBPACK_IMPORTED_MODULE_5__["default"].propTypes, {
  width: prop_types__WEBPACK_IMPORTED_MODULE_11__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_11__.number, prop_types__WEBPACK_IMPORTED_MODULE_11__.string]),
  height: prop_types__WEBPACK_IMPORTED_MODULE_11__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_11__.number, prop_types__WEBPACK_IMPORTED_MODULE_11__.string]),
  onResize: prop_types__WEBPACK_IMPORTED_MODULE_11__.func,
  disableTokenWarning: prop_types__WEBPACK_IMPORTED_MODULE_11__.bool,
  visible: prop_types__WEBPACK_IMPORTED_MODULE_11__.bool,
  className: prop_types__WEBPACK_IMPORTED_MODULE_11__.string,
  style: prop_types__WEBPACK_IMPORTED_MODULE_11__.object,
  visibilityConstraints: prop_types__WEBPACK_IMPORTED_MODULE_11__.object
});
var defaultProps = Object.assign({}, _mapbox_mapbox__WEBPACK_IMPORTED_MODULE_5__["default"].defaultProps, {
  disableTokenWarning: false,
  visible: true,
  onResize: noop,
  className: '',
  style: null,
  visibilityConstraints: _utils_map_state__WEBPACK_IMPORTED_MODULE_8__.MAPBOX_LIMITS
});

function NoTokenWarning() {
  var style = {
    position: 'absolute',
    left: 0,
    top: 0
  };
  return react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    key: "warning",
    id: "no-token-warning",
    style: style
  }, react__WEBPACK_IMPORTED_MODULE_2__.createElement("h3", {
    key: "header"
  }, NO_TOKEN_WARNING), react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    key: "text"
  }, "For information on setting up your basemap, read"), react__WEBPACK_IMPORTED_MODULE_2__.createElement("a", {
    key: "link",
    href: TOKEN_DOC_URL
  }, "Note on Map Tokens"));
}

function getRefHandles(mapboxRef) {
  return {
    getMap: function getMap() {
      return mapboxRef.current && mapboxRef.current.getMap();
    },
    queryRenderedFeatures: function queryRenderedFeatures(geometry) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var map = mapboxRef.current && mapboxRef.current.getMap();
      return map && map.queryRenderedFeatures(geometry, options);
    }
  };
}

var StaticMap = (0,react__WEBPACK_IMPORTED_MODULE_2__.forwardRef)(function (props, ref) {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(true),
      _useState2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__["default"])(_useState, 2),
      accessTokenValid = _useState2[0],
      setTokenState = _useState2[1];

  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)({
    width: 0,
    height: 0
  }),
      _useState4 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__["default"])(_useState3, 2),
      size = _useState4[0],
      setSize = _useState4[1];

  var mapboxRef = (0,react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
  var mapDivRef = (0,react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
  var containerRef = (0,react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
  var overlayRef = (0,react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
  var context = (0,react__WEBPACK_IMPORTED_MODULE_2__.useContext)(_map_context__WEBPACK_IMPORTED_MODULE_9__["default"]);
  (0,_utils_use_isomorphic_layout_effect__WEBPACK_IMPORTED_MODULE_10__["default"])(function () {
    if (!StaticMap.supported()) {
      return undefined;
    }

    var mapbox = new _mapbox_mapbox__WEBPACK_IMPORTED_MODULE_5__["default"](_objectSpread(_objectSpread(_objectSpread({}, props), size), {}, {
      mapboxgl: _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_6__["default"],
      container: mapDivRef.current,
      onError: function onError(evt) {
        var statusCode = evt.error && evt.error.status || evt.status;

        if (statusCode === UNAUTHORIZED_ERROR_CODE && accessTokenValid) {
          console.error(NO_TOKEN_WARNING);
          setTokenState(false);
        }

        props.onError(evt);
      }
    }));
    mapboxRef.current = mapbox;

    if (context && context.setMap) {
      context.setMap(mapbox.getMap());
    }

    var resizeObserver = new resize_observer_polyfill__WEBPACK_IMPORTED_MODULE_4__["default"](function (entries) {
      if (entries[0].contentRect) {
        var _entries$0$contentRec = entries[0].contentRect,
            _width = _entries$0$contentRec.width,
            _height = _entries$0$contentRec.height;
        setSize({
          width: _width,
          height: _height
        });
        props.onResize({
          width: _width,
          height: _height
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return function () {
      mapbox.finalize();
      mapboxRef.current = null;
      resizeObserver.disconnect();
    };
  }, []);
  (0,_utils_use_isomorphic_layout_effect__WEBPACK_IMPORTED_MODULE_10__["default"])(function () {
    if (mapboxRef.current) {
      mapboxRef.current.setProps(_objectSpread(_objectSpread({}, props), size));
    }
  });
  var map = mapboxRef.current && mapboxRef.current.getMap();
  (0,react__WEBPACK_IMPORTED_MODULE_2__.useImperativeHandle)(ref, function () {
    return getRefHandles(mapboxRef);
  }, []);
  var preventScroll = (0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)(function (_ref2) {
    var target = _ref2.target;

    if (target === overlayRef.current) {
      target.scrollTo(0, 0);
    }
  }, []);
  var overlays = map && react__WEBPACK_IMPORTED_MODULE_2__.createElement(_map_context__WEBPACK_IMPORTED_MODULE_9__.MapContextProvider, {
    value: _objectSpread(_objectSpread({}, context), {}, {
      viewport: context.viewport || getViewport(_objectSpread({
        map: map,
        props: props
      }, size)),
      map: map,
      container: context.container || containerRef.current
    })
  }, react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    key: "map-overlays",
    className: "overlays",
    ref: overlayRef,
    style: CONTAINER_STYLE,
    onScroll: preventScroll
  }, props.children));
  var className = props.className,
      width = props.width,
      height = props.height,
      style = props.style,
      visibilityConstraints = props.visibilityConstraints;
  var mapContainerStyle = Object.assign({
    position: 'relative'
  }, style, {
    width: width,
    height: height
  });
  var visible = props.visible && (0,_utils_map_constraints__WEBPACK_IMPORTED_MODULE_7__.checkVisibilityConstraints)(props.viewState || props, visibilityConstraints);
  var mapStyle = Object.assign({}, CONTAINER_STYLE, {
    visibility: visible ? 'inherit' : 'hidden'
  });
  return react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    key: "map-container",
    ref: containerRef,
    style: mapContainerStyle
  }, react__WEBPACK_IMPORTED_MODULE_2__.createElement("div", {
    key: "map-mapbox",
    ref: mapDivRef,
    style: mapStyle,
    className: className
  }), overlays, !accessTokenValid && !props.disableTokenWarning && react__WEBPACK_IMPORTED_MODULE_2__.createElement(NoTokenWarning, null));
});

StaticMap.supported = function () {
  return _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_6__["default"] && _utils_mapboxgl__WEBPACK_IMPORTED_MODULE_6__["default"].supported();
};

StaticMap.propTypes = propTypes;
StaticMap.defaultProps = defaultProps;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (StaticMap);
//# sourceMappingURL=static-map.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js":
/*!**************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/components/use-map-control.js ***!
  \**************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ useMapControl),
/* harmony export */   "mapControlDefaultProps": () => (/* binding */ mapControlDefaultProps),
/* harmony export */   "mapControlPropTypes": () => (/* binding */ mapControlPropTypes)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _map_context__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./map-context */ "./node_modules/react-map-gl/dist/esm/components/map-context.js");



var mapControlDefaultProps = {
  captureScroll: false,
  captureDrag: true,
  captureClick: true,
  captureDoubleClick: true,
  capturePointerMove: false
};
var mapControlPropTypes = {
  captureScroll: prop_types__WEBPACK_IMPORTED_MODULE_2__.bool,
  captureDrag: prop_types__WEBPACK_IMPORTED_MODULE_2__.bool,
  captureClick: prop_types__WEBPACK_IMPORTED_MODULE_2__.bool,
  captureDoubleClick: prop_types__WEBPACK_IMPORTED_MODULE_2__.bool,
  capturePointerMove: prop_types__WEBPACK_IMPORTED_MODULE_2__.bool
};

function onMount(thisRef) {
  var ref = thisRef.containerRef.current;
  var eventManager = thisRef.context.eventManager;

  if (!ref || !eventManager) {
    return undefined;
  }

  var events = {
    wheel: function wheel(evt) {
      var props = thisRef.props;

      if (props.captureScroll) {
        evt.stopPropagation();
      }

      if (props.onScroll) {
        props.onScroll(evt, thisRef);
      }
    },
    panstart: function panstart(evt) {
      var props = thisRef.props;

      if (props.captureDrag) {
        evt.stopPropagation();
      }

      if (props.onDragStart) {
        props.onDragStart(evt, thisRef);
      }
    },
    anyclick: function anyclick(evt) {
      var props = thisRef.props;

      if (props.captureClick) {
        evt.stopPropagation();
      }

      if (props.onNativeClick) {
        props.onNativeClick(evt, thisRef);
      }
    },
    click: function click(evt) {
      var props = thisRef.props;

      if (props.captureClick) {
        evt.stopPropagation();
      }

      if (props.onClick) {
        props.onClick(evt, thisRef);
      }
    },
    dblclick: function dblclick(evt) {
      var props = thisRef.props;

      if (props.captureDoubleClick) {
        evt.stopPropagation();
      }

      if (props.onDoubleClick) {
        props.onDoubleClick(evt, thisRef);
      }
    },
    pointermove: function pointermove(evt) {
      var props = thisRef.props;

      if (props.capturePointerMove) {
        evt.stopPropagation();
      }

      if (props.onPointerMove) {
        props.onPointerMove(evt, thisRef);
      }
    }
  };
  eventManager.watch(events, ref);
  return function () {
    eventManager.off(events);
  };
}

function useMapControl() {
  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var context = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(_map_context__WEBPACK_IMPORTED_MODULE_1__["default"]);
  var containerRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  var _thisRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)({
    props: props,
    state: {},
    context: context,
    containerRef: containerRef
  });

  var thisRef = _thisRef.current;
  thisRef.props = props;
  thisRef.context = context;
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    return onMount(thisRef);
  }, [context.eventManager]);
  return thisRef;
}
//# sourceMappingURL=use-map-control.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/index.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AttributionControl": () => (/* reexport safe */ _components_attribution_control__WEBPACK_IMPORTED_MODULE_7__["default"]),
/* harmony export */   "BaseControl": () => (/* reexport safe */ _components_base_control__WEBPACK_IMPORTED_MODULE_4__["default"]),
/* harmony export */   "CanvasOverlay": () => (/* reexport safe */ _overlays_canvas_overlay__WEBPACK_IMPORTED_MODULE_12__["default"]),
/* harmony export */   "FlyToInterpolator": () => (/* reexport safe */ _utils_transition__WEBPACK_IMPORTED_MODULE_16__.ViewportFlyToInterpolator),
/* harmony export */   "FullscreenControl": () => (/* reexport safe */ _components_fullscreen_control__WEBPACK_IMPORTED_MODULE_8__["default"]),
/* harmony export */   "GeolocateControl": () => (/* reexport safe */ _components_geolocate_control__WEBPACK_IMPORTED_MODULE_9__["default"]),
/* harmony export */   "HTMLOverlay": () => (/* reexport safe */ _overlays_html_overlay__WEBPACK_IMPORTED_MODULE_13__["default"]),
/* harmony export */   "InteractiveMap": () => (/* reexport safe */ _components_interactive_map__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "Layer": () => (/* reexport safe */ _components_layer__WEBPACK_IMPORTED_MODULE_3__["default"]),
/* harmony export */   "LinearInterpolator": () => (/* reexport safe */ _utils_transition__WEBPACK_IMPORTED_MODULE_16__.LinearInterpolator),
/* harmony export */   "MapContext": () => (/* reexport safe */ _components_map_context__WEBPACK_IMPORTED_MODULE_20__["default"]),
/* harmony export */   "MapController": () => (/* reexport safe */ _utils_map_controller__WEBPACK_IMPORTED_MODULE_17__["default"]),
/* harmony export */   "Marker": () => (/* reexport safe */ _components_marker__WEBPACK_IMPORTED_MODULE_5__["default"]),
/* harmony export */   "NavigationControl": () => (/* reexport safe */ _components_navigation_control__WEBPACK_IMPORTED_MODULE_10__["default"]),
/* harmony export */   "Popup": () => (/* reexport safe */ _components_popup__WEBPACK_IMPORTED_MODULE_6__["default"]),
/* harmony export */   "SVGOverlay": () => (/* reexport safe */ _overlays_svg_overlay__WEBPACK_IMPORTED_MODULE_14__["default"]),
/* harmony export */   "ScaleControl": () => (/* reexport safe */ _components_scale_control__WEBPACK_IMPORTED_MODULE_11__["default"]),
/* harmony export */   "Source": () => (/* reexport safe */ _components_source__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "StaticMap": () => (/* reexport safe */ _components_static_map__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "TRANSITION_EVENTS": () => (/* reexport safe */ _utils_transition_manager__WEBPACK_IMPORTED_MODULE_15__.TRANSITION_EVENTS),
/* harmony export */   "TransitionInterpolator": () => (/* reexport safe */ _utils_transition__WEBPACK_IMPORTED_MODULE_16__.TransitionInterpolator),
/* harmony export */   "WebMercatorViewport": () => (/* reexport safe */ viewport_mercator_project__WEBPACK_IMPORTED_MODULE_18__.WebMercatorViewport),
/* harmony export */   "_MapContext": () => (/* reexport safe */ _components_map_context__WEBPACK_IMPORTED_MODULE_20__["default"]),
/* harmony export */   "_useMapControl": () => (/* reexport safe */ _components_use_map_control__WEBPACK_IMPORTED_MODULE_21__["default"]),
/* harmony export */   "default": () => (/* reexport safe */ _components_interactive_map__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "setRTLTextPlugin": () => (/* reexport safe */ _utils_set_rtl_text_plugin__WEBPACK_IMPORTED_MODULE_19__["default"])
/* harmony export */ });
/* harmony import */ var _components_interactive_map__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./components/interactive-map */ "./node_modules/react-map-gl/dist/esm/components/interactive-map.js");
/* harmony import */ var _components_static_map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components/static-map */ "./node_modules/react-map-gl/dist/esm/components/static-map.js");
/* harmony import */ var _components_source__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./components/source */ "./node_modules/react-map-gl/dist/esm/components/source.js");
/* harmony import */ var _components_layer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/layer */ "./node_modules/react-map-gl/dist/esm/components/layer.js");
/* harmony import */ var _components_base_control__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./components/base-control */ "./node_modules/react-map-gl/dist/esm/components/base-control.js");
/* harmony import */ var _components_marker__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./components/marker */ "./node_modules/react-map-gl/dist/esm/components/marker.js");
/* harmony import */ var _components_popup__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./components/popup */ "./node_modules/react-map-gl/dist/esm/components/popup.js");
/* harmony import */ var _components_attribution_control__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./components/attribution-control */ "./node_modules/react-map-gl/dist/esm/components/attribution-control.js");
/* harmony import */ var _components_fullscreen_control__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./components/fullscreen-control */ "./node_modules/react-map-gl/dist/esm/components/fullscreen-control.js");
/* harmony import */ var _components_geolocate_control__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./components/geolocate-control */ "./node_modules/react-map-gl/dist/esm/components/geolocate-control.js");
/* harmony import */ var _components_navigation_control__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./components/navigation-control */ "./node_modules/react-map-gl/dist/esm/components/navigation-control.js");
/* harmony import */ var _components_scale_control__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./components/scale-control */ "./node_modules/react-map-gl/dist/esm/components/scale-control.js");
/* harmony import */ var _overlays_canvas_overlay__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./overlays/canvas-overlay */ "./node_modules/react-map-gl/dist/esm/overlays/canvas-overlay.js");
/* harmony import */ var _overlays_html_overlay__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./overlays/html-overlay */ "./node_modules/react-map-gl/dist/esm/overlays/html-overlay.js");
/* harmony import */ var _overlays_svg_overlay__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./overlays/svg-overlay */ "./node_modules/react-map-gl/dist/esm/overlays/svg-overlay.js");
/* harmony import */ var _utils_transition_manager__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./utils/transition-manager */ "./node_modules/react-map-gl/dist/esm/utils/transition-manager.js");
/* harmony import */ var _utils_transition__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./utils/transition */ "./node_modules/react-map-gl/dist/esm/utils/transition/index.js");
/* harmony import */ var _utils_map_controller__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./utils/map-controller */ "./node_modules/react-map-gl/dist/esm/utils/map-controller.js");
/* harmony import */ var viewport_mercator_project__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! viewport-mercator-project */ "./node_modules/viewport-mercator-project/module.js");
/* harmony import */ var _utils_set_rtl_text_plugin__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./utils/set-rtl-text-plugin */ "./node_modules/react-map-gl/dist/esm/utils/set-rtl-text-plugin.js");
/* harmony import */ var _components_map_context__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./components/map-context */ "./node_modules/react-map-gl/dist/esm/components/map-context.js");
/* harmony import */ var _components_use_map_control__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./components/use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");
























//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/mapbox/mapbox.js":
/*!*************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/mapbox/mapbox.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Mapbox),
/* harmony export */   "getAccessToken": () => (/* binding */ getAccessToken)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _utils_globals__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/globals */ "./node_modules/react-map-gl/dist/esm/utils/globals.js");
/* harmony import */ var _utils_style_utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/style-utils */ "./node_modules/react-map-gl/dist/esm/utils/style-utils.js");







function noop() {}

function defaultOnError(event) {
  if (event) {
    console.error(event.error);
  }
}

var propTypes = {
  container: prop_types__WEBPACK_IMPORTED_MODULE_5__.object,
  gl: prop_types__WEBPACK_IMPORTED_MODULE_5__.object,
  mapboxApiAccessToken: prop_types__WEBPACK_IMPORTED_MODULE_5__.string,
  mapboxApiUrl: prop_types__WEBPACK_IMPORTED_MODULE_5__.string,
  attributionControl: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  preserveDrawingBuffer: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  reuseMaps: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  transformRequest: prop_types__WEBPACK_IMPORTED_MODULE_5__.func,
  mapOptions: prop_types__WEBPACK_IMPORTED_MODULE_5__.object,
  mapStyle: prop_types__WEBPACK_IMPORTED_MODULE_5__.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_5__.string, prop_types__WEBPACK_IMPORTED_MODULE_5__.object]),
  preventStyleDiffing: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  visible: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  asyncRender: prop_types__WEBPACK_IMPORTED_MODULE_5__.bool,
  onLoad: prop_types__WEBPACK_IMPORTED_MODULE_5__.func,
  onError: prop_types__WEBPACK_IMPORTED_MODULE_5__.func,
  width: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  height: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  viewState: prop_types__WEBPACK_IMPORTED_MODULE_5__.object,
  longitude: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  latitude: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  zoom: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  bearing: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  pitch: prop_types__WEBPACK_IMPORTED_MODULE_5__.number,
  altitude: prop_types__WEBPACK_IMPORTED_MODULE_5__.number
};
var defaultProps = {
  container: _utils_globals__WEBPACK_IMPORTED_MODULE_3__.document.body,
  mapboxApiAccessToken: getAccessToken(),
  mapboxApiUrl: 'https://api.mapbox.com',
  preserveDrawingBuffer: false,
  attributionControl: true,
  reuseMaps: false,
  mapOptions: {},
  mapStyle: 'mapbox://styles/mapbox/light-v8',
  preventStyleDiffing: false,
  visible: true,
  asyncRender: false,
  onLoad: noop,
  onError: defaultOnError,
  width: 0,
  height: 0,
  longitude: 0,
  latitude: 0,
  zoom: 0,
  bearing: 0,
  pitch: 0,
  altitude: 1.5
};
function getAccessToken() {
  var accessToken = null;

  if (typeof window !== 'undefined' && window.location) {
    var match = window.location.search.match(/access_token=([^&\/]*)/);
    accessToken = match && match[1];
  }

  if (!accessToken && typeof process !== 'undefined') {
    accessToken = accessToken || ({}).MapboxAccessToken || ({}).REACT_APP_MAPBOX_ACCESS_TOKEN;
  }

  return accessToken || 'no-token';
}

function checkPropTypes(props) {
  var component = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'component';

  if (props.debug) {
    prop_types__WEBPACK_IMPORTED_MODULE_5__.checkPropTypes(propTypes, props, 'prop', component);
  }
}

var Mapbox = function () {
  function Mapbox(props) {
    var _this = this;

    (0,_babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, Mapbox);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "props", defaultProps);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "width", 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "height", 0);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "_fireLoadEvent", function () {
      _this.props.onLoad({
        type: 'load',
        target: _this._map
      });
    });

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "_handleError", function (event) {
      _this.props.onError(event);
    });

    if (!props.mapboxgl) {
      throw new Error('Mapbox not available');
    }

    this.mapboxgl = props.mapboxgl;

    if (!Mapbox.initialized) {
      Mapbox.initialized = true;

      this._checkStyleSheet(this.mapboxgl.version);
    }

    this._initialize(props);
  }

  (0,_babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(Mapbox, [{
    key: "finalize",
    value: function finalize() {
      this._destroy();

      return this;
    }
  }, {
    key: "setProps",
    value: function setProps(props) {
      this._update(this.props, props);

      return this;
    }
  }, {
    key: "redraw",
    value: function redraw() {
      var map = this._map;

      if (map.style) {
        if (map._frame) {
          map._frame.cancel();

          map._frame = null;
        }

        map._render();
      }
    }
  }, {
    key: "getMap",
    value: function getMap() {
      return this._map;
    }
  }, {
    key: "_reuse",
    value: function _reuse(props) {
      this._map = Mapbox.savedMap;

      var oldContainer = this._map.getContainer();

      var newContainer = props.container;
      newContainer.classList.add('mapboxgl-map');

      while (oldContainer.childNodes.length > 0) {
        newContainer.appendChild(oldContainer.childNodes[0]);
      }

      this._map._container = newContainer;
      Mapbox.savedMap = null;

      if (props.mapStyle) {
        this._map.setStyle((0,_utils_style_utils__WEBPACK_IMPORTED_MODULE_4__.normalizeStyle)(props.mapStyle), {
          diff: false
        });
      }

      if (this._map.isStyleLoaded()) {
        this._fireLoadEvent();
      } else {
        this._map.once('styledata', this._fireLoadEvent);
      }
    }
  }, {
    key: "_create",
    value: function _create(props) {
      if (props.reuseMaps && Mapbox.savedMap) {
        this._reuse(props);
      } else {
        if (props.gl) {
          var getContext = HTMLCanvasElement.prototype.getContext;

          HTMLCanvasElement.prototype.getContext = function () {
            HTMLCanvasElement.prototype.getContext = getContext;
            return props.gl;
          };
        }

        var mapOptions = {
          container: props.container,
          center: [0, 0],
          zoom: 8,
          pitch: 0,
          bearing: 0,
          maxZoom: 24,
          style: (0,_utils_style_utils__WEBPACK_IMPORTED_MODULE_4__.normalizeStyle)(props.mapStyle),
          interactive: false,
          trackResize: false,
          attributionControl: props.attributionControl,
          preserveDrawingBuffer: props.preserveDrawingBuffer
        };

        if (props.transformRequest) {
          mapOptions.transformRequest = props.transformRequest;
        }

        this._map = new this.mapboxgl.Map(Object.assign({}, mapOptions, props.mapOptions));

        this._map.once('load', this._fireLoadEvent);

        this._map.on('error', this._handleError);
      }

      return this;
    }
  }, {
    key: "_destroy",
    value: function _destroy() {
      if (!this._map) {
        return;
      }

      if (this.props.reuseMaps && !Mapbox.savedMap) {
        Mapbox.savedMap = this._map;

        this._map.off('load', this._fireLoadEvent);

        this._map.off('error', this._handleError);

        this._map.off('styledata', this._fireLoadEvent);
      } else {
        this._map.remove();
      }

      this._map = null;
    }
  }, {
    key: "_initialize",
    value: function _initialize(props) {
      var _this2 = this;

      props = Object.assign({}, defaultProps, props);
      checkPropTypes(props, 'Mapbox');
      this.mapboxgl.accessToken = props.mapboxApiAccessToken || defaultProps.mapboxApiAccessToken;
      this.mapboxgl.baseApiUrl = props.mapboxApiUrl;

      this._create(props);

      var _props = props,
          container = _props.container;
      Object.defineProperty(container, 'offsetWidth', {
        configurable: true,
        get: function get() {
          return _this2.width;
        }
      });
      Object.defineProperty(container, 'clientWidth', {
        configurable: true,
        get: function get() {
          return _this2.width;
        }
      });
      Object.defineProperty(container, 'offsetHeight', {
        configurable: true,
        get: function get() {
          return _this2.height;
        }
      });
      Object.defineProperty(container, 'clientHeight', {
        configurable: true,
        get: function get() {
          return _this2.height;
        }
      });

      var canvas = this._map.getCanvas();

      if (canvas) {
        canvas.style.outline = 'none';
      }

      this._updateMapViewport({}, props);

      this._updateMapSize({}, props);

      this.props = props;
    }
  }, {
    key: "_update",
    value: function _update(oldProps, newProps) {
      if (!this._map) {
        return;
      }

      newProps = Object.assign({}, this.props, newProps);
      checkPropTypes(newProps, 'Mapbox');

      var viewportChanged = this._updateMapViewport(oldProps, newProps);

      var sizeChanged = this._updateMapSize(oldProps, newProps);

      this._updateMapStyle(oldProps, newProps);

      if (!newProps.asyncRender && (viewportChanged || sizeChanged)) {
        this.redraw();
      }

      this.props = newProps;
    }
  }, {
    key: "_updateMapStyle",
    value: function _updateMapStyle(oldProps, newProps) {
      var styleChanged = oldProps.mapStyle !== newProps.mapStyle;

      if (styleChanged) {
        this._map.setStyle((0,_utils_style_utils__WEBPACK_IMPORTED_MODULE_4__.normalizeStyle)(newProps.mapStyle), {
          diff: !newProps.preventStyleDiffing
        });
      }
    }
  }, {
    key: "_updateMapSize",
    value: function _updateMapSize(oldProps, newProps) {
      var sizeChanged = oldProps.width !== newProps.width || oldProps.height !== newProps.height;

      if (sizeChanged) {
        this.width = newProps.width;
        this.height = newProps.height;

        this._map.resize();
      }

      return sizeChanged;
    }
  }, {
    key: "_updateMapViewport",
    value: function _updateMapViewport(oldProps, newProps) {
      var oldViewState = this._getViewState(oldProps);

      var newViewState = this._getViewState(newProps);

      var viewportChanged = newViewState.latitude !== oldViewState.latitude || newViewState.longitude !== oldViewState.longitude || newViewState.zoom !== oldViewState.zoom || newViewState.pitch !== oldViewState.pitch || newViewState.bearing !== oldViewState.bearing || newViewState.altitude !== oldViewState.altitude;

      if (viewportChanged) {
        this._map.jumpTo(this._viewStateToMapboxProps(newViewState));

        if (newViewState.altitude !== oldViewState.altitude) {
          this._map.transform.altitude = newViewState.altitude;
        }
      }

      return viewportChanged;
    }
  }, {
    key: "_getViewState",
    value: function _getViewState(props) {
      var _ref = props.viewState || props,
          longitude = _ref.longitude,
          latitude = _ref.latitude,
          zoom = _ref.zoom,
          _ref$pitch = _ref.pitch,
          pitch = _ref$pitch === void 0 ? 0 : _ref$pitch,
          _ref$bearing = _ref.bearing,
          bearing = _ref$bearing === void 0 ? 0 : _ref$bearing,
          _ref$altitude = _ref.altitude,
          altitude = _ref$altitude === void 0 ? 1.5 : _ref$altitude;

      return {
        longitude: longitude,
        latitude: latitude,
        zoom: zoom,
        pitch: pitch,
        bearing: bearing,
        altitude: altitude
      };
    }
  }, {
    key: "_checkStyleSheet",
    value: function _checkStyleSheet() {
      var mapboxVersion = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '0.47.0';

      if (typeof _utils_globals__WEBPACK_IMPORTED_MODULE_3__.document === 'undefined') {
        return;
      }

      try {
        var testElement = _utils_globals__WEBPACK_IMPORTED_MODULE_3__.document.createElement('div');
        testElement.className = 'mapboxgl-map';
        testElement.style.display = 'none';
        _utils_globals__WEBPACK_IMPORTED_MODULE_3__.document.body.appendChild(testElement);
        var isCssLoaded = window.getComputedStyle(testElement).position !== 'static';

        if (!isCssLoaded) {
          var link = _utils_globals__WEBPACK_IMPORTED_MODULE_3__.document.createElement('link');
          link.setAttribute('rel', 'stylesheet');
          link.setAttribute('type', 'text/css');
          link.setAttribute('href', "https://api.tiles.mapbox.com/mapbox-gl-js/v".concat(mapboxVersion, "/mapbox-gl.css"));
          _utils_globals__WEBPACK_IMPORTED_MODULE_3__.document.head.appendChild(link);
        }
      } catch (error) {}
    }
  }, {
    key: "_viewStateToMapboxProps",
    value: function _viewStateToMapboxProps(viewState) {
      return {
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch
      };
    }
  }]);

  return Mapbox;
}();

(0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(Mapbox, "initialized", false);

(0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(Mapbox, "propTypes", propTypes);

(0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(Mapbox, "defaultProps", defaultProps);

(0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(Mapbox, "savedMap", null);


//# sourceMappingURL=mapbox.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/overlays/canvas-overlay.js":
/*!***********************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/overlays/canvas-overlay.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _components_use_map_control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");





var pixelRatio = typeof window !== 'undefined' && window.devicePixelRatio || 1;
var propTypes = Object.assign({}, _components_use_map_control__WEBPACK_IMPORTED_MODULE_2__.mapControlPropTypes, {
  redraw: prop_types__WEBPACK_IMPORTED_MODULE_3__.func.isRequired
});
var defaultProps = {
  captureScroll: false,
  captureDrag: false,
  captureClick: false,
  captureDoubleClick: false,
  capturePointerMove: false
};

function CanvasOverlay(props) {
  var _useMapControl = (0,_components_use_map_control__WEBPACK_IMPORTED_MODULE_2__["default"])(props),
      context = _useMapControl.context,
      containerRef = _useMapControl.containerRef;

  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null),
      _useState2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__["default"])(_useState, 2),
      ctx = _useState2[0],
      setDrawingContext = _useState2[1];

  (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
    setDrawingContext(containerRef.current.getContext('2d'));
  }, []);
  var viewport = context.viewport,
      isDragging = context.isDragging;

  if (ctx) {
    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);
    props.redraw({
      width: viewport.width,
      height: viewport.height,
      ctx: ctx,
      isDragging: isDragging,
      project: viewport.project,
      unproject: viewport.unproject
    });
    ctx.restore();
  }

  return react__WEBPACK_IMPORTED_MODULE_1__.createElement("canvas", {
    ref: containerRef,
    width: viewport.width * pixelRatio,
    height: viewport.height * pixelRatio,
    style: {
      width: "".concat(viewport.width, "px"),
      height: "".concat(viewport.height, "px"),
      position: 'absolute',
      left: 0,
      top: 0
    }
  });
}

CanvasOverlay.propTypes = propTypes;
CanvasOverlay.defaultProps = defaultProps;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (CanvasOverlay);
//# sourceMappingURL=canvas-overlay.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/overlays/html-overlay.js":
/*!*********************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/overlays/html-overlay.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _components_use_map_control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");


function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }




var propTypes = Object.assign({}, _components_use_map_control__WEBPACK_IMPORTED_MODULE_2__.mapControlPropTypes, {
  redraw: prop_types__WEBPACK_IMPORTED_MODULE_3__.func.isRequired,
  style: prop_types__WEBPACK_IMPORTED_MODULE_3__.object
});
var defaultProps = {
  captureScroll: false,
  captureDrag: false,
  captureClick: false,
  captureDoubleClick: false,
  capturePointerMove: false
};

function HTMLOverlay(props) {
  var _useMapControl = (0,_components_use_map_control__WEBPACK_IMPORTED_MODULE_2__["default"])(props),
      context = _useMapControl.context,
      containerRef = _useMapControl.containerRef;

  var viewport = context.viewport,
      isDragging = context.isDragging;

  var style = _objectSpread({
    position: 'absolute',
    left: 0,
    top: 0,
    width: viewport.width,
    height: viewport.height
  }, props.style);

  return react__WEBPACK_IMPORTED_MODULE_1__.createElement("div", {
    ref: containerRef,
    style: style
  }, props.redraw({
    width: viewport.width,
    height: viewport.height,
    isDragging: isDragging,
    project: viewport.project,
    unproject: viewport.unproject
  }));
}

HTMLOverlay.propTypes = propTypes;
HTMLOverlay.defaultProps = defaultProps;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (HTMLOverlay);
//# sourceMappingURL=html-overlay.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/overlays/svg-overlay.js":
/*!********************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/overlays/svg-overlay.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _components_use_map_control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/use-map-control */ "./node_modules/react-map-gl/dist/esm/components/use-map-control.js");


function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }




var propTypes = Object.assign({}, _components_use_map_control__WEBPACK_IMPORTED_MODULE_2__.mapControlPropTypes, {
  redraw: prop_types__WEBPACK_IMPORTED_MODULE_3__.func.isRequired,
  style: prop_types__WEBPACK_IMPORTED_MODULE_3__.object
});
var defaultProps = {
  captureScroll: false,
  captureDrag: false,
  captureClick: false,
  captureDoubleClick: false,
  capturePointerMove: false
};

function SVGOverlay(props) {
  var _useMapControl = (0,_components_use_map_control__WEBPACK_IMPORTED_MODULE_2__["default"])(props),
      context = _useMapControl.context,
      containerRef = _useMapControl.containerRef;

  var viewport = context.viewport,
      isDragging = context.isDragging;

  var style = _objectSpread({
    position: 'absolute',
    left: 0,
    top: 0
  }, props.style);

  return react__WEBPACK_IMPORTED_MODULE_1__.createElement("svg", {
    width: viewport.width,
    height: viewport.height,
    ref: containerRef,
    style: style
  }, props.redraw({
    width: viewport.width,
    height: viewport.height,
    isDragging: isDragging,
    project: viewport.project,
    unproject: viewport.unproject
  }));
}

SVGOverlay.propTypes = propTypes;
SVGOverlay.defaultProps = defaultProps;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SVGOverlay);
//# sourceMappingURL=svg-overlay.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/assert.js":
/*!************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/assert.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ assert)
/* harmony export */ });
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'react-map-gl: assertion failed.');
  }
}
//# sourceMappingURL=assert.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/crisp-pixel.js":
/*!*****************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/crisp-pixel.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "crispPercentage": () => (/* binding */ crispPercentage),
/* harmony export */   "crispPixel": () => (/* binding */ crispPixel)
/* harmony export */ });
var pixelRatio = typeof window !== 'undefined' && window.devicePixelRatio || 1;
var crispPixel = function crispPixel(size) {
  return Math.round(size * pixelRatio) / pixelRatio;
};
var crispPercentage = function crispPercentage(el, percentage) {
  var dimension = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'x';

  if (el === null) {
    return percentage;
  }

  var origSize = dimension === 'x' ? el.offsetWidth : el.offsetHeight;
  return crispPixel(percentage / 100 * origSize) / origSize * 100;
};
//# sourceMappingURL=crisp-pixel.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/deep-equal.js":
/*!****************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/deep-equal.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ deepEqual)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/typeof */ "./node_modules/@babel/runtime/helpers/esm/typeof.js");

function deepEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false;
    }

    for (var i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }

    return true;
  } else if (Array.isArray(b)) {
    return false;
  }

  if ((0,_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_0__["default"])(a) === 'object' && (0,_babel_runtime_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_0__["default"])(b) === 'object') {
    var aKeys = Object.keys(a);
    var bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    for (var _i = 0, _aKeys = aKeys; _i < _aKeys.length; _i++) {
      var key = _aKeys[_i];

      if (!b.hasOwnProperty(key)) {
        return false;
      }

      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
}
//# sourceMappingURL=deep-equal.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/dynamic-position.js":
/*!**********************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/dynamic-position.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ANCHOR_POSITION": () => (/* binding */ ANCHOR_POSITION),
/* harmony export */   "getDynamicPosition": () => (/* binding */ getDynamicPosition)
/* harmony export */ });
var ANCHOR_POSITION = {
  top: {
    x: 0.5,
    y: 0
  },
  'top-left': {
    x: 0,
    y: 0
  },
  'top-right': {
    x: 1,
    y: 0
  },
  bottom: {
    x: 0.5,
    y: 1
  },
  'bottom-left': {
    x: 0,
    y: 1
  },
  'bottom-right': {
    x: 1,
    y: 1
  },
  left: {
    x: 0,
    y: 0.5
  },
  right: {
    x: 1,
    y: 0.5
  }
};
var ANCHOR_TYPES = Object.keys(ANCHOR_POSITION);
function getDynamicPosition(_ref) {
  var x = _ref.x,
      y = _ref.y,
      width = _ref.width,
      height = _ref.height,
      selfWidth = _ref.selfWidth,
      selfHeight = _ref.selfHeight,
      anchor = _ref.anchor,
      _ref$padding = _ref.padding,
      padding = _ref$padding === void 0 ? 0 : _ref$padding;
  var _ANCHOR_POSITION$anch = ANCHOR_POSITION[anchor],
      anchorX = _ANCHOR_POSITION$anch.x,
      anchorY = _ANCHOR_POSITION$anch.y;
  var top = y - anchorY * selfHeight;
  var bottom = top + selfHeight;
  var cutoffY = Math.max(0, padding - top) + Math.max(0, bottom - height + padding);

  if (cutoffY > 0) {
    var bestAnchorY = anchorY;
    var minCutoff = cutoffY;

    for (anchorY = 0; anchorY <= 1; anchorY += 0.5) {
      top = y - anchorY * selfHeight;
      bottom = top + selfHeight;
      cutoffY = Math.max(0, padding - top) + Math.max(0, bottom - height + padding);

      if (cutoffY < minCutoff) {
        minCutoff = cutoffY;
        bestAnchorY = anchorY;
      }
    }

    anchorY = bestAnchorY;
  }

  var xStep = 0.5;

  if (anchorY === 0.5) {
    anchorX = Math.floor(anchorX);
    xStep = 1;
  }

  var left = x - anchorX * selfWidth;
  var right = left + selfWidth;
  var cutoffX = Math.max(0, padding - left) + Math.max(0, right - width + padding);

  if (cutoffX > 0) {
    var bestAnchorX = anchorX;
    var _minCutoff = cutoffX;

    for (anchorX = 0; anchorX <= 1; anchorX += xStep) {
      left = x - anchorX * selfWidth;
      right = left + selfWidth;
      cutoffX = Math.max(0, padding - left) + Math.max(0, right - width + padding);

      if (cutoffX < _minCutoff) {
        _minCutoff = cutoffX;
        bestAnchorX = anchorX;
      }
    }

    anchorX = bestAnchorX;
  }

  return ANCHOR_TYPES.find(function (positionType) {
    var anchorPosition = ANCHOR_POSITION[positionType];
    return anchorPosition.x === anchorX && anchorPosition.y === anchorY;
  }) || anchor;
}
//# sourceMappingURL=dynamic-position.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/geolocate-utils.js":
/*!*********************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/geolocate-utils.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isGeolocationSupported": () => (/* binding */ isGeolocationSupported)
/* harmony export */ });
var supported;
function isGeolocationSupported() {
  if (supported !== undefined) {
    return Promise.resolve(supported);
  }

  if (window.navigator.permissions !== undefined) {
    return window.navigator.permissions.query({
      name: 'geolocation'
    }).then(function (p) {
      supported = p.state !== 'denied';
      return supported;
    });
  }

  supported = Boolean(window.navigator.geolocation);
  return Promise.resolve(supported);
}
//# sourceMappingURL=geolocate-utils.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/globals.js":
/*!*************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/globals.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "document": () => (/* binding */ document_),
/* harmony export */   "global": () => (/* binding */ global_),
/* harmony export */   "window": () => (/* binding */ window_)
/* harmony export */ });
var window_ = typeof window !== 'undefined' ? window : global;
var global_ = typeof global !== 'undefined' ? global : window;
var document_ = typeof document !== 'undefined' ? document : {};

//# sourceMappingURL=globals.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/map-constraints.js":
/*!*********************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/map-constraints.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "checkVisibilityConstraints": () => (/* binding */ checkVisibilityConstraints)
/* harmony export */ });
/* harmony import */ var _map_state__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./map-state */ "./node_modules/react-map-gl/dist/esm/utils/map-state.js");


function decapitalize(s) {
  return s[0].toLowerCase() + s.slice(1);
}

function checkVisibilityConstraints(props) {
  var constraints = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _map_state__WEBPACK_IMPORTED_MODULE_0__.MAPBOX_LIMITS;

  for (var constraintName in constraints) {
    var type = constraintName.slice(0, 3);
    var propName = decapitalize(constraintName.slice(3));

    if (type === 'min' && props[propName] < constraints[constraintName]) {
      return false;
    }

    if (type === 'max' && props[propName] > constraints[constraintName]) {
      return false;
    }
  }

  return true;
}
//# sourceMappingURL=map-constraints.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/map-controller.js":
/*!********************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/map-controller.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "LINEAR_TRANSITION_PROPS": () => (/* binding */ LINEAR_TRANSITION_PROPS),
/* harmony export */   "default": () => (/* binding */ MapController)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _map_state__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./map-state */ "./node_modules/react-map-gl/dist/esm/utils/map-state.js");
/* harmony import */ var _transition__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./transition */ "./node_modules/react-map-gl/dist/esm/utils/transition/index.js");
/* harmony import */ var _transition_manager__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./transition-manager */ "./node_modules/react-map-gl/dist/esm/utils/transition-manager.js");




function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }




var NO_TRANSITION_PROPS = {
  transitionDuration: 0
};
var LINEAR_TRANSITION_PROPS = {
  transitionDuration: 300,
  transitionEasing: function transitionEasing(t) {
    return t;
  },
  transitionInterpolator: new _transition__WEBPACK_IMPORTED_MODULE_4__.LinearInterpolator(),
  transitionInterruption: _transition_manager__WEBPACK_IMPORTED_MODULE_5__.TRANSITION_EVENTS.BREAK
};
var DEFAULT_INERTIA = 300;

var INERTIA_EASING = function INERTIA_EASING(t) {
  return 1 - (1 - t) * (1 - t);
};

var EVENT_TYPES = {
  WHEEL: ['wheel'],
  PAN: ['panstart', 'panmove', 'panend'],
  PINCH: ['pinchstart', 'pinchmove', 'pinchend'],
  TRIPLE_PAN: ['tripanstart', 'tripanmove', 'tripanend'],
  DOUBLE_TAP: ['doubletap'],
  KEYBOARD: ['keydown']
};

var MapController = function () {
  function MapController() {
    var _this = this;

    (0,_babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, MapController);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "events", []);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "scrollZoom", true);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "dragPan", true);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "dragRotate", true);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "doubleClickZoom", true);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "touchZoom", true);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "touchRotate", false);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "keyboard", true);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "_interactionState", {
      isDragging: false
    });

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "_events", {});

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "_setInteractionState", function (newState) {
      Object.assign(_this._interactionState, newState);

      if (_this.onStateChange) {
        _this.onStateChange(_this._interactionState);
      }
    });

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "_onTransition", function (newViewport, oldViewport) {
      _this.onViewportChange(newViewport, _this._interactionState, oldViewport);
    });

    this.handleEvent = this.handleEvent.bind(this);
    this._transitionManager = new _transition_manager__WEBPACK_IMPORTED_MODULE_5__["default"]({
      onViewportChange: this._onTransition,
      onStateChange: this._setInteractionState
    });
  }

  (0,_babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(MapController, [{
    key: "handleEvent",
    value: function handleEvent(event) {
      this.mapState = this.getMapState();
      var eventStartBlocked = this._eventStartBlocked;

      switch (event.type) {
        case 'panstart':
          return eventStartBlocked ? false : this._onPanStart(event);

        case 'panmove':
          return this._onPan(event);

        case 'panend':
          return this._onPanEnd(event);

        case 'pinchstart':
          return eventStartBlocked ? false : this._onPinchStart(event);

        case 'pinchmove':
          return this._onPinch(event);

        case 'pinchend':
          return this._onPinchEnd(event);

        case 'tripanstart':
          return eventStartBlocked ? false : this._onTriplePanStart(event);

        case 'tripanmove':
          return this._onTriplePan(event);

        case 'tripanend':
          return this._onTriplePanEnd(event);

        case 'doubletap':
          return this._onDoubleTap(event);

        case 'wheel':
          return this._onWheel(event);

        case 'keydown':
          return this._onKeyDown(event);

        default:
          return false;
      }
    }
  }, {
    key: "getCenter",
    value: function getCenter(event) {
      var _event$offsetCenter = event.offsetCenter,
          x = _event$offsetCenter.x,
          y = _event$offsetCenter.y;
      return [x, y];
    }
  }, {
    key: "isFunctionKeyPressed",
    value: function isFunctionKeyPressed(event) {
      var srcEvent = event.srcEvent;
      return Boolean(srcEvent.metaKey || srcEvent.altKey || srcEvent.ctrlKey || srcEvent.shiftKey);
    }
  }, {
    key: "blockEvents",
    value: function blockEvents(timeout) {
      var _this2 = this;

      var timer = setTimeout(function () {
        if (_this2._eventStartBlocked === timer) {
          _this2._eventStartBlocked = null;
        }
      }, timeout);
      this._eventStartBlocked = timer;
    }
  }, {
    key: "updateViewport",
    value: function updateViewport(newMapState, extraProps, interactionState) {
      var oldViewport = this.mapState instanceof _map_state__WEBPACK_IMPORTED_MODULE_3__["default"] ? this.mapState.getViewportProps() : this.mapState;

      var newViewport = _objectSpread(_objectSpread({}, newMapState.getViewportProps()), extraProps);

      var viewStateChanged = Object.keys(newViewport).some(function (key) {
        return oldViewport[key] !== newViewport[key];
      });
      this._state = newMapState.getState();

      this._setInteractionState(interactionState);

      if (viewStateChanged) {
        this.onViewportChange(newViewport, this._interactionState, oldViewport);
      }
    }
  }, {
    key: "getMapState",
    value: function getMapState(overrides) {
      return new _map_state__WEBPACK_IMPORTED_MODULE_3__["default"](_objectSpread(_objectSpread(_objectSpread({}, this.mapStateProps), this._state), overrides));
    }
  }, {
    key: "isDragging",
    value: function isDragging() {
      return this._interactionState.isDragging;
    }
  }, {
    key: "setOptions",
    value: function setOptions(options) {
      var onViewportChange = options.onViewportChange,
          onStateChange = options.onStateChange,
          _options$eventManager = options.eventManager,
          eventManager = _options$eventManager === void 0 ? this.eventManager : _options$eventManager,
          _options$isInteractiv = options.isInteractive,
          isInteractive = _options$isInteractiv === void 0 ? true : _options$isInteractiv,
          _options$scrollZoom = options.scrollZoom,
          scrollZoom = _options$scrollZoom === void 0 ? this.scrollZoom : _options$scrollZoom,
          _options$dragPan = options.dragPan,
          dragPan = _options$dragPan === void 0 ? this.dragPan : _options$dragPan,
          _options$dragRotate = options.dragRotate,
          dragRotate = _options$dragRotate === void 0 ? this.dragRotate : _options$dragRotate,
          _options$doubleClickZ = options.doubleClickZoom,
          doubleClickZoom = _options$doubleClickZ === void 0 ? this.doubleClickZoom : _options$doubleClickZ,
          _options$touchZoom = options.touchZoom,
          touchZoom = _options$touchZoom === void 0 ? this.touchZoom : _options$touchZoom,
          _options$touchRotate = options.touchRotate,
          touchRotate = _options$touchRotate === void 0 ? this.touchRotate : _options$touchRotate,
          _options$keyboard = options.keyboard,
          keyboard = _options$keyboard === void 0 ? this.keyboard : _options$keyboard;
      this.onViewportChange = onViewportChange;
      this.onStateChange = onStateChange;
      var prevOptions = this.mapStateProps || {};
      var dimensionChanged = prevOptions.height !== options.height || prevOptions.width !== options.width;
      this.mapStateProps = options;

      if (dimensionChanged) {
        this.mapState = prevOptions;
        this.updateViewport(new _map_state__WEBPACK_IMPORTED_MODULE_3__["default"](options));
      }

      this._transitionManager.processViewportChange(options);

      if (this.eventManager !== eventManager) {
        this.eventManager = eventManager;
        this._events = {};
        this.toggleEvents(this.events, true);
      }

      this.toggleEvents(EVENT_TYPES.WHEEL, isInteractive && Boolean(scrollZoom));
      this.toggleEvents(EVENT_TYPES.PAN, isInteractive && Boolean(dragPan || dragRotate));
      this.toggleEvents(EVENT_TYPES.PINCH, isInteractive && Boolean(touchZoom || touchRotate));
      this.toggleEvents(EVENT_TYPES.TRIPLE_PAN, isInteractive && Boolean(touchRotate));
      this.toggleEvents(EVENT_TYPES.DOUBLE_TAP, isInteractive && Boolean(doubleClickZoom));
      this.toggleEvents(EVENT_TYPES.KEYBOARD, isInteractive && Boolean(keyboard));
      this.scrollZoom = scrollZoom;
      this.dragPan = dragPan;
      this.dragRotate = dragRotate;
      this.doubleClickZoom = doubleClickZoom;
      this.touchZoom = touchZoom;
      this.touchRotate = touchRotate;
      this.keyboard = keyboard;
    }
  }, {
    key: "toggleEvents",
    value: function toggleEvents(eventNames, enabled) {
      var _this3 = this;

      if (this.eventManager) {
        eventNames.forEach(function (eventName) {
          if (_this3._events[eventName] !== enabled) {
            _this3._events[eventName] = enabled;

            if (enabled) {
              _this3.eventManager.on(eventName, _this3.handleEvent);
            } else {
              _this3.eventManager.off(eventName, _this3.handleEvent);
            }
          }
        });
      }
    }
  }, {
    key: "_onPanStart",
    value: function _onPanStart(event) {
      var pos = this.getCenter(event);
      this._panRotate = this.isFunctionKeyPressed(event) || event.rightButton;
      var newMapState = this._panRotate ? this.mapState.rotateStart({
        pos: pos
      }) : this.mapState.panStart({
        pos: pos
      });
      this.updateViewport(newMapState, NO_TRANSITION_PROPS, {
        isDragging: true
      });
      return true;
    }
  }, {
    key: "_onPan",
    value: function _onPan(event) {
      if (!this.isDragging()) {
        return false;
      }

      return this._panRotate ? this._onPanRotate(event) : this._onPanMove(event);
    }
  }, {
    key: "_onPanEnd",
    value: function _onPanEnd(event) {
      if (!this.isDragging()) {
        return false;
      }

      return this._panRotate ? this._onPanRotateEnd(event) : this._onPanMoveEnd(event);
    }
  }, {
    key: "_onPanMove",
    value: function _onPanMove(event) {
      if (!this.dragPan) {
        return false;
      }

      var pos = this.getCenter(event);
      var newMapState = this.mapState.pan({
        pos: pos
      });
      this.updateViewport(newMapState, NO_TRANSITION_PROPS, {
        isPanning: true
      });
      return true;
    }
  }, {
    key: "_onPanMoveEnd",
    value: function _onPanMoveEnd(event) {
      if (this.dragPan) {
        var _this$dragPan$inertia = this.dragPan.inertia,
            inertia = _this$dragPan$inertia === void 0 ? DEFAULT_INERTIA : _this$dragPan$inertia;

        if (inertia && event.velocity) {
          var pos = this.getCenter(event);
          var endPos = [pos[0] + event.velocityX * inertia / 2, pos[1] + event.velocityY * inertia / 2];
          var newControllerState = this.mapState.pan({
            pos: endPos
          }).panEnd();
          this.updateViewport(newControllerState, _objectSpread(_objectSpread({}, LINEAR_TRANSITION_PROPS), {}, {
            transitionDuration: inertia,
            transitionEasing: INERTIA_EASING
          }), {
            isDragging: false,
            isPanning: true
          });
          return true;
        }
      }

      var newMapState = this.mapState.panEnd();
      this.updateViewport(newMapState, null, {
        isDragging: false,
        isPanning: false
      });
      return true;
    }
  }, {
    key: "_onPanRotate",
    value: function _onPanRotate(event) {
      if (!this.dragRotate) {
        return false;
      }

      var pos = this.getCenter(event);
      var newMapState = this.mapState.rotate({
        pos: pos
      });
      this.updateViewport(newMapState, NO_TRANSITION_PROPS, {
        isRotating: true
      });
      return true;
    }
  }, {
    key: "_onPanRotateEnd",
    value: function _onPanRotateEnd(event) {
      if (this.dragRotate) {
        var _this$dragRotate$iner = this.dragRotate.inertia,
            inertia = _this$dragRotate$iner === void 0 ? DEFAULT_INERTIA : _this$dragRotate$iner;

        if (inertia && event.velocity) {
          var pos = this.getCenter(event);
          var endPos = [pos[0] + event.velocityX * inertia / 2, pos[1] + event.velocityY * inertia / 2];
          var newControllerState = this.mapState.rotate({
            pos: endPos
          }).rotateEnd();
          this.updateViewport(newControllerState, _objectSpread(_objectSpread({}, LINEAR_TRANSITION_PROPS), {}, {
            transitionDuration: inertia,
            transitionEasing: INERTIA_EASING
          }), {
            isDragging: false,
            isRotating: true
          });
          return true;
        }
      }

      var newMapState = this.mapState.panEnd();
      this.updateViewport(newMapState, null, {
        isDragging: false,
        isRotating: false
      });
      return true;
    }
  }, {
    key: "_onWheel",
    value: function _onWheel(event) {
      if (!this.scrollZoom) {
        return false;
      }

      var _this$scrollZoom = this.scrollZoom,
          _this$scrollZoom$spee = _this$scrollZoom.speed,
          speed = _this$scrollZoom$spee === void 0 ? 0.01 : _this$scrollZoom$spee,
          _this$scrollZoom$smoo = _this$scrollZoom.smooth,
          smooth = _this$scrollZoom$smoo === void 0 ? false : _this$scrollZoom$smoo;
      event.preventDefault();
      var pos = this.getCenter(event);
      var delta = event.delta;
      var scale = 2 / (1 + Math.exp(-Math.abs(delta * speed)));

      if (delta < 0 && scale !== 0) {
        scale = 1 / scale;
      }

      var newMapState = this.mapState.zoom({
        pos: pos,
        scale: scale
      });

      if (newMapState.getViewportProps().zoom === this.mapStateProps.zoom) {
        return false;
      }

      this.updateViewport(newMapState, _objectSpread(_objectSpread({}, LINEAR_TRANSITION_PROPS), {}, {
        transitionInterpolator: new _transition__WEBPACK_IMPORTED_MODULE_4__.LinearInterpolator({
          around: pos
        }),
        transitionDuration: smooth ? 250 : 1
      }), {
        isPanning: true,
        isZooming: true
      });
      return true;
    }
  }, {
    key: "_onPinchStart",
    value: function _onPinchStart(event) {
      var pos = this.getCenter(event);
      var newMapState = this.mapState.zoomStart({
        pos: pos
      }).rotateStart({
        pos: pos
      });
      this._startPinchRotation = event.rotation;
      this._lastPinchEvent = event;
      this.updateViewport(newMapState, NO_TRANSITION_PROPS, {
        isDragging: true
      });
      return true;
    }
  }, {
    key: "_onPinch",
    value: function _onPinch(event) {
      if (!this.isDragging()) {
        return false;
      }

      if (!this.touchZoom && !this.touchRotate) {
        return false;
      }

      var newMapState = this.mapState;

      if (this.touchZoom) {
        var scale = event.scale;
        var pos = this.getCenter(event);
        newMapState = newMapState.zoom({
          pos: pos,
          scale: scale
        });
      }

      if (this.touchRotate) {
        var rotation = event.rotation;
        newMapState = newMapState.rotate({
          deltaAngleX: this._startPinchRotation - rotation
        });
      }

      this.updateViewport(newMapState, NO_TRANSITION_PROPS, {
        isDragging: true,
        isPanning: Boolean(this.touchZoom),
        isZooming: Boolean(this.touchZoom),
        isRotating: Boolean(this.touchRotate)
      });
      this._lastPinchEvent = event;
      return true;
    }
  }, {
    key: "_onPinchEnd",
    value: function _onPinchEnd(event) {
      if (!this.isDragging()) {
        return false;
      }

      if (this.touchZoom) {
        var _this$touchZoom$inert = this.touchZoom.inertia,
            inertia = _this$touchZoom$inert === void 0 ? DEFAULT_INERTIA : _this$touchZoom$inert;
        var _lastPinchEvent = this._lastPinchEvent;

        if (inertia && _lastPinchEvent && event.scale !== _lastPinchEvent.scale) {
          var pos = this.getCenter(event);

          var _newMapState = this.mapState.rotateEnd();

          var z = Math.log2(event.scale);

          var velocityZ = (z - Math.log2(_lastPinchEvent.scale)) / (event.deltaTime - _lastPinchEvent.deltaTime);

          var endScale = Math.pow(2, z + velocityZ * inertia / 2);
          _newMapState = _newMapState.zoom({
            pos: pos,
            scale: endScale
          }).zoomEnd();
          this.updateViewport(_newMapState, _objectSpread(_objectSpread({}, LINEAR_TRANSITION_PROPS), {}, {
            transitionInterpolator: new _transition__WEBPACK_IMPORTED_MODULE_4__.LinearInterpolator({
              around: pos
            }),
            transitionDuration: inertia,
            transitionEasing: INERTIA_EASING
          }), {
            isDragging: false,
            isPanning: Boolean(this.touchZoom),
            isZooming: Boolean(this.touchZoom),
            isRotating: false
          });
          this.blockEvents(inertia);
          return true;
        }
      }

      var newMapState = this.mapState.zoomEnd().rotateEnd();
      this._state.startPinchRotation = 0;
      this.updateViewport(newMapState, null, {
        isDragging: false,
        isPanning: false,
        isZooming: false,
        isRotating: false
      });
      this._startPinchRotation = null;
      this._lastPinchEvent = null;
      return true;
    }
  }, {
    key: "_onTriplePanStart",
    value: function _onTriplePanStart(event) {
      var pos = this.getCenter(event);
      var newMapState = this.mapState.rotateStart({
        pos: pos
      });
      this.updateViewport(newMapState, NO_TRANSITION_PROPS, {
        isDragging: true
      });
      return true;
    }
  }, {
    key: "_onTriplePan",
    value: function _onTriplePan(event) {
      if (!this.isDragging()) {
        return false;
      }

      if (!this.touchRotate) {
        return false;
      }

      var pos = this.getCenter(event);
      pos[0] -= event.deltaX;
      var newMapState = this.mapState.rotate({
        pos: pos
      });
      this.updateViewport(newMapState, NO_TRANSITION_PROPS, {
        isRotating: true
      });
      return true;
    }
  }, {
    key: "_onTriplePanEnd",
    value: function _onTriplePanEnd(event) {
      if (!this.isDragging()) {
        return false;
      }

      if (this.touchRotate) {
        var _this$touchRotate$ine = this.touchRotate.inertia,
            inertia = _this$touchRotate$ine === void 0 ? DEFAULT_INERTIA : _this$touchRotate$ine;

        if (inertia && event.velocityY) {
          var pos = this.getCenter(event);
          var endPos = [pos[0], pos[1] += event.velocityY * inertia / 2];

          var _newMapState2 = this.mapState.rotate({
            pos: endPos
          });

          this.updateViewport(_newMapState2, _objectSpread(_objectSpread({}, LINEAR_TRANSITION_PROPS), {}, {
            transitionDuration: inertia,
            transitionEasing: INERTIA_EASING
          }), {
            isDragging: false,
            isRotating: true
          });
          this.blockEvents(inertia);
          return false;
        }
      }

      var newMapState = this.mapState.rotateEnd();
      this.updateViewport(newMapState, null, {
        isDragging: false,
        isRotating: false
      });
      return true;
    }
  }, {
    key: "_onDoubleTap",
    value: function _onDoubleTap(event) {
      if (!this.doubleClickZoom) {
        return false;
      }

      var pos = this.getCenter(event);
      var isZoomOut = this.isFunctionKeyPressed(event);
      var newMapState = this.mapState.zoom({
        pos: pos,
        scale: isZoomOut ? 0.5 : 2
      });
      this.updateViewport(newMapState, Object.assign({}, LINEAR_TRANSITION_PROPS, {
        transitionInterpolator: new _transition__WEBPACK_IMPORTED_MODULE_4__.LinearInterpolator({
          around: pos
        })
      }), {
        isZooming: true
      });
      return true;
    }
  }, {
    key: "_onKeyDown",
    value: function _onKeyDown(event) {
      if (!this.keyboard) {
        return false;
      }

      var funcKey = this.isFunctionKeyPressed(event);
      var _this$keyboard = this.keyboard,
          _this$keyboard$zoomSp = _this$keyboard.zoomSpeed,
          zoomSpeed = _this$keyboard$zoomSp === void 0 ? 2 : _this$keyboard$zoomSp,
          _this$keyboard$moveSp = _this$keyboard.moveSpeed,
          moveSpeed = _this$keyboard$moveSp === void 0 ? 100 : _this$keyboard$moveSp,
          _this$keyboard$rotate = _this$keyboard.rotateSpeedX,
          rotateSpeedX = _this$keyboard$rotate === void 0 ? 15 : _this$keyboard$rotate,
          _this$keyboard$rotate2 = _this$keyboard.rotateSpeedY,
          rotateSpeedY = _this$keyboard$rotate2 === void 0 ? 10 : _this$keyboard$rotate2;
      var mapStateProps = this.mapStateProps;
      var newMapState;

      switch (event.srcEvent.keyCode) {
        case 189:
          if (funcKey) {
            newMapState = this.getMapState({
              zoom: mapStateProps.zoom - Math.log2(zoomSpeed) - 1
            });
          } else {
            newMapState = this.getMapState({
              zoom: mapStateProps.zoom - Math.log2(zoomSpeed)
            });
          }

          break;

        case 187:
          if (funcKey) {
            newMapState = this.getMapState({
              zoom: mapStateProps.zoom + Math.log2(zoomSpeed) + 1
            });
          } else {
            newMapState = this.getMapState({
              zoom: mapStateProps.zoom + Math.log2(zoomSpeed)
            });
          }

          break;

        case 37:
          if (funcKey) {
            newMapState = this.getMapState({
              bearing: mapStateProps.bearing - rotateSpeedX
            });
          } else {
            newMapState = this.mapState.pan({
              pos: [moveSpeed, 0],
              startPos: [0, 0]
            });
          }

          break;

        case 39:
          if (funcKey) {
            newMapState = this.getMapState({
              bearing: mapStateProps.bearing + rotateSpeedX
            });
          } else {
            newMapState = this.mapState.pan({
              pos: [-moveSpeed, 0],
              startPos: [0, 0]
            });
          }

          break;

        case 38:
          if (funcKey) {
            newMapState = this.getMapState({
              pitch: mapStateProps.pitch + rotateSpeedY
            });
          } else {
            newMapState = this.mapState.pan({
              pos: [0, moveSpeed],
              startPos: [0, 0]
            });
          }

          break;

        case 40:
          if (funcKey) {
            newMapState = this.getMapState({
              pitch: mapStateProps.pitch - rotateSpeedY
            });
          } else {
            newMapState = this.mapState.pan({
              pos: [0, -moveSpeed],
              startPos: [0, 0]
            });
          }

          break;

        default:
          return false;
      }

      return this.updateViewport(newMapState, LINEAR_TRANSITION_PROPS);
    }
  }]);

  return MapController;
}();


//# sourceMappingURL=map-controller.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/map-state.js":
/*!***************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/map-state.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MAPBOX_LIMITS": () => (/* binding */ MAPBOX_LIMITS),
/* harmony export */   "default": () => (/* binding */ MapState)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/esm/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var viewport_mercator_project__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! viewport-mercator-project */ "./node_modules/viewport-mercator-project/module.js");
/* harmony import */ var _math_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./math-utils */ "./node_modules/react-map-gl/dist/esm/utils/math-utils.js");
/* harmony import */ var _assert__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./assert */ "./node_modules/react-map-gl/dist/esm/utils/assert.js");





function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }




var MAPBOX_LIMITS = {
  minZoom: 0,
  maxZoom: 24,
  minPitch: 0,
  maxPitch: 60
};
var DEFAULT_STATE = {
  pitch: 0,
  bearing: 0,
  altitude: 1.5
};
var PITCH_MOUSE_THRESHOLD = 5;
var PITCH_ACCEL = 1.2;

var MapState = function () {
  function MapState(_ref) {
    var width = _ref.width,
        height = _ref.height,
        latitude = _ref.latitude,
        longitude = _ref.longitude,
        zoom = _ref.zoom,
        _ref$bearing = _ref.bearing,
        bearing = _ref$bearing === void 0 ? DEFAULT_STATE.bearing : _ref$bearing,
        _ref$pitch = _ref.pitch,
        pitch = _ref$pitch === void 0 ? DEFAULT_STATE.pitch : _ref$pitch,
        _ref$altitude = _ref.altitude,
        altitude = _ref$altitude === void 0 ? DEFAULT_STATE.altitude : _ref$altitude,
        _ref$maxZoom = _ref.maxZoom,
        maxZoom = _ref$maxZoom === void 0 ? MAPBOX_LIMITS.maxZoom : _ref$maxZoom,
        _ref$minZoom = _ref.minZoom,
        minZoom = _ref$minZoom === void 0 ? MAPBOX_LIMITS.minZoom : _ref$minZoom,
        _ref$maxPitch = _ref.maxPitch,
        maxPitch = _ref$maxPitch === void 0 ? MAPBOX_LIMITS.maxPitch : _ref$maxPitch,
        _ref$minPitch = _ref.minPitch,
        minPitch = _ref$minPitch === void 0 ? MAPBOX_LIMITS.minPitch : _ref$minPitch,
        transitionDuration = _ref.transitionDuration,
        transitionEasing = _ref.transitionEasing,
        transitionInterpolator = _ref.transitionInterpolator,
        transitionInterruption = _ref.transitionInterruption,
        startPanLngLat = _ref.startPanLngLat,
        startZoomLngLat = _ref.startZoomLngLat,
        startRotatePos = _ref.startRotatePos,
        startBearing = _ref.startBearing,
        startPitch = _ref.startPitch,
        startZoom = _ref.startZoom;

    (0,_babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__["default"])(this, MapState);

    (0,_assert__WEBPACK_IMPORTED_MODULE_6__["default"])(Number.isFinite(width), '`width` must be supplied');
    (0,_assert__WEBPACK_IMPORTED_MODULE_6__["default"])(Number.isFinite(height), '`height` must be supplied');
    (0,_assert__WEBPACK_IMPORTED_MODULE_6__["default"])(Number.isFinite(longitude), '`longitude` must be supplied');
    (0,_assert__WEBPACK_IMPORTED_MODULE_6__["default"])(Number.isFinite(latitude), '`latitude` must be supplied');
    (0,_assert__WEBPACK_IMPORTED_MODULE_6__["default"])(Number.isFinite(zoom), '`zoom` must be supplied');
    this._viewportProps = this._applyConstraints({
      width: width,
      height: height,
      latitude: latitude,
      longitude: longitude,
      zoom: zoom,
      bearing: bearing,
      pitch: pitch,
      altitude: altitude,
      maxZoom: maxZoom,
      minZoom: minZoom,
      maxPitch: maxPitch,
      minPitch: minPitch,
      transitionDuration: transitionDuration,
      transitionEasing: transitionEasing,
      transitionInterpolator: transitionInterpolator,
      transitionInterruption: transitionInterruption
    });
    this._state = {
      startPanLngLat: startPanLngLat,
      startZoomLngLat: startZoomLngLat,
      startRotatePos: startRotatePos,
      startBearing: startBearing,
      startPitch: startPitch,
      startZoom: startZoom
    };
  }

  (0,_babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__["default"])(MapState, [{
    key: "getViewportProps",
    value: function getViewportProps() {
      return this._viewportProps;
    }
  }, {
    key: "getState",
    value: function getState() {
      return this._state;
    }
  }, {
    key: "panStart",
    value: function panStart(_ref2) {
      var pos = _ref2.pos;
      return this._getUpdatedMapState({
        startPanLngLat: this._unproject(pos)
      });
    }
  }, {
    key: "pan",
    value: function pan(_ref3) {
      var pos = _ref3.pos,
          startPos = _ref3.startPos;

      var startPanLngLat = this._state.startPanLngLat || this._unproject(startPos);

      if (!startPanLngLat) {
        return this;
      }

      var _this$_calculateNewLn = this._calculateNewLngLat({
        startPanLngLat: startPanLngLat,
        pos: pos
      }),
          _this$_calculateNewLn2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_this$_calculateNewLn, 2),
          longitude = _this$_calculateNewLn2[0],
          latitude = _this$_calculateNewLn2[1];

      return this._getUpdatedMapState({
        longitude: longitude,
        latitude: latitude
      });
    }
  }, {
    key: "panEnd",
    value: function panEnd() {
      return this._getUpdatedMapState({
        startPanLngLat: null
      });
    }
  }, {
    key: "rotateStart",
    value: function rotateStart(_ref4) {
      var pos = _ref4.pos;
      return this._getUpdatedMapState({
        startRotatePos: pos,
        startBearing: this._viewportProps.bearing,
        startPitch: this._viewportProps.pitch
      });
    }
  }, {
    key: "rotate",
    value: function rotate(_ref5) {
      var pos = _ref5.pos,
          _ref5$deltaAngleX = _ref5.deltaAngleX,
          deltaAngleX = _ref5$deltaAngleX === void 0 ? 0 : _ref5$deltaAngleX,
          _ref5$deltaAngleY = _ref5.deltaAngleY,
          deltaAngleY = _ref5$deltaAngleY === void 0 ? 0 : _ref5$deltaAngleY;
      var _this$_state = this._state,
          startRotatePos = _this$_state.startRotatePos,
          startBearing = _this$_state.startBearing,
          startPitch = _this$_state.startPitch;

      if (!Number.isFinite(startBearing) || !Number.isFinite(startPitch)) {
        return this;
      }

      var newRotation;

      if (pos) {
        newRotation = this._calculateNewPitchAndBearing(_objectSpread(_objectSpread({}, this._getRotationParams(pos, startRotatePos)), {}, {
          startBearing: startBearing,
          startPitch: startPitch
        }));
      } else {
        newRotation = {
          bearing: startBearing + deltaAngleX,
          pitch: startPitch + deltaAngleY
        };
      }

      return this._getUpdatedMapState(newRotation);
    }
  }, {
    key: "rotateEnd",
    value: function rotateEnd() {
      return this._getUpdatedMapState({
        startBearing: null,
        startPitch: null
      });
    }
  }, {
    key: "zoomStart",
    value: function zoomStart(_ref6) {
      var pos = _ref6.pos;
      return this._getUpdatedMapState({
        startZoomLngLat: this._unproject(pos),
        startZoom: this._viewportProps.zoom
      });
    }
  }, {
    key: "zoom",
    value: function zoom(_ref7) {
      var pos = _ref7.pos,
          startPos = _ref7.startPos,
          scale = _ref7.scale;
      (0,_assert__WEBPACK_IMPORTED_MODULE_6__["default"])(scale > 0, '`scale` must be a positive number');
      var _this$_state2 = this._state,
          startZoom = _this$_state2.startZoom,
          startZoomLngLat = _this$_state2.startZoomLngLat;

      if (!Number.isFinite(startZoom)) {
        startZoom = this._viewportProps.zoom;
        startZoomLngLat = this._unproject(startPos) || this._unproject(pos);
      }

      (0,_assert__WEBPACK_IMPORTED_MODULE_6__["default"])(startZoomLngLat, '`startZoomLngLat` prop is required ' + 'for zoom behavior to calculate where to position the map.');

      var zoom = this._calculateNewZoom({
        scale: scale,
        startZoom: startZoom || 0
      });

      var zoomedViewport = new viewport_mercator_project__WEBPACK_IMPORTED_MODULE_4__["default"](Object.assign({}, this._viewportProps, {
        zoom: zoom
      }));

      var _zoomedViewport$getMa = zoomedViewport.getMapCenterByLngLatPosition({
        lngLat: startZoomLngLat,
        pos: pos
      }),
          _zoomedViewport$getMa2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_zoomedViewport$getMa, 2),
          longitude = _zoomedViewport$getMa2[0],
          latitude = _zoomedViewport$getMa2[1];

      return this._getUpdatedMapState({
        zoom: zoom,
        longitude: longitude,
        latitude: latitude
      });
    }
  }, {
    key: "zoomEnd",
    value: function zoomEnd() {
      return this._getUpdatedMapState({
        startZoomLngLat: null,
        startZoom: null
      });
    }
  }, {
    key: "_getUpdatedMapState",
    value: function _getUpdatedMapState(newProps) {
      return new MapState(Object.assign({}, this._viewportProps, this._state, newProps));
    }
  }, {
    key: "_applyConstraints",
    value: function _applyConstraints(props) {
      var maxZoom = props.maxZoom,
          minZoom = props.minZoom,
          zoom = props.zoom;
      props.zoom = (0,_math_utils__WEBPACK_IMPORTED_MODULE_5__.clamp)(zoom, minZoom, maxZoom);
      var maxPitch = props.maxPitch,
          minPitch = props.minPitch,
          pitch = props.pitch;
      props.pitch = (0,_math_utils__WEBPACK_IMPORTED_MODULE_5__.clamp)(pitch, minPitch, maxPitch);
      Object.assign(props, (0,viewport_mercator_project__WEBPACK_IMPORTED_MODULE_4__.normalizeViewportProps)(props));
      return props;
    }
  }, {
    key: "_unproject",
    value: function _unproject(pos) {
      var viewport = new viewport_mercator_project__WEBPACK_IMPORTED_MODULE_4__["default"](this._viewportProps);
      return pos && viewport.unproject(pos);
    }
  }, {
    key: "_calculateNewLngLat",
    value: function _calculateNewLngLat(_ref8) {
      var startPanLngLat = _ref8.startPanLngLat,
          pos = _ref8.pos;
      var viewport = new viewport_mercator_project__WEBPACK_IMPORTED_MODULE_4__["default"](this._viewportProps);
      return viewport.getMapCenterByLngLatPosition({
        lngLat: startPanLngLat,
        pos: pos
      });
    }
  }, {
    key: "_calculateNewZoom",
    value: function _calculateNewZoom(_ref9) {
      var scale = _ref9.scale,
          startZoom = _ref9.startZoom;
      var _this$_viewportProps = this._viewportProps,
          maxZoom = _this$_viewportProps.maxZoom,
          minZoom = _this$_viewportProps.minZoom;
      var zoom = startZoom + Math.log2(scale);
      return (0,_math_utils__WEBPACK_IMPORTED_MODULE_5__.clamp)(zoom, minZoom, maxZoom);
    }
  }, {
    key: "_calculateNewPitchAndBearing",
    value: function _calculateNewPitchAndBearing(_ref10) {
      var deltaScaleX = _ref10.deltaScaleX,
          deltaScaleY = _ref10.deltaScaleY,
          startBearing = _ref10.startBearing,
          startPitch = _ref10.startPitch;
      deltaScaleY = (0,_math_utils__WEBPACK_IMPORTED_MODULE_5__.clamp)(deltaScaleY, -1, 1);
      var _this$_viewportProps2 = this._viewportProps,
          minPitch = _this$_viewportProps2.minPitch,
          maxPitch = _this$_viewportProps2.maxPitch;
      var bearing = startBearing + 180 * deltaScaleX;
      var pitch = startPitch;

      if (deltaScaleY > 0) {
        pitch = startPitch + deltaScaleY * (maxPitch - startPitch);
      } else if (deltaScaleY < 0) {
        pitch = startPitch - deltaScaleY * (minPitch - startPitch);
      }

      return {
        pitch: pitch,
        bearing: bearing
      };
    }
  }, {
    key: "_getRotationParams",
    value: function _getRotationParams(pos, startPos) {
      var deltaX = pos[0] - startPos[0];
      var deltaY = pos[1] - startPos[1];
      var centerY = pos[1];
      var startY = startPos[1];
      var _this$_viewportProps3 = this._viewportProps,
          width = _this$_viewportProps3.width,
          height = _this$_viewportProps3.height;
      var deltaScaleX = deltaX / width;
      var deltaScaleY = 0;

      if (deltaY > 0) {
        if (Math.abs(height - startY) > PITCH_MOUSE_THRESHOLD) {
          deltaScaleY = deltaY / (startY - height) * PITCH_ACCEL;
        }
      } else if (deltaY < 0) {
        if (startY > PITCH_MOUSE_THRESHOLD) {
          deltaScaleY = 1 - centerY / startY;
        }
      }

      deltaScaleY = Math.min(1, Math.max(-1, deltaScaleY));
      return {
        deltaScaleX: deltaScaleX,
        deltaScaleY: deltaScaleY
      };
    }
  }]);

  return MapState;
}();


//# sourceMappingURL=map-state.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/mapboxgl.js":
/*!**************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/mapboxgl.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (null);
//# sourceMappingURL=mapboxgl.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/math-utils.js":
/*!****************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/math-utils.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "clamp": () => (/* binding */ clamp),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "lerp": () => (/* binding */ lerp)
/* harmony export */ });
var EPSILON = 1e-7;

function isArray(value) {
  return Array.isArray(value) || ArrayBuffer.isView(value);
}

function equals(a, b) {
  if (a === b) {
    return true;
  }

  if (isArray(a) && isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    for (var i = 0; i < a.length; ++i) {
      if (!equals(a[i], b[i])) {
        return false;
      }
    }

    return true;
  }

  return Math.abs(a - b) <= EPSILON;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function lerp(a, b, t) {
  if (isArray(a)) {
    return a.map(function (ai, i) {
      return lerp(ai, b[i], t);
    });
  }

  return t * b + (1 - t) * a;
}
//# sourceMappingURL=math-utils.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/set-rtl-text-plugin.js":
/*!*************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/set-rtl-text-plugin.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _mapboxgl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mapboxgl */ "./node_modules/react-map-gl/dist/esm/utils/mapboxgl.js");

var setRTLTextPlugin = _mapboxgl__WEBPACK_IMPORTED_MODULE_0__["default"] ? _mapboxgl__WEBPACK_IMPORTED_MODULE_0__["default"].setRTLTextPlugin : function () {};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (setRTLTextPlugin);
//# sourceMappingURL=set-rtl-text-plugin.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/style-utils.js":
/*!*****************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/style-utils.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "normalizeStyle": () => (/* binding */ normalizeStyle)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");


function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_0__["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var refProps = ['type', 'source', 'source-layer', 'minzoom', 'maxzoom', 'filter', 'layout'];
function normalizeStyle(style) {
  if (!style) {
    return null;
  }

  if (typeof style === 'string') {
    return style;
  }

  if (style.toJS) {
    style = style.toJS();
  }

  var layerIndex = {};

  var _iterator = _createForOfIteratorHelper(style.layers),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var layer = _step.value;
      layerIndex[layer.id] = layer;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  var layers = style.layers.map(function (layer) {
    var layerRef = layerIndex[layer.ref];
    var normalizedLayer = null;

    if ('interactive' in layer) {
      normalizedLayer = _objectSpread({}, layer);
      delete normalizedLayer.interactive;
    }

    if (layerRef) {
      normalizedLayer = normalizedLayer || _objectSpread({}, layer);
      delete normalizedLayer.ref;

      var _iterator2 = _createForOfIteratorHelper(refProps),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var propName = _step2.value;

          if (propName in layerRef) {
            normalizedLayer[propName] = layerRef[propName];
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }

    return normalizedLayer || layer;
  });
  return _objectSpread(_objectSpread({}, style), {}, {
    layers: layers
  });
}
//# sourceMappingURL=style-utils.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/transition-manager.js":
/*!************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/transition-manager.js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TRANSITION_EVENTS": () => (/* binding */ TRANSITION_EVENTS),
/* harmony export */   "cropEasingFunction": () => (/* binding */ cropEasingFunction),
/* harmony export */   "default": () => (/* binding */ TransitionManager)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _assert__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./assert */ "./node_modules/react-map-gl/dist/esm/utils/assert.js");
/* harmony import */ var _transition__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./transition */ "./node_modules/react-map-gl/dist/esm/utils/transition/index.js");
/* harmony import */ var _map_state__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./map-state */ "./node_modules/react-map-gl/dist/esm/utils/map-state.js");







var noop = function noop() {};

function cropEasingFunction(easing, x0) {
  var y0 = easing(x0);
  return function (t) {
    return 1 / (1 - y0) * (easing(t * (1 - x0) + x0) - y0);
  };
}
var TRANSITION_EVENTS = {
  BREAK: 1,
  SNAP_TO_END: 2,
  IGNORE: 3,
  UPDATE: 4
};
var DEFAULT_PROPS = {
  transitionDuration: 0,
  transitionEasing: function transitionEasing(t) {
    return t;
  },
  transitionInterpolator: new _transition__WEBPACK_IMPORTED_MODULE_4__.LinearInterpolator(),
  transitionInterruption: TRANSITION_EVENTS.BREAK,
  onTransitionStart: noop,
  onTransitionInterrupt: noop,
  onTransitionEnd: noop
};

var TransitionManager = function () {
  function TransitionManager() {
    var _this = this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    (0,_babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, TransitionManager);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "_animationFrame", null);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "_onTransitionFrame", function () {
      _this._animationFrame = requestAnimationFrame(_this._onTransitionFrame);

      _this._updateViewport();
    });

    this.props = null;
    this.onViewportChange = opts.onViewportChange || noop;
    this.onStateChange = opts.onStateChange || noop;
    this.time = opts.getTime || Date.now;
  }

  (0,_babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(TransitionManager, [{
    key: "getViewportInTransition",
    value: function getViewportInTransition() {
      return this._animationFrame ? this.state.propsInTransition : null;
    }
  }, {
    key: "processViewportChange",
    value: function processViewportChange(nextProps) {
      var currentProps = this.props;
      this.props = nextProps;

      if (!currentProps || this._shouldIgnoreViewportChange(currentProps, nextProps)) {
        return false;
      }

      if (this._isTransitionEnabled(nextProps)) {
        var startProps = Object.assign({}, currentProps);
        var endProps = Object.assign({}, nextProps);

        if (this._isTransitionInProgress()) {
          currentProps.onTransitionInterrupt();

          if (this.state.interruption === TRANSITION_EVENTS.SNAP_TO_END) {
            Object.assign(startProps, this.state.endProps);
          } else {
            Object.assign(startProps, this.state.propsInTransition);
          }

          if (this.state.interruption === TRANSITION_EVENTS.UPDATE) {
            var currentTime = this.time();
            var x0 = (currentTime - this.state.startTime) / this.state.duration;
            endProps.transitionDuration = this.state.duration - (currentTime - this.state.startTime);
            endProps.transitionEasing = cropEasingFunction(this.state.easing, x0);
            endProps.transitionInterpolator = startProps.transitionInterpolator;
          }
        }

        endProps.onTransitionStart();

        this._triggerTransition(startProps, endProps);

        return true;
      }

      if (this._isTransitionInProgress()) {
        currentProps.onTransitionInterrupt();

        this._endTransition();
      }

      return false;
    }
  }, {
    key: "_isTransitionInProgress",
    value: function _isTransitionInProgress() {
      return Boolean(this._animationFrame);
    }
  }, {
    key: "_isTransitionEnabled",
    value: function _isTransitionEnabled(props) {
      var transitionDuration = props.transitionDuration,
          transitionInterpolator = props.transitionInterpolator;
      return (transitionDuration > 0 || transitionDuration === 'auto') && Boolean(transitionInterpolator);
    }
  }, {
    key: "_isUpdateDueToCurrentTransition",
    value: function _isUpdateDueToCurrentTransition(props) {
      if (this.state.propsInTransition) {
        return this.state.interpolator.arePropsEqual(props, this.state.propsInTransition);
      }

      return false;
    }
  }, {
    key: "_shouldIgnoreViewportChange",
    value: function _shouldIgnoreViewportChange(currentProps, nextProps) {
      if (!currentProps) {
        return true;
      }

      if (this._isTransitionInProgress()) {
        return this.state.interruption === TRANSITION_EVENTS.IGNORE || this._isUpdateDueToCurrentTransition(nextProps);
      }

      if (this._isTransitionEnabled(nextProps)) {
        return nextProps.transitionInterpolator.arePropsEqual(currentProps, nextProps);
      }

      return true;
    }
  }, {
    key: "_triggerTransition",
    value: function _triggerTransition(startProps, endProps) {
      (0,_assert__WEBPACK_IMPORTED_MODULE_3__["default"])(this._isTransitionEnabled(endProps));

      if (this._animationFrame) {
        cancelAnimationFrame(this._animationFrame);
      }

      var transitionInterpolator = endProps.transitionInterpolator;
      var duration = transitionInterpolator.getDuration ? transitionInterpolator.getDuration(startProps, endProps) : endProps.transitionDuration;

      if (duration === 0) {
        return;
      }

      var initialProps = endProps.transitionInterpolator.initializeProps(startProps, endProps);
      var interactionState = {
        inTransition: true,
        isZooming: startProps.zoom !== endProps.zoom,
        isPanning: startProps.longitude !== endProps.longitude || startProps.latitude !== endProps.latitude,
        isRotating: startProps.bearing !== endProps.bearing || startProps.pitch !== endProps.pitch
      };
      this.state = {
        duration: duration,
        easing: endProps.transitionEasing,
        interpolator: endProps.transitionInterpolator,
        interruption: endProps.transitionInterruption,
        startTime: this.time(),
        startProps: initialProps.start,
        endProps: initialProps.end,
        animation: null,
        propsInTransition: {}
      };

      this._onTransitionFrame();

      this.onStateChange(interactionState);
    }
  }, {
    key: "_endTransition",
    value: function _endTransition() {
      if (this._animationFrame) {
        cancelAnimationFrame(this._animationFrame);
        this._animationFrame = null;
      }

      this.onStateChange({
        inTransition: false,
        isZooming: false,
        isPanning: false,
        isRotating: false
      });
    }
  }, {
    key: "_updateViewport",
    value: function _updateViewport() {
      var currentTime = this.time();
      var _this$state = this.state,
          startTime = _this$state.startTime,
          duration = _this$state.duration,
          easing = _this$state.easing,
          interpolator = _this$state.interpolator,
          startProps = _this$state.startProps,
          endProps = _this$state.endProps;
      var shouldEnd = false;
      var t = (currentTime - startTime) / duration;

      if (t >= 1) {
        t = 1;
        shouldEnd = true;
      }

      t = easing(t);
      var viewport = interpolator.interpolateProps(startProps, endProps, t);
      var mapState = new _map_state__WEBPACK_IMPORTED_MODULE_5__["default"](Object.assign({}, this.props, viewport));
      this.state.propsInTransition = mapState.getViewportProps();
      this.onViewportChange(this.state.propsInTransition, this.props);

      if (shouldEnd) {
        this._endTransition();

        this.props.onTransitionEnd();
      }
    }
  }]);

  return TransitionManager;
}();

(0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(TransitionManager, "defaultProps", DEFAULT_PROPS);


//# sourceMappingURL=transition-manager.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/transition/index.js":
/*!**********************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/transition/index.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "LinearInterpolator": () => (/* reexport safe */ _linear_interpolator__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "TransitionInterpolator": () => (/* reexport safe */ _transition_interpolator__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "ViewportFlyToInterpolator": () => (/* reexport safe */ _viewport_fly_to_interpolator__WEBPACK_IMPORTED_MODULE_1__["default"])
/* harmony export */ });
/* harmony import */ var _transition_interpolator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./transition-interpolator */ "./node_modules/react-map-gl/dist/esm/utils/transition/transition-interpolator.js");
/* harmony import */ var _viewport_fly_to_interpolator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./viewport-fly-to-interpolator */ "./node_modules/react-map-gl/dist/esm/utils/transition/viewport-fly-to-interpolator.js");
/* harmony import */ var _linear_interpolator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./linear-interpolator */ "./node_modules/react-map-gl/dist/esm/utils/transition/linear-interpolator.js");



//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/transition/linear-interpolator.js":
/*!************************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/transition/linear-interpolator.js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ LinearInterpolator)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/esm/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/esm/inherits */ "./node_modules/@babel/runtime/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js");
/* harmony import */ var viewport_mercator_project__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! viewport-mercator-project */ "./node_modules/viewport-mercator-project/module.js");
/* harmony import */ var _assert__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../assert */ "./node_modules/react-map-gl/dist/esm/utils/assert.js");
/* harmony import */ var _transition_interpolator__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./transition-interpolator */ "./node_modules/react-map-gl/dist/esm/utils/transition/transition-interpolator.js");
/* harmony import */ var _transition_utils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./transition-utils */ "./node_modules/react-map-gl/dist/esm/utils/transition/transition-utils.js");
/* harmony import */ var _math_utils__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../math-utils */ "./node_modules/react-map-gl/dist/esm/utils/math-utils.js");







function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0,_babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0,_babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0,_babel_runtime_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }






var VIEWPORT_TRANSITION_PROPS = ['longitude', 'latitude', 'zoom', 'bearing', 'pitch'];

var LinearInterpolator = function (_TransitionInterpolat) {
  (0,_babel_runtime_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_3__["default"])(LinearInterpolator, _TransitionInterpolat);

  var _super = _createSuper(LinearInterpolator);

  function LinearInterpolator() {
    var _this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    (0,_babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__["default"])(this, LinearInterpolator);

    _this = _super.call(this);

    if (Array.isArray(opts)) {
      opts = {
        transitionProps: opts
      };
    }

    _this.propNames = opts.transitionProps || VIEWPORT_TRANSITION_PROPS;

    if (opts.around) {
      _this.around = opts.around;
    }

    return _this;
  }

  (0,_babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_2__["default"])(LinearInterpolator, [{
    key: "initializeProps",
    value: function initializeProps(startProps, endProps) {
      var startViewportProps = {};
      var endViewportProps = {};

      if (this.around) {
        startViewportProps.around = this.around;
        var aroundLngLat = new viewport_mercator_project__WEBPACK_IMPORTED_MODULE_6__["default"](startProps).unproject(this.around);
        Object.assign(endViewportProps, endProps, {
          around: new viewport_mercator_project__WEBPACK_IMPORTED_MODULE_6__["default"](endProps).project(aroundLngLat),
          aroundLngLat: aroundLngLat
        });
      }

      var _iterator = _createForOfIteratorHelper(this.propNames),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var key = _step.value;
          var startValue = startProps[key];
          var endValue = endProps[key];
          (0,_assert__WEBPACK_IMPORTED_MODULE_7__["default"])((0,_transition_utils__WEBPACK_IMPORTED_MODULE_9__.isValid)(startValue) && (0,_transition_utils__WEBPACK_IMPORTED_MODULE_9__.isValid)(endValue), "".concat(key, " must be supplied for transition"));
          startViewportProps[key] = startValue;
          endViewportProps[key] = (0,_transition_utils__WEBPACK_IMPORTED_MODULE_9__.getEndValueByShortestPath)(key, startValue, endValue);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return {
        start: startViewportProps,
        end: endViewportProps
      };
    }
  }, {
    key: "interpolateProps",
    value: function interpolateProps(startProps, endProps, t) {
      var viewport = {};

      var _iterator2 = _createForOfIteratorHelper(this.propNames),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var key = _step2.value;
          viewport[key] = (0,_math_utils__WEBPACK_IMPORTED_MODULE_10__.lerp)(startProps[key], endProps[key], t);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      if (endProps.around) {
        var _WebMercatorViewport$ = new viewport_mercator_project__WEBPACK_IMPORTED_MODULE_6__["default"](Object.assign({}, endProps, viewport)).getMapCenterByLngLatPosition({
          lngLat: endProps.aroundLngLat,
          pos: (0,_math_utils__WEBPACK_IMPORTED_MODULE_10__.lerp)(startProps.around, endProps.around, t)
        }),
            _WebMercatorViewport$2 = (0,_babel_runtime_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_0__["default"])(_WebMercatorViewport$, 2),
            longitude = _WebMercatorViewport$2[0],
            latitude = _WebMercatorViewport$2[1];

        viewport.longitude = longitude;
        viewport.latitude = latitude;
      }

      return viewport;
    }
  }]);

  return LinearInterpolator;
}(_transition_interpolator__WEBPACK_IMPORTED_MODULE_8__["default"]);


//# sourceMappingURL=linear-interpolator.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/transition/transition-interpolator.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/transition/transition-interpolator.js ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ TransitionInterpolator)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _math_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../math-utils */ "./node_modules/react-map-gl/dist/esm/utils/math-utils.js");
/* harmony import */ var _assert__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../assert */ "./node_modules/react-map-gl/dist/esm/utils/assert.js");




function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }




var TransitionInterpolator = function () {
  function TransitionInterpolator() {
    (0,_babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, TransitionInterpolator);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(this, "propNames", []);
  }

  (0,_babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(TransitionInterpolator, [{
    key: "arePropsEqual",
    value: function arePropsEqual(currentProps, nextProps) {
      var _iterator = _createForOfIteratorHelper(this.propNames || []),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var key = _step.value;

          if (!(0,_math_utils__WEBPACK_IMPORTED_MODULE_3__.equals)(currentProps[key], nextProps[key])) {
            return false;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return true;
    }
  }, {
    key: "initializeProps",
    value: function initializeProps(startProps, endProps) {
      return {
        start: startProps,
        end: endProps
      };
    }
  }, {
    key: "interpolateProps",
    value: function interpolateProps(startProps, endProps, t) {
      (0,_assert__WEBPACK_IMPORTED_MODULE_4__["default"])(false, 'interpolateProps is not implemented');
    }
  }, {
    key: "getDuration",
    value: function getDuration(startProps, endProps) {
      return endProps.transitionDuration;
    }
  }]);

  return TransitionInterpolator;
}();


//# sourceMappingURL=transition-interpolator.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/transition/transition-utils.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/transition/transition-utils.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getEndValueByShortestPath": () => (/* binding */ getEndValueByShortestPath),
/* harmony export */   "isValid": () => (/* binding */ isValid),
/* harmony export */   "mod": () => (/* binding */ mod)
/* harmony export */ });
var WRAPPED_ANGULAR_PROPS = {
  longitude: 1,
  bearing: 1
};
function mod(value, divisor) {
  var modulus = value % divisor;
  return modulus < 0 ? divisor + modulus : modulus;
}
function isValid(prop) {
  return Number.isFinite(prop) || Array.isArray(prop);
}

function isWrappedAngularProp(propName) {
  return propName in WRAPPED_ANGULAR_PROPS;
}

function getEndValueByShortestPath(propName, startValue, endValue) {
  if (isWrappedAngularProp(propName) && Math.abs(endValue - startValue) > 180) {
    endValue = endValue < 0 ? endValue + 360 : endValue - 360;
  }

  return endValue;
}
//# sourceMappingURL=transition-utils.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/transition/viewport-fly-to-interpolator.js":
/*!*********************************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/transition/viewport-fly-to-interpolator.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ViewportFlyToInterpolator)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/esm/assertThisInitialized */ "./node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js");
/* harmony import */ var _babel_runtime_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/esm/inherits */ "./node_modules/@babel/runtime/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _assert__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../assert */ "./node_modules/react-map-gl/dist/esm/utils/assert.js");
/* harmony import */ var _transition_interpolator__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./transition-interpolator */ "./node_modules/react-map-gl/dist/esm/utils/transition/transition-interpolator.js");
/* harmony import */ var viewport_mercator_project__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! viewport-mercator-project */ "./node_modules/viewport-mercator-project/module.js");
/* harmony import */ var _transition_utils__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./transition-utils */ "./node_modules/react-map-gl/dist/esm/utils/transition/transition-utils.js");
/* harmony import */ var _math_utils__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../math-utils */ "./node_modules/react-map-gl/dist/esm/utils/math-utils.js");








function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0,_babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0,_babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0,_babel_runtime_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }






var VIEWPORT_TRANSITION_PROPS = ['longitude', 'latitude', 'zoom', 'bearing', 'pitch'];
var REQUIRED_PROPS = ['latitude', 'longitude', 'zoom', 'width', 'height'];
var LINEARLY_INTERPOLATED_PROPS = ['bearing', 'pitch'];
var DEFAULT_OPTS = {
  speed: 1.2,
  curve: 1.414
};

var ViewportFlyToInterpolator = function (_TransitionInterpolat) {
  (0,_babel_runtime_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_3__["default"])(ViewportFlyToInterpolator, _TransitionInterpolat);

  var _super = _createSuper(ViewportFlyToInterpolator);

  function ViewportFlyToInterpolator() {
    var _this;

    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    (0,_babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, ViewportFlyToInterpolator);

    _this = _super.call(this);

    (0,_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__["default"])((0,_babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_2__["default"])(_this), "propNames", VIEWPORT_TRANSITION_PROPS);

    _this.props = Object.assign({}, DEFAULT_OPTS, props);
    return _this;
  }

  (0,_babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(ViewportFlyToInterpolator, [{
    key: "initializeProps",
    value: function initializeProps(startProps, endProps) {
      var startViewportProps = {};
      var endViewportProps = {};

      var _iterator = _createForOfIteratorHelper(REQUIRED_PROPS),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var key = _step.value;
          var startValue = startProps[key];
          var endValue = endProps[key];
          (0,_assert__WEBPACK_IMPORTED_MODULE_7__["default"])((0,_transition_utils__WEBPACK_IMPORTED_MODULE_10__.isValid)(startValue) && (0,_transition_utils__WEBPACK_IMPORTED_MODULE_10__.isValid)(endValue), "".concat(key, " must be supplied for transition"));
          startViewportProps[key] = startValue;
          endViewportProps[key] = (0,_transition_utils__WEBPACK_IMPORTED_MODULE_10__.getEndValueByShortestPath)(key, startValue, endValue);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      var _iterator2 = _createForOfIteratorHelper(LINEARLY_INTERPOLATED_PROPS),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _key = _step2.value;

          var _startValue = startProps[_key] || 0;

          var _endValue = endProps[_key] || 0;

          startViewportProps[_key] = _startValue;
          endViewportProps[_key] = (0,_transition_utils__WEBPACK_IMPORTED_MODULE_10__.getEndValueByShortestPath)(_key, _startValue, _endValue);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      return {
        start: startViewportProps,
        end: endViewportProps
      };
    }
  }, {
    key: "interpolateProps",
    value: function interpolateProps(startProps, endProps, t) {
      var viewport = (0,viewport_mercator_project__WEBPACK_IMPORTED_MODULE_9__.flyToViewport)(startProps, endProps, t, this.props);

      var _iterator3 = _createForOfIteratorHelper(LINEARLY_INTERPOLATED_PROPS),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var key = _step3.value;
          viewport[key] = (0,_math_utils__WEBPACK_IMPORTED_MODULE_11__.lerp)(startProps[key], endProps[key], t);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }

      return viewport;
    }
  }, {
    key: "getDuration",
    value: function getDuration(startProps, endProps) {
      var transitionDuration = endProps.transitionDuration;

      if (transitionDuration === 'auto') {
        transitionDuration = (0,viewport_mercator_project__WEBPACK_IMPORTED_MODULE_9__.getFlyToDuration)(startProps, endProps, this.props);
      }

      return transitionDuration;
    }
  }]);

  return ViewportFlyToInterpolator;
}(_transition_interpolator__WEBPACK_IMPORTED_MODULE_8__["default"]);


//# sourceMappingURL=viewport-fly-to-interpolator.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/use-isomorphic-layout-effect.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/use-isomorphic-layout-effect.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

var useIsomorphicLayoutEffect = typeof window !== 'undefined' ? react__WEBPACK_IMPORTED_MODULE_0__.useLayoutEffect : react__WEBPACK_IMPORTED_MODULE_0__.useEffect;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (useIsomorphicLayoutEffect);
//# sourceMappingURL=use-isomorphic-layout-effect.js.map

/***/ }),

/***/ "./node_modules/react-map-gl/dist/esm/utils/version.js":
/*!*************************************************************!*\
  !*** ./node_modules/react-map-gl/dist/esm/utils/version.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "compareVersions": () => (/* binding */ compareVersions)
/* harmony export */ });
function compareVersions(version1, version2) {
  var v1 = (version1 || '').split('.').map(Number);
  var v2 = (version2 || '').split('.').map(Number);

  for (var i = 0; i < 3; i++) {
    var part1 = v1[i] || 0;
    var part2 = v2[i] || 0;

    if (part1 < part2) {
      return -1;
    }

    if (part1 > part2) {
      return 1;
    }
  }

  return 0;
}
//# sourceMappingURL=version.js.map

/***/ }),

/***/ "./node_modules/resize-observer-polyfill/dist/ResizeObserver.es.js":
/*!*************************************************************************!*\
  !*** ./node_modules/resize-observer-polyfill/dist/ResizeObserver.es.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * A collection of shims that provide minimal functionality of the ES6 collections.
 *
 * These implementations are not meant to be used outside of the ResizeObserver
 * modules as they cover only a limited range of use cases.
 */
/* eslint-disable require-jsdoc, valid-jsdoc */
var MapShim = (function () {
    if (typeof Map !== 'undefined') {
        return Map;
    }
    /**
     * Returns index in provided array that matches the specified key.
     *
     * @param {Array<Array>} arr
     * @param {*} key
     * @returns {number}
     */
    function getIndex(arr, key) {
        var result = -1;
        arr.some(function (entry, index) {
            if (entry[0] === key) {
                result = index;
                return true;
            }
            return false;
        });
        return result;
    }
    return /** @class */ (function () {
        function class_1() {
            this.__entries__ = [];
        }
        Object.defineProperty(class_1.prototype, "size", {
            /**
             * @returns {boolean}
             */
            get: function () {
                return this.__entries__.length;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @param {*} key
         * @returns {*}
         */
        class_1.prototype.get = function (key) {
            var index = getIndex(this.__entries__, key);
            var entry = this.__entries__[index];
            return entry && entry[1];
        };
        /**
         * @param {*} key
         * @param {*} value
         * @returns {void}
         */
        class_1.prototype.set = function (key, value) {
            var index = getIndex(this.__entries__, key);
            if (~index) {
                this.__entries__[index][1] = value;
            }
            else {
                this.__entries__.push([key, value]);
            }
        };
        /**
         * @param {*} key
         * @returns {void}
         */
        class_1.prototype.delete = function (key) {
            var entries = this.__entries__;
            var index = getIndex(entries, key);
            if (~index) {
                entries.splice(index, 1);
            }
        };
        /**
         * @param {*} key
         * @returns {void}
         */
        class_1.prototype.has = function (key) {
            return !!~getIndex(this.__entries__, key);
        };
        /**
         * @returns {void}
         */
        class_1.prototype.clear = function () {
            this.__entries__.splice(0);
        };
        /**
         * @param {Function} callback
         * @param {*} [ctx=null]
         * @returns {void}
         */
        class_1.prototype.forEach = function (callback, ctx) {
            if (ctx === void 0) { ctx = null; }
            for (var _i = 0, _a = this.__entries__; _i < _a.length; _i++) {
                var entry = _a[_i];
                callback.call(ctx, entry[1], entry[0]);
            }
        };
        return class_1;
    }());
})();

/**
 * Detects whether window and document objects are available in current environment.
 */
var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && window.document === document;

// Returns global object of a current environment.
var global$1 = (function () {
    if (typeof global !== 'undefined' && global.Math === Math) {
        return global;
    }
    if (typeof self !== 'undefined' && self.Math === Math) {
        return self;
    }
    if (typeof window !== 'undefined' && window.Math === Math) {
        return window;
    }
    // eslint-disable-next-line no-new-func
    return Function('return this')();
})();

/**
 * A shim for the requestAnimationFrame which falls back to the setTimeout if
 * first one is not supported.
 *
 * @returns {number} Requests' identifier.
 */
var requestAnimationFrame$1 = (function () {
    if (typeof requestAnimationFrame === 'function') {
        // It's required to use a bounded function because IE sometimes throws
        // an "Invalid calling object" error if rAF is invoked without the global
        // object on the left hand side.
        return requestAnimationFrame.bind(global$1);
    }
    return function (callback) { return setTimeout(function () { return callback(Date.now()); }, 1000 / 60); };
})();

// Defines minimum timeout before adding a trailing call.
var trailingTimeout = 2;
/**
 * Creates a wrapper function which ensures that provided callback will be
 * invoked only once during the specified delay period.
 *
 * @param {Function} callback - Function to be invoked after the delay period.
 * @param {number} delay - Delay after which to invoke callback.
 * @returns {Function}
 */
function throttle (callback, delay) {
    var leadingCall = false, trailingCall = false, lastCallTime = 0;
    /**
     * Invokes the original callback function and schedules new invocation if
     * the "proxy" was called during current request.
     *
     * @returns {void}
     */
    function resolvePending() {
        if (leadingCall) {
            leadingCall = false;
            callback();
        }
        if (trailingCall) {
            proxy();
        }
    }
    /**
     * Callback invoked after the specified delay. It will further postpone
     * invocation of the original function delegating it to the
     * requestAnimationFrame.
     *
     * @returns {void}
     */
    function timeoutCallback() {
        requestAnimationFrame$1(resolvePending);
    }
    /**
     * Schedules invocation of the original function.
     *
     * @returns {void}
     */
    function proxy() {
        var timeStamp = Date.now();
        if (leadingCall) {
            // Reject immediately following calls.
            if (timeStamp - lastCallTime < trailingTimeout) {
                return;
            }
            // Schedule new call to be in invoked when the pending one is resolved.
            // This is important for "transitions" which never actually start
            // immediately so there is a chance that we might miss one if change
            // happens amids the pending invocation.
            trailingCall = true;
        }
        else {
            leadingCall = true;
            trailingCall = false;
            setTimeout(timeoutCallback, delay);
        }
        lastCallTime = timeStamp;
    }
    return proxy;
}

// Minimum delay before invoking the update of observers.
var REFRESH_DELAY = 20;
// A list of substrings of CSS properties used to find transition events that
// might affect dimensions of observed elements.
var transitionKeys = ['top', 'right', 'bottom', 'left', 'width', 'height', 'size', 'weight'];
// Check if MutationObserver is available.
var mutationObserverSupported = typeof MutationObserver !== 'undefined';
/**
 * Singleton controller class which handles updates of ResizeObserver instances.
 */
var ResizeObserverController = /** @class */ (function () {
    /**
     * Creates a new instance of ResizeObserverController.
     *
     * @private
     */
    function ResizeObserverController() {
        /**
         * Indicates whether DOM listeners have been added.
         *
         * @private {boolean}
         */
        this.connected_ = false;
        /**
         * Tells that controller has subscribed for Mutation Events.
         *
         * @private {boolean}
         */
        this.mutationEventsAdded_ = false;
        /**
         * Keeps reference to the instance of MutationObserver.
         *
         * @private {MutationObserver}
         */
        this.mutationsObserver_ = null;
        /**
         * A list of connected observers.
         *
         * @private {Array<ResizeObserverSPI>}
         */
        this.observers_ = [];
        this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
        this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
    }
    /**
     * Adds observer to observers list.
     *
     * @param {ResizeObserverSPI} observer - Observer to be added.
     * @returns {void}
     */
    ResizeObserverController.prototype.addObserver = function (observer) {
        if (!~this.observers_.indexOf(observer)) {
            this.observers_.push(observer);
        }
        // Add listeners if they haven't been added yet.
        if (!this.connected_) {
            this.connect_();
        }
    };
    /**
     * Removes observer from observers list.
     *
     * @param {ResizeObserverSPI} observer - Observer to be removed.
     * @returns {void}
     */
    ResizeObserverController.prototype.removeObserver = function (observer) {
        var observers = this.observers_;
        var index = observers.indexOf(observer);
        // Remove observer if it's present in registry.
        if (~index) {
            observers.splice(index, 1);
        }
        // Remove listeners if controller has no connected observers.
        if (!observers.length && this.connected_) {
            this.disconnect_();
        }
    };
    /**
     * Invokes the update of observers. It will continue running updates insofar
     * it detects changes.
     *
     * @returns {void}
     */
    ResizeObserverController.prototype.refresh = function () {
        var changesDetected = this.updateObservers_();
        // Continue running updates if changes have been detected as there might
        // be future ones caused by CSS transitions.
        if (changesDetected) {
            this.refresh();
        }
    };
    /**
     * Updates every observer from observers list and notifies them of queued
     * entries.
     *
     * @private
     * @returns {boolean} Returns "true" if any observer has detected changes in
     *      dimensions of it's elements.
     */
    ResizeObserverController.prototype.updateObservers_ = function () {
        // Collect observers that have active observations.
        var activeObservers = this.observers_.filter(function (observer) {
            return observer.gatherActive(), observer.hasActive();
        });
        // Deliver notifications in a separate cycle in order to avoid any
        // collisions between observers, e.g. when multiple instances of
        // ResizeObserver are tracking the same element and the callback of one
        // of them changes content dimensions of the observed target. Sometimes
        // this may result in notifications being blocked for the rest of observers.
        activeObservers.forEach(function (observer) { return observer.broadcastActive(); });
        return activeObservers.length > 0;
    };
    /**
     * Initializes DOM listeners.
     *
     * @private
     * @returns {void}
     */
    ResizeObserverController.prototype.connect_ = function () {
        // Do nothing if running in a non-browser environment or if listeners
        // have been already added.
        if (!isBrowser || this.connected_) {
            return;
        }
        // Subscription to the "Transitionend" event is used as a workaround for
        // delayed transitions. This way it's possible to capture at least the
        // final state of an element.
        document.addEventListener('transitionend', this.onTransitionEnd_);
        window.addEventListener('resize', this.refresh);
        if (mutationObserverSupported) {
            this.mutationsObserver_ = new MutationObserver(this.refresh);
            this.mutationsObserver_.observe(document, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            });
        }
        else {
            document.addEventListener('DOMSubtreeModified', this.refresh);
            this.mutationEventsAdded_ = true;
        }
        this.connected_ = true;
    };
    /**
     * Removes DOM listeners.
     *
     * @private
     * @returns {void}
     */
    ResizeObserverController.prototype.disconnect_ = function () {
        // Do nothing if running in a non-browser environment or if listeners
        // have been already removed.
        if (!isBrowser || !this.connected_) {
            return;
        }
        document.removeEventListener('transitionend', this.onTransitionEnd_);
        window.removeEventListener('resize', this.refresh);
        if (this.mutationsObserver_) {
            this.mutationsObserver_.disconnect();
        }
        if (this.mutationEventsAdded_) {
            document.removeEventListener('DOMSubtreeModified', this.refresh);
        }
        this.mutationsObserver_ = null;
        this.mutationEventsAdded_ = false;
        this.connected_ = false;
    };
    /**
     * "Transitionend" event handler.
     *
     * @private
     * @param {TransitionEvent} event
     * @returns {void}
     */
    ResizeObserverController.prototype.onTransitionEnd_ = function (_a) {
        var _b = _a.propertyName, propertyName = _b === void 0 ? '' : _b;
        // Detect whether transition may affect dimensions of an element.
        var isReflowProperty = transitionKeys.some(function (key) {
            return !!~propertyName.indexOf(key);
        });
        if (isReflowProperty) {
            this.refresh();
        }
    };
    /**
     * Returns instance of the ResizeObserverController.
     *
     * @returns {ResizeObserverController}
     */
    ResizeObserverController.getInstance = function () {
        if (!this.instance_) {
            this.instance_ = new ResizeObserverController();
        }
        return this.instance_;
    };
    /**
     * Holds reference to the controller's instance.
     *
     * @private {ResizeObserverController}
     */
    ResizeObserverController.instance_ = null;
    return ResizeObserverController;
}());

/**
 * Defines non-writable/enumerable properties of the provided target object.
 *
 * @param {Object} target - Object for which to define properties.
 * @param {Object} props - Properties to be defined.
 * @returns {Object} Target object.
 */
var defineConfigurable = (function (target, props) {
    for (var _i = 0, _a = Object.keys(props); _i < _a.length; _i++) {
        var key = _a[_i];
        Object.defineProperty(target, key, {
            value: props[key],
            enumerable: false,
            writable: false,
            configurable: true
        });
    }
    return target;
});

/**
 * Returns the global object associated with provided element.
 *
 * @param {Object} target
 * @returns {Object}
 */
var getWindowOf = (function (target) {
    // Assume that the element is an instance of Node, which means that it
    // has the "ownerDocument" property from which we can retrieve a
    // corresponding global object.
    var ownerGlobal = target && target.ownerDocument && target.ownerDocument.defaultView;
    // Return the local global object if it's not possible extract one from
    // provided element.
    return ownerGlobal || global$1;
});

// Placeholder of an empty content rectangle.
var emptyRect = createRectInit(0, 0, 0, 0);
/**
 * Converts provided string to a number.
 *
 * @param {number|string} value
 * @returns {number}
 */
function toFloat(value) {
    return parseFloat(value) || 0;
}
/**
 * Extracts borders size from provided styles.
 *
 * @param {CSSStyleDeclaration} styles
 * @param {...string} positions - Borders positions (top, right, ...)
 * @returns {number}
 */
function getBordersSize(styles) {
    var positions = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        positions[_i - 1] = arguments[_i];
    }
    return positions.reduce(function (size, position) {
        var value = styles['border-' + position + '-width'];
        return size + toFloat(value);
    }, 0);
}
/**
 * Extracts paddings sizes from provided styles.
 *
 * @param {CSSStyleDeclaration} styles
 * @returns {Object} Paddings box.
 */
function getPaddings(styles) {
    var positions = ['top', 'right', 'bottom', 'left'];
    var paddings = {};
    for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
        var position = positions_1[_i];
        var value = styles['padding-' + position];
        paddings[position] = toFloat(value);
    }
    return paddings;
}
/**
 * Calculates content rectangle of provided SVG element.
 *
 * @param {SVGGraphicsElement} target - Element content rectangle of which needs
 *      to be calculated.
 * @returns {DOMRectInit}
 */
function getSVGContentRect(target) {
    var bbox = target.getBBox();
    return createRectInit(0, 0, bbox.width, bbox.height);
}
/**
 * Calculates content rectangle of provided HTMLElement.
 *
 * @param {HTMLElement} target - Element for which to calculate the content rectangle.
 * @returns {DOMRectInit}
 */
function getHTMLElementContentRect(target) {
    // Client width & height properties can't be
    // used exclusively as they provide rounded values.
    var clientWidth = target.clientWidth, clientHeight = target.clientHeight;
    // By this condition we can catch all non-replaced inline, hidden and
    // detached elements. Though elements with width & height properties less
    // than 0.5 will be discarded as well.
    //
    // Without it we would need to implement separate methods for each of
    // those cases and it's not possible to perform a precise and performance
    // effective test for hidden elements. E.g. even jQuery's ':visible' filter
    // gives wrong results for elements with width & height less than 0.5.
    if (!clientWidth && !clientHeight) {
        return emptyRect;
    }
    var styles = getWindowOf(target).getComputedStyle(target);
    var paddings = getPaddings(styles);
    var horizPad = paddings.left + paddings.right;
    var vertPad = paddings.top + paddings.bottom;
    // Computed styles of width & height are being used because they are the
    // only dimensions available to JS that contain non-rounded values. It could
    // be possible to utilize the getBoundingClientRect if only it's data wasn't
    // affected by CSS transformations let alone paddings, borders and scroll bars.
    var width = toFloat(styles.width), height = toFloat(styles.height);
    // Width & height include paddings and borders when the 'border-box' box
    // model is applied (except for IE).
    if (styles.boxSizing === 'border-box') {
        // Following conditions are required to handle Internet Explorer which
        // doesn't include paddings and borders to computed CSS dimensions.
        //
        // We can say that if CSS dimensions + paddings are equal to the "client"
        // properties then it's either IE, and thus we don't need to subtract
        // anything, or an element merely doesn't have paddings/borders styles.
        if (Math.round(width + horizPad) !== clientWidth) {
            width -= getBordersSize(styles, 'left', 'right') + horizPad;
        }
        if (Math.round(height + vertPad) !== clientHeight) {
            height -= getBordersSize(styles, 'top', 'bottom') + vertPad;
        }
    }
    // Following steps can't be applied to the document's root element as its
    // client[Width/Height] properties represent viewport area of the window.
    // Besides, it's as well not necessary as the <html> itself neither has
    // rendered scroll bars nor it can be clipped.
    if (!isDocumentElement(target)) {
        // In some browsers (only in Firefox, actually) CSS width & height
        // include scroll bars size which can be removed at this step as scroll
        // bars are the only difference between rounded dimensions + paddings
        // and "client" properties, though that is not always true in Chrome.
        var vertScrollbar = Math.round(width + horizPad) - clientWidth;
        var horizScrollbar = Math.round(height + vertPad) - clientHeight;
        // Chrome has a rather weird rounding of "client" properties.
        // E.g. for an element with content width of 314.2px it sometimes gives
        // the client width of 315px and for the width of 314.7px it may give
        // 314px. And it doesn't happen all the time. So just ignore this delta
        // as a non-relevant.
        if (Math.abs(vertScrollbar) !== 1) {
            width -= vertScrollbar;
        }
        if (Math.abs(horizScrollbar) !== 1) {
            height -= horizScrollbar;
        }
    }
    return createRectInit(paddings.left, paddings.top, width, height);
}
/**
 * Checks whether provided element is an instance of the SVGGraphicsElement.
 *
 * @param {Element} target - Element to be checked.
 * @returns {boolean}
 */
var isSVGGraphicsElement = (function () {
    // Some browsers, namely IE and Edge, don't have the SVGGraphicsElement
    // interface.
    if (typeof SVGGraphicsElement !== 'undefined') {
        return function (target) { return target instanceof getWindowOf(target).SVGGraphicsElement; };
    }
    // If it's so, then check that element is at least an instance of the
    // SVGElement and that it has the "getBBox" method.
    // eslint-disable-next-line no-extra-parens
    return function (target) { return (target instanceof getWindowOf(target).SVGElement &&
        typeof target.getBBox === 'function'); };
})();
/**
 * Checks whether provided element is a document element (<html>).
 *
 * @param {Element} target - Element to be checked.
 * @returns {boolean}
 */
function isDocumentElement(target) {
    return target === getWindowOf(target).document.documentElement;
}
/**
 * Calculates an appropriate content rectangle for provided html or svg element.
 *
 * @param {Element} target - Element content rectangle of which needs to be calculated.
 * @returns {DOMRectInit}
 */
function getContentRect(target) {
    if (!isBrowser) {
        return emptyRect;
    }
    if (isSVGGraphicsElement(target)) {
        return getSVGContentRect(target);
    }
    return getHTMLElementContentRect(target);
}
/**
 * Creates rectangle with an interface of the DOMRectReadOnly.
 * Spec: https://drafts.fxtf.org/geometry/#domrectreadonly
 *
 * @param {DOMRectInit} rectInit - Object with rectangle's x/y coordinates and dimensions.
 * @returns {DOMRectReadOnly}
 */
function createReadOnlyRect(_a) {
    var x = _a.x, y = _a.y, width = _a.width, height = _a.height;
    // If DOMRectReadOnly is available use it as a prototype for the rectangle.
    var Constr = typeof DOMRectReadOnly !== 'undefined' ? DOMRectReadOnly : Object;
    var rect = Object.create(Constr.prototype);
    // Rectangle's properties are not writable and non-enumerable.
    defineConfigurable(rect, {
        x: x, y: y, width: width, height: height,
        top: y,
        right: x + width,
        bottom: height + y,
        left: x
    });
    return rect;
}
/**
 * Creates DOMRectInit object based on the provided dimensions and the x/y coordinates.
 * Spec: https://drafts.fxtf.org/geometry/#dictdef-domrectinit
 *
 * @param {number} x - X coordinate.
 * @param {number} y - Y coordinate.
 * @param {number} width - Rectangle's width.
 * @param {number} height - Rectangle's height.
 * @returns {DOMRectInit}
 */
function createRectInit(x, y, width, height) {
    return { x: x, y: y, width: width, height: height };
}

/**
 * Class that is responsible for computations of the content rectangle of
 * provided DOM element and for keeping track of it's changes.
 */
var ResizeObservation = /** @class */ (function () {
    /**
     * Creates an instance of ResizeObservation.
     *
     * @param {Element} target - Element to be observed.
     */
    function ResizeObservation(target) {
        /**
         * Broadcasted width of content rectangle.
         *
         * @type {number}
         */
        this.broadcastWidth = 0;
        /**
         * Broadcasted height of content rectangle.
         *
         * @type {number}
         */
        this.broadcastHeight = 0;
        /**
         * Reference to the last observed content rectangle.
         *
         * @private {DOMRectInit}
         */
        this.contentRect_ = createRectInit(0, 0, 0, 0);
        this.target = target;
    }
    /**
     * Updates content rectangle and tells whether it's width or height properties
     * have changed since the last broadcast.
     *
     * @returns {boolean}
     */
    ResizeObservation.prototype.isActive = function () {
        var rect = getContentRect(this.target);
        this.contentRect_ = rect;
        return (rect.width !== this.broadcastWidth ||
            rect.height !== this.broadcastHeight);
    };
    /**
     * Updates 'broadcastWidth' and 'broadcastHeight' properties with a data
     * from the corresponding properties of the last observed content rectangle.
     *
     * @returns {DOMRectInit} Last observed content rectangle.
     */
    ResizeObservation.prototype.broadcastRect = function () {
        var rect = this.contentRect_;
        this.broadcastWidth = rect.width;
        this.broadcastHeight = rect.height;
        return rect;
    };
    return ResizeObservation;
}());

var ResizeObserverEntry = /** @class */ (function () {
    /**
     * Creates an instance of ResizeObserverEntry.
     *
     * @param {Element} target - Element that is being observed.
     * @param {DOMRectInit} rectInit - Data of the element's content rectangle.
     */
    function ResizeObserverEntry(target, rectInit) {
        var contentRect = createReadOnlyRect(rectInit);
        // According to the specification following properties are not writable
        // and are also not enumerable in the native implementation.
        //
        // Property accessors are not being used as they'd require to define a
        // private WeakMap storage which may cause memory leaks in browsers that
        // don't support this type of collections.
        defineConfigurable(this, { target: target, contentRect: contentRect });
    }
    return ResizeObserverEntry;
}());

var ResizeObserverSPI = /** @class */ (function () {
    /**
     * Creates a new instance of ResizeObserver.
     *
     * @param {ResizeObserverCallback} callback - Callback function that is invoked
     *      when one of the observed elements changes it's content dimensions.
     * @param {ResizeObserverController} controller - Controller instance which
     *      is responsible for the updates of observer.
     * @param {ResizeObserver} callbackCtx - Reference to the public
     *      ResizeObserver instance which will be passed to callback function.
     */
    function ResizeObserverSPI(callback, controller, callbackCtx) {
        /**
         * Collection of resize observations that have detected changes in dimensions
         * of elements.
         *
         * @private {Array<ResizeObservation>}
         */
        this.activeObservations_ = [];
        /**
         * Registry of the ResizeObservation instances.
         *
         * @private {Map<Element, ResizeObservation>}
         */
        this.observations_ = new MapShim();
        if (typeof callback !== 'function') {
            throw new TypeError('The callback provided as parameter 1 is not a function.');
        }
        this.callback_ = callback;
        this.controller_ = controller;
        this.callbackCtx_ = callbackCtx;
    }
    /**
     * Starts observing provided element.
     *
     * @param {Element} target - Element to be observed.
     * @returns {void}
     */
    ResizeObserverSPI.prototype.observe = function (target) {
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        // Do nothing if current environment doesn't have the Element interface.
        if (typeof Element === 'undefined' || !(Element instanceof Object)) {
            return;
        }
        if (!(target instanceof getWindowOf(target).Element)) {
            throw new TypeError('parameter 1 is not of type "Element".');
        }
        var observations = this.observations_;
        // Do nothing if element is already being observed.
        if (observations.has(target)) {
            return;
        }
        observations.set(target, new ResizeObservation(target));
        this.controller_.addObserver(this);
        // Force the update of observations.
        this.controller_.refresh();
    };
    /**
     * Stops observing provided element.
     *
     * @param {Element} target - Element to stop observing.
     * @returns {void}
     */
    ResizeObserverSPI.prototype.unobserve = function (target) {
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        // Do nothing if current environment doesn't have the Element interface.
        if (typeof Element === 'undefined' || !(Element instanceof Object)) {
            return;
        }
        if (!(target instanceof getWindowOf(target).Element)) {
            throw new TypeError('parameter 1 is not of type "Element".');
        }
        var observations = this.observations_;
        // Do nothing if element is not being observed.
        if (!observations.has(target)) {
            return;
        }
        observations.delete(target);
        if (!observations.size) {
            this.controller_.removeObserver(this);
        }
    };
    /**
     * Stops observing all elements.
     *
     * @returns {void}
     */
    ResizeObserverSPI.prototype.disconnect = function () {
        this.clearActive();
        this.observations_.clear();
        this.controller_.removeObserver(this);
    };
    /**
     * Collects observation instances the associated element of which has changed
     * it's content rectangle.
     *
     * @returns {void}
     */
    ResizeObserverSPI.prototype.gatherActive = function () {
        var _this = this;
        this.clearActive();
        this.observations_.forEach(function (observation) {
            if (observation.isActive()) {
                _this.activeObservations_.push(observation);
            }
        });
    };
    /**
     * Invokes initial callback function with a list of ResizeObserverEntry
     * instances collected from active resize observations.
     *
     * @returns {void}
     */
    ResizeObserverSPI.prototype.broadcastActive = function () {
        // Do nothing if observer doesn't have active observations.
        if (!this.hasActive()) {
            return;
        }
        var ctx = this.callbackCtx_;
        // Create ResizeObserverEntry instance for every active observation.
        var entries = this.activeObservations_.map(function (observation) {
            return new ResizeObserverEntry(observation.target, observation.broadcastRect());
        });
        this.callback_.call(ctx, entries, ctx);
        this.clearActive();
    };
    /**
     * Clears the collection of active observations.
     *
     * @returns {void}
     */
    ResizeObserverSPI.prototype.clearActive = function () {
        this.activeObservations_.splice(0);
    };
    /**
     * Tells whether observer has active observations.
     *
     * @returns {boolean}
     */
    ResizeObserverSPI.prototype.hasActive = function () {
        return this.activeObservations_.length > 0;
    };
    return ResizeObserverSPI;
}());

// Registry of internal observers. If WeakMap is not available use current shim
// for the Map collection as it has all required methods and because WeakMap
// can't be fully polyfilled anyway.
var observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new MapShim();
/**
 * ResizeObserver API. Encapsulates the ResizeObserver SPI implementation
 * exposing only those methods and properties that are defined in the spec.
 */
var ResizeObserver = /** @class */ (function () {
    /**
     * Creates a new instance of ResizeObserver.
     *
     * @param {ResizeObserverCallback} callback - Callback that is invoked when
     *      dimensions of the observed elements change.
     */
    function ResizeObserver(callback) {
        if (!(this instanceof ResizeObserver)) {
            throw new TypeError('Cannot call a class as a function.');
        }
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        var controller = ResizeObserverController.getInstance();
        var observer = new ResizeObserverSPI(callback, controller, this);
        observers.set(this, observer);
    }
    return ResizeObserver;
}());
// Expose public methods of ResizeObserver.
[
    'observe',
    'unobserve',
    'disconnect'
].forEach(function (method) {
    ResizeObserver.prototype[method] = function () {
        var _a;
        return (_a = observers.get(this))[method].apply(_a, arguments);
    };
});

var index = (function () {
    // Export existing implementation if available.
    if (typeof global$1.ResizeObserver !== 'undefined') {
        return global$1.ResizeObserver;
    }
    return ResizeObserver;
})();

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (index);


/***/ }),

/***/ "./assets/end.svg":
/*!************************!*\
  !*** ./assets/end.svg ***!
  \************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var React = __webpack_require__(/*! react */ "react");

function End (props) {
    return React.createElement("svg",props,React.createElement("g",{"id":"Page-1","fill":"none","fillRule":"evenodd"},React.createElement("g",{"id":"037---Waypoint-Flag","fillRule":"nonzero","transform":"translate(-1 -1)"},[React.createElement("path",{"id":"Shape","d":"m58.44 30.6c-11.88 14.2-32.78-3.93-44.27 11.64l-.66-2.34v-.01c-2.29-8.19-4.58-16.3833333-6.87-24.58-.22-.78-.43-1.56-.65-2.34 11.49-15.57 32.4 2.56 44.27-11.64.58-.7 1.13-.4 1.01.62-.06.48-.13.96-.19 1.43-.69 5-1.53 9.44-2.49 13.46-.27 1.13-.54 2.22-.83 3.29-.0181734.0757458-.0315335.1525661-.04.23-.0106736.2802805.1027422.5510151.31.74 2.9783401 2.7019905 6.2761919 5.0292932 9.82 6.93.28.14.55.27.82.39.46.2.35 1.48-.23 2.18z","fill":"#e64c3c","key":0}),React.createElement("path",{"id":"Shape","d":"m58.44 30.6c-11.88 14.2-32.78-3.93-44.27 11.64-.22-.78-1.95-.87-2.17-1.65v-.01c-2.29-8.19-4.58-16.3833333-6.87-24.58-.22-.78 1.08-2.25.86-3.03 11.49-15.57 32.4 2.56 44.27-11.64.58-.7 1.13-.4 1.01.62-.06.48-.13.96-.19 1.43-.69 5-1.53 9.44-2.49 13.46-.27 1.13-.54 2.22-.83 3.29-.0181734.0757458-.0315335.1525661-.04.23-.0106736.2802805.1027422.5510151.31.74 2.9783401 2.7019905 6.2761919 5.0292932 9.82 6.93.28.14.55.27.82.39.46.2.35 1.48-.23 2.18z","fill":"#e64c3c","key":1}),React.createElement("path",{"id":"Shape","d":"m9.45150963 10.0111708h.1433c.64015307 0 1.25408707.2542998 1.70674367.7069563.4526565.4526566.7069563 1.0665906.7069563 1.7067437v45.3626c0 1.0664618-.8645381 1.931-1.931 1.931h-1.10879997c-1.06646186 0-1.931-.8645382-1.931-1.931v-45.3626c0-1.3330497 1.0806503-2.4137 2.4137-2.4137z","fill":"#cf976a","transform":"matrix(.963 -.269 .269 .963 -9.032 3.849)","key":2})])));
}

End.defaultProps = {"height":"16","viewBox":"0 0 58 58","width":"16"};

module.exports = End;

End.default = End;


/***/ }),

/***/ "./assets/github.svg":
/*!***************************!*\
  !*** ./assets/github.svg ***!
  \***************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var React = __webpack_require__(/*! react */ "react");

function Github (props) {
    return React.createElement("svg",props,[React.createElement("defs",{"key":0}),React.createElement("rect",{"fill":"#222222","height":"98","width":"200","x":"0","y":"0","key":1}),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"12px","fontFamily":"Arial","fontWeight":"bold"},"x":"10","y":"20","key":2},"XUANYUAN'S Hiking"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"4px","fontFamily":"Arial"},"x":"10","y":"78","key":3},"ATHLETE"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"9px","fontFamily":"Arial"},"x":"10","y":"88","key":4},"XUANYUAN.me"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"4px","fontFamily":"Arial"},"x":"120","y":"78","key":5},"STATISTICS"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"120","y":"83","key":6},"Number: 19"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"120","y":"88","key":7},"Weekly: 1.1"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"141","y":"83","key":8},"Total: 237.9 km"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"141","y":"88","key":9},"Avg: 12.5 km"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"167","y":"83","key":10},"Min: 4.5 km"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"167","y":"88","key":11},"Max: 23.5 km"),React.createElement("text",{"alignmentBaseline":"hanging","fill":"#FFFFFF","style":{"fontSize":"10.0px","fontFamily":"Arial"},"x":"10","y":"30","key":12},"2022"),React.createElement("text",{"alignmentBaseline":"hanging","fill":"#FFFFFF","style":{"fontSize":"4.125px","fontFamily":"Arial"},"x":"175","y":"35","key":13},"237.9 km"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"10.0","y":"44","key":14},"Jan"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"25.5","y":"44","key":15},"Feb"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"41.0","y":"44","key":16},"Mar"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"56.5","y":"44","key":17},"Apr"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"72.0","y":"44","key":18},"May"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"87.5","y":"44","key":19},"Jun"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"103.0","y":"44","key":20},"Jul"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"118.5","y":"44","key":21},"Aug"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"134.0","y":"44","key":22},"Sep"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"149.5","y":"44","key":23},"Oct"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"165.0","y":"44","key":24},"Nov"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"2.5px","fontFamily":"Arial"},"x":"180.5","y":"44","key":25},"Dec"),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"10.0","y":"45.5","key":26},React.createElement("title",null,"2021-12-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"10.0","y":"49.0","key":27},React.createElement("title",null,"2021-12-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"10.0","y":"52.5","key":28},React.createElement("title",null,"2021-12-29")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"10.0","y":"56.0","key":29},React.createElement("title",null,"2021-12-30")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"10.0","y":"59.5","key":30},React.createElement("title",null,"2021-12-31")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"10.0","y":"63.0","key":31},React.createElement("title",null,"2022-01-01")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"10.0","y":"66.5","key":32},React.createElement("title",null,"2022-01-02")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"13.5","y":"45.5","key":33},React.createElement("title",null,"2022-01-03")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"13.5","y":"49.0","key":34},React.createElement("title",null,"2022-01-04")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"13.5","y":"52.5","key":35},React.createElement("title",null,"2022-01-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"13.5","y":"56.0","key":36},React.createElement("title",null,"2022-01-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"13.5","y":"59.5","key":37},React.createElement("title",null,"2022-01-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"13.5","y":"63.0","key":38},React.createElement("title",null,"2022-01-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"13.5","y":"66.5","key":39},React.createElement("title",null,"2022-01-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"17.0","y":"45.5","key":40},React.createElement("title",null,"2022-01-10")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"17.0","y":"49.0","key":41},React.createElement("title",null,"2022-01-11")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"17.0","y":"52.5","key":42},React.createElement("title",null,"2022-01-12")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"17.0","y":"56.0","key":43},React.createElement("title",null,"2022-01-13")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"17.0","y":"59.5","key":44},React.createElement("title",null,"2022-01-14")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"17.0","y":"63.0","key":45},React.createElement("title",null,"2022-01-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"17.0","y":"66.5","key":46},React.createElement("title",null,"2022-01-16")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"20.5","y":"45.5","key":47},React.createElement("title",null,"2022-01-17")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"20.5","y":"49.0","key":48},React.createElement("title",null,"2022-01-18")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"20.5","y":"52.5","key":49},React.createElement("title",null,"2022-01-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"20.5","y":"56.0","key":50},React.createElement("title",null,"2022-01-20")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"20.5","y":"59.5","key":51},React.createElement("title",null,"2022-01-21")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"20.5","y":"63.0","key":52},React.createElement("title",null,"2022-01-22")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"20.5","y":"66.5","key":53},React.createElement("title",null,"2022-01-23")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"24.0","y":"45.5","key":54},React.createElement("title",null,"2022-01-24")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"24.0","y":"49.0","key":55},React.createElement("title",null,"2022-01-25")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"24.0","y":"52.5","key":56},React.createElement("title",null,"2022-01-26")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"24.0","y":"56.0","key":57},React.createElement("title",null,"2022-01-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"24.0","y":"59.5","key":58},React.createElement("title",null,"2022-01-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"24.0","y":"63.0","key":59},React.createElement("title",null,"2022-01-29")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"24.0","y":"66.5","key":60},React.createElement("title",null,"2022-01-30")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"27.5","y":"45.5","key":61},React.createElement("title",null,"2022-01-31")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"27.5","y":"49.0","key":62},React.createElement("title",null,"2022-02-01")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"27.5","y":"52.5","key":63},React.createElement("title",null,"2022-02-02")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"27.5","y":"56.0","key":64},React.createElement("title",null,"2022-02-03")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"27.5","y":"59.5","key":65},React.createElement("title",null,"2022-02-04")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"27.5","y":"63.0","key":66},React.createElement("title",null,"2022-02-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"27.5","y":"66.5","key":67},React.createElement("title",null,"2022-02-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"31.0","y":"45.5","key":68},React.createElement("title",null,"2022-02-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"31.0","y":"49.0","key":69},React.createElement("title",null,"2022-02-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"31.0","y":"52.5","key":70},React.createElement("title",null,"2022-02-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"31.0","y":"56.0","key":71},React.createElement("title",null,"2022-02-10")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"31.0","y":"59.5","key":72},React.createElement("title",null,"2022-02-11")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"31.0","y":"63.0","key":73},React.createElement("title",null,"2022-02-12")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"31.0","y":"66.5","key":74},React.createElement("title",null,"2022-02-13")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"34.5","y":"45.5","key":75},React.createElement("title",null,"2022-02-14")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"34.5","y":"49.0","key":76},React.createElement("title",null,"2022-02-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"34.5","y":"52.5","key":77},React.createElement("title",null,"2022-02-16")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"34.5","y":"56.0","key":78},React.createElement("title",null,"2022-02-17")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"34.5","y":"59.5","key":79},React.createElement("title",null,"2022-02-18")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"34.5","y":"63.0","key":80},React.createElement("title",null,"2022-02-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"34.5","y":"66.5","key":81},React.createElement("title",null,"2022-02-20")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"38.0","y":"45.5","key":82},React.createElement("title",null,"2022-02-21")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"38.0","y":"49.0","key":83},React.createElement("title",null,"2022-02-22")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"38.0","y":"52.5","key":84},React.createElement("title",null,"2022-02-23")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"38.0","y":"56.0","key":85},React.createElement("title",null,"2022-02-24")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"38.0","y":"59.5","key":86},React.createElement("title",null,"2022-02-25")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"38.0","y":"63.0","key":87},React.createElement("title",null,"2022-02-26")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"38.0","y":"66.5","key":88},React.createElement("title",null,"2022-02-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"41.5","y":"45.5","key":89},React.createElement("title",null,"2022-02-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"41.5","y":"49.0","key":90},React.createElement("title",null,"2022-03-01")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"41.5","y":"52.5","key":91},React.createElement("title",null,"2022-03-02")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"41.5","y":"56.0","key":92},React.createElement("title",null,"2022-03-03")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"41.5","y":"59.5","key":93},React.createElement("title",null,"2022-03-04")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"41.5","y":"63.0","key":94},React.createElement("title",null,"2022-03-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"41.5","y":"66.5","key":95},React.createElement("title",null,"2022-03-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"45.0","y":"45.5","key":96},React.createElement("title",null,"2022-03-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"45.0","y":"49.0","key":97},React.createElement("title",null,"2022-03-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"45.0","y":"52.5","key":98},React.createElement("title",null,"2022-03-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"45.0","y":"56.0","key":99},React.createElement("title",null,"2022-03-10")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"45.0","y":"59.5","key":100},React.createElement("title",null,"2022-03-11")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"45.0","y":"63.0","key":101},React.createElement("title",null,"2022-03-12")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"45.0","y":"66.5","key":102},React.createElement("title",null,"2022-03-13")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"48.5","y":"45.5","key":103},React.createElement("title",null,"2022-03-14")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"48.5","y":"49.0","key":104},React.createElement("title",null,"2022-03-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"48.5","y":"52.5","key":105},React.createElement("title",null,"2022-03-16")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"48.5","y":"56.0","key":106},React.createElement("title",null,"2022-03-17")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"48.5","y":"59.5","key":107},React.createElement("title",null,"2022-03-18")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"48.5","y":"63.0","key":108},React.createElement("title",null,"2022-03-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"48.5","y":"66.5","key":109},React.createElement("title",null,"2022-03-20")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"52.0","y":"45.5","key":110},React.createElement("title",null,"2022-03-21")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"52.0","y":"49.0","key":111},React.createElement("title",null,"2022-03-22")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"52.0","y":"52.5","key":112},React.createElement("title",null,"2022-03-23")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"52.0","y":"56.0","key":113},React.createElement("title",null,"2022-03-24")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"52.0","y":"59.5","key":114},React.createElement("title",null,"2022-03-25")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"52.0","y":"63.0","key":115},React.createElement("title",null,"2022-03-26")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"52.0","y":"66.5","key":116},React.createElement("title",null,"2022-03-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"55.5","y":"45.5","key":117},React.createElement("title",null,"2022-03-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"55.5","y":"49.0","key":118},React.createElement("title",null,"2022-03-29")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"55.5","y":"52.5","key":119},React.createElement("title",null,"2022-03-30")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"55.5","y":"56.0","key":120},React.createElement("title",null,"2022-03-31")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"55.5","y":"59.5","key":121},React.createElement("title",null,"2022-04-01")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"55.5","y":"63.0","key":122},React.createElement("title",null,"2022-04-02")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"55.5","y":"66.5","key":123},React.createElement("title",null,"2022-04-03")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"59.0","y":"45.5","key":124},React.createElement("title",null,"2022-04-04")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"59.0","y":"49.0","key":125},React.createElement("title",null,"2022-04-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"59.0","y":"52.5","key":126},React.createElement("title",null,"2022-04-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"59.0","y":"56.0","key":127},React.createElement("title",null,"2022-04-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"59.0","y":"59.5","key":128},React.createElement("title",null,"2022-04-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"59.0","y":"63.0","key":129},React.createElement("title",null,"2022-04-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"59.0","y":"66.5","key":130},React.createElement("title",null,"2022-04-10")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"62.5","y":"45.5","key":131},React.createElement("title",null,"2022-04-11")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"62.5","y":"49.0","key":132},React.createElement("title",null,"2022-04-12")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"62.5","y":"52.5","key":133},React.createElement("title",null,"2022-04-13")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"62.5","y":"56.0","key":134},React.createElement("title",null,"2022-04-14")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"62.5","y":"59.5","key":135},React.createElement("title",null,"2022-04-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"62.5","y":"63.0","key":136},React.createElement("title",null,"2022-04-16")),React.createElement("rect",{"fill":"#ffa800","height":"2.6","width":"2.6","x":"62.5","y":"66.5","key":137},React.createElement("title",null,"2022-04-17 11.0 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"66.0","y":"45.5","key":138},React.createElement("title",null,"2022-04-18")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"66.0","y":"49.0","key":139},React.createElement("title",null,"2022-04-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"66.0","y":"52.5","key":140},React.createElement("title",null,"2022-04-20")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"66.0","y":"56.0","key":141},React.createElement("title",null,"2022-04-21")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"66.0","y":"59.5","key":142},React.createElement("title",null,"2022-04-22")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"66.0","y":"63.0","key":143},React.createElement("title",null,"2022-04-23")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"66.0","y":"66.5","key":144},React.createElement("title",null,"2022-04-24")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"69.5","y":"45.5","key":145},React.createElement("title",null,"2022-04-25")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"69.5","y":"49.0","key":146},React.createElement("title",null,"2022-04-26")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"69.5","y":"52.5","key":147},React.createElement("title",null,"2022-04-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"69.5","y":"56.0","key":148},React.createElement("title",null,"2022-04-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"69.5","y":"59.5","key":149},React.createElement("title",null,"2022-04-29")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"69.5","y":"63.0","key":150},React.createElement("title",null,"2022-04-30")),React.createElement("rect",{"fill":"#4dd2ff","height":"2.6","width":"2.6","x":"69.5","y":"66.5","key":151},React.createElement("title",null,"2022-05-01 9.3 km")),React.createElement("rect",{"fill":"#4dd2ff","height":"2.6","width":"2.6","x":"73.0","y":"45.5","key":152},React.createElement("title",null,"2022-05-02 7.3 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"73.0","y":"49.0","key":153},React.createElement("title",null,"2022-05-03")),React.createElement("rect",{"fill":"#ffa900","height":"2.6","width":"2.6","x":"73.0","y":"52.5","key":154},React.createElement("title",null,"2022-05-04 10.9 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"73.0","y":"56.0","key":155},React.createElement("title",null,"2022-05-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"73.0","y":"59.5","key":156},React.createElement("title",null,"2022-05-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"73.0","y":"63.0","key":157},React.createElement("title",null,"2022-05-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"73.0","y":"66.5","key":158},React.createElement("title",null,"2022-05-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"76.5","y":"45.5","key":159},React.createElement("title",null,"2022-05-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"76.5","y":"49.0","key":160},React.createElement("title",null,"2022-05-10")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"76.5","y":"52.5","key":161},React.createElement("title",null,"2022-05-11")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"76.5","y":"56.0","key":162},React.createElement("title",null,"2022-05-12")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"76.5","y":"59.5","key":163},React.createElement("title",null,"2022-05-13")),React.createElement("rect",{"fill":"#ffab00","height":"2.6","width":"2.6","x":"76.5","y":"63.0","key":164},React.createElement("title",null,"2022-05-14 10.8 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"76.5","y":"66.5","key":165},React.createElement("title",null,"2022-05-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"80.0","y":"45.5","key":166},React.createElement("title",null,"2022-05-16")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"80.0","y":"49.0","key":167},React.createElement("title",null,"2022-05-17")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"80.0","y":"52.5","key":168},React.createElement("title",null,"2022-05-18")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"80.0","y":"56.0","key":169},React.createElement("title",null,"2022-05-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"80.0","y":"59.5","key":170},React.createElement("title",null,"2022-05-20")),React.createElement("rect",{"fill":"#4dd2ff","height":"2.6","width":"2.6","x":"80.0","y":"63.0","key":171},React.createElement("title",null,"2022-05-21 8.1 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"80.0","y":"66.5","key":172},React.createElement("title",null,"2022-05-22")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"83.5","y":"45.5","key":173},React.createElement("title",null,"2022-05-23")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"83.5","y":"49.0","key":174},React.createElement("title",null,"2022-05-24")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"83.5","y":"52.5","key":175},React.createElement("title",null,"2022-05-25")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"83.5","y":"56.0","key":176},React.createElement("title",null,"2022-05-26")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"83.5","y":"59.5","key":177},React.createElement("title",null,"2022-05-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"83.5","y":"63.0","key":178},React.createElement("title",null,"2022-05-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"83.5","y":"66.5","key":179},React.createElement("title",null,"2022-05-29")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"87.0","y":"45.5","key":180},React.createElement("title",null,"2022-05-30")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"87.0","y":"49.0","key":181},React.createElement("title",null,"2022-05-31")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"87.0","y":"52.5","key":182},React.createElement("title",null,"2022-06-01")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"87.0","y":"56.0","key":183},React.createElement("title",null,"2022-06-02")),React.createElement("rect",{"fill":"#4dd2ff","height":"2.6","width":"2.6","x":"87.0","y":"59.5","key":184},React.createElement("title",null,"2022-06-03 4.5 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"87.0","y":"63.0","key":185},React.createElement("title",null,"2022-06-04")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"87.0","y":"66.5","key":186},React.createElement("title",null,"2022-06-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"90.5","y":"45.5","key":187},React.createElement("title",null,"2022-06-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"90.5","y":"49.0","key":188},React.createElement("title",null,"2022-06-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"90.5","y":"52.5","key":189},React.createElement("title",null,"2022-06-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"90.5","y":"56.0","key":190},React.createElement("title",null,"2022-06-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"90.5","y":"59.5","key":191},React.createElement("title",null,"2022-06-10")),React.createElement("rect",{"fill":"#ff5d00","height":"2.6","width":"2.6","x":"90.5","y":"63.0","key":192},React.createElement("title",null,"2022-06-11 16.6 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"90.5","y":"66.5","key":193},React.createElement("title",null,"2022-06-12")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"94.0","y":"45.5","key":194},React.createElement("title",null,"2022-06-13")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"94.0","y":"49.0","key":195},React.createElement("title",null,"2022-06-14")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"94.0","y":"52.5","key":196},React.createElement("title",null,"2022-06-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"94.0","y":"56.0","key":197},React.createElement("title",null,"2022-06-16")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"94.0","y":"59.5","key":198},React.createElement("title",null,"2022-06-17")),React.createElement("rect",{"fill":"#4dd2ff","height":"2.6","width":"2.6","x":"94.0","y":"63.0","key":199},React.createElement("title",null,"2022-06-18 7.9 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"94.0","y":"66.5","key":200},React.createElement("title",null,"2022-06-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"97.5","y":"45.5","key":201},React.createElement("title",null,"2022-06-20")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"97.5","y":"49.0","key":202},React.createElement("title",null,"2022-06-21")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"97.5","y":"52.5","key":203},React.createElement("title",null,"2022-06-22")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"97.5","y":"56.0","key":204},React.createElement("title",null,"2022-06-23")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"97.5","y":"59.5","key":205},React.createElement("title",null,"2022-06-24")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"97.5","y":"63.0","key":206},React.createElement("title",null,"2022-06-25")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"97.5","y":"66.5","key":207},React.createElement("title",null,"2022-06-26")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"101.0","y":"45.5","key":208},React.createElement("title",null,"2022-06-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"101.0","y":"49.0","key":209},React.createElement("title",null,"2022-06-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"101.0","y":"52.5","key":210},React.createElement("title",null,"2022-06-29")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"101.0","y":"56.0","key":211},React.createElement("title",null,"2022-06-30")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"101.0","y":"59.5","key":212},React.createElement("title",null,"2022-07-01")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"101.0","y":"63.0","key":213},React.createElement("title",null,"2022-07-02")),React.createElement("rect",{"fill":"#4dd2ff","height":"2.6","width":"2.6","x":"101.0","y":"66.5","key":214},React.createElement("title",null,"2022-07-03 6.0 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"104.5","y":"45.5","key":215},React.createElement("title",null,"2022-07-04")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"104.5","y":"49.0","key":216},React.createElement("title",null,"2022-07-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"104.5","y":"52.5","key":217},React.createElement("title",null,"2022-07-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"104.5","y":"56.0","key":218},React.createElement("title",null,"2022-07-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"104.5","y":"59.5","key":219},React.createElement("title",null,"2022-07-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"104.5","y":"63.0","key":220},React.createElement("title",null,"2022-07-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"104.5","y":"66.5","key":221},React.createElement("title",null,"2022-07-10")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"108.0","y":"45.5","key":222},React.createElement("title",null,"2022-07-11")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"108.0","y":"49.0","key":223},React.createElement("title",null,"2022-07-12")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"108.0","y":"52.5","key":224},React.createElement("title",null,"2022-07-13")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"108.0","y":"56.0","key":225},React.createElement("title",null,"2022-07-14")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"108.0","y":"59.5","key":226},React.createElement("title",null,"2022-07-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"108.0","y":"63.0","key":227},React.createElement("title",null,"2022-07-16")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"108.0","y":"66.5","key":228},React.createElement("title",null,"2022-07-17")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"111.5","y":"45.5","key":229},React.createElement("title",null,"2022-07-18")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"111.5","y":"49.0","key":230},React.createElement("title",null,"2022-07-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"111.5","y":"52.5","key":231},React.createElement("title",null,"2022-07-20")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"111.5","y":"56.0","key":232},React.createElement("title",null,"2022-07-21")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"111.5","y":"59.5","key":233},React.createElement("title",null,"2022-07-22")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"111.5","y":"63.0","key":234},React.createElement("title",null,"2022-07-23")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"111.5","y":"66.5","key":235},React.createElement("title",null,"2022-07-24")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"115.0","y":"45.5","key":236},React.createElement("title",null,"2022-07-25")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"115.0","y":"49.0","key":237},React.createElement("title",null,"2022-07-26")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"115.0","y":"52.5","key":238},React.createElement("title",null,"2022-07-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"115.0","y":"56.0","key":239},React.createElement("title",null,"2022-07-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"115.0","y":"59.5","key":240},React.createElement("title",null,"2022-07-29")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"115.0","y":"63.0","key":241},React.createElement("title",null,"2022-07-30")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"115.0","y":"66.5","key":242},React.createElement("title",null,"2022-07-31")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"118.5","y":"45.5","key":243},React.createElement("title",null,"2022-08-01")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"118.5","y":"49.0","key":244},React.createElement("title",null,"2022-08-02")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"118.5","y":"52.5","key":245},React.createElement("title",null,"2022-08-03")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"118.5","y":"56.0","key":246},React.createElement("title",null,"2022-08-04")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"118.5","y":"59.5","key":247},React.createElement("title",null,"2022-08-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"118.5","y":"63.0","key":248},React.createElement("title",null,"2022-08-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"118.5","y":"66.5","key":249},React.createElement("title",null,"2022-08-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"122.0","y":"45.5","key":250},React.createElement("title",null,"2022-08-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"122.0","y":"49.0","key":251},React.createElement("title",null,"2022-08-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"122.0","y":"52.5","key":252},React.createElement("title",null,"2022-08-10")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"122.0","y":"56.0","key":253},React.createElement("title",null,"2022-08-11")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"122.0","y":"59.5","key":254},React.createElement("title",null,"2022-08-12")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"122.0","y":"63.0","key":255},React.createElement("title",null,"2022-08-13")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"122.0","y":"66.5","key":256},React.createElement("title",null,"2022-08-14")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"125.5","y":"45.5","key":257},React.createElement("title",null,"2022-08-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"125.5","y":"49.0","key":258},React.createElement("title",null,"2022-08-16")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"125.5","y":"52.5","key":259},React.createElement("title",null,"2022-08-17")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"125.5","y":"56.0","key":260},React.createElement("title",null,"2022-08-18")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"125.5","y":"59.5","key":261},React.createElement("title",null,"2022-08-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"125.5","y":"63.0","key":262},React.createElement("title",null,"2022-08-20")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"125.5","y":"66.5","key":263},React.createElement("title",null,"2022-08-21")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"129.0","y":"45.5","key":264},React.createElement("title",null,"2022-08-22")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"129.0","y":"49.0","key":265},React.createElement("title",null,"2022-08-23")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"129.0","y":"52.5","key":266},React.createElement("title",null,"2022-08-24")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"129.0","y":"56.0","key":267},React.createElement("title",null,"2022-08-25")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"129.0","y":"59.5","key":268},React.createElement("title",null,"2022-08-26")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"129.0","y":"63.0","key":269},React.createElement("title",null,"2022-08-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"129.0","y":"66.5","key":270},React.createElement("title",null,"2022-08-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"132.5","y":"45.5","key":271},React.createElement("title",null,"2022-08-29")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"132.5","y":"49.0","key":272},React.createElement("title",null,"2022-08-30")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"132.5","y":"52.5","key":273},React.createElement("title",null,"2022-08-31")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"132.5","y":"56.0","key":274},React.createElement("title",null,"2022-09-01")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"132.5","y":"59.5","key":275},React.createElement("title",null,"2022-09-02")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"132.5","y":"63.0","key":276},React.createElement("title",null,"2022-09-03")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"132.5","y":"66.5","key":277},React.createElement("title",null,"2022-09-04")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"136.0","y":"45.5","key":278},React.createElement("title",null,"2022-09-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"136.0","y":"49.0","key":279},React.createElement("title",null,"2022-09-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"136.0","y":"52.5","key":280},React.createElement("title",null,"2022-09-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"136.0","y":"56.0","key":281},React.createElement("title",null,"2022-09-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"136.0","y":"59.5","key":282},React.createElement("title",null,"2022-09-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"136.0","y":"63.0","key":283},React.createElement("title",null,"2022-09-10")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"136.0","y":"66.5","key":284},React.createElement("title",null,"2022-09-11")),React.createElement("rect",{"fill":"#ff5f00","height":"2.6","width":"2.6","x":"139.5","y":"45.5","key":285},React.createElement("title",null,"2022-09-12 16.5 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"139.5","y":"49.0","key":286},React.createElement("title",null,"2022-09-13")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"139.5","y":"52.5","key":287},React.createElement("title",null,"2022-09-14")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"139.5","y":"56.0","key":288},React.createElement("title",null,"2022-09-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"139.5","y":"59.5","key":289},React.createElement("title",null,"2022-09-16")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"139.5","y":"63.0","key":290},React.createElement("title",null,"2022-09-17")),React.createElement("rect",{"fill":"red","height":"2.6","width":"2.6","x":"139.5","y":"66.5","key":291},React.createElement("title",null,"2022-09-18 21.4 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"143.0","y":"45.5","key":292},React.createElement("title",null,"2022-09-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"143.0","y":"49.0","key":293},React.createElement("title",null,"2022-09-20")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"143.0","y":"52.5","key":294},React.createElement("title",null,"2022-09-21")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"143.0","y":"56.0","key":295},React.createElement("title",null,"2022-09-22")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"143.0","y":"59.5","key":296},React.createElement("title",null,"2022-09-23")),React.createElement("rect",{"fill":"#4dd2ff","height":"2.6","width":"2.6","x":"143.0","y":"63.0","key":297},React.createElement("title",null,"2022-09-24 9.9 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"143.0","y":"66.5","key":298},React.createElement("title",null,"2022-09-25")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"146.5","y":"45.5","key":299},React.createElement("title",null,"2022-09-26")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"146.5","y":"49.0","key":300},React.createElement("title",null,"2022-09-27")),React.createElement("rect",{"fill":"red","height":"2.6","width":"2.6","x":"146.5","y":"52.5","key":301},React.createElement("title",null,"2022-09-28 23.5 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"146.5","y":"56.0","key":302},React.createElement("title",null,"2022-09-29")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"146.5","y":"59.5","key":303},React.createElement("title",null,"2022-09-30")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"146.5","y":"63.0","key":304},React.createElement("title",null,"2022-10-01")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"146.5","y":"66.5","key":305},React.createElement("title",null,"2022-10-02")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"150.0","y":"45.5","key":306},React.createElement("title",null,"2022-10-03")),React.createElement("rect",{"fill":"#4dd2ff","height":"2.6","width":"2.6","x":"150.0","y":"49.0","key":307},React.createElement("title",null,"2022-10-04 6.8 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"150.0","y":"52.5","key":308},React.createElement("title",null,"2022-10-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"150.0","y":"56.0","key":309},React.createElement("title",null,"2022-10-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"150.0","y":"59.5","key":310},React.createElement("title",null,"2022-10-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"150.0","y":"63.0","key":311},React.createElement("title",null,"2022-10-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"150.0","y":"66.5","key":312},React.createElement("title",null,"2022-10-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"153.5","y":"45.5","key":313},React.createElement("title",null,"2022-10-10")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"153.5","y":"49.0","key":314},React.createElement("title",null,"2022-10-11")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"153.5","y":"52.5","key":315},React.createElement("title",null,"2022-10-12")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"153.5","y":"56.0","key":316},React.createElement("title",null,"2022-10-13")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"153.5","y":"59.5","key":317},React.createElement("title",null,"2022-10-14")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"153.5","y":"63.0","key":318},React.createElement("title",null,"2022-10-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"153.5","y":"66.5","key":319},React.createElement("title",null,"2022-10-16")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"157.0","y":"45.5","key":320},React.createElement("title",null,"2022-10-17")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"157.0","y":"49.0","key":321},React.createElement("title",null,"2022-10-18")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"157.0","y":"52.5","key":322},React.createElement("title",null,"2022-10-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"157.0","y":"56.0","key":323},React.createElement("title",null,"2022-10-20")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"157.0","y":"59.5","key":324},React.createElement("title",null,"2022-10-21")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"157.0","y":"63.0","key":325},React.createElement("title",null,"2022-10-22")),React.createElement("rect",{"fill":"#ff6900","height":"2.6","width":"2.6","x":"157.0","y":"66.5","key":326},React.createElement("title",null,"2022-10-23 15.7 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"160.5","y":"45.5","key":327},React.createElement("title",null,"2022-10-24")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"160.5","y":"49.0","key":328},React.createElement("title",null,"2022-10-25")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"160.5","y":"52.5","key":329},React.createElement("title",null,"2022-10-26")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"160.5","y":"56.0","key":330},React.createElement("title",null,"2022-10-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"160.5","y":"59.5","key":331},React.createElement("title",null,"2022-10-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"160.5","y":"63.0","key":332},React.createElement("title",null,"2022-10-29")),React.createElement("rect",{"fill":"#ff7000","height":"2.6","width":"2.6","x":"160.5","y":"66.5","key":333},React.createElement("title",null,"2022-10-30 15.2 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"164.0","y":"45.5","key":334},React.createElement("title",null,"2022-10-31")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"164.0","y":"49.0","key":335},React.createElement("title",null,"2022-11-01")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"164.0","y":"52.5","key":336},React.createElement("title",null,"2022-11-02")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"164.0","y":"56.0","key":337},React.createElement("title",null,"2022-11-03")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"164.0","y":"59.5","key":338},React.createElement("title",null,"2022-11-04")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"164.0","y":"63.0","key":339},React.createElement("title",null,"2022-11-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"164.0","y":"66.5","key":340},React.createElement("title",null,"2022-11-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"167.5","y":"45.5","key":341},React.createElement("title",null,"2022-11-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"167.5","y":"49.0","key":342},React.createElement("title",null,"2022-11-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"167.5","y":"52.5","key":343},React.createElement("title",null,"2022-11-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"167.5","y":"56.0","key":344},React.createElement("title",null,"2022-11-10")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"167.5","y":"59.5","key":345},React.createElement("title",null,"2022-11-11")),React.createElement("rect",{"fill":"#ff6400","height":"2.6","width":"2.6","x":"167.5","y":"63.0","key":346},React.createElement("title",null,"2022-11-12 16.1 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"167.5","y":"66.5","key":347},React.createElement("title",null,"2022-11-13")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"171.0","y":"45.5","key":348},React.createElement("title",null,"2022-11-14")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"171.0","y":"49.0","key":349},React.createElement("title",null,"2022-11-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"171.0","y":"52.5","key":350},React.createElement("title",null,"2022-11-16")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"171.0","y":"56.0","key":351},React.createElement("title",null,"2022-11-17")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"171.0","y":"59.5","key":352},React.createElement("title",null,"2022-11-18")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"171.0","y":"63.0","key":353},React.createElement("title",null,"2022-11-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"171.0","y":"66.5","key":354},React.createElement("title",null,"2022-11-20")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"174.5","y":"45.5","key":355},React.createElement("title",null,"2022-11-21")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"174.5","y":"49.0","key":356},React.createElement("title",null,"2022-11-22")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"174.5","y":"52.5","key":357},React.createElement("title",null,"2022-11-23")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"174.5","y":"56.0","key":358},React.createElement("title",null,"2022-11-24")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"174.5","y":"59.5","key":359},React.createElement("title",null,"2022-11-25")),React.createElement("rect",{"fill":"red","height":"2.6","width":"2.6","x":"174.5","y":"63.0","key":360},React.createElement("title",null,"2022-11-26 20.4 km")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"174.5","y":"66.5","key":361},React.createElement("title",null,"2022-11-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"178.0","y":"45.5","key":362},React.createElement("title",null,"2022-11-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"178.0","y":"49.0","key":363},React.createElement("title",null,"2022-11-29")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"178.0","y":"52.5","key":364},React.createElement("title",null,"2022-11-30")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"178.0","y":"56.0","key":365},React.createElement("title",null,"2022-12-01")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"178.0","y":"59.5","key":366},React.createElement("title",null,"2022-12-02")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"178.0","y":"63.0","key":367},React.createElement("title",null,"2022-12-03")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"178.0","y":"66.5","key":368},React.createElement("title",null,"2022-12-04")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"181.5","y":"45.5","key":369},React.createElement("title",null,"2022-12-05")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"181.5","y":"49.0","key":370},React.createElement("title",null,"2022-12-06")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"181.5","y":"52.5","key":371},React.createElement("title",null,"2022-12-07")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"181.5","y":"56.0","key":372},React.createElement("title",null,"2022-12-08")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"181.5","y":"59.5","key":373},React.createElement("title",null,"2022-12-09")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"181.5","y":"63.0","key":374},React.createElement("title",null,"2022-12-10")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"181.5","y":"66.5","key":375},React.createElement("title",null,"2022-12-11")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"185.0","y":"45.5","key":376},React.createElement("title",null,"2022-12-12")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"185.0","y":"49.0","key":377},React.createElement("title",null,"2022-12-13")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"185.0","y":"52.5","key":378},React.createElement("title",null,"2022-12-14")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"185.0","y":"56.0","key":379},React.createElement("title",null,"2022-12-15")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"185.0","y":"59.5","key":380},React.createElement("title",null,"2022-12-16")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"185.0","y":"63.0","key":381},React.createElement("title",null,"2022-12-17")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"185.0","y":"66.5","key":382},React.createElement("title",null,"2022-12-18")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"188.5","y":"45.5","key":383},React.createElement("title",null,"2022-12-19")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"188.5","y":"49.0","key":384},React.createElement("title",null,"2022-12-20")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"188.5","y":"52.5","key":385},React.createElement("title",null,"2022-12-21")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"188.5","y":"56.0","key":386},React.createElement("title",null,"2022-12-22")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"188.5","y":"59.5","key":387},React.createElement("title",null,"2022-12-23")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"188.5","y":"63.0","key":388},React.createElement("title",null,"2022-12-24")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"188.5","y":"66.5","key":389},React.createElement("title",null,"2022-12-25")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"192.0","y":"45.5","key":390},React.createElement("title",null,"2022-12-26")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"192.0","y":"49.0","key":391},React.createElement("title",null,"2022-12-27")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"192.0","y":"52.5","key":392},React.createElement("title",null,"2022-12-28")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"192.0","y":"56.0","key":393},React.createElement("title",null,"2022-12-29")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"192.0","y":"59.5","key":394},React.createElement("title",null,"2022-12-30")),React.createElement("rect",{"fill":"#444444","height":"2.6","width":"2.6","x":"192.0","y":"63.0","key":395},React.createElement("title",null,"2022-12-31"))]);
}

Github.defaultProps = {"baseProfile":"full","height":"98mm","version":"1.1","viewBox":"0,0,200,98","width":"200mm","xmlnsEv":"http://www.w3.org/2001/xml-events"};

module.exports = Github;

Github.default = Github;


/***/ }),

/***/ "./assets/grid.svg":
/*!*************************!*\
  !*** ./assets/grid.svg ***!
  \*************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var React = __webpack_require__(/*! react */ "react");

function Grid (props) {
    return React.createElement("svg",props,[React.createElement("defs",{"key":0}),React.createElement("rect",{"fill":"#222222","height":"300","width":"200","x":"0","y":"0","key":1}),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"12px","fontFamily":"Arial","fontWeight":"bold"},"x":"10","y":"20","key":2},"OVER 10KM Hiking"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"4px","fontFamily":"Arial"},"x":"10","y":"280","key":3},"ATHLETE"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"9px","fontFamily":"Arial"},"x":"10","y":"290","key":4},"XUANYUAN.me"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"4px","fontFamily":"Arial"},"x":"120","y":"280","key":5},"STATISTICS"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"120","y":"285","key":6},"Number: 11"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"120","y":"290","key":7},"Weekly: 1.1"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"141","y":"285","key":8},"Total: 178.1 km"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"141","y":"290","key":9},"Avg: 16.2 km"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"167","y":"285","key":10},"Min: 10.8 km"),React.createElement("text",{"fill":"#FFFFFF","style":{"fontSize":"3px","fontFamily":"Arial"},"x":"167","y":"290","key":11},"Max: 23.5 km"),React.createElement("polyline",{"fill":"none","points":"36.14669652856537,67.03599824329285 36.71780515118735,66.84178401427926 36.93952967526275,66.6398006943491 36.93952967526275,66.48442854781024 37.55095184771926,66.53104022482876 38.316909294517245,66.81070969199209 38.66629339303472,66.70194946484116 39.32474804029334,65.45119576629077 40.5408734602388,64.65878224596963 40.72900335947634,64.55778777761589 41.18589025756228,64.68208864286862 41.50167973124189,64.49563726945053 42.77155655095703,64.15380857411219 43.416573348251404,63.38468843824376 43.73236282196012,63.213771804847056 44.23628219484817,63.29923016917746 44.78051511757076,62.89524433516635 45.15677491601673,62.84086146419577 45.70772676370689,63.151620207354426 45.84882418811321,63.112775433342904 46.15117581188679,62.88747535597213 46.54759238520637,62.258185426238924 46.809630459116306,62.2038021034532 46.93729003358749,62.03288283783331 47.15229563269531,62.03288283783331 47.589025755849434,61.24820313796954 47.59574468084611,60.308130746103416 47.83762597985333,59.989591205456236 48.01231802912662,59.461278805698385 48.44232922734227,58.99511778264423 48.22732362820534,58.1715597148941 47.817469204892404,57.44899676568457 48.61702127661556,56.55549552928278 48.65733482642099,56.11262583898497 48.97984322506818,55.33565528823965 49.32250839867629,55.14918118424248 49.69876819709316,54.49651824796456 50.068309070542455,54.24011343118764 50.39081746918964,53.8360798581416 50.18924972007517,53.1600958486888 50.3773796192545,52.662816449701495 51.002239641646156,52.45302573561639 51.04255319148069,52.28208472923143 50.894736842106795,52.09560319653974 51.351623740192736,51.71486865852057 51.580067189235706,51.74594909987354 52.82306830905145,52.96584646743577 53.380739081738284,52.888146577104635 53.87122060469119,52.44525569814141 53.790593505022116,52.02567250481661 53.92497200446087,51.74594909987354 53.716685330320615,50.339546510818764 53.857782754756045,50.13751970969315 53.98544232919812,50.35508701195795 54.227323628234444,51.90135111753625 54.65733482642099,52.297624836457544 54.83202687569428,52.19661408307002 55.02015677493182,51.65270773803786 55.40985442328383,51.07771683351166 56.10190369540942,51.34967252866045 56.8678611422074,52.18884401959076 57.11646136618219,51.668247972862446 57.86898096307414,51.769259422595496 58.26539753639372,51.707098546226916 58.594624860037584,51.27974115635152 59.39417693167343,50.91454295321455 59.41433370660525,50.68920702358446 59.11198208286078,50.230762914856314 59.26651735720225,49.733464509750775 59.159014557662886,49.42265136792412 59.62933930568397,48.75439884454681 59.58902575587854,48.22600900315592 60.032474804029334,47.68984499898215 60.193729003338376,47.39456467024138 60.207166853302624,47.075971460551955 60.422172452381346,46.83508303241251 61.95408734600642,46.710753224848304 62.21612541991635,46.18234929225582 62.35722284435178,46.44655171400518 62.35722284435178,46.79622998922423 62.995520716678584,47.16921839075076 63.37178051509545,47.23138294782257 63.98320268758107,47.03711853947607 64.64837625980726,47.2780063325481 65.51511758114793,46.99049500821275 66.15341545350384,46.40769847379852 66.36842105264077,46.99049500821275 66.65733482642099,47.15367724360112 67.0,47.736468104798405 66.63717805151828,48.17938619517372 66.99328107503243,48.75439884454681 66.67077267635614,49.32163682542159 66.27435610303655,49.60136907848937 66.07950727883144,50.02873582694883 65.28667413210496,50.75136872551957 64.90369540874963,51.34190237934672 64.50727883537184,51.65270773803786 63.98320268758107,51.543926005862886 63.58678611420328,51.69932843314018 62.908174692012835,51.27974115635152 62.67301231800229,51.3263620783182 62.16237402014667,51.71486865852057 61.92049272113945,52.77936659831903 61.24188129900722,53.49420363291574 61.09406494957511,53.8360798581416 59.46136618137825,53.52528335277748 58.231802911526756,54.286732552573085 57.79507278834353,54.745152402734675 57.230683090689126,54.900548339952365 56.995520716678584,55.25018804688443 56.995520716678584,55.69306271966343 56.73348264276865,56.55549552928278 56.20940649494878,57.39461003155884 55.718924971995875,57.61992625035782 55.60470324748894,57.78308585748164 54.69092945128796,57.759777363433386 54.368421052611666,57.9462451173531 54.18701007839991,57.798624849565385 53.85106382978847,57.837472316023195 53.66293393058004,57.705390849783726 53.172452407627134,57.9462451173531 53.226203807396814,58.33471814802033 52.82978723401902,58.33471814802033 52.554311310173944,58.60664809826994 52.50727883540094,59.00288715626084 52.634938409843016,59.20489059376996 52.171332586789504,59.58558793315024 52.19148936169222,59.73320476023946 51.553191489336314,60.952975033236726 51.30459126539063,63.41576414882002 50.96864501677919,64.87630834142328 51.10302351624705,65.33466487976693 50.861142217268934,65.81632473069476 49.67861142216134,66.53104022482876 49.23516237401054,66.98938687317423 48.637178051518276,66.94277547475212 48.24748040313716,67.04376680223504 48.16685330346809,66.92723833562923 48.173572228464764,67.06707247429586 48.032474804029334,67.1369894479867 47.79731243001879,67.11368379719352 47.68980963045033,67.24574905820191 47.45464725641068,67.23021198047354 46.76931690928177,67.54095293699356 46.3930571108649,67.99929354971391 45.84210526314564,68.11582038741471 45.02239641654887,68.76836740678118 44.363941769319354,68.75283063748793 44.21612541991635,69.06356542495632 44.263157894747565,69.60734827374836 43.98768197087338,69.78601893974701 43.77267637179466,70.22880966592493 40.16461366182193,71.30858686001011 37.389697648381116,71.61931129362347 34.35274356105947,71.79020919562754 33.48600223966059,71.95333865594876 32.48488241882296,72.73014085061004 31.50391937288805,73.67782887550129 31.497200447920477,73.81765070774418 31.63157894735923,73.52247098521912 32.3034714445821,72.91657220677735 32.35050391938421,72.70683689921134 31.12094064950361,71.572702708836 29.340425531903747,70.67936602661939 28.89025755878538,70.13559077811806 28.110862262023147,69.48305539109424 29.23292273239349,69.3121523485097 29.50839865623857,67.70409143514553 29.340425531903747,67.23021198047354 29.12541993279592,67.14475799670618 25.17469204927329,67.5797954680238 24.227323628234444,67.44773078222352 23.300111982098315,66.5698832673661 23.085106382961385,65.7386378625888 22.802911534177838,65.22590255925752 21.828667413210496,64.09942659571243 21.640537514002062,63.95181817426055 21.15005599107826,63.96735591621837 19.92721164613613,63.07393063962081 17.924972004489973,61.232664845003455 16.829787234048126,59.880821303100674 15.52631578949513,58.72318921027181 15.573348264297238,58.59887868449732 15.069428891409189,58.41241251795145 14.47816349385539,57.985092509014066 14.451287793955998,57.7442383634625 13.0,56.92843644198729 13.013437849964248,56.811892601661384 13.302351623744471,56.951745188802306 14.538633818592643,57.73646886230563 14.961926091840724,57.52669203324331 15.109742441214621,57.231449597660685 16.23852183649433,56.392333309479 16.393057110894006,55.71637184207793 17.044792833155952,55.351194776420016 17.004479283321416,55.21133926929906 16.84322508398327,55.219109026380465","stroke":"#ff3f00","strokeLinecap":"round","strokeLinejoin":"round","strokeWidth":"0.5","key":12},React.createElement("title",null,"2022-11-26 20.4km")),React.createElement("polyline",{"fill":"none","points":"81.5247844827245,71.71448563541344 83.02801724139135,71.66963221906917 83.57112068962306,71.29959084071015 83.62931034481153,71.03046906131931 84.52155172411585,71.12017639382975 85.57866379304323,71.51264511871705 86.00538793101441,71.37808456977655 87.11099137924612,69.43815181194077 88.75,68.38407004657347 89.1379310344928,68.20465087403863 89.7683189655072,68.3616426659064 92.0377155172173,67.61032278776838 92.5808189655072,66.81414242582832 93.39547413791297,66.30951810442639 94.11314655171009,66.38801537218387 95.32543103443459,65.71517984193633 96.22737068962306,66.15252340186271 96.78987068962306,65.8497472752133 97.37176724133315,64.94141392561141 98.00215517234756,64.53770782179345 98.35129310347838,64.52649374233442 98.77801724133315,63.820004445748054 98.99137931037694,62.978939879067184 98.9622844827245,61.91358225218573 99.27262931031873,61.5883657755403 99.6314655172173,60.72485532060091 100.16487068962306,60.18655967964878 99.92241379310144,59.07631665070949 99.25323275860865,57.92120349437755 100.40732758620288,56.60907003854663 100.90193965518847,54.92682489788422 101.51293103443459,54.48943697196955 101.97844827582594,53.637086302602256 102.8997844827827,52.75108325203473 102.66702586208703,51.68562714962172 102.95797413791297,50.96784041195497 103.87931034481153,50.72110014533246 103.88900862069568,50.429497302633536 103.5689655172173,50.10424707134371 103.72413793101441,50.14910922905983 104.3254310344928,49.6219777269871 104.9752155172173,50.28369559303974 105.50862068968127,50.46314382372657 106.51724137930432,51.41645766873262 107.32219827582594,51.28187268269539 107.9622844827245,50.72110014533246 107.85560344828991,50.205186900617264 108.10775862069568,49.70048683328787 107.77801724139135,47.60315300027287 107.95258620689856,47.367621049023 108.14655172411585,47.591937204415444 108.51508620689856,49.89115157375636 109.21336206898559,50.508005835879885 110.0377155172173,49.15092191925942 110.12499999994179,48.72472684107197 111.20150862069568,49.08362806869263 112.2877155172173,50.261264543754805 112.4622844827245,50.21640243154252 112.66594827588415,49.554684162947524 114.24676724139135,49.6556244936437 114.95474137930432,48.89296193649352 116.01185344828991,48.45555015629361 115.98275862069568,48.01813664661313 115.58512931031873,47.46856337525969 115.8372844827245,46.739533394094906 115.67241379310144,46.15630594996037 116.27370689657982,45.38240324814251 116.29310344828991,44.5636307273453 116.92349137930432,43.778500700391305 117.17564655171009,42.82512103280169 117.6120689655072,42.48863212941069 119.63900862069568,42.42133422590996 120.06573275860865,41.65862179110263 120.28879310342018,42.01754594498925 120.34698275860865,42.56714629844646 121.20043103443459,43.02701388351852 121.80172413791297,43.13917641912121 122.59698275866685,42.84755358999246 123.42133620689856,43.19525764427817 124.06142241379712,43.13917641912121 125.2252155172755,42.477415815017594 125.71012931031873,41.93903138586029 125.93318965518847,42.17457489604567 126.0689655172173,42.7914721885536 126.41810344828991,42.97093257305096 127.0,43.91309481506323 126.29202586208703,44.58606293194316 126.6120689655072,44.86646510562423 126.51508620689856,45.225378850795096 126.85452586208703,45.50577940396033 126.57327586208703,46.11144217306719 125.9622844827827,46.58251092315186 125.62284482753603,47.3227577633661 124.58512931037694,48.17515707984421 124.34267241379712,48.67986410577578 123.52801724139135,49.521037365593656 123.31465517240576,49.599546543518954 122.68426724139135,49.39766568772757 122.09267241379712,49.64440890590777 121.2683189655072,49.19578446352534 120.62823275860865,49.476174953182635 120.28879310342018,49.38645007383457 119.93965517240576,49.857504878760665 119.83297413797118,50.94540950136434 119.19288793101441,51.7977809067379 117.39870689657982,52.51556226008688 115.96336206898559,52.28004076682555 115.44935344828991,52.73986797804537 114.19827586208703,53.40156719666993 113.64547413791297,54.0296170317597 112.86961206892738,54.22027431204333 112.53017241379712,54.69130853725801 112.40409482759424,55.64458595272299 112.92780172417406,56.227763381531986 112.43318965518847,56.59785515561089 112.2877155172173,56.93430114887451 112.38469827582594,57.34924979831703 111.85129310342018,57.909988744453585 110.65840517240576,58.381007263291394 109.15517241379712,58.3249337352172 108.70905172411585,58.58287172904966 108.3308189655072,58.3585778554625 107.99137931031873,58.437080762931146 107.63254310342018,58.268860178744944 106.95366379310144,58.61651577088924 107.04094827588415,59.18846291693626 106.40086206892738,59.132389798040094 106.06142241379712,59.56975937207608 106.07112068962306,60.130487066511705 106.25538793101441,60.46692231936322 106.09051724139135,60.65756850867183 105.66379310342018,60.7584987112059 105.58620689652162,61.19586185854132 105.09159482759424,61.86872486393986 105.11099137930432,62.1266545980252 104.63577586208703,63.00136835047306 104.63577586208703,63.4387226341496 105.07219827582594,63.56207865814213 105.20797413791297,64.13400024542352 105.58620689652162,64.70591887733462 105.50862068968127,64.91898584734008 105.04310344828991,65.12083838796389 104.90732758614467,65.69275192051282 104.1993534482317,66.9374946878088 103.80172413791297,68.68683924074139 103.99568965513026,69.0793165932264 103.88900862069568,69.75213167412585 103.64655172411585,70.01004303748778 102.84159482759424,70.31280778426299 101.32866379310144,71.63599214488204 100.52370689652162,71.54628523038264 98.61314655171009,72.07331231194985 97.77909482753603,72.45456438133988 97.22629310342018,73.14978536296258 96.6443965517683,73.17221177354804 95.91702586208703,73.54224689226976 95.19935344828991,74.2374610432671 94.41379310342018,74.18139554778463 94.02586206892738,74.91024477448809 93.62823275860865,74.9887359434797 93.7058189655072,76.03154190759233 93.40517241379712,76.40156746927823 90.36961206892738,77.19767887899798 90.26293103443459,76.2445870790034 90.03987068962306,75.86334806158993 88.72090517240576,76.40156746927823 87.00431034481153,77.9713591302716 83.40625,78.34137820889009 83.06681034481153,75.80728338951303 83.47413793101441,74.7308361792675 83.73599137930432,73.03765324186679 83.79418103443459,72.20787201577332 83.5808189655072,71.96117910048633 81.2435344827245,71.70327228301903 81.27262931031873,71.60235206045763 80.93318965518847,71.5014317458772 76.78232758620288,71.28837744631892 73.0,71.59113869673456","stroke":"#4dd2ff","strokeLinecap":"round","strokeLinejoin":"round","strokeWidth":"0.5","key":13},React.createElement("title",null,"2022-11-12 16.1km")),React.createElement("polyline",{"fill":"none","points":"133.76896918180864,73.92289108662226 135.23804463341366,73.61767801815586 135.6856535600964,73.06033058006142 136.156216790725,72.95416889444459 137.94665249739774,73.67075860289333 138.5778958555311,73.4849764622777 139.81742826785194,71.16267747362144 142.13581296498887,69.72946669653174 142.8703506908496,69.92852468662022 143.4327311371453,69.59676120172662 145.5904357067193,69.02612604216847 146.3823591923574,68.01755549441441 147.32348565361463,67.42037190440169 148.1039319873089,67.59289188786352 149.04505844850792,66.88953976088669 149.69925611058716,66.78337307400943 150.75515409139916,67.28766407020157 151.38639744959073,66.87626892971457 151.7880977683817,66.09328751190333 152.7177470776369,65.403198313943 153.08501594053814,65.37665634909354 153.72773645061534,64.43441311259812 153.95727948989952,63.492163097529556 153.89989373018034,62.32429451601638 154.2442082890775,61.92615511929034 154.5655685441452,61.03697276330786 155.3230605738936,60.2008704138716 155.0017003188841,58.94007106318895 154.27863974496722,57.559813645653776 155.6444208289613,55.99373472749721 155.7018065887969,55.2372322701558 156.26418703515083,53.949840848275926 156.9298618491157,53.498587251015124 157.67587672692025,52.290812618870405 158.58257173217135,51.46792681836814 158.28416578116594,50.1804983363545 158.66291179601103,49.33105405578681 159.6155154091539,49.07887422411295 159.67290116898948,48.24269551735779 160.45334750268376,47.67196730188152 162.8061636557104,49.88850248651579 163.7358129649656,49.74250431738619 164.5277364506619,49.05232895043446 164.4129649309325,48.3886953589099 164.6769394261646,47.76487671579525 164.3211477152072,45.34921052541176 164.5277364506619,45.043930856511 164.71137088205433,45.17666123480012 165.19341126462677,48.00378633454966 165.98533475026488,48.76033058458415 166.35260361322435,48.33560452630627 166.50180658872705,47.67196730188152 166.96089266735362,47.15432793166838 167.06418703508098,46.623413631052244 168.39553666312713,47.06141808448592 169.70393198734382,48.52142234632629 170.1400637619663,47.605603394447826 172.05674814031227,47.738331175700296 172.68799149844563,46.928689616994234 174.04229543043766,46.251772339615854 173.9045696068206,45.73412735421152 173.5602550478652,45.34921052541176 173.7897980871494,44.24754576072155 173.58320935175288,43.76971237784892 174.35217853356153,42.7742205618415 174.34070138155948,41.73890104274324 175.31625929864822,40.39828283293173 175.3736450584256,39.70805820256646 175.94750265672337,39.27002914559853 178.1740701381932,39.21693461484392 178.89713071205188,38.30105056949833 179.06928799155867,39.30985002951638 180.1366631243145,39.90716183480981 180.8023379383376,40.0133503148827 181.6516471838113,39.6151430705504 182.90265674813418,40.119538708764594 184.08480340067763,39.827520418242784 185.5653560042265,38.63289335524314 185.95557917107362,39.70805820256646 186.38023379386868,39.893888268765295 186.98852284805616,40.91594891740533 187.0,41.4203395434015 186.7360255048261,42.00436836670269 186.86227417638293,42.45566158190195 185.79489904362708,43.676800128640025 185.93262486718595,43.995356137122144 185.34729011694435,44.95101951164543 184.55536663124803,45.627943514453364 183.86673751327908,45.7872192417708 183.0862911795848,46.57032208262535 183.0862911795848,47.340147428258206 182.91413390013622,47.552512244248646 182.47800212539732,47.61887617860339 181.89266737515572,47.40651147023891 181.14665249735117,47.685240079357754 179.7808714133571,46.9817810201057 178.86269925616216,47.63214896147838 178.4954303932027,49.145237384786014 177.7379383634543,50.23358842088783 176.53283740702318,50.817577930225525 175.87863974500215,50.897212661540834 175.74091392138507,51.13611656478315 174.01934112649178,50.8706677564478 171.93049946863903,52.118272476276616 171.1615302869468,52.91460969901527 170.24335812969366,53.180054363721865 169.86461211479036,53.81711936346255 169.8760892667924,54.520541700170725 168.9120085016475,56.86967948138772 169.50882040383294,57.50672653137008 169.3825717322179,57.347465059385286 167.5921360255452,58.0774118819827 165.9279489904875,57.99778151724604 165.33113708824385,58.316302685736446 165.06716259301174,58.03759670567524 164.53921360260574,58.117227046212065 164.21785334753804,57.89160762226675 163.31115834222874,58.32957438426092 163.43740701384377,59.01970085494395 162.6569606801495,58.966614332501194 162.25526036135852,59.470935427132645 162.2208289054106,60.14778437020141 162.40446333691943,60.62555798862013 161.71583421895048,60.983887058566324 160.94686503720004,62.44373609898321 160.53368756646523,63.66468825514312 160.1778958555078,67.48672577107209 159.89096705638804,67.68578716943739 160.12051009573042,67.67251641895564 160.13198724761605,67.91138972183398 159.6155154091539,70.23374635059736 159.83358129649423,70.84418754497892 159.47778958559502,71.73330332599289 158.46780021255836,72.21103468608635 156.70031880983151,73.6972988872003 155.27715196606005,73.76364957439364 152.694792773691,74.58639530393702 151.89139213605085,75.46221572534705 150.938788522908,75.64799506196869 149.35494155157357,76.8953637854429 148.40233793843072,76.81574486008321 148.12688629119657,77.57212269764568 147.49564293312142,77.79770822486898 147.73666312440764,78.87255157901382 147.24314558983315,79.41660473032971 141.056960680231,81.23452204480418 137.88926673756214,81.5397173694364 135.4790648247581,81.69894943050167 135.31838469719514,81.48663997271797 135.14622741768835,80.66393757449987 135.13475026574451,78.77966422983445 135.6856535600964,76.84228450722003 135.88076514349086,74.37407432003238 134.82486716267886,74.00251177011523 133.0,73.92289108662226","stroke":"#4dd2ff","strokeLinecap":"round","strokeLinejoin":"round","strokeWidth":"0.5","key":14},React.createElement("title",null,"2022-10-30 15.2km")),React.createElement("polyline",{"fill":"none","points":"13.364787840400822,133.67736886367493 13.433185560512356,134.0727839624742 13.661177960748319,134.16504731266468 15.485117162810639,133.92779856579727 15.952501583320554,133.63782728771912 15.986700443376321,133.2687719991809 17.092463584558573,133.37421647412702 17.3546548448503,133.6246467597084 18.19822672579903,133.84871555403515 18.8138062065118,133.7037299076037 20.079164027934894,131.4630221034895 22.062697910121642,130.15812154386367 22.45028499054024,129.98676999320742 23.225459151435643,130.1844833008654 23.670044331869576,129.88132277295517 25.892970234330278,129.3013615338714 26.417352754913736,128.4445958819124 26.975934135494754,127.98325819388265 27.523115896154195,127.70645479581435 28.309689677029382,127.89099045994226 29.290056998084765,127.15284623285697 29.917036098835524,127.06057791000057 30.81760607979959,127.54828116108547 31.205193160218187,127.48237542314746 31.592780240636785,127.16602741647512 32.33375554153463,126.01925944384129 33.34832172258757,125.68972654752724 34.06649778340943,124.33204221034248 34.134895503520966,122.61843980898266 34.47688410390401,122.22298989530827 34.78467384423129,121.3398140809004 35.4458518049214,120.68072374504118 35.18366054468788,119.23071325093042 34.45408486382803,117.91250786579621 35.83343888534,116.3438260491821 35.89043698547175,115.68471039748692 36.44901836611098,114.31373914262804 37.07599746674532,113.91826397961995 37.81697276752675,112.71864862889925 38.83153894869611,111.78267731903179 38.48955034831306,110.66213942661125 38.82013932871632,109.83161687635584 39.74350854975637,109.52840890934749 39.92590246995678,109.08018714145874 39.77770740975393,108.76379437514697 40.735275490849745,108.0650909558899 43.003799873346,110.29301894798118 43.92716909432784,110.09527540343697 44.234958834713325,109.64705558933201 44.69094363518525,109.42294510298234 44.57694743509637,108.73742827653768 44.850538315367885,108.15737275472202 44.47435085498728,105.7712080530764 44.73654211527901,105.44162385155505 45.16972767573316,108.03872471560317 45.5117162761162,108.72424522525398 46.1956934768823,109.10655317058263 47.198860037955455,107.0763532872079 48.37302089930745,107.40593334539153 50.003166561131366,109.29111522468156 50.04876504116692,109.80525099422084 49.592780240636785,110.45121356709569 50.15136162127601,109.63387263020559 49.911969601002056,108.8824417527212 50.219759341387544,108.02554159349529 51.906903103226796,108.18373897092533 52.36288790375693,107.8805271617457 52.71627612411976,107.31365101328993 54.06143128563417,106.70722263029893 54.08423052565195,106.32490763101669 53.61684610508382,105.59982437254803 53.9360354655073,104.5978844890924 53.68524382519536,104.11009517265484 54.52881570614409,102.96312389425293 54.48321722605033,102.14573588935309 55.23559214692796,101.36789414538362 55.64597846736433,99.99677194381366 56.28435718809487,99.69354104291415 58.45028499048203,99.61443721332762 58.92906903102994,98.74429191136733 58.84927169093862,98.01916637776594 58.997466751141474,99.50896536566142 59.24825839139521,99.83856460549578 60.44521849270677,100.41865723820229 61.85877137433272,100.1286112453381 62.59974667511415,100.48457669178606 63.386320455989335,100.44502502365503 63.37492083595134,100.65596711469698 62.70234325522324,101.15695320934174 63.557314756151754,100.39228944736533 64.82267257757485,99.69354104291415 65.48385053832317,99.03434099243896 65.91703609877732,100.04950768046547 66.32742241921369,100.30000213749008 67.0,101.4601806972787 66.70360987971071,102.27757301190286 66.48701709939633,102.22483817892498 66.8974034198909,102.69945090572583 66.40721975936322,103.56956973871274 64.5718809372629,105.33615673065651 62.770740975334775,106.72040588609525 61.59658011398278,107.1422693656641 60.04623179225018,107.24773502170865 59.03166561113903,107.82779460100573 58.72387587081175,108.26283758752106 58.153894870134536,110.24028736549371 57.54971500945976,110.7939679150586 56.238758708001114,111.25536657232442 53.69664344523335,111.0971729314042 51.35972134262556,113.12731004602392 50.162761241255794,113.39096189169504 49.66117796074832,114.16873172250052 49.70677644084208,115.42106320156017 49.50158328056568,116.17245630103571 49.09119696012931,117.12157822214067 48.441418619360775,117.82023298849526 47.290056998084765,118.08387532130291 44.30335655476665,117.9256899857719 42.946801773272455,118.55843017373991 42.103229892323725,119.69208197965054 41.78404053201666,121.61663102611783 40.689677010755986,123.76523776055546 40.290690310357604,127.83826601118199 39.46991766942665,131.0016951183352 38.432552248297725,131.97707024584815 36.96200126665644,132.72836772380106 33.507916402770206,134.0596034785267 28.708676377485972,136.6034121412813 28.184293856902514,137.07789944576507 27.8081063964637,137.8159873694094 27.876504116575234,139.0944511884445 27.580113996227738,139.568929410103 21.663711209606845,141.37456682401535 14.880937302077655,141.98083362223406 15.7131095630466,141.7040599994798 15.40531982271932,138.9890113487345 15.88410386320902,137.51284462171316 16.169094363518525,134.67908478016034 15.758708043023944,134.33639336079068 13.0,134.0859644450975","stroke":"#4dd2ff","strokeLinecap":"round","strokeLinejoin":"round","strokeWidth":"0.5","key":15},React.createElement("title",null,"2022-10-23 15.7km")),React.createElement("polyline",{"fill":"none","points":"96.22678239428205,93.0 96.32803685255931,93.33103880607814 96.22082624968607,93.53104063360661 95.78602769371355,93.90345625514601 95.76815925989649,94.03449089400965 95.97066817636369,94.06207710142917 95.89323829652858,94.08276674964145 96.03618576700683,94.15862873893639 96.02427347781486,94.25518023873883 96.28038769570412,94.41380026091065 96.54245805821847,94.42069677518157 96.22082624968607,94.84827928791492 96.26847540651215,95.15861974289146 95.57756263262127,95.6551615118151 95.35718528233701,96.00687639470561 94.4339828689117,96.93787755928497 93.64181563680177,97.48267971043242 92.98663973051589,97.73094252782175 92.54588502994739,98.73777684431843 92.15277948614676,99.05499551365938 91.84901611146051,99.62046858626127 91.40230526626692,100.13766543250676 91.18192791595357,101.01344308412081 90.72926092616399,101.227213861981 90.49697128665866,101.66164916997514 90.30041851478745,102.1236646140751 90.27659393637441,102.53051142500772 90.12173417667509,102.97183401558141 90.16938333353028,103.15801612092764 89.77032164516277,103.79241056240426 89.96687441700487,104.54402237271279 90.28255008094129,105.06118161823542 90.30041851478745,105.69555823312112 90.34806767161353,105.5645461581953 90.16938333353028,105.75761649597553 89.84179538040189,105.80588399442058 89.46655827041832,106.12306955709937 89.09132116046385,106.9367126865618 88.81733850872843,107.13667433238152 88.38253995278501,107.75034604241955 87.79883778170915,107.86066845689493 87.5367674191657,107.76413635406789 87.42360067175468,107.57796691012481 87.58441657604999,106.88155074933456 87.47720597317675,106.28855708709307 87.22109175525839,105.68176750034036 87.36999537030351,105.71624432706449 87.34021464732359,105.96447696142423 87.54272356379079,106.4126724692469 87.60824115440482,106.90223648107349 87.27469705668045,107.75034604241955 86.50635440295446,108.15715905543766 86.2859770526702,108.41917292281141 85.89287150889868,108.55017947644956 85.60697656797129,108.81219182362838 84.81480933586136,109.18452341575903 84.21919487559353,108.99146284567541 83.40915920963744,108.90872243290505 83.11135197951808,109.21899845966254 82.96244836447295,109.83954624969192 82.53360595306731,110.32219060086209 82.61103583293152,110.41182417318487 82.44426378401113,110.81862120328151 81.9320353482035,111.26678459491814 81.26494715272565,111.25988979596877 80.95522763338522,112.60436231986387 80.53829751122976,112.94909456683672 80.02606907542213,113.05251389890327 80.09754281063215,113.05251389890327 80.06180594302714,113.2248791015154 79.76995485750376,113.69371023415442 79.69848112226464,114.16943262627319 79.09095437280484,114.74167397687415 78.94205075775972,115.21049461428629 78.2213572608307,115.899930835556 77.83420786168426,116.01023997997981 77.42919002872077,116.30669491583103 77.14925123238936,116.75482200796978 76.58341749513056,117.12710995390808 76.60128592894762,117.96130329564767 76.37495243406738,118.20949106814078 76.26774183119414,119.2780669292697 76.01162761330488,119.5951894265745 75.86272399823065,120.09155209549499 75.94611002266174,120.59480497901677 76.36304014487541,120.8085139772229 76.35112785562524,121.04290371657407 76.54172448292957,121.34623041127634 76.4881191814784,121.89083629733068 76.29156640963629,122.60088550089131 75.83889941981761,123.02139657070074 75.66617122635944,123.40743722320622 75.35049556239392,123.69007273542229 74.78466182519333,124.53797220113483 74.93952158483444,124.51729185257864 75.320714839414,124.74477534001198 75.6006536357163,124.64137384943751 76.55363677212154,124.91021739684948 77.02417219572817,124.84817667285097 77.7389095480321,125.66848832432879 78.42982232192298,125.74431495056342 78.69189268440823,126.53704278291843 78.5846820815932,126.8058788124763 79.20412112027407,127.0816069661305 79.60913895323756,127.14364564611606 80.2762271487154,127.7640293239092 80.06180594302714,128.21208067172847 80.07967437681509,129.0047796488434 81.0862628146424,129.38389327470213 81.30664016492665,129.65271801577182 81.80100016694632,129.79746935794537 82.17028113233391,130.1627927997106 82.55147438688437,130.21793578976212 83.03392209968297,131.24496578335675 83.21856258236221,132.1203414842821 83.45085222186754,132.50633032922633 83.75461559658288,132.5821493084295 83.72483487357385,132.89920957576396 83.23047487155418,133.27140886754205 83.05774667809601,133.6918537583697 83.05179053350003,134.84978686730756 83.20665029317024,135.16683653255313 83.27216788378428,135.64240825126763 83.39129077582038,135.80782371952228 83.71292258438189,135.91810047422769 84.18345800798852,136.47637379324442 84.66590572075802,137.1380251095252 84.71951102218009,137.40681911300635 84.5110459611169,137.7031804974613 84.42765993668581,138.13048998145678 83.91543150087819,138.247655014864 83.826089331822,138.3441437139336 83.98094909149222,138.6818530797318 83.92734379007015,138.94374898132082 83.67122957215179,139.29523925995454 83.3019486067933,139.52956510047807 83.52828210170264,139.77767393163958 83.52232595710666,140.30145626165904 83.09348354570102,140.5426704481797 82.89097462923382,140.81834275391884 82.78972017098567,141.28698310255277 83.03392209968297,141.535085505835 82.95649221984786,142.08642093103845 83.7069664397568,142.81693346764223 83.60571198153775,142.99611458656727 83.74270330739091,143.46473989090737 84.04646668210626,144.10564866913046 84.3919230690808,144.47778647163068 84.37405463526375,145.12557703639322 84.52295825030887,145.2427299887422 84.64208114237408,145.15314245515037 84.45744065969484,145.03598934809997 84.594431985548,145.18759921283345 84.57060740713496,145.5390571417156 84.67186186538311,145.76647012554167 84.77311632360215,145.74579624943 84.89819536029245,145.48392660658283 85.62484500178834,145.47014396583108 86.20259102823911,145.6010789401771 86.8101177776698,146.02833867789013 87.14961802004836,146.09725128683203 87.72140790190315,145.8974045280629 88.34084694052581,145.97320854035206 89.00793513600365,146.2212938065495 89.07345272664679,146.41424838649255 89.70480405451963,146.95176182290015 89.97283056162996,147.0 90.37784839459346,146.86217654586653 90.038348152244,146.57274638093804 90.33615538239246,146.33844486695307 90.41954140682356,146.06279499111406 90.63991875710781,145.83538300047076 91.60481418273412,145.61486155435705 92.14682334155077,144.98085840419662 92.7424378018186,144.93261879154306 92.60544647596544,144.94640154150693 92.74839394641458,144.87059638202481 92.73052551262663,144.55359207003494 93.09980647798511,144.25726061283785 93.4631312986894,143.57500419796997 93.46908744331449,142.98233144035476 93.91579828853719,141.92102077395975 94.48758817036287,141.37657574175682 94.97599202775746,141.12847275875538 95.1606325104367,141.08023040668922 95.36909757152898,141.21806560728146 95.45843974055606,140.96307026593422 95.66094865705236,140.88036886830378 95.90515058574965,141.09401393932785 95.86345757354866,140.91482779623766 96.1255279360339,140.74942478251614 96.30421227411716,140.84590992287121 96.53650191362249,140.74253298151598 96.66158095028368,140.5702377291891 96.59606335966964,140.3910502025028 96.72709854089771,140.2394296179118 96.59010721504455,139.9706468395816 96.69731781788869,139.92929554838338 96.75687926393584,140.10848429482576 96.8521775775589,140.0740249572773 96.98321275881608,139.40551034454256 96.68540552869672,138.17184236930188 96.73901083008968,137.59290664522268 97.06064263865119,137.3447898221275 97.26910769974347,136.78652365147718 97.59669565287186,136.33852895654854 98.25782770375372,135.7802545028244 98.59137180147809,135.73200834666932 99.09168794812285,135.01520426887146 99.53839879328734,134.85667926710448 99.91363590324181,134.5396281518406 99.96724120466388,134.22946801780927 100.87853132889722,133.59535844014317 101.11677711296943,133.2576237450121 101.59922482576803,133.1680203802971 101.76004073006334,133.04395398753695 102.05189181555761,133.07841689719498 102.35565519030206,133.95376892999047 102.63559398660436,134.04337125648453 102.85001519232173,134.45691892146715 102.80236603549565,134.59476758271194 103.02869953037589,134.7739704234191 102.96913808435784,134.97384995631728 103.53497182161664,135.2219754534599 103.90425278697512,135.54591570844786 105.0776132736355,135.74579296620504 105.27416604556493,135.54591570844786 105.39924508219701,135.55280803749338 105.58388556487625,135.8905313023497 105.48263110665721,135.8767467122234 105.58388556487625,135.9249927654455 105.51836797423312,135.67686984042666 105.66727158930735,134.56030544365785 106.04250869929092,133.01638364722749 106.79298291917075,132.91988736778876 107.45411497005261,132.4856524110728 107.76383448939305,132.45808184375346 108.03781714112847,132.75446485503198 108.38327352807391,132.47875977030344 108.96697569909156,132.42361861883546 109.36603738748818,132.65107557961164 109.44942341191927,133.1680203802971 109.66384461760754,133.34722699133272 109.9199588355259,133.36790464673686 109.86039738947875,133.2576237450121 110.02121329374495,133.1542352367469 110.3249766684894,133.50575552169175 111.45664414294879,133.47818536913837 111.99269715719856,133.2093757941111 112.54661860523629,133.13355751618656 112.80868896775064,132.96813552466483 113.20775065611815,132.2168389014987 113.17796993308002,131.76881401736318 113.27326824676129,131.82395570131484 114.0356547558913,131.203609171469 114.34537427517353,131.27942960733344 114.85760271101026,130.81072010038042 115.23283982096473,130.65907809563214 115.92375259488472,130.514328592908 116.06074392073788,130.68664939445443 115.93566488404758,130.2248286603717 116.4121564522793,129.99047066677304 116.47171789829736,129.86639845989703 116.59084079033346,130.04561379697407 116.65040223638061,129.92154169100104 116.76952512841672,129.94911328971648 116.76356898382073,130.48675722398912 117.0613762139401,130.8520769519164 117.19241139519727,131.27942960733344 117.46043790233671,130.4385073014637 117.88332416908816,130.06629245924705 118.15135067619849,129.48728753202158 118.37172802648274,129.25292698907288 118.42533332793391,128.85313360494183 118.80652658251347,128.5567335397427 119.06859694499872,128.06732594469213 119.10433381260373,127.72267058869329 118.99116706519271,127.40558611367305 119.06859694499872,127.20568426937825 119.37831646433915,126.77141271442088 119.72972899588058,126.66801431510248 120.05731694903807,126.22684603944799 120.27173815469723,125.57198158640676 120.23004514249624,125.03429867448722 119.91436947853072,124.73098848371592 119.7237728513137,124.1243640306493 119.98584321379894,123.59356318083883 119.89650104477187,122.4216504814467 120.1645275518822,122.29067074441264 120.13474682887318,122.34582013823092 120.27173815469723,122.37339481830713 120.35512417915743,122.26309603067784 120.08709767201799,121.53925578293274 120.53976466183667,121.44274316582596 120.84352803655202,121.26350508371252 121.37958105077269,121.2359299520831 121.63569526869105,121.31865531332005 122.43977479002206,121.05669132305775 122.344476476399,120.78093866048584 122.4635993684351,120.07776429268415 123.35702105885139,119.08503511743038 123.41658250484033,118.66449962363549 123.58931069832761,118.50593638290593 123.24385431135306,117.91993857851776 123.41658250484033,117.67174974556838 123.47614395088749,117.16847515499103 123.66674057816272,116.78239896299056 123.12473141934606,116.38253201669431 123.1068629854999,116.1894919566912 123.37488949263934,116.01713429555093 123.63695985515369,116.08607741261221 123.81564419320785,115.87235352139396 123.64291599974968,115.11397298352676 123.73225816877675,114.6520461327309 124.33382877364056,114.54862924217014 124.44699552108068,114.47968456075614 124.48273238868569,114.13496010141534 125.12003986118361,113.9694917379311 125.04856612594449,114.07980402514659 125.09621528277057,114.2245886295641 125.16173287341371,114.05222597019747 125.21533817480667,114.27974458795507 125.13195215037558,114.4865790320473 124.46486395489774,114.50036797253415 124.46486395489774,114.12806559433375 125.10812757196254,113.99706982658245","stroke":"#ff0000","strokeLinecap":"round","strokeLinejoin":"round","strokeWidth":"0.5","key":16},React.createElement("title",null,"2022-09-28 23.5km")),React.createElement("polyline",{"fill":"none","points":"155.1038757555798,93.61064010008704 155.0495821006043,93.60615013022107 155.0340696277708,93.42206097179223 154.96814161812654,93.35022109169586 154.60747662428184,93.44002092351366 154.58420791500248,93.31879110735099 154.65013592461764,93.2918511029311 154.63462345178414,93.33675110114928 154.5803297967941,93.21552100103872 154.35539894041722,93.09429056759473 154.22742103936616,93.13470074911311 154.04127136513125,93.04490029543376 153.9792214737099,93.08980054512722 154.01024641943513,93.0 153.94431840979087,93.09429056759473 153.84736545446503,93.04939032245966 153.96758711907023,93.09878058960021 153.76980309019564,93.08531052222679 153.54487223381875,93.16164084955017 153.4517973967013,93.23797104473124 153.47118798775773,93.3457310952981 153.13379170317785,93.5702303547805 153.16481664890307,93.50288069696035 153.09888863927335,93.52982057243571 152.90498272860714,93.40859100318266 152.48614596156403,93.64206987638681 152.34653370588785,93.35471108763886 151.76869409208302,93.28736110060345 151.54764135392907,93.50288069696035 151.50886017180164,93.62411000696738 151.80359715601662,94.09106423456979 152.03240613058733,93.77676866393085 152.00525930311414,93.63308994259933 152.0905779038003,93.63308994259933 152.08669978557737,93.700439401513 152.1991652137658,93.7677887575519 152.34653370588785,93.72288919830316 152.50165843442664,93.83513801073423 152.59861138975248,93.81717821994607 152.7227111725806,93.63757990972226 152.7227111725806,93.7049293617747 152.80415165505838,93.65104980836259 152.74597988187452,93.63757990972226 152.86620154646516,93.43553093626178 153.056229338923,93.30981110771609 153.12991358498402,93.39063103864828 153.01744815679558,93.39063103864828 153.1260354667611,93.26042107698231 153.07174181177106,93.33675110114928 153.16481664890307,93.3277711051669 153.00193568396207,93.3277711051669 153.35096632315253,93.28287109781377 154.0063683012122,93.02245015343942 154.05290571975638,93.08980054512722 154.4950111960934,93.19307094592659 154.60359850607347,93.28736110060345 154.5958422696567,93.44900089663497 154.95650726348686,93.37267106679428 155.04182586418756,93.66451970289563 155.5072000497894,93.67349963028755 155.7127403150953,93.7588088493685 155.88725563469052,93.63308994259933 155.84459633434017,93.7049293617747 155.62742171440914,93.7588088493685 155.798058915796,93.73186911380617 155.7709120882937,93.77676866393085 155.54985935013974,93.66900966682078 155.6506904236885,93.77227871096693 155.8833775164967,93.82615811624783 157.77977732282307,93.06286040080886 157.88060839637183,93.26042107698231 158.03961124313355,94.23025155723735 158.12105172559677,94.3290293906357 160.11828260551556,94.32004959675396 160.23074803368945,94.98903923495163 160.38199464401987,99.72555475930494 160.57977867289446,99.85574563331465 162.27451633215242,99.88268162822715 163.3565113136865,99.98593612304467 163.40304873224522,102.1138227670308 163.3565113136865,103.0295904905579 163.2595583583461,103.4201327084229 163.08504303873633,103.53235684424362 163.01911502912117,103.71191486781026 162.767037345242,105.69149364167606 162.8174528820091,106.1583201392641 162.77091546346492,106.71042587280317 162.43739729710796,108.03006524997545 162.46066600638733,108.21409345659049 162.71662180847488,108.70333544490495 162.73601239954587,108.94571020086369 163.58144217003428,109.72668647171304 163.91883845461416,109.88377773042157 163.98088834602095,109.96905560814776 164.12437871992006,110.93403063913138 164.1592817838391,111.70599547574238 164.04293823745684,112.51385119785118 163.83739797215094,113.01202152418409 164.13989119278267,113.43837905087275 164.9387835447269,114.86103700710373 164.35706581272825,113.83331708635887 164.3415533398802,113.73009498627653 164.41911570413504,113.7480466731904 164.66343715159746,114.30005748272379 168.09169365222624,120.37620823419638 168.4911398281838,121.26467425571172 167.32382624597813,121.9826135416697 165.7105290692125,122.85758627083487 161.98365746614581,124.6568347075845 161.018006030994,125.10102690924032 160.75817211069807,125.15935484644797 161.64626118159504,128.6813222130986 161.6074799994385,130.88857778922466 161.44847715269134,132.97908814261973 161.4872583348333,134.40111701527712 161.5919675265759,134.84969707486744 162.54598460707348,137.3706323535116 161.75097037333762,137.8819789160334 160.5991692639509,138.50096947550264 159.26121848032926,139.45186563095194 157.0739598079963,140.34891873428933 157.24459700938314,140.76155705228666 157.2795000733022,141.22352799293367 157.05456921693985,143.1655472319726 157.05069109870237,143.67682680301732 156.87229766089877,143.703736090436 156.87229766089877,143.75755461617155 157.0739598079963,144.69936821869123 157.2368407729664,145.15232857305818 157.82631474139635,146.23762065445044 156.71329481416615,147.0 157.17866899976798,146.63675030309605 157.20581582724117,146.40355139507665 157.32215937365254,146.20174365573257 157.67506813108048,146.03132751460362 157.60526200322784,145.93266523814236 157.40747797435324,145.9819964038761 157.3648186740029,146.03581215829763 157.45013727468904,146.12998957105083 157.33379372827767,146.0133889352437 157.16703464511374,146.02235822582225 157.19418147260149,145.9640578045146 157.28337819151056,146.02235822582225","stroke":"#ff2a00","strokeLinecap":"round","strokeLinejoin":"round","strokeWidth":"0.5","key":17},React.createElement("title",null,"2022-09-18 21.4km")),React.createElement("polyline",{"fill":"none","points":"18.78198685735697,190.71803436955088 19.470815616543405,190.8025062502711 19.616930807882454,190.98351722150983 19.512562814052217,192.06957727318513 19.251642829505727,192.3833261113905 19.992655585636385,192.1902500010474 20.357943563954905,191.9127025442067 20.284885968314484,191.59895246650558 20.535369153425563,191.74376029735868 21.328565906442236,191.7316929848239 22.361809045250993,192.12991365240305 22.956706609926187,192.00924086338637 24.167375338205602,189.87331226777314 25.962504831841215,188.77516458011087 26.42172400461277,188.61828551255894 27.0896791650448,188.76309696683893 27.465403942740522,188.5217444452428 29.58407421724405,187.9183610017135 29.782373405469116,187.38738104301592 30.42945496708853,186.7839918532336 30.867800541163888,186.55470315966522 31.713181291066576,186.63917799284536 32.558562040969264,186.0116492299785 33.184770003834274,185.93924185232027 34.16582914569881,186.33748188491154 34.645921917282976,185.96337764976488 35.28256667952519,184.9617379452975 36.201005025126506,184.64796955825295 36.84808658680413,183.56184183563164 36.93158098182175,181.860221822506 37.53691534593236,180.7257949735358 38.19443370698718,179.94134455622407 37.860456126742065,178.6741445051739 37.43254735210212,177.75692462748702 37.192500966310035,177.57589355367963 38.44491689209826,176.23625505417294 38.5388480865513,175.51211986063572 39.07112485502148,174.28107992516743 39.645148821000475,173.89486869527173 40.32354078080971,172.7724351978104 40.74101275607245,172.59139654600585 41.22110552765662,171.93965512036084 40.89756474684691,170.96203629285446 41.231542326975614,170.09303504073614 42.11867027444532,169.91199231486098 42.22303826821735,169.51369734897162 42.03517587936949,169.2119578513375 43.01623502117582,168.49984960507572 43.00579822185682,168.70503377385467 45.07228449935792,170.6120226625062 45.761113258544356,170.5396059208506 46.61693080782425,169.7792274742751 46.48125241592061,169.28437540052255 46.71086200227728,168.71710341981816 46.38732122146757,166.47212821598805 46.606494008447044,166.17038100960053 46.7839195979177,166.48419808835024 47.11789717816282,168.71710341981816 47.49362195591675,169.32058415860956 47.911093931179494,169.54990603727492 48.098956320027355,169.44127993928123 48.986084267438855,167.63083038148034 50.134132199396845,168.06534078616096 51.313490529486444,169.4171407929316 51.67877850786317,168.523988937377 53.369540007726755,168.82573017857067 53.24429841514211,168.71710341981816 53.995747970591765,167.90843443405902 55.18554310005857,167.41357458448329 55.17510630073957,166.89457302009396 54.768071124795824,166.24280040888698 55.04986470815493,165.45825457012688 54.851565519871656,165.01166462964466 55.216853498190176,164.33574153301743 55.550831078435294,164.154690051917 55.61345187475672,163.0200945005854 56.37533822952537,162.0182617792234 56.41708542709239,161.37853285940946 56.82412060297793,160.9681389119578 58.92191727866884,160.91985717805073 59.51681484346045,160.34047484377516 59.65249323536409,159.954218387531 59.777734827948734,160.94399804745626 60.29957479698351,161.34232168566814 61.551990722771734,161.65615149217774 61.64592191722477,161.45095517385926 62.12601468880894,161.35439207812306 62.86702744488139,161.63201076719997 62.13645148818614,161.35439207812306 62.36606107460102,161.3302512919836 63.378430614597164,161.72857363767253 64.53691534593236,161.35439207812306 65.66408967913594,160.32840434850368 65.89369926549261,160.58188449244335 66.07112485502148,161.3664624693629 66.37379203707678,161.4992366923325 66.80170081171673,162.03033210315334 67.0,162.98388382618577 66.81213761115214,163.32184969214723 66.57209122530185,163.33391988391668 66.92694240430137,163.8650071093798 65.66408967913594,165.27720479616983 63.159257827559486,167.41357458448329 62.36606107460102,167.6911791436214 60.72748357168166,167.8239463127029 59.88210282177897,168.27052570382511 59.54812524153385,168.65675517770433 59.24545805953676,170.2861469782365 61.10320834943559,171.7948232079725 61.77116350980941,172.57932729274762 60.602241979097016,173.82245395020436 60.11171240819385,173.70176261055167 60.01778121374082,173.82245395020436 59.51681484346045,175.75349874777748 58.75492848851718,177.52761855418794 58.27483571699122,178.25174149170925 57.82605334353866,178.45690885682416 57.50251256278716,178.86724252664135 57.85736374172848,179.21723189242766 57.56513335905038,179.9654815691756 57.40858136839233,182.00504149351036 56.13529184379149,184.76864980495156 55.592578275944106,185.60134017444943 52.336296868918,189.1975302734645 51.67877850786317,189.39061123444117 51.04213374562096,189.8250422525016 50.280247390735894,189.83710975814756 49.873212214850355,190.27153914779774 47.56667955155717,190.71803436955088 47.03440278308699,191.09212367226428 45.81329725543037,192.4919312859347 44.529570931510534,193.28836620734364 41.21066872822121,194.27786884413945 39.53034402785124,194.30200295212126 38.246617703931406,195.1708275833662 36.16969462693669,195.8345087969501 35.80440664861817,195.653505196271 35.51217626588186,195.71383976038487 35.47042906837305,195.52076904769638 35.042520293733105,195.54490290387912 34.593737920280546,195.70177284997771 34.1449555469444,196.20858203360694 33.36219559336314,196.3533842614852 32.27676845766837,196.90845783804252 31.94279087742325,196.94465819888865 31.671434093557764,196.54645362490555 31.379203710821457,196.57058727335243 31.139157325029373,197.19806041662378 30.773869346710853,197.4997290207466 25.68071124854032,199.02012715981982 15.066486277559306,200.04578161247628 14.638577502861153,199.8285849358872 13.532276768411975,197.47559556052147 13.187862388847861,195.49663518657326 13.0,192.1178463790202 19.34557402395876,192.4919312859347 19.575183610315435,190.83870846651553 18.82373405492399,190.8025062502711","stroke":"#4dd2ff","strokeLinecap":"round","strokeLinejoin":"round","strokeWidth":"0.5","key":18},React.createElement("title",null,"2022-09-12 16.5km")),React.createElement("polyline",{"fill":"none","points":"77.45478582760552,186.48366352955782 77.42622950818622,186.30757038623415 77.76890534115955,186.5607041900148 79.03490216820501,186.4946693415186 79.58699101005914,186.18650618464017 79.6250661025988,185.86733627923968 80.53886832360877,185.92236564015184 80.91010047594318,186.18650618464017 81.5478582760552,186.3295820447238 82.06187202542787,186.20851786765706 83.09941829717718,184.2934847589786 84.72712850343669,183.2809248751073 85.11739820207004,183.11583269487892 85.6599682707456,183.26991873753286 87.92543627711711,182.543511194468 88.87731359066674,181.43187812620454 89.26758328930009,181.22275776296738 89.92437863565283,181.343827495999 90.80010576412315,180.73847748139815 91.34267583285691,180.65042628919036 92.29455314646475,181.05766245494306 93.3225806451519,179.7589039483064 94.14119513484184,179.49474777550495 94.7123215229949,178.50415640641586 94.75991538871313,176.94120498673874 95.10259122162824,176.65502834726794 95.32152300368762,175.91756968608388 95.93072448438033,175.23514079290908 95.68323638284346,174.09041173074365 95.09307244844967,172.95667778719508 96.21628767845687,171.74588089541066 96.27340031729545,171.1514847541912 96.72078265470918,170.03973509058414 97.09201480698539,169.87462278376188 97.77736647275742,168.8399132786144 98.65309360128595,168.0033324284741 98.44368059228873,166.97961288278748 98.78635642520385,166.23108065521956 99.58593336859485,165.999915248045 99.66208355367417,165.7247176930905 99.50978318351554,165.42750355039607 100.10946589102969,164.9211368410397 101.05182443151716,165.84580470319634 101.4420941300923,165.9008442086415 103.13643574825255,167.728139950661 104.00264410366071,167.51899320109078 104.8878900053096,167.59604731357103 105.99206768907607,168.36658543135854 106.77260708616814,169.13711808182416 108.09571655205218,169.7975702880285 108.58117398200557,169.31323906290345 109.34267583291512,169.0600650628112 109.95187731360784,168.39960837135004 111.70333157060668,167.43093129132467 112.82654680061387,167.69511680643336 113.0359598096693,168.26751655107364 114.00687466951786,168.31154717569007 114.56848228449235,168.2014705806796 115.31094658910297,167.47496225511713 116.27234267583117,167.26581501796318 117.46218931779731,168.2785242089085 118.1094658910879,168.12441689775733 118.97567424637964,168.14643224133033 119.87995769432746,167.82720932300435 120.58434690645663,167.87124012615095 121.61237440508557,166.990620671153 122.20253833953757,167.07868293798674 122.79270227393135,167.58503958658548 123.07826546800788,168.49867713116691 123.38286620838335,168.5647229208189 124.12533051293576,169.21417104620923 124.42041248013265,170.48003334816167 125.21998942358186,170.93133720962942 125.84822845057352,172.38430275700375 126.61924907454522,173.28689277866943 126.4669487043866,173.44099276442284 127.0,174.04638344893465 125.7435219460167,175.29017553999438 125.42940243257908,176.55596702720504 124.73453199362848,177.21637412133714 124.70597567426739,177.90979724887438 124.44896879955195,178.6252291694327 124.46800634585088,179.37367598165292 124.25859333685366,179.72588446182635 123.85880486515816,179.97903360163764 123.81121099949814,180.39727871400828 124.0872554203961,180.5623750256127 123.41142252774443,181.22275776296738 123.36382866208442,181.82810507894465 122.95452141721034,182.44445524407638 122.78318350075278,183.3689739352776 122.97355896350928,184.26046665071772 123.24008461134508,184.56863527067617 123.19249074562686,184.7777491935194 122.99259650980821,185.14094610291068 121.393442622968,185.63621265901747 120.31782125856262,185.40508854713698 120.20359598094365,186.35159369878966 120.29878371232189,186.5827157972235 119.03278688527644,188.18955108124646 118.70914859866025,188.32161867790273 118.47117927024374,190.08250462800788 117.58593336859485,190.2695970831628 117.17662612372078,189.9064173171355 116.2628239027108,189.4772033013869 116.5293495504884,189.79636260292318 116.31041776837083,189.7853571253654 116.31041776837083,190.11552096705418 116.79587519832421,191.45817692144192 116.31041776837083,191.7112987263099 115.5965097831795,191.5902405453744 115.17768376518507,191.67828287215525 113.92120571125997,192.95488859478792 114.34955050237477,193.8132874584844 115.28239026968367,194.67167954175238 114.00687466951786,195.07886315896758 112.5505023796577,194.93579881865298 110.81808566895779,193.34006841077644 110.46589106292231,192.73478522981168 110.47540983604267,193.19700178135827 110.46589106292231,192.95488859478792 109.799576943391,191.88738311242923 109.9328397673089,190.45668921615288 109.09518773137825,188.17854544094007 108.34320465358905,184.24946061242372 108.04812268639216,184.19443040413898 104.59280803811271,184.9428388482993 103.95505023794249,185.39408262479992 102.82231623481493,186.6487505921832 101.72765732411062,187.32010206282575 98.6626123743481,188.2225679954572 97.196721311484,188.27759616351977 95.65468006348237,189.1800541434277 90.21946060290793,190.81986714299273 89.65785298787523,190.7318241207031 89.14383923850255,191.17203851892555 84.74616604967741,192.52568662013073 83.3088313061744,192.78981111283065 80.05341089371359,192.9438834370958 74.82760444213636,193.50514505679894 74.3611845584237,193.1749915139444 73.6948704389506,192.00844096233777 73.3997884716955,191.06198508655507 73.20941300899722,190.0054664646159 73.0,186.31857621604286 73.21893178211758,186.23052954625018 75.03701745107537,186.61573319973832 76.8170280274935,186.5607041900148","stroke":"#4dd2ff","strokeLinecap":"round","strokeLinejoin":"round","strokeWidth":"0.5","key":19},React.createElement("title",null,"2022-06-11 16.6km")),React.createElement("polyline",{"fill":"none","points":"135.9681449093623,192.9299643678969 138.63272954401327,192.656977513092 143.45596502179978,193.0664576501731 144.75452841969673,192.3059938452061 144.77139287942555,191.72101964324247 145.04122423479566,191.9550095374143 146.13741411617957,191.83801462587144 148.14428482198855,192.5594821140112 149.07183010608424,192.42298847228813 150.89319175522542,189.01061597334046 153.9287945034448,187.04116202720616 154.63710181141505,186.90466447232757 155.54778263589833,187.17765948529996 156.2054965646239,186.7291674738226 159.5783885071869,185.83218031577417 160.1855090567842,184.83768966713978 161.33229231723817,183.804193940392 161.9562773266225,183.4726941355475 163.05246720800642,183.7261940376775 164.8906933167018,182.61469198937993 165.85196752025513,182.63419208062987 166.81324172392488,183.2386939295102 167.47095565270865,182.94619327198598 167.28544659586623,183.19969386758748 169.0224859463051,180.99617752776248 170.52342286071507,180.489170197965 171.50156152411364,178.73413451174565 171.6364772017696,176.04304870755004 172.14241099305218,175.4775258913287 172.63148032483878,173.99545821249194 173.69394128670683,172.88389996284968 173.2554653341649,171.01178734477435 172.12554653343977,169.10065359373402 174.19987507804763,166.7214605640038 174.2673329169047,165.7658747551177 175.0936914428603,163.77668091085798 176.00437226734357,163.09410965666757 176.91505309182685,161.57294215020374 178.60149906307925,160.0322602371598 178.11242973140907,158.17952514225908 178.50031230482273,157.2433995725587 178.66895690199453,156.91185400764516 180.0855715178186,156.59981060116843 180.2542161149904,156.0732362049166 179.95065584010445,155.58566603448708 180.94565896311542,154.70803661373793 184.35227982507786,157.67245769075816 185.0437226733775,158.64758621896908 185.26296064961934,159.66171464549552 184.52092442224966,162.47004239096714 184.43660212366376,164.1082146463741 185.7183010618901,166.38993133117037 187.0,169.58818951729336 185.650843223033,170.095225567522 185.7183010618901,171.1677974252234 184.75702685822034,171.10929365991615 184.7232979387627,170.6997668043332 184.74016239854973,171.01178734477435 183.98126171145122,171.83083885627275 183.89693941292353,172.7668934577814 184.2173641474219,173.2349190510722 183.84634603373706,174.13196492333373 184.6221111805644,174.79499614131055 185.0437226733775,174.8339979065786 184.40287320426432,176.56956845633977 182.1093066833564,176.37456130991632 181.772017489071,176.56956845633977 181.21549031854374,178.85113738871587 180.64209868840408,184.56469133522478 179.9169269206468,187.74314792320365 178.60149906307925,189.40060446356074 176.13928794499952,190.84355500699894 171.67020612116903,192.5594821140112 167.7576514678076,194.47038293567311 162.9681449093623,197.23920557284146 162.2935665208497,198.5651065371203 162.49594003747916,200.2224699006474 161.99000624613836,201.08039356663357 153.57464084943058,203.6736395861517 151.36539662710857,204.06359837233322 145.74953154282412,204.35606694361195 136.4740787007031,205.29196338624752 135.74890693312045,205.01899406044686 134.41661461576587,202.8547235641454 133.6071205495973,200.2224699006474 133.0,192.52048394053418 133.35415365395602,192.36449116760923 143.4728294815286,193.0664576501731 137.60399750154465,192.87146721733734","stroke":"#4dd2ff","strokeLinecap":"round","strokeLinejoin":"round","strokeWidth":"0.5","key":20},React.createElement("title",null,"2022-05-14 10.8km")),React.createElement("polyline",{"fill":"none","points":"53.63865915470524,256.9155437473819 52.74492296227254,256.15068164984405 52.03483119298471,255.86739832726016 51.38595423143124,254.0827001655416 51.45941200066591,253.501960125388 51.14109500061022,251.7030670952954 48.82717526971828,248.79929317432106 48.447643461986445,248.03438656937215 48.32521384663414,246.8728537029674 47.27231915429002,245.89545879607613 46.905030308058485,245.04554461345833 47.00297400041018,243.77066362761252 46.83157253888203,243.2182115809992 46.37858296191553,242.19829436046712 45.950079308007844,241.99997625693504 45.986808192683384,240.83839312949567 46.427554808033165,239.4926444809389 45.88886450033169,237.63690662066801 46.24391038500471,237.14109461472253 46.3540970387985,235.45532060677942 46.672414038854185,235.15782896027667 46.59895626956131,234.9170019243611 46.92951623117551,234.78950508990965 46.08475188497687,233.95368962119392 45.58279046189273,234.23701746006554 45.82764969259733,235.0161660483427 44.9828853464569,234.9878334487148 44.56662465410773,233.74119336419972 44.64008242334239,233.37286575157486 43.55045884632273,232.80620598598034 42.32616269245045,231.07787947637553 41.469155384693295,230.34120920591522 41.236539115488995,229.98703942113207 41.18756726925494,228.91035775022465 40.220373307703994,227.8761688422528 40.195887384645175,227.59282807650743 40.41626069234917,227.39448919786082 41.60382796160411,227.28115256907768 41.567099077044986,226.82780513251782 41.00392284622649,226.33195468578197 40.404017730790656,226.23278438475973 39.16747861530166,225.0994045057887 39.155235653801356,224.78772342360753 39.57149634609232,224.19269396795426 39.40009488456417,223.0167949553288 39.57149634609232,221.0899992261402 39.22869342297781,219.7298920872272 39.96327111532446,218.90815425943583 39.93878519232385,216.683770660733 38.92261938453885,213.949288675125 38.383929076837376,213.18419084555353 38.01664023066405,213.21252787711273 38.469629807572346,213.0 38.28598538454389,213.39671844177064 37.74729507678421,213.39671844177064 37.367763269052375,213.9067833503941 36.2536537690321,213.949288675125 35.89860788441729,213.75093038192426 35.89860788441729,213.5384033258888 34.69879765348742,214.119309844682 32.29917719186051,214.5018567177467 30.438247037876863,215.49364001723006 29.189464960887562,217.61886617996788 29.116007191652898,218.171419674356 28.4426443069824,219.10650521313073 28.283485807012767,219.00732977157168 28.38142949930625,219.5032062738028 27.181619268434588,220.59412836897536 26.887788191554137,221.50086231429304 26.838816345320083,222.98845991695998 26.985731883905828,223.07346501477878 26.92451707617147,223.73933648744423 27.291805922286585,224.2918657202681 27.35302073007915,225.26941207509662 27.659094768518116,225.70859733608086 28.601802807010245,226.147781213469 30.2546026147902,228.52785041800234 30.31581742252456,229.0803606721165 29.86282784555806,229.67536926624598 29.740398230147548,230.39787628802878 28.5528309608344,230.75204502916313 28.846662037831265,231.5453797444643 28.71198946092045,232.12621122717974 27.499936268490274,233.4153651411034 27.916196960839443,233.7978590644052 27.977411768573802,234.49201202280528 27.512179230048787,235.24282663833583 26.949002999230288,235.32782426460471 26.863302268495318,235.8803075721662 26.618443037732504,236.00780340924393 26.36134084535297,236.74444374053564 26.851059306936804,237.45274808141403 26.679657845408656,238.57186160665879 26.80208746076096,238.26021064125234 26.936760037729982,238.7276868281915 28.161056191602256,239.94595073946402 28.014140653191134,240.64007309195586 28.3202146916301,241.54667667548347 29.018063499359414,243.00572944182204 29.495538999384735,243.26070796999556 29.556753807060886,244.76223873488198 29.69142638402991,245.1730320710485 29.997500422527082,245.3855109080614 29.887313768616877,245.6121546440554 30.205630768672563,245.66881552046107 30.328060384083074,246.24958817682636 30.75656403793255,245.56965897159535 32.98478303808952,245.7254763739038 34.13562142272713,246.26375333336182 34.515153230400756,246.6745422467502 35.04160057666013,246.70287247205852 35.825150115124416,247.09949502187374 36.33935449976707,247.83607676479733 36.90253073058557,248.1335413659108 37.23309069214156,249.15341518189234 38.1880416921922,250.51323533579125 37.759538038342725,251.26396369906433 38.15131280757487,252.00052344925643 38.383929076837376,252.38296640082262 38.910376422980335,252.52461167234287 38.94710530759767,252.99204004772764 39.47355265379883,253.1195202418894 40.68560584622901,256.0515325523593 41.322239846223965,256.3064872321265 41.66504276933847,256.10818918817677 41.71401461545611,256.717246569242 41.97111680783564,256.9155437473819 44.468680961756036,257.43961350416066 45.631762308010366,257.04302035592264 48.55783011589665,257.1138406436512 49.30465076980181,256.6180978744669 50.026985500589944,256.5897696630418 51.43492607760709,255.9523833844578 52.08380303916056,256.1648458008858 52.695951116096694,256.7880670223967 53.07548292382853,256.8872155963618 53.09996884688735,257.43961350416066 51.69202826987021,258.91266389755765 48.006896846636664,264.06821778949234 45.11755792336771,267.0","stroke":"#4dd2ff","strokeLinecap":"round","strokeLinejoin":"round","strokeWidth":"0.5","key":21},React.createElement("title",null,"2022-05-04 10.9km")),React.createElement("polyline",{"fill":"none","points":"114.12710593780503,265.0538872524776 113.78472086240072,264.9333308610949 113.36790424882201,263.348867467299 114.4397183979745,260.88603085021896 112.8468834819505,260.50712973480404 112.608702559839,259.16374623165757 110.0184850327787,256.373608030437 109.58678211161168,255.63300808236818 109.2592833438539,253.91067011440464 108.11303765652701,252.86003536391945 107.63667581253685,251.75772305435385 107.74087996588787,250.72429875617672 107.53247165912762,249.63919646464637 106.50531643285649,247.27950560752652 106.96679196931655,245.22982047472033 106.4308848947403,243.0423140501225 106.95190566167003,241.81936508763465 106.95190566167003,240.1830111281015 106.10338612698251,238.78779159364058 106.23736289562657,236.51407589716837 106.04384089645464,239.04616644777707 106.37133966421243,239.63181465939851 105.28463920747163,239.5973648206127 104.79339105583495,238.23659058866906 104.83804997865809,237.71983801890747 103.70669059903594,237.22030903752602 102.15851460577687,235.10160078995978 100.87829214998055,233.8269180294883 100.65499753551558,232.27661526799784 99.47897923295386,231.03636285019456 99.77670538559323,230.45068494300358 100.95272368803853,230.31287808253546 101.14624568715226,229.86500501216506 100.62522492028074,229.33100095859845 99.33011615672149,228.69363907948718 98.18387046951102,227.55671734470525 98.67511862120591,226.5231455136818 98.5113692372106,225.24839824192168 98.8388680050848,222.85391461045947 98.36250616097823,221.06233638756385 99.1812530804309,220.23544774316542 99.1812530804309,219.70141334952496 98.97284477367066,219.52914383128518 99.24079831090057,217.9787102873088 99.0026173889637,216.70389874726243 98.55602816015016,217.58248610601004 98.28807462280383,217.2551697792078 98.02012108557392,217.58248610601004 97.45444139576284,217.65139472579176 98.13921154657146,217.70307617229992 99.07704892702168,216.85894390626345 98.64534600585466,215.4979871128453 97.1716015508282,213.0 96.07001478644088,214.06810934074747 94.55161140847486,214.06810934074747 94.13479479495436,213.63742090047162 92.85457233904162,214.30929438916792 90.9937838857295,214.7572085684078 89.87731081369566,214.7572085684078 87.65925097721629,215.96312547413982 85.54539529426256,219.92536346144334 85.18812391121173,220.4077165434137 84.90528406627709,220.08040567324497 85.23278283403488,220.80393411955447 83.72926576377358,222.2682084289263 83.29756284260657,223.45684533019084 83.28267653490184,225.9374520117708 83.77392468665494,226.91934879381733 83.92278776288731,227.98737041416462 86.21527913748287,230.07171580704744 87.54016051627696,232.32829225515889 87.01913974934723,233.03454283392057 86.81073144252878,234.08530044466897 85.27744175697444,234.55038779949246 85.61982683237875,236.0489939297113 84.84573883580742,237.04805732336536 84.02699191635475,237.61648731597234 84.54801268328447,238.39161605249683 84.56289899087278,239.11506634243415 84.33960437646601,239.56291497481288 83.35710807307623,240.0968867980264 82.83608730620472,240.92367856102646 82.67233792232582,241.9571625948156 83.26779022737173,242.85284366155975 83.08915453584632,244.04133623365487 84.93505668162834,245.78099874439067 84.78619360527955,246.79722898187174 85.88778036966687,249.44973344766186 86.72141359682428,250.15591270757432 86.69164098153124,252.1194200707978 87.12334390269825,252.2572092074697 87.37641113239806,253.34229474610765 88.0760675908532,252.5500107511034 89.74333404499339,252.5500107511034 91.45525942213135,253.08394167623192 92.64616403228138,253.92789358070877 93.91150018054759,254.25513910745212 95.47456248133676,255.75357108502067 95.60853925003903,256.42527767355205 96.97807955165626,258.4576044824207 96.62080816860544,259.5770961352391 97.24603308894439,260.61046648659976 97.87125800928334,261.0410356079956 97.9159169322229,261.52327172624064 98.63045969832456,261.7299439285998 99.91068215417909,264.9505532079784 100.64011122786906,265.5533342468116 101.3397676863824,265.39833361288765 101.13135937962215,265.93222408910515 101.28022245579632,266.2422242395696 102.51578598888591,266.3111130849866 103.11123829393182,266.6900012344704 103.76623582956381,266.67277906421805 104.55521013372345,267.0 106.19270397274522,266.44889069181227 107.11565504560713,266.65555689224857 109.37837380485144,266.6383347184601 113.39767686417326,265.1227765805379 114.29085532168392,265.19166588060034 114.91608024208108,265.5533342468116 115.4371010089526,266.0355575355352 114.97562547260895,266.5177794532501 116.28562054375652,265.4844450936944 117.32766207761597,265.43277821039374","stroke":"#4dd2ff","strokeLinecap":"round","strokeLinejoin":"round","strokeWidth":"0.5","key":22},React.createElement("title",null,"2022-04-17 11.0km"))]);
}

Grid.defaultProps = {"baseProfile":"full","height":"300mm","version":"1.1","viewBox":"0,0,200,300","width":"200mm","xmlnsEv":"http://www.w3.org/2001/xml-events"};

module.exports = Grid;

Grid.default = Grid;


/***/ }),

/***/ "./assets/start.svg":
/*!**************************!*\
  !*** ./assets/start.svg ***!
  \**************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var React = __webpack_require__(/*! react */ "react");

function Start (props) {
    return React.createElement("svg",props,React.createElement("g",{"id":"Page-1","fill":"none","fillRule":"evenodd"},React.createElement("g",{"id":"037---Waypoint-Flag","fillRule":"nonzero","transform":"translate(0 -1)"},[React.createElement("g",{"id":"Icons_copy","transform":"translate(0 1)","key":0},[React.createElement("path",{"id":"Shape","d":"m58.44 30.6c-11.88 14.2-32.78-3.93-44.27 11.64l-.66-2.34v-.01c-2.29-8.19-4.58-16.3833333-6.87-24.58-.22-.78-.43-1.56-.65-2.34 11.49-15.57 32.4 2.56 44.27-11.64.58-.7 1.13-.4 1.01.62-.06.48-.13.96-.19 1.43-.69 5-1.53 9.44-2.49 13.46-.27 1.13-.54 2.22-.83 3.29-.0181734.0757458-.0315335.1525661-.04.23-.0106736.2802805.1027422.5510151.31.74 2.9783401 2.7019905 6.2761919 5.0292932 9.82 6.93.28.14.55.27.82.39.46.2.35 1.48-.23 2.18z","fill":"#e64c3c","key":0}),React.createElement("path",{"id":"Shape","d":"m58.44 30.6c-.6501399.7802412-1.3697588 1.4998601-2.15 2.15-10.83 8.99-27.3-2.22-38.4 5.76h-.01c-1.4199733 1.046483-2.6711663 2.304421-3.71 3.73-.22-.78-1.95-.87-2.17-1.65v-.01c-.02-.07-.04-.13-.06-.2-2.27-8.12-4.54-16.2466667-6.81-24.38-.22-.78 1.08-2.25.86-3.03 5.09-6.89 12.02-7.18 19.19-6.6 7.87.65 16.04 2.35 22.38-2.46.9983609-.75079008 1.9046285-1.61677914 2.7-2.58.58-.7 1.13-.4 1.01.62-.06.48-.13.96-.19 1.43-.69 5-1.53 9.44-2.49 13.46-.27 1.13-.54 2.22-.83 3.29-.0181734.0757458-.0315335.1525661-.04.23-.0106736.2802805.1027422.5510151.31.74 2.9783401 2.7019905 6.2761919 5.0292932 9.82 6.93.28.14.55.27.82.39.46.2.35 1.48-.23 2.18z","fill":"#cad9fc","key":1}),React.createElement("g",{"fill":"#e8edfc","key":2},[React.createElement("path",{"id":"Shape","d":"m56.41 32.61c-.04.05-.08.09-.12.14-10.83 8.99-27.3-2.22-38.4 5.76h-.01c-2.07.32-2 3.52-3.88 4.49-2.27-8.12-6.6-18.87-8.87-27-.22-.78 1.08-2.25.86-3.03 5.09-6.89 12.02-7.18 19.19-6.6 7.87.65 17.48 1.44 23.82-3.37-.71 4.7-2.07 9.87-3 13.78-.31 1.3-.62 2.56-.96 3.79-.0182073.0858464-.0315618.1726507-.04.26-.0165937.3214646.1118607.6334254.35.85 3.99 3.47 6.87 6.23 10.38 7.98.32.16.63.31.94.44.53.23.4 1.71-.26 2.51z","key":0}),React.createElement("path",{"id":"Shape","d":"m9.45150963 10.0111708h.1433c.64015307 0 1.25408707.2542998 1.70674367.7069563.4526565.4526566.7069563 1.0665906.7069563 1.7067437v45.3626c0 1.0664618-.8645381 1.931-1.931 1.931h-1.10879997c-1.06646186 0-1.931-.8645382-1.931-1.931v-45.3626c0-1.3330497 1.0806503-2.4137 2.4137-2.4137z","transform":"matrix(.963 -.269 .269 .963 -9.032 3.849)","key":1})])]),React.createElement("g",{"id":"Icons","fill":"#fff","transform":"translate(1 11)","key":1},React.createElement("path",{"id":"Shape","d":"m14.678 48.9507 1.0678-.2984c.0634142-.0210171.1256684-.0453847.1865-.073-.3059718-.2499171-.5272905-.5882341-.6337-.9687l-12.2086-43.6888c-.27028924-.97424098.09689756-2.01356496.9192-2.6018-.59836922-.46042192-1.37842214-.61265447-2.106-.411l-.1379.0385c-1.28392347.35874479-2.03396372 1.69035388-1.6753 2.9743l12.2086 43.6888c.2870014 1.0271063 1.3522895 1.6270863 2.3794 1.3401z"})),React.createElement("g",{"id":"Layer_2","key":2},[React.createElement("path",{"id":"Shape","d":"m2.053 14.653 3.499 12.52 8.71 31.168-1.926.539-8.71-31.169-3.499-12.52z","fill":"#fff","key":0}),React.createElement("g",{"fill":"#428dff","key":1},[React.createElement("path",{"id":"Shape","d":"m2.4358 19.7373c.53079922-.1500279.84084226-.7005107.694-1.2322l-1.0765-3.8525-1.9262.5383 1.0765 3.8524c.14998144.5308358.70050349.840901 1.2322.694z","key":0}),React.createElement("path",{"id":"Shape","d":"m12.3355 58.88 1.9262-.5383-8.9789-32.1317c-.09615803-.3440825-.36857754-.6107281-.71464074-.6994941-.34606319-.0887659-.71319484.0138335-.9631.26915-.24990517.2553166-.3446173.6245616-.24845926.9686441z","key":1}),React.createElement("path",{"id":"Shape","d":"m4.2063 22.3575c-.07490138-.2538315-.24272249-.4701065-.47-.6057l-.1767-.0754c-.06393913-.0215298-.13045347-.0344763-.1978-.0385-.06253228-.0124484-.12657787-.0154484-.19-.0089-.06662004.0069034-.13267939.0184312-.1977.0345-.25396014.0747004-.47033292.2425696-.6058.47-.25632418.4849939-.08842788 1.0857657.3822 1.3676.11633877.0611962.24326559.0996815.374.1134.12966928.0170871.26143258.0085248.3878-.0252.25694371-.0689915.47530619-.2384954.60586452-.4703023.13055832-.2318068.16232364-.506406.08813548-.7618977z","key":2}),React.createElement("path",{"id":"Shape","d":"m15.1543 61.0234c-1.3131578-.0035737-2.4641659-.8789182-2.8184-2.1434-.1047434-.3467682-.0137665-.7230684.2378229-.9836871.2515895-.2606187.6244494-.3648018.9746938-.2723454.3502445.0924565.6231043.3670948.7132833.7179325.1386638.4946286.6515843.7836357 1.1465.646l1.0693-.2988c.4945675-.1390172.783314-.6520959.6455-1.147l-12.208-43.6891c-.21192095-.751076-.99110897-1.1895509-1.7431-.9809l-.1367.0381c-.75150823.21118-1.19077567.9902817-.9825 1.7426.10566032.3470367.0150922.7240796-.23666629.985262-.25175848.2611825-.62522009.3655392-.9759038.2726977-.3506837-.0928415-.62358626-.3683195-.71312991-.7198597-.50468593-1.815475.55497633-3.6969782 2.3691-4.2065l.1377-.0386c1.81535016-.5036775 3.69623437.5553314 4.207 2.3687l12.208 43.6894c.2094014.7485105.1128149 1.5495525-.2685031 2.2268365-.381318.6772839-1.0161182 1.1753058-1.7646969 1.3844635l-1.0693.2989c-.2578315.0721343-.5242682.1089039-.792.1093z","key":3}),React.createElement("path",{"id":"Shape","d":"m14.166 44.2441c-.0605828.0000403-.1210397-.0055166-.1806-.0166-.3759553-.0688112-.6796786-.3461339-.7823-.7143l-8.18-29.27c-.08284248-.2966212-.02449022-.614866.1582-.8628 6.2012-8.4072 14.9463-7.5347 23.4043-6.689 7.9366.7954 15.4327 1.5425 20.9053-5.0054.4028894-.63382158 1.1959029-.89698941 1.8978-.6298.249.1079 1.0508.5722.872 2.0126-.7623159 6.18130331-1.9437366 12.3036693-3.5361 18.3248 3.0998951 2.8439162 6.5841877 5.237941 10.3506 7.1118.4232899.1992905.726435.5881733.8164 1.0473.1707533.9506993-.0781613 1.9287813-.6826 2.6822l-.0029.0039c-6.1534 7.3589-14.53 6.5234-22.64 5.7129-8.2637-.8252-16.07-1.607-21.5957 5.8862-.1883675.2555125-.4869587.4062929-.8044.4062zm-7.083-30.062 7.527 26.9351c6.0947-6.7608 14.2519-5.9463 22.1552-5.1558 7.9336.7935 15.4307 1.542 20.9043-5.0039.1637292-.2242914.2617894-.4897328.2832-.7666-3.8403085-1.9552616-7.3981938-4.4214973-10.5767-7.3315-.5562771-.4965314-.7823066-1.2658845-.583-1.9844 1.472317-5.5570772 2.5852862-11.20319096 3.332-16.9033-6.0586 6.2759-14.0225 5.479-21.7373 4.71-8.125-.8117-15.7977-1.5792-21.3047 5.5004zm51.166 16.1446.02.0092z","key":4})])])])));
}

Start.defaultProps = {"height":"16","viewBox":"0 0 60 60","width":"16"};

module.exports = Start;

Start.default = Start;


/***/ }),

/***/ "./node_modules/viewport-mercator-project/module.js":
/*!**********************************************************!*\
  !*** ./node_modules/viewport-mercator-project/module.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MAX_LATITUDE": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.MAX_LATITUDE),
/* harmony export */   "WebMercatorViewport": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.WebMercatorViewport),
/* harmony export */   "addMetersToLngLat": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.addMetersToLngLat),
/* harmony export */   "altitudeToFovy": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.altitudeToFovy),
/* harmony export */   "default": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.WebMercatorViewport),
/* harmony export */   "fitBounds": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.fitBounds),
/* harmony export */   "flyToViewport": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.flyToViewport),
/* harmony export */   "fovyToAltitude": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.fovyToAltitude),
/* harmony export */   "getBounds": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.getBounds),
/* harmony export */   "getDistanceScales": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.getDistanceScales),
/* harmony export */   "getFlyToDuration": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.getFlyToDuration),
/* harmony export */   "getMeterZoom": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.getMeterZoom),
/* harmony export */   "getProjectionMatrix": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.getProjectionMatrix),
/* harmony export */   "getProjectionParameters": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.getProjectionParameters),
/* harmony export */   "getViewMatrix": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.getViewMatrix),
/* harmony export */   "lngLatToWorld": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.lngLatToWorld),
/* harmony export */   "normalizeViewportProps": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.normalizeViewportProps),
/* harmony export */   "pixelsToWorld": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.pixelsToWorld),
/* harmony export */   "scaleToZoom": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.scaleToZoom),
/* harmony export */   "unitsPerMeter": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.unitsPerMeter),
/* harmony export */   "worldToLngLat": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.worldToLngLat),
/* harmony export */   "worldToPixels": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.worldToPixels),
/* harmony export */   "zoomToScale": () => (/* reexport safe */ _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__.zoomToScale)
/* harmony export */ });
/* harmony import */ var _math_gl_web_mercator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @math.gl/web-mercator */ "./node_modules/@math.gl/web-mercator/dist/esm/index.js");




/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _arrayLikeToArray)
/* harmony export */ });
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _arrayWithHoles)
/* harmony export */ });
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/arrayWithoutHoles.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/arrayWithoutHoles.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _arrayWithoutHoles)
/* harmony export */ });
/* harmony import */ var _arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./arrayLikeToArray.js */ "./node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js");

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return (0,_arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_0__["default"])(arr);
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js":
/*!**************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js ***!
  \**************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _assertThisInitialized)
/* harmony export */ });
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/classCallCheck.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _classCallCheck)
/* harmony export */ });
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/createClass.js":
/*!****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/createClass.js ***!
  \****************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _createClass)
/* harmony export */ });
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/defineProperty.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _defineProperty)
/* harmony export */ });
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/extends.js":
/*!************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/extends.js ***!
  \************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _extends)
/* harmony export */ });
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _getPrototypeOf)
/* harmony export */ });
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/inherits.js":
/*!*************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/inherits.js ***!
  \*************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _inherits)
/* harmony export */ });
/* harmony import */ var _setPrototypeOf_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./setPrototypeOf.js */ "./node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js");

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  Object.defineProperty(subClass, "prototype", {
    writable: false
  });
  if (superClass) (0,_setPrototypeOf_js__WEBPACK_IMPORTED_MODULE_0__["default"])(subClass, superClass);
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/iterableToArray.js":
/*!********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/iterableToArray.js ***!
  \********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _iterableToArray)
/* harmony export */ });
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _iterableToArrayLimit)
/* harmony export */ });
function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/nonIterableRest.js":
/*!********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/nonIterableRest.js ***!
  \********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _nonIterableRest)
/* harmony export */ });
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/nonIterableSpread.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/nonIterableSpread.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _nonIterableSpread)
/* harmony export */ });
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js":
/*!****************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _objectWithoutProperties)
/* harmony export */ });
/* harmony import */ var _objectWithoutPropertiesLoose_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./objectWithoutPropertiesLoose.js */ "./node_modules/@babel/runtime/helpers/esm/objectWithoutPropertiesLoose.js");

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = (0,_objectWithoutPropertiesLoose_js__WEBPACK_IMPORTED_MODULE_0__["default"])(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/objectWithoutPropertiesLoose.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/objectWithoutPropertiesLoose.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _objectWithoutPropertiesLoose)
/* harmony export */ });
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js":
/*!******************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _possibleConstructorReturn)
/* harmony export */ });
/* harmony import */ var _typeof_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./typeof.js */ "./node_modules/@babel/runtime/helpers/esm/typeof.js");
/* harmony import */ var _assertThisInitialized_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./assertThisInitialized.js */ "./node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js");


function _possibleConstructorReturn(self, call) {
  if (call && ((0,_typeof_js__WEBPACK_IMPORTED_MODULE_0__["default"])(call) === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }
  return (0,_assertThisInitialized_js__WEBPACK_IMPORTED_MODULE_1__["default"])(self);
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _setPrototypeOf)
/* harmony export */ });
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };
  return _setPrototypeOf(o, p);
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js":
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js ***!
  \******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _slicedToArray)
/* harmony export */ });
/* harmony import */ var _arrayWithHoles_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./arrayWithHoles.js */ "./node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js");
/* harmony import */ var _iterableToArrayLimit_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./iterableToArrayLimit.js */ "./node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js");
/* harmony import */ var _unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./unsupportedIterableToArray.js */ "./node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js");
/* harmony import */ var _nonIterableRest_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./nonIterableRest.js */ "./node_modules/@babel/runtime/helpers/esm/nonIterableRest.js");




function _slicedToArray(arr, i) {
  return (0,_arrayWithHoles_js__WEBPACK_IMPORTED_MODULE_0__["default"])(arr) || (0,_iterableToArrayLimit_js__WEBPACK_IMPORTED_MODULE_1__["default"])(arr, i) || (0,_unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(arr, i) || (0,_nonIterableRest_js__WEBPACK_IMPORTED_MODULE_3__["default"])();
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _toConsumableArray)
/* harmony export */ });
/* harmony import */ var _arrayWithoutHoles_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./arrayWithoutHoles.js */ "./node_modules/@babel/runtime/helpers/esm/arrayWithoutHoles.js");
/* harmony import */ var _iterableToArray_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./iterableToArray.js */ "./node_modules/@babel/runtime/helpers/esm/iterableToArray.js");
/* harmony import */ var _unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./unsupportedIterableToArray.js */ "./node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js");
/* harmony import */ var _nonIterableSpread_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./nonIterableSpread.js */ "./node_modules/@babel/runtime/helpers/esm/nonIterableSpread.js");




function _toConsumableArray(arr) {
  return (0,_arrayWithoutHoles_js__WEBPACK_IMPORTED_MODULE_0__["default"])(arr) || (0,_iterableToArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(arr) || (0,_unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(arr) || (0,_nonIterableSpread_js__WEBPACK_IMPORTED_MODULE_3__["default"])();
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/typeof.js":
/*!***********************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/typeof.js ***!
  \***********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _typeof)
/* harmony export */ });
function _typeof(obj) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
}

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _unsupportedIterableToArray)
/* harmony export */ });
/* harmony import */ var _arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./arrayLikeToArray.js */ "./node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js");

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return (0,_arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_0__["default"])(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return (0,_arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_0__["default"])(o, minLen);
}

/***/ }),

/***/ "./public/page-data/sq/d/3278082143.json":
/*!***********************************************!*\
  !*** ./public/page-data/sq/d/3278082143.json ***!
  \***********************************************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"data":{"allActivitiesJson":{"nodes":[{"id":"eb1fc605-353d-5164-96ee-cf855ddb75ca","distance":11009.090670269832,"name":"run from gpx","run_id":1650175984000,"moving_time":"2:44:22","type":"Run","average_speed":1.1163142030287805,"average_heartrate":null,"location_country":"杭州瑞铂斯庄园, 九溪路, 西湖街道, 西湖区, 杭州市, 浙江省, 310008, 中国","start_date":"2022-04-17 06:13:04","start_date_local":"2022-04-17 14:13:04","streak":1,"summary_polyline":"}ogwDisb|UMl@wDv@}GoCk@tE{C^cIzIuAx@gEj@yBxC_C~@wBM}BZqGhCmF}@}FfAmCeA}D?aDpBgGQdHXbAk@CpC}C`A{@Ey@vCuFnEsCjDsD\\\\oC|CcAg@O}Cs@Y}@dAiAlDcCxCwBaAsCTuGk@oE~@_BmB}@?SZsDc@sC^dBz@e@b@d@b@FjAD{AaB}B}Cx@aHdEzBrC?jEq@v@lAjDr@xF?tCjChHjMzGv@n@e@d@rAk@hDhEhCx@~G@pBaAzBSpFsHdGqDpAdAxBZt@lElDm@rBfB`AlBxAeArAAr@\\\\|@bC~AdAvBTfBoAhCVhEwFtBRrHsCpAoBbFBNy@|Ba@{A}A?_F|@eF`B_Dd@iDlDqElAQjFwD`Cn@vBsAp@sAv@EV_BtJkDdAaBQ}A|@Zb@SFeDj@oAAwAd@iB_A{EV{BAoHoD{OFwBh@sAv@eAv@|@wBoDEkC"},{"id":"efbaf828-9319-514d-ae39-a5f61b7e8384","distance":9340.985426022336,"name":"run from gpx","run_id":1651374561000,"moving_time":"2:13:54","type":"Run","average_speed":1.1626817806848813,"average_heartrate":null,"location_country":"闻堰初级中学, 闻兴路, 闻堰街道, 萧山区, 杭州市, 浙江省, 中国","start_date":"2022-05-01 03:09:21","start_date_local":"2022-05-01 11:09:21","streak":1,"summary_polyline":"ey{vDqto|UFgE_@qDo@w@w@P~@Ay@OJyCfAkFWiB{IaFcEyJKi@`@qBu@eB{AuJiEcEc@{ATwCmB{COcCfAeCK_A{EgEy@{DqDoBsGQkFoCyAcBqE|@cD~Ba@ImDqE_JeCu@cBuD_CqCwD{Dx@cC_Ae@iDw@Wm@f@{A{BnK{MpPdAhGkDbF}AfCzErBdB|HlAlD~Bf@[Mg@r@mEfCpC|FkB|ADpAbCDpBfAz@fCnA`HdAfDKfAb@nAhDfFxHJ~FxAbJ`AtCrBvBLdCn@jBdCdD@vDrAr@bCSb@fAvAb@n@|@fG|^hAv]Q|@uIl@cCKkG{AgI[}@vA_@tP^yC"},{"id":"d8d22f7c-f43c-5169-89f0-8583c9099bd8","distance":7305.886267270993,"name":"run from gpx","run_id":1651463661000,"moving_time":"2:37:26","type":"Run","average_speed":0.7734370386693831,"average_heartrate":null,"location_country":"杭州动物园, 40, 虎跑路, 马儿山, 西湖街道, 西湖区, 杭州市, 浙江省, 310008, 中国","start_date":"2022-05-02 03:54:21","start_date_local":"2022-05-02 11:54:21","streak":2,"summary_polyline":"owkwD{ne|UGl@]O^n@y@nA[`CoAxAIr@ZEa@J?|@u@BrAgB}@m@W\\\\DhE[@Al@^_Aq@_@GsAUPLVRaAMf@Bi@WA{AZoAjCw@CgDtAOvAdAhFtAx@fA~ClBfCzARl@rBz@VZvCsAcAaF}@gDcDs@Rs@`CeAJ]f@DrBKiCr@c@`@PzA_D{@aBsBXcBQsB_ByAMg@m@^uCGhCoClA_C{ByBkFq@\\\\kAGK[GfCy@I_@dAIY`@LWi@}At@kAcEl@a@m@HFT^O{@GXcDO}CgASwA`Ac@E`BcAUO\\\\d@v@DnAcAZmEdJqJhDaGZuCnR_@fLrAt@b@jPx@vCu@b@o@lAC~KmFzGiHlALvHjDbIh@l@sAYeM`BgA]gD]]_@Lb@EPx@i@yDh@]i@d@v@rIgBLl@lOk@PqHe@sEiBe@\\\\Er@nAjA"},{"id":"38a9cda8-1d00-51a5-8a41-c9743a05e30c","distance":10915.081251735768,"name":"run from gpx","run_id":1651635326000,"moving_time":"3:55:23","type":"Run","average_speed":0.7728585464657487,"average_heartrate":null,"location_country":"九溪, 之江路隧道, 马儿山, 西湖街道, 西湖区, 杭州市, 浙江省, 310008, 中国","start_date":"2022-05-04 03:35:26","start_date_local":"2022-05-04 11:35:26","streak":1,"summary_polyline":"ekgwDszb|UkBpCg@rB{FhBqAK}Fr@yKxJkB|@cDRiCjDwBz@sDOmAZoChA[dAcDE}DgAeGvAeAy@mFQi@s@a@JQu@uBhCf@pAlBg@ChCoDbAs@KoApDsFfEgBjCq@d@wCFqC|Cg@B[c@OaE_ADeAzAM`B_DhEk@@sAcAeDZoG[_Ev@sBwByHBaKdDkBvABz@]iAv@\\\\?vAfA|@DtD[x@]?pAbEt@fKjCnHjHjElAJbClBMXdAOxCbE~Bn@pEFJW|AHlA{@hCI|@q@|@yCnImGlAIrAhAdBRp@`EnBo@pATtDdEt@cA`BIhBjAJzAlALPf@fBh@bBoA|CZk@S`AUjDgE`BV~Bq@lEqBb@mArEIx@U\\\\q@^PFs@pAS_BeATkJjA{Dx@}@BuAv@_CfBsAh@{AnCu@~D{ChBdAfB_At@e@RuA`AEPuA|KeEb@gB[w@tAGZi@hAwKw@}DH}MeAyBCuByAeF\\\\iBvAcBL}@lACnEdFvUxQ|KvM"},{"id":"3e0c267e-d146-50fe-b0e7-a6783956a3b3","distance":10762.883995157043,"name":"run from gpx","run_id":1652498735000,"moving_time":"2:46:32","type":"Run","average_speed":1.0771501196113933,"average_heartrate":null,"location_country":"闻堰体育馆, 闻兴路, 闻堰街道, 萧山区, 杭州市, 浙江省, 中国","start_date":"2022-05-14 03:25:35","start_date_local":"2022-05-14 11:25:35","streak":1,"summary_polyline":"ey{vDaao|U[{Hh@{PmAyC{@AV_@KaChAmFMmB}IwEiEgJMsAZkBm@mA{AoKeBgAiBgCa@iAXaCqByE@qB|@qB]mAXTaFmEs@qDsDsBsGOy@{@wCy@qB}B_Er@cEdCsFuFaBGkEaBeAkB{CkB}CgE}Dx@_Bm@a@S_@gDu@Sq@b@yAuBnHsKbBqAfBY~GvAfDHhFwCfIwCr@~ClBGEpBi@B^ArAxA~AHn@e@zAj@bA{ABq@pDjASnGRf@hF`AhQbAdItAhDzCrCbHnDpObEnMzGvPfCnAhDWvAz@hGd^f@dG\\\\xS~Aja@[tA}E|CmG~AuWfAOi@fAod@SvT"},{"id":"16293ddc-cfa5-5e6a-a1eb-a15104bf3bc0","distance":8059.144366036657,"name":"run from gpx","run_id":1653103878000,"moving_time":"3:30:45","type":"Run","average_speed":0.6373384235695261,"average_heartrate":null,"location_country":"杭州陶瓷品市场, 虎玉路, 玉皇山社区, 南星街道, 上城区, 杭州市, 浙江省, 310008, 中国","start_date":"2022-05-21 03:31:18","start_date_local":"2022-05-21 11:31:18","streak":1,"summary_polyline":"_pkwDifi|UgDl@sFUWk@{Bq@CzB`At@f@bCoCHsBuBmA^dDlB}A|BZt@e@w@}AdEsBFYh@X|@u@_@Hn@iAhB{E_BIv@rANh@hA\\\\Cy@j@T]e@_@jADaCYc@q@Dk@[AQzDmBxB}Ew@o@?Al@n@y@hE`A~BuBPcAHuCwCaEUcAXu@a@uA{BmCoAkIl@h@c@}Aq@\\\\hAAc@^F[sADw@oCa@QZi@Sw@xCFt@cAjDeB}Ay@aCY_@cBwEwBcAkAgCUuA}B{@a@aEkAoBj@qCaCa@oBcF{DuAu@aEEq@}Ab@lBSfBOh@uBt@wAJmCcALTy@[u@FLNLO_ASgEl@a@[E_AgAB{@bAe@u@aA?C{C{@{AF{A[[XuCi@sBFuBw@s@aAp@oDa@iCaBiEcFqAFw@}@}DnCs@qAgBK_DgAq@|@wATo@n@Ye@NqAeAoA_EfAoBKu@_AFwBk@qCPg@cARf@Rd@e@YoDy@Yj@HHX_@ERj@XQg@KB_ARd@WIMr@h@o@o@Il@Ik@kPVmDu@v@bAqA|Lj@"},{"id":"711b3e63-a4ff-5930-9bf2-4716de58af48","distance":4543.370705197832,"name":"run from gpx","run_id":1654235730000,"moving_time":"1:24:59","type":"Run","average_speed":0.8910317131197945,"average_heartrate":null,"location_country":"东平路, 一江两岸, 椒江区, 台州市, 浙江省, 318000, 中国","start_date":"2022-06-03 05:55:30","start_date_local":"2022-06-03 13:55:30","streak":1,"summary_polyline":"e{~mDea`dV_@cCVKhFnHnAESiHx@cGCoBp@uBX_H]{BZyCMZs@kCp@aBtBqBjBmFWk@jAcAh@?e@ZlCu@LgD`AgFZ{KjFImAo@{AwDC_FaCSm@`BgCXx@nA[b@}ALu@~DsDqAuAp@eEc@g@lBeVqBu@vGBvFu@lLVbS~AFyCG~@i@HoDPVQ`@cAG"},{"id":"20ea2613-dbe7-5fa1-b8cb-d6022f7806bc","distance":16597.261110204712,"name":"run from gpx","run_id":1654920389000,"moving_time":"4:28:07","type":"Run","average_speed":1.0317188481509736,"average_heartrate":null,"location_country":"闻堰初级中学, 闻兴路, 闻堰街道, 萧山区, 杭州市, 浙江省, 中国","start_date":"2022-06-11 04:06:29","start_date_local":"2022-06-11 12:06:29","streak":1,"summary_polyline":"my{vDqso|U_@Dl@gAKiGw@sBy@GH_En@mAXeCUkB{IyEwDuI]qAZqBcC{MiEgEe@qATiCmBwDOqBhAgEkFwEo@kDsDwB{GIs@gAeCm@{B_CoEr@mEzB{EkFkBKiE}A]mA{DoCwCwDyDj@gCgAi@gDq@Ou@^{A}BfDeEHqAjIcJe@uDLyDjCgFjCcDvBuGwAeBm@_DwB_CoDoJn@kFfBk@FkESuBcC{Ce@iEvDyF[gCBuDy@}DFsC_DwEN{BzA{BdD{@J_AtB{CdF}@pAgDfGcCbDaDZ^lBoB`FfGdF`AvBpC|BD`Ct@fCC~@j@l@rAjAH\\\\y@vBlClBHnBtAfDb@`Dg@v@w@d@H`Ah@xAnIi@`FjDVh@SbHhGVbA~Hp@`@xDaAtAmA~Dx@w@Al@z@?rFeBl@dBUtCNvAfFfGzCyAzCcEhAjGYpHaHjJmBhArAAk@@aEjCcG[}KnDiU|CI|@fCtUpAdCbFlFxBdFbDbSHrHbDbIhHtb@OtBnAjBtFz[n@lHZjTdBha@{@`BsEjCkD|@_Ef@}Sj@Om@dA}JIuJ"},{"id":"c7364beb-a2b7-5fb8-8393-018154c82829","distance":7893.110369613129,"name":"run from gpx","run_id":1655526325000,"moving_time":"3:01:56","type":"Run","average_speed":0.723077168341254,"average_heartrate":null,"location_country":"灵山村, 双浦镇, 西湖区, 杭州市, 浙江省, 310024, 中国","start_date":"2022-06-18 04:25:25","start_date_local":"2022-06-18 12:25:25","streak":1,"summary_polyline":"se{vDavp{Uf@vA]_@y@tCrBtDZ`DvAnAfBx@nFuApEnDlARx@hA`ChAxHa@lAv@Z|@nCz@h@~@`@E`@tBbAt@NxAz@lAEx@p@GT~Bx@gBXJCdFwGxHq@~CGvBt@fDBlBjCjEgAvNx@nBh@lGt@fAK~BqAnFsBfEZ`Jr@~AqAo@kXuBoAqDkBaBsCiAoFw@k@_B_CcBgBeHmDcF_@eCeCcBs@oDsCwBeC]cAiCD`@i@v@dAqA{@ZZTDo@cCwDiEuL_Am@I{BdAyKh@q@XoBMoCpCqD`AqC_AtCsCpDmA_EwB_BCmAzAaIsAsI~CX`E~EjCYzIaCNmBa@_D~@tAhEc@n@o@jAaE"},{"id":"30f10acf-47ea-5881-a3bd-2c7b5bab4510","distance":5960.687597983561,"name":"run from gpx","run_id":1656814993000,"moving_time":"1:37:36","type":"Run","average_speed":1.0178769805299797,"average_heartrate":null,"location_country":"闻堰体育馆, 闻兴路, 闻堰街道, 萧山区, 杭州市, 浙江省, 中国","start_date":"2022-07-03 02:23:13","start_date_local":"2022-07-03 10:23:13","streak":1,"summary_polyline":"qx{vDago|UaAQ`Ag@WyCb@yDI{FuAmEw@FV]CwCbAoEYaC_JiFkAgC}BaGZiCcA}C_A_I_CqAkA{Am@cBXuCeB}CU_CfAyCz@?zAuBLn@jBhAGn@EiA`BxAmB_@|Aw@gA\\\\ApAb@aA~ASbIl@lCzB`B~Cb@tCjB|AnFO?g@zAg@dDfA|Ce@bA|@nHzd@XfVfBd\\\\EbEwHtEaCn@kY~A_@]?y@l@_O"},{"id":"aced2caf-5039-50db-9db6-7ad20cbe1b07","distance":16462.889224611154,"name":"run from gpx","run_id":1662945108000,"moving_time":"3:51:38","type":"Run","average_speed":1.1845509587430676,"average_heartrate":null,"location_country":"闻堰初级中学, 闻兴路, 闻堰街道, 萧山区, 杭州市, 浙江省, 中国","start_date":"2022-09-12 01:11:48","start_date_local":"2022-09-12 09:11:48","streak":1,"summary_polyline":"ua|vDwxo|ULcC\\\\[rDRr@p@_@mCm@eAs@LVo@AwC`AeESqBaJgFuDwIYwAV_Cg@gAcBuKwAe@cB{Be@sALaDgBaDKwB`A{D}@{AeDyBs@oDsD{ByGO{DsBaC}BqE~@wCpA]l@}EoFwBQkEeB_AmByDaC]oAkB{AaD|@oC_A]iDaASq@b@uB{D`@@zHkKKcC}BcDqAX}Ak@sJ|@q@i@r@a@pJ_AbBgAd@oAQc@kHiDfA{E~EaFsCeAp@cIQVeCoCqAcFuA@kBlAaCu@iAd@oBeA]_A{DKeDqCiBGcAmAGqK_BqB_AYbDW`AcBr@oFa@QO{Al@mCm@jCCk@`AaE}@}EiDwEh@k@`Ca@Ty@vAqA|Ce@v@b@@l@vAcAhFpF`J~Ml@vCTxHhA`D~@~@lGx@xFcJ`C_ClE~ES|ARP~H~AdHpCvBzA`@tAbA|@x@cAzBv@pI\\\\hMrFhCfBrQnR^|BfAxB@pCfAlAhAxL|@dBfFhFbCtFbDzRB`InCtFlBlK]dAHv@_@FBpAXtArAtAVtCzAnED~@aAr@Bv@fBl@p@dAzFn]hDp~@c@pAeKrEgI`AoPb@|@_e@qGk@EnC"},{"id":"f26689b8-34f4-50d6-b414-24a5e6ab2f3b","distance":21445.845842426814,"name":"run from gpx","run_id":1663480769000,"moving_time":"2:30:27","type":"Run","average_speed":2.3757445266895774,"average_heartrate":null,"location_country":"Inlake Hostel, 北山街, 北山街道, 西湖区, 杭州市, 浙江省, 310006, 中国","start_date":"2022-09-18 05:59:29","start_date_local":"2022-09-18 13:59:29","streak":1,"summary_polyline":"_quwD{_i|UAZqAF_@`@f@xDu@JKa@RFu@Zu@rBP`Ag@~AR^g@Oh@`@Sp@T}@EdB`@rB`@n@n@IbBlD]OJ`@u@bBfBvE_CfA]hH~ApBt@RnEwCkCuB_AL?k@\\\\@\\\\y@SkAp@oAGq@oA_A\\\\?Wi@E\\\\yA}@w@aBb@e@?x@y@w@`@ZCo@?rASsDsBqI\\\\Wl@cFh@w@fABa@yD`Ck@BoFd@iBw@yA^TVnBKwARLo@pBl@s@VwBsIq]vAs@nLqAj@i@Ce_@hHy@|`AmAx@eBJiZl@mPr\\\\WvKVlDp@p@xAnA`@pZ`CnEYtFVjQjDpAKxEcCjBIzIsLdAmDd@_@lLiAvIQfJz@|EhB|D{CxR{KiMjHm@FFg@tF}BrsAgv@jKmE~HxQdK~X`X`{@dEpNXdC`p@iMv]Rb\\\\pAxRSfEu@bb@kNbFxKrGpQfLpTnKfb@vDwAlEQ`ZrBbF@JzAV?bLgBhEsAbNoHrI|PaDoFgBMyA{@kAuDk@b@TdBVTh@k@s@z@BtAYMXm@"},{"id":"e46bfc11-881b-512e-8ff6-52b62cee98f3","distance":9860.147684080963,"name":"run from gpx","run_id":1663999573000,"moving_time":"1:46:46","type":"Run","average_speed":1.539205070883697,"average_heartrate":null,"location_country":"闻堰初级中学, 闻兴路, 闻堰街道, 萧山区, 杭州市, 浙江省, 中国","start_date":"2022-09-24 06:06:13","start_date_local":"2022-09-24 14:06:13","streak":1,"summary_polyline":"uy{vDayo|UTB?iBLfEI~@CiH_@oAq@iAy@FRiEhAiEYiBwI}EmC{FiA_DVkC{BmM_D}BuA_DZsCgByCImDbA}B?Vx@E|@qB~AhACv@h@EYh@l@fASy@d@u@tDQnFp@bCrBzCnI~AnA|DAtCyAbDpA|Bm@xAv@tGt_@bD~}@yAtBwHpC{ZfBQe@\\\\wBAoD`@oA[{F\\\\cG[PsAh]v@hIX`Lm@b@iKr@Qp@i@Ni@t`@gCvV{@fEkCfDaUhJwJnMkDtCwFrBqNzBWbBmChAd@nBRJ@mAp@f@"},{"id":"68261ac5-8a7b-53f5-9bb1-f7e1943ab2d0","distance":23523.083431176485,"name":"run from gpx","run_id":1664323295000,"moving_time":"7:44:13","type":"Run","average_speed":0.8445439784287684,"average_heartrate":null,"location_country":"西溪路, 白沙泉, 西湖区, 杭州市, 浙江省, 310028, 中国","start_date":"2022-09-28 00:01:35","start_date_local":"2022-09-28 08:01:35","streak":1,"summary_polyline":"gywwDq|b|U~Aa@x@b@jBpCd@DFcADXTo@ZBl@uA@wAzBjBxAOnCfFdBhAlGtH|ChGfAzEbHrCzAbCbDdBtCtC|FhA|@vC|BlAdC`AtBF~Br@t@OvDdCxEaAtCiBvDEe@Ov@z@LlBzA|BjF|Bx@zApDpC^bE[vAu@d@iEu@kDb@oDtAHq@fAH`CcAlCUtFnBtB`GjAhAd@bCjA~AjBhGw@fEWnGxAbBrDp@jCnCXYtBv@`CjDA~EdKfBbBjC\\\\jD?Wp@JfC`BhCVdDjEfCp@fEpF^`CtAfC`C|AjB|DpFEfAjAtHb@zAtAnCp@pC[|@kCbABvA_A|CPlE`AxBvCnBx@pAhBtF|DEs@`A_C]}AlA_IQ}ClFoFTgFdFwAlAb@nAoEPgCrD_F`CfAdFElBqIlAiAh@eDhB{BN_ChHaD|F}@nBmATeBzAHjBdDxBx@nI@zAs@hCUn@g@^kB`D}C~DaDlAQtAdAzBZ`@jDZ\\\\`Bs@jAPdBtAbAzBfAkAvC@dAnCnAbAfC`@fAqA~CXrE{Fr@`@fCm@xDeBjBsBzDD`@q@Yg@a@|@j@m@dBF`Aa@Ea@kAi@CsFd@aEzBkERqBy@_EToEfA_Fv@UzCsELyAg@gCsApBcAcBoA[aAiA_AcIwDuDMgEBl@Uo@{ADuA{BeEyBkDAsHuC}C_EgAcDM}@f@eAiA]WcA|@qAs@Lo@wAZ{@]mAq@i@s@Tk@k@mAl@Kc@r@SI_@aEk@eJbBgDQgAkBaDeAaCmBaD}EMoBoEgDm@uC{A}ByAQwDqHaBoAYaDc@u@HaB|FeBX}AvBgAf@Nr@kAx@RfA}D|A{Bx@iKy@aA@i@`B}@C`@La@gATcIq@_M}B[{F}B}EGgBtA{AoAsBOcE`AeCtC[r@gADuA_@R]u@dBeBG{JmAsDUyDo@wAyEeCaCHN_@sD_GTgBgCkDk@}Bi@gFp@m@eCh@cA_Dc@Sr@g@c@SFg@zC@hBcBzBk@sFyAkBmCgDyAcAiAsBQuA_CmCwAcBK{Ad@y@Y}BgB]uB_CmB}DgA{CLwAhBoD~@yCwAsI\\\\e@yANHFm@_@[qExA[wCs@eBGsDVuAkAmGoA^kEg@_HkHyBSm@y@iDrBgAy@qCSoB_AsBtDw@Dq@yARwA}@{@{Ex@eC]]iESe@cBKo@uE^Vh@Oq@U`AQz@ZB~EkB?e@wE"},{"id":"98e55dbd-e06f-59fa-85cc-3e86589d3a8b","distance":6821.867378093161,"name":"run from gpx","run_id":1664846610000,"moving_time":"2:26:34","type":"Run","average_speed":0.7757411164536231,"average_heartrate":null,"location_country":"长兴, 台州市, 浙江省, 中国","start_date":"2022-10-04 01:23:30","start_date_local":"2022-10-04 09:23:30","streak":1,"summary_polyline":"we~kDe~keVaCqD]mBcC}@m@eAFiEa@oAw@_@bB_C[r@Cw@yCbAcCyEkAWqAh@eF}Ek@Gu@l@S{Ax@mF[kBsF}CcBaCaBO_AkAy@Dq@yAcLgMkAaDHcCmAaFoAkBKyAsBeFa@}EsCqDyAuET_Bb@tCrBxEb@Vv@[r@LjAzClB~AJlEtCbBnA`DP|Ct@bClC`C~DlBlB~CdCdAd@g@i@mGqAmEfAxCz@Fd@q@~EnDzCiA|A{D\\\\rA_FhD~EbEVvChDfGl@~EoAzDy@Io@h@_@pCrAjCl@tEnBtE|Ds@yAlBrAxBGzEnDfCb@pBdEnGdB`AVr["},{"id":"51126b98-f53e-59ff-9f2f-bb39a33bdd36","distance":15725.402622806274,"name":"run from gpx","run_id":1666492706000,"moving_time":"3:09:39","type":"Run","average_speed":1.381967011407529,"average_heartrate":null,"location_country":"闻堰初级中学, 闻兴路, 闻堰街道, 萧山区, 杭州市, 浙江省, 中国","start_date":"2022-10-23 02:38:26","start_date_local":"2022-10-23 10:38:26","streak":1,"summary_polyline":"a{{vDqso|Uz@KLg@c@_Ik@qAw@ENaEd@m@`@sCUkBsI}EeE{IYcA\\\\gCm@mAwAeKaC{AeAaBi@_BZiCoBkDMmBhA}CIcAo@cAmDaCq@qDmE}BcGK{@{@eCu@cBsB{El@gE~BmFqFcBIoEaB{@mBuDaCmCqDiDz@}By@m@aDcA_@o@XiBgDpImK]aDcAu@a@oAgBRwAo@iJ`Aq@m@hKkAfB{@x@wBsHoDp@mE|G}GlAG`BnA{BaBqBh@aCu@VgHm@oAuA}@{AkFy@CmBpAwCw@iAj@mDsC{BFuBcCoEgAm@oBK{JcCsAmBL`FYp@k@vAqEk@wFt@aCEiC^@jAtBsBuCiB}EcBsBxCkAd@gAnDuBzBr@Gd@fAgAbCtAjG`IpEzH~@lENnGvApD`At@jHbBrAhBdAdFW|LrHxKf@pEtBvA|DGpBb@nCfAhBpBf@hEWjO~AlFjDrCbHv@dI~DhRdA~MnCrCtDpB`GhE|Q`KhYfAzAnB`A`EKfAr@pGl_@zAdd@i@qC{Kt@_FsAmLq@s@fAe@bN"},{"id":"4a3aeda1-8076-571f-a93b-11821455bf56","distance":15204.191554294857,"name":"run from gpx","run_id":1667096435000,"moving_time":"4:14:00","type":"Run","average_speed":0.9976503644550432,"average_heartrate":null,"location_country":"闻堰初级中学, 闻兴路, 闻堰街道, 萧山区, 杭州市, 浙江省, 中国","start_date":"2022-10-30 02:20:35","start_date_local":"2022-10-30 10:20:35","streak":1,"summary_polyline":"wx{vDuwo|Um@_GsAmAOqAjBwH[mB}IwEwEsK\\\\_Cq@aBuAwJwCiCyAcDXgCiBcDOqBjAwD}@mBuBeAgBaDC_AmCoBmCg@oDH{@{@eCw@}BcC}Dv@oE|BkFmFqBIaEaBcAsBuDaC{B}CaEr@_CaAe@eD}BIuAgClIyKUaDgBiCcBR}Am@kJ|@m@c@R_@hLsApBiC_A_AcBYmAoAoAQ`AgFzEcFiCkARmIyBmBeBkFmAVy@z@eDg@gAb@uCeC{C@iEiDgBIaAcBGcKiC}BvC]xAyDNsB{@sCjAyEk@mEsDaG`DcAZiAxCiBjAAvAl@bAUvDxDn@WnCdBdBhCVvBtBfCrB?^\\\\HjA_@dBh@`CiBlF`B~CbF~@bDbCvApEJpBb@Vg@jHzDjJvBdCf@~C~A`AhBA`JfD~AgBWTlBvHK`Hn@fBi@l@JzAa@v@`A|CfBUGfCjAdAdBDfA_@t@vBzEdCvDfA~P|@\\\\p@Ag@b@A|IxAzAe@dC|@fAnD~ErHHvFzB`MbCjCZdDzDrGKdDpBn@`@lB`Di@pAtApGt`@l@fPVbL_@Z{B\\\\{G@cH_BsJa@w@vDK|H"},{"id":"74c2942d-ee91-5ded-bc04-a35f04eb30fb","distance":16071.512019064055,"name":"run from gpx","run_id":1668219965000,"moving_time":"4:07:52","type":"Run","average_speed":1.080655730168374,"average_heartrate":null,"location_country":"闻堰初级中学, 闻兴路, 闻堰街道, 萧山区, 杭州市, 浙江省, 中国","start_date":"2022-11-12 02:26:05","start_date_local":"2022-11-12 10:26:05","streak":1,"summary_polyline":"cy{vDwto|UGuHaAoBo@KNwDdAyEWwAyIcF{DqI_@oAZaCeCsMmCoByAgDLsCwByFlAyDu@sBaDwBgAaCAgA}BwAuCk@}DDy@_AyCiA_BmBeEp@mEhCiFmFkHeBmA}BwC_B}C}D}Dn@_C{@k@}Ds@Ay@`AF_@}A{BtBeC^mBhDoEWeDcBcC{ATyAs@uJbAi@c@f@g@xKkAlBoCqFiDkAQ~@}EpE_FGc@uBi@PeIgCqCmAyEmADaBpAaCs@gB`@iC{BqCCkCaCiDs@{@yAKaLgCwA~@m@`BKpAoDR{Bs@cD|@iDIcCuBoF_BcBh@m@lB[^gAfDwBvBpCp@aA~@Rp@eAjBx@rA|BbCdAvCtExAp@tCfDLj@c@`Cj@xBoAhDp@bCOdArAfA`ETvCbC~BpJi@fHpAhBtB`GnBpB`@~CrAdAhDXfBkB`AdBz@\\\\hASbBlBrAtFItHl@zAg@lALdA]hA|@jCdBQIbClAdAbBAz@e@`@`@PvAlANvBdBl@CzC`BlA?TyAdB[dBmAd@Nb@~AdBZ|EpCvHpAdAg@vBTl@p@t@dDjFvHOdD|AhKbAjDzBpBBvB`AtCzBrCI`D`CnALpAxDO`A|@lCpRiDTcAl@~AnGvG`J`AdVcMdA_EsAmHu@sCKk@j@m@`NQEQdAe@vYt@jW"},{"id":"b81f4e4b-054d-526e-a098-ab017e64665a","distance":20389.54402540939,"name":"run from gpx","run_id":1669431957000,"moving_time":"4:32:38","type":"Run","average_speed":1.246457025639405,"average_heartrate":null,"location_country":"闻堰初级中学, 闻兴路, 闻堰街道, 萧山区, 杭州市, 浙江省, 中国","start_date":"2022-11-26 03:05:57","start_date_local":"2022-11-26 11:05:57","streak":1,"summary_polyline":"yx{vDqzo|Uq@iDs@aAg@?JuDfAcF[gBaIcEkEiJYw@^gCo@}AwAyJeE_Ek@}ATuCgBaDMoBnAcDIi@y@yAaDuBMmAk@e@?_AiEaCqFAqAgAgCs@wB_CsE~@yDxBeFmFqBKgE_Bo@eBgDoBaAmBgB_BmDz@_Cw@u@yDk@Ko@j@aBgCFcAxHqJSeDqBqCkBVgAg@iJ|@s@i@v@e@lKgAdB_CYs@kCw@sCsBdAmEvEcFeCiAX_FOuBmBaB}AmFy@EuBxA_Cm@oA^kDkCgCJiCcCkAo@qAC}@_A_@gMgCmAbAi@xA?~A}DNoBq@uD|@eEiAaGuC}DtC_Ah@uAtCeBpBjBrCiBpC~AfAtBlBx@xDjFvCpBnAtB[zCf@tBkBhEJdAbBvCpGfAvDhEvAj@oAdNbElJtB`Cf@fDxAdApB?|ElAvEzCx@pCh@`@EnGn@~Ae@t@HbBa@v@|@pCbBO?tBdApAdBLr@e@`BhCd@ExH|DxRhAvJbBtBg@zBfAvD~ItBbCKpDXrB]Vb@APh@EdA`@^CdAnAjEtBnB\\\\bDfDrFCbEnAj@jCMl@pApB~@tGp`@nAxXj@f[h@`GfEhHrFbHb@@kAg@{CgEu@McHlJeFpOkCdCgDfFk@mI}KqAyBp@U~@nBvc@a@xGaFrGuE~@cCrAaH`He@v@BpCeFjJyMrQ{IdIiHbK_@Mo@tCmBnD}@FqEnL]Cb@uAhEoJu@}BkAk@wEoImDm@}AaEc@J@n@"}]}}}');

/***/ }),

/***/ "./public/page-data/sq/d/666401299.json":
/*!**********************************************!*\
  !*** ./public/page-data/sq/d/666401299.json ***!
  \**********************************************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"data":{"site":{"siteMetadata":{"siteTitle":"Running Page","siteUrl":"https://xuanyuan.me","description":"Personal site and blog","logo":"https://avatars.githubusercontent.com/u/698815?v=4","navLinks":[{"name":"Blog","url":"https://xuanyuan.me/blog"},{"name":"About","url":"https://xuanyuan.me"}]}}}}');

/***/ })

};
;
//# sourceMappingURL=component---src-pages-index-jsxhead.js.map