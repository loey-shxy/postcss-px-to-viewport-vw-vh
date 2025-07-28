import { getUnitRegexp } from './pixel-unit-regexp';
import { createPropListMatcher } from './prop-list-matcher';
import { OptionType, ParentExtendType, RuleType } from './types';
import {
  blacklistedSelector,
  createPxReplace,
  createShorthandPxReplace,
  declarationExists,
  getUnit,
  getViewportSize,
  isExclude,
  validateParams,
} from './utils';
import objectAssign from 'object-assign';

import { AtRule, Root, Rule } from 'postcss';
import postcss from 'postcss';

const defaults: Required<Omit<OptionType, 'exclude' | 'include'>> = {
  unitToConvert: 'px',
  viewportWidth: 320,
  viewportHeight: 568,
  unitPrecision: 5,
  viewportUnit: 'vw',
  fontViewportUnit: 'vw', // vmin is more suitable.
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
    'bottom'
  ],
  selectorBlackList: [],
  propList: ['*'],
  minPixelValue: 1,
  mediaQuery: false,
  replace: true,
  landscape: false,
  landscapeUnit: 'vw',
  landscapeWidth: 568,
};

const ignoreNextComment = 'px-to-viewport-ignore-next';
const ignorePrevComment = 'px-to-viewport-ignore';

const postcssPxToViewport = (options: OptionType) => {
  const opts = objectAssign({}, defaults, options);

  const pxRegex = getUnitRegexp(opts.unitToConvert);
  const satisfyPropList = createPropListMatcher(opts.propList);
  const landscapeRules: AtRule[] = [];

  return {
    postcssPlugin: 'postcss-px-to-viewport',
    Once(css: Root, { result }: { result: any }) {
      // @ts-ignore 补充类型
      css.walkRules((rule: RuleType) => {
        // Add exclude option to ignore some files like 'node_modules'
        const file = rule.source?.input.file || '';
        if (opts.exclude && file) {
          if (Object.prototype.toString.call(opts.exclude) === '[object RegExp]') {
            if (isExclude(opts.exclude as RegExp, file)) return;
          } else if (
            // Object.prototype.toString.call(opts.exclude) === '[object Array]' &&
            opts.exclude instanceof Array
          ) {
            for (let i = 0; i < opts.exclude.length; i++) {
              if (isExclude(opts.exclude[i], file)) return;
            }
          } else {
            throw new Error('options.exclude should be RegExp or Array.');
          }
        }

        if (blacklistedSelector(opts.selectorBlackList, rule.selector)) return;

        if (opts.landscape && !rule.parent?.params) {
          const landscapeRule = rule.clone().removeAll();
          rule.walkDecls((decl) => {
            if (decl.value.indexOf(opts.unitToConvert) === -1) return;
            if (!satisfyPropList(decl.prop)) return;
            let landscapeWidth;
            if (typeof opts.landscapeWidth === 'function') {
              const num = opts.landscapeWidth(file);
              if (!num) return;
              landscapeWidth = num;
            } else {
              landscapeWidth = opts.landscapeWidth;
            }

            let landscapeValue;
            const isShorthandProperty = decl.prop === 'padding' || decl.prop === 'margin';
            
            if (isShorthandProperty) {
              // 对于简写属性，需要特殊处理 - 但landscape模式统一使用landscapeUnit
              const parts = decl.value.trim().split(/\s+/);
              const newParts = parts.map(part => {
                if (part.includes('px')) {
                  return part.replace(pxRegex, createPxReplace(opts, opts.landscapeUnit, landscapeWidth));
                }
                return part;
              });
              landscapeValue = newParts.join(' ');
            } else {
              landscapeValue = decl.value.replace(
                pxRegex,
                createPxReplace(opts, opts.landscapeUnit, landscapeWidth),
              );
            }

            landscapeRule.append(
              decl.clone({
                value: landscapeValue,
              }),
            );
          });

          if (landscapeRule.nodes.length > 0) {
            landscapeRules.push((landscapeRule as unknown) as AtRule);
          }
        }

        if (!validateParams(rule.parent?.params, opts.mediaQuery)) return;

        rule.walkDecls((decl, i) => {
          if (decl.value.indexOf(opts.unitToConvert) === -1) return;
          if (!satisfyPropList(decl.prop)) return;

          const prev = decl.prev();
          // prev declaration is ignore conversion comment at same line
          if (prev && prev.type === 'comment' && prev.text === ignoreNextComment) {
            // remove comment
            prev.remove();
            return;
          }
          const next = decl.next();
          // next declaration is ignore conversion comment at same line
          if (next && next.type === 'comment' && next.text === ignorePrevComment) {
            if (/\n/.test(next.raws.before!)) {
              result.warn(
                `Unexpected comment /* ${ignorePrevComment} */ must be after declaration at same line.`,
                { node: next },
              );
            } else {
              // remove comment
              next.remove();
              return;
            }
          }

          // 检查是否是需要特殊处理的简写属性
          const isShorthandProperty = decl.prop === 'padding' || decl.prop === 'margin';
          let value;

          if (isShorthandProperty) {
            // 使用特殊的简写属性处理函数
            const shorthandReplacer = createShorthandPxReplace(decl.prop, opts, file);
            value = shorthandReplacer(decl.value);
          } else {
            // 原有的单个属性处理逻辑
            let unit;
            let size;
            const { params } = rule.parent;

            if (opts.landscape && params && params.indexOf('landscape') !== -1) {
              unit = opts.landscapeUnit;

              if (typeof opts.landscapeWidth === 'function') {
                const num = opts.landscapeWidth(file);
                if (!num) return;
                size = num;
              } else {
                size = opts.landscapeWidth;
              }
            } else {
              unit = getUnit(decl.prop, opts);
              const viewportSize = getViewportSize(decl.prop, opts, file);
              if (!viewportSize) return;
              size = viewportSize;
            }

            value = decl.value.replace(pxRegex, createPxReplace(opts, unit!, size));
          }

          if (declarationExists((decl.parent as unknown) as ParentExtendType[], decl.prop, value))
            return;

          if (opts.replace) {
            decl.value = value;
          } else {
            decl.parent?.insertAfter(i, decl.clone({ value }));
          }
        });
      });

      // if (landscapeRules.length > 0) {
      //   const landscapeRoot = new AtRule({
      //     params: '(orientation: landscape)',
      //     name: 'media',
      //   });

      //   landscapeRules.forEach((rule) => {
      //     landscapeRoot.append(rule);
      //   });
      //   css.append(landscapeRoot);
      // }
    },
    // https://www.postcss.com.cn/docs/writing-a-postcss-plugin
    // Declaration Rule RuleExit OnceExit
    // There two types or listeners: enter and exit.
    // Once, Root, AtRule, and Rule will be called before processing children.
    // OnceExit, RootExit, AtRuleExit, and RuleExit after processing all children inside node.
    OnceExit(css: Root, { AtRule }: { AtRule: any }) {
      // 在 Once里跑这段逻辑，设置横屏时，打包后到生产环境竖屏样式会覆盖横屏样式，所以 OnceExit再执行。
      if (landscapeRules.length > 0) {
        const landscapeRoot = new AtRule({
          params: '(orientation: landscape)',
          name: 'media',
        });

        landscapeRules.forEach(function(rule) {
          landscapeRoot.append(rule);
        });
        css.append(landscapeRoot);
      }
    },
  };
};

postcssPxToViewport.postcss = true;
module.exports = postcssPxToViewport;
export default postcssPxToViewport;
