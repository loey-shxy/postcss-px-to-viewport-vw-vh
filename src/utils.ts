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

// 检查简写属性中某个位置的值是否应该使用vh单位
export const shouldUseVhForShorthandPosition = (prop: string, position: number, opts: OptionType): boolean => {
  if (!opts.heightPropList) return false;
  
  // 对于 padding 和 margin 简写属性
  if (prop === 'padding' || prop === 'margin') {
    // position 0: top, 1: right, 2: bottom, 3: left
    // top(0) 和 bottom(2) 应该使用 vh
    if (position === 0 || position === 2) {
      const correspondingProp = position === 0 ? `${prop}-top` : `${prop}-bottom`;
      return opts.heightPropList.includes(correspondingProp);
    }
  }
  
  return false;
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

// 为简写属性创建特殊的替换函数
export const createShorthandPxReplace = (
  prop: string,
  opts: OptionType,
  file: string,
) => {
  const pxRegex = /(\d*\.?\d+)px/g;
  
  return function (value: string) {
    // 将值按空格分割
    const parts = value.trim().split(/\s+/);
    const newParts: string[] = [];
    
    // 对于1个值的情况，需要为每个逻辑方向生成对应的转换值
    if (parts.length === 1) {
      const originalPart = parts[0];
      if (originalPart.includes('px')) {
        // 为四个方向分别生成转换值
        const logicalPositions = [0, 1, 2, 3]; // top, right, bottom, left
        const convertedParts = logicalPositions.map(logicalPosition => {
          const shouldUseVh = shouldUseVhForShorthandPosition(prop, logicalPosition, opts);
          
          if (shouldUseVh) {
            const viewportSize = opts.viewportHeight;
            const size = typeof viewportSize === 'function' ? viewportSize(file) : viewportSize;
            if (size) {
              const replacer = createPxReplace(opts, opts.heightViewportUnit!, size);
              return originalPart.replace(pxRegex, replacer);
            }
          } else {
            const viewportSize = opts.viewportWidth;
            const size = typeof viewportSize === 'function' ? viewportSize(file) : viewportSize;
            if (size) {
              const replacer = createPxReplace(opts, opts.viewportUnit!, size);
              return originalPart.replace(pxRegex, replacer);
            }
          }
          return originalPart;
        });
        
        // 检查是否有不同的值，如果有则返回四个值，否则返回一个值
        const uniqueValues = [...new Set(convertedParts)];
        if (uniqueValues.length === 1) {
          return uniqueValues[0];
        } else {
          return convertedParts.join(' ');
        }
      } else {
        return originalPart;
      }
    }
    
    // 根据CSS简写属性规则处理多个值的情况
    // 2个值: 上下, 左右
    // 3个值: 上, 左右, 下  
    // 4个值: 上, 右, 下, 左
    let positions: number[];
    if (parts.length === 2) {
      positions = [0, 1]; // parts[0]对应top/bottom, parts[1]对应left/right
    } else if (parts.length === 3) {
      positions = [0, 1, 2]; // parts[0]对应top, parts[1]对应left/right, parts[2]对应bottom
    } else {
      positions = [0, 1, 2, 3]; // parts[0]对应top, parts[1]对应right, parts[2]对应bottom, parts[3]对应left
    }
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let logicalPosition: number;
      
      // 根据CSS简写规则确定逻辑位置
      if (parts.length === 2) {
        logicalPosition = i === 0 ? 0 : 1; // 第一个值是top，第二个值是right (left用同样的转换)
      } else if (parts.length === 3) {
        if (i === 0) logicalPosition = 0; // top
        else if (i === 1) logicalPosition = 1; // right (left用同样的转换)
        else logicalPosition = 2; // bottom
      } else {
        logicalPosition = i; // 直接对应
      }
      
      if (part.includes('px')) {
        const shouldUseVh = shouldUseVhForShorthandPosition(prop, logicalPosition, opts);
        
        if (shouldUseVh) {
          // 使用vh单位
          const viewportSize = opts.viewportHeight;
          const size = typeof viewportSize === 'function' ? viewportSize(file) : viewportSize;
          if (size) {
            const replacer = createPxReplace(opts, opts.heightViewportUnit!, size);
            newParts[i] = part.replace(pxRegex, replacer);
          } else {
            newParts[i] = part;
          }
        } else {
          // 使用vw单位
          const viewportSize = opts.viewportWidth;
          const size = typeof viewportSize === 'function' ? viewportSize(file) : viewportSize;
          if (size) {
            const replacer = createPxReplace(opts, opts.viewportUnit!, size);
            newParts[i] = part.replace(pxRegex, replacer);
          } else {
            newParts[i] = part;
          }
        }
      } else {
        newParts[i] = part;
      }
    }
    
    return newParts.join(' ');
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
