
// prefer default export if available
const preferDefault = m => (m && m.default) || m


exports.components = {
  "component---cache-dev-404-page-js": preferDefault(require("/Users/sean/workspace/running_page/.cache/dev-404-page.js")),
  "component---src-pages-404-jsx": preferDefault(require("/Users/sean/workspace/running_page/src/pages/404.jsx")),
  "component---src-pages-index-jsx": preferDefault(require("/Users/sean/workspace/running_page/src/pages/index.jsx"))
}

