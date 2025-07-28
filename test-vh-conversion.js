const postcss = require('postcss');
const pxToViewport = require('./lib/index.js');

// 测试CSS
const css = `
.test {
  font-size: 16px;
  width: 100px;
  height: 200px;
  padding-top: 10px;
  padding-bottom: 20px;
  padding-left: 15px;
  padding-right: 25px;
  margin-top: 5px;
  margin-bottom: 8px;
  margin-left: 12px;
  margin-right: 18px;
  min-height: 50px;
  max-height: 300px;
  border: 2px solid #000;
}
`;

// 配置选项
const options = {
  viewportWidth: 375,
  viewportHeight: 667,
  unitPrecision: 5,
  viewportUnit: 'vw',
  fontViewportUnit: 'vw',
  heightViewportUnit: 'vh',
  heightPropList: [
    'height',
    'min-height',
    'max-height',
    'padding-top',
    'padding-bottom',
    'margin-top',
    'margin-bottom',
  ],
  minPixelValue: 1,
  mediaQuery: false,
  replace: true,
};

// 执行转换
postcss([pxToViewport(options)])
  .process(css, { from: undefined })
  .then((result) => {
    console.log('转换结果:');
    console.log(result.css);
  })
  .catch((err) => {
    console.error('转换失败:', err);
  });
