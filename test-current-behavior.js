const postcss = require('postcss');
const pxToViewport = require('./lib/index.js');
const fs = require('fs');

const css = fs.readFileSync('./test-padding-margin.css', 'utf8');

const plugin = pxToViewport({
  viewportWidth: 375,
  viewportHeight: 667,
  unitPrecision: 5,
  viewportUnit: 'vw',
  heightViewportUnit: 'vh',
  heightPropList: [
    'height',
    'line-height',
    'min-height',
    'max-height',
    'padding-top',
    'padding-bottom',
    'margin-top',
    'margin-bottom',
    'top',
    'bottom',
  ],
});

postcss([plugin])
  .process(css, { from: undefined })
  .then((result) => {
    console.log('Current behavior:');
    console.log(result.css);
  });
