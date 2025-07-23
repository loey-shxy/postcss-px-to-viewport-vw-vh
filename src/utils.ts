import type { OptionType, ParentExtendType } from './types';

export const getUnit = (prop: string | string[], opts: OptionType) => {
  // 检查是否是字体相关属性
  if (prop.indexOf('font') !== -1) {
    return opts.fontViewportUnit;
  }
  
  // 检查是否是高度相关属性
  if (opts.heightPropList && opts.heightPropList.some(heightProp => prop === heightProp)) {
    return opts.heightViewportUnit;
  }
  
  // 默认使用 viewportUnit
  return opts.viewportUnit;
};

export const createPxReplace = (
  opts: OptionType,
  viewportUnit: string | number,
  viewportSize: number,
) => {
  return function (m: any, $1: string) {
    if (!$1) return m;
    const pixels = parseFloat($1);
    if (pixels <= opts.minPixelValue!) return m;
    const parsedVal = toFixed((pixels / viewportSize) * 100, opts.unitPrecision!);
    return parsedVal === 0 ? '0' : `${parsedVal}${viewportUnit}`;
  };
};

export const getViewportSize = (prop: string, opts: OptionType, file: string) => {
  // 检查是否是高度相关属性，使用 viewportHeight
  if (opts.heightPropList && opts.heightPropList.some(heightProp => prop === heightProp)) {
    if (typeof opts.viewportHeight === 'function') {
      return opts.viewportHeight(file);
    }
    return opts.viewportHeight;
  }
  
  // 默认使用 viewportWidth
  if (typeof opts.viewportWidth === 'function') {
    return opts.viewportWidth(file);
  }
  return opts.viewportWidth;
};

export const toFixed = (number: number, precision: number) => {
  const multiplier = Math.pow(10, precision + 1);
  const wholeNumber = Math.floor(number * multiplier);
  return (Math.round(wholeNumber / 10) * 10) / multiplier;
};

export const blacklistedSelector = (blacklist: string[], selector: string) => {
  if (typeof selector !== 'string') return;
  return blacklist.some((regex) => {
    if (typeof regex === 'string') return selector.indexOf(regex) !== -1;
    return selector.match(regex);
  });
};

export const isExclude = (reg: RegExp, file: string) => {
  if (Object.prototype.toString.call(reg) !== '[object RegExp]') {
    throw new Error('options.exclude should be RegExp.');
  }
  return file.match(reg) !== null;
};

export const declarationExists = (decls: ParentExtendType[], prop: string, value: string) => {
  return decls?.some((decl: ParentExtendType) => {
    return decl.prop === prop && decl.value === value;
  });
};

export const validateParams = (params: string, mediaQuery: boolean) => {
  return !params || (params && mediaQuery);
};
