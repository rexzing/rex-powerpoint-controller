const path = require('path')

module.exports = {
  entry: './slideshow-api.js',
  output: {
    filename: 'slideshow.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: "slideshow",
    libraryTarget: "umd"
  }
}