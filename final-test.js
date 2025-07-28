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

console.log('=== 完整测试：简写属性的vh转换功能 ===\n');

// 测试padding
console.log('1. PADDING 测试:');
const paddingReplacer = createShorthandPxReplace('padding', opts, file);

console.log('输入: padding: 10px');
console.log('输出:', paddingReplacer('10px'));
console.log('预期: top/bottom转vh, left/right转vw\n');

console.log('输入: padding: 10px 20px');
console.log('输出:', paddingReplacer('10px 20px'));
console.log('预期: 第一个值(上下)转vh, 第二个值(左右)转vw\n');

console.log('输入: padding: 10px 20px 30px');
console.log('输出:', paddingReplacer('10px 20px 30px'));
console.log('预期: 上转vh, 左右转vw, 下转vh\n');

console.log('输入: padding: 10px 20px 30px 40px');
console.log('输出:', paddingReplacer('10px 20px 30px 40px'));
console.log('预期: 上转vh, 右转vw, 下转vh, 左转vw\n');

// 测试margin
console.log('2. MARGIN 测试:');
const marginReplacer = createShorthandPxReplace('margin', opts, file);

console.log('输入: margin: 15px');
console.log('输出:', marginReplacer('15px'));
console.log('预期: top/bottom转vh, left/right转vw\n');

console.log('输入: margin: 10px 20px');
console.log('输出:', marginReplacer('10px 20px'));
console.log('预期: 第一个值(上下)转vh, 第二个值(左右)转vw\n');

// 测试混合单位
console.log('3. 混合单位测试:');
console.log('输入: padding: 10px auto 20px 5%');
console.log('输出:', paddingReplacer('10px auto 20px 5%'));
console.log('预期: 只有px值被转换, auto和%保持不变\n');

console.log('=== 测试完成 ===');
