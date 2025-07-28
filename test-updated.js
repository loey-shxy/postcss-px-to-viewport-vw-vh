// 简单测试不依赖postcss
const { createShorthandPxReplace } = require('./lib/utils.js');

const opts = {
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
  minPixelValue: 1,
};

const file = '';

console.log('测试简写属性转换:');
console.log('');

// 测试padding简写属性
const paddingReplacer = createShorthandPxReplace('padding', opts, file);
console.log('padding: 10px 20px 30px 40px');
console.log('转换后:', paddingReplacer('10px 20px 30px 40px'));
console.log('说明: top(10px->vh), right(20px->vw), bottom(30px->vh), left(40px->vw)');
console.log('');

console.log('padding: 10px 20px');
console.log('转换后:', paddingReplacer('10px 20px'));
console.log('说明: top/bottom(10px->vh), left/right(20px->vw)');
console.log('');

// 测试margin简写属性
const marginReplacer = createShorthandPxReplace('margin', opts, file);
console.log('margin: 5px 10px 15px 20px');
console.log('转换后:', marginReplacer('5px 10px 15px 20px'));
console.log('说明: top(5px->vh), right(10px->vw), bottom(15px->vh), left(20px->vw)');
console.log('');

console.log('margin: 10px');
console.log('转换后:', marginReplacer('10px'));
console.log('说明: 四个方向都是10px，top/bottom->vh, left/right->vw');
