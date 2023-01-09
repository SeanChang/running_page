exports.id = "component---src-pages-404-jsx";
exports.ids = ["component---src-pages-404-jsx"];
exports.modules = {

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

/***/ "./src/pages/404.jsx?export=default":
/*!******************************************!*\
  !*** ./src/pages/404.jsx?export=default ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var src_components_Layout__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/components/Layout */ "./src/components/Layout/index.jsx");
/* harmony import */ var src_hooks_useSiteMetadata__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/hooks/useSiteMetadata */ "./src/hooks/useSiteMetadata.js");



const NotFoundPage = () => {
  const {
    siteUrl
  } = (0,src_hooks_useSiteMetadata__WEBPACK_IMPORTED_MODULE_2__["default"])();
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(src_components_Layout__WEBPACK_IMPORTED_MODULE_1__["default"], null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h1", {
    className: "f-headline"
  }, "404"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "This page doesn't exist."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "moon-gray"
  }, "If you wanna more message, you could visit", ' ', /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    className: "moon-gray b",
    href: siteUrl
  }, siteUrl)));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (NotFoundPage);

/***/ }),

/***/ "./src/styles/index.scss":
/*!*******************************!*\
  !*** ./src/styles/index.scss ***!
  \*******************************/
/***/ (() => {



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
//# sourceMappingURL=component---src-pages-404-jsx.js.map