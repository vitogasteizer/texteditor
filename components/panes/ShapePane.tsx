import React, { useState, useEffect, useCallback } from 'react';

interface ShapePaneProps {
  editingElement: HTMLElement;
  onUpdateStyle: (element: HTMLElement, styles: React.CSSProperties) => void;
  onChangeZIndex: (element: HTMLElement, direction: 'front' | 'back') => void;
}

interface ShadowState {
    enabled: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
}

const getTextColorForBackground = (rgbaBg: string): string => {
    if (!rgbaBg) return '#000000';
    const match = rgbaBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#000000';

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    // Luma formula to determine brightness
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    
    return luma > 128 ? '#000000' : '#FFFFFF';
};

const ShapePane: React.FC<ShapePaneProps> = ({ editingElement, onUpdateStyle, onChangeZIndex }) => {
  const [styles, setStyles] = useState<React.CSSProperties>({});
  const shapeType = editingElement.dataset.shapeType;

  const parseStyle = (value: string | undefined, defaultValue: number): number => {
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  const parseColor = (value: string | undefined, defaultValue: string): string => {
    return value || defaultValue;
  }
  
  const parseTransform = (transform: string | undefined): number => {
    if (!transform) return 0;
    const match = /rotate\(([-]?\d*\.?\d+)deg\)/.exec(transform);
    return match ? parseFloat(match[1]) : 0;
  };
  
  const parseBoxShadow = (boxShadow: string | undefined): ShadowState => {
      const defaultState: ShadowState = { enabled: false, offsetX: 2, offsetY: 2, blur: 4, color: '#000000' };
      if (!boxShadow || boxShadow === 'none') return defaultState;
      
      const colorMatch = /(rgba?\(.+?\)|#\w+)/.exec(boxShadow);
      const color = colorMatch ? colorMatch[0] : '#000000';
      
      const pxValues = boxShadow.match(/-?\d+px/g) || [];
      
      return {
          enabled: true,
          offsetX: parseInt(pxValues[0], 10) || 0,
          offsetY: parseInt(pxValues[1], 10) || 0,
          blur: parseInt(pxValues[2], 10) || 0,
          color: color,
      };
  };
  
  const rgbaToHex = (rgba: string): {hex: string, alpha: number} => {
    if (!rgba || !rgba.startsWith('rgb')) return { hex: '#000000', alpha: 1 };
    const parts = rgba.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return { hex: '#000000', alpha: 1 };

    const r = parseInt(parts[0]).toString(16).padStart(2, '0');
    const g = parseInt(parts[1]).toString(16).padStart(2, '0');
    const b = parseInt(parts[2]).toString(16).padStart(2, '0');
    
    const alpha = parts.length >= 4 ? parseFloat(parts[3]) : 1;

    return { hex: `#${r}${g}${b}`, alpha };
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }


  useEffect(() => {
    if (editingElement) {
        const computed = window.getComputedStyle(editingElement);
        const initialStyles: React.CSSProperties = {
            width: computed.width,
            height: computed.height,
            top: computed.top,
            left: computed.left,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            borderWidth: computed.borderWidth,
            borderStyle: computed.borderStyle,
            borderRadius: computed.borderRadius,
            padding: computed.padding,
            opacity: computed.opacity,
            transform: computed.transform,
            boxShadow: computed.boxShadow,
        };
        setStyles(initialStyles);
    }
  }, [editingElement]);
  
  const handleStyleChange = useCallback((newStyles: Partial<React.CSSProperties>) => {
    setStyles(prevStyles => {
        const updatedState = { ...prevStyles, ...newStyles };
        let stylesToApply = { ...newStyles };

        if (shapeType === 'textbox') {
            const currentBg = rgbaToHex(prevStyles.backgroundColor as string);
            let finalBgColor = prevStyles.backgroundColor as string;

            if ('opacity' in newStyles) {
                const newOpacity = parseFloat(newStyles.opacity as string);
                finalBgColor = hexToRgba(currentBg.hex, newOpacity);
            } else if ('backgroundColor' in newStyles) {
                const newBgHex = newStyles.backgroundColor as string;
                finalBgColor = hexToRgba(newBgHex, currentBg.alpha);
            }
            
            updatedState.backgroundColor = finalBgColor;
            stylesToApply.backgroundColor = finalBgColor;
            
            // Auto text color contrast logic
            const textColor = getTextColorForBackground(finalBgColor);
            const innerEditableDiv = editingElement.querySelector('[contenteditable="true"]');
            if (innerEditableDiv) {
                (innerEditableDiv as HTMLElement).style.color = textColor;
            }

            // For textbox, opacity controls background alpha, not the element itself
            delete stylesToApply.opacity;
            delete updatedState.opacity;
        }

        onUpdateStyle(editingElement, stylesToApply);
        return updatedState;
    });
  }, [editingElement, onUpdateStyle, shapeType]);
  
  const handleShadowChange = (prop: keyof ShadowState, value: any) => {
      const currentShadow = parseBoxShadow(styles.boxShadow as string);
      const newShadowState = { ...currentShadow, [prop]: value };
      
      if (!newShadowState.enabled) {
          handleStyleChange({ boxShadow: 'none' });
      } else {
          const shadowString = `${newShadowState.offsetX}px ${newShadowState.offsetY}px ${newShadowState.blur}px ${newShadowState.color}`;
          handleStyleChange({ boxShadow: shadowString });
      }
  };

  const currentRotation = parseTransform(styles.transform as string);
  const currentShadow = parseBoxShadow(styles.boxShadow as string);

  const {hex: currentBgColor, alpha: currentBgAlpha} = rgbaToHex(styles.backgroundColor as string);
  const currentOpacity = shapeType === 'textbox' ? currentBgAlpha : parseFloat(styles.opacity as string) || 1;
  
  return (
    <div className="space-y-4 text-sm">
        {/* Position & Size */}
        <details className="space-y-2" open>
            <summary className="font-medium cursor-pointer">Transform & Position</summary>
            <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Left (X)</label>
                    <input type="number" value={parseStyle(styles.left as string, 0)} onChange={e => handleStyleChange({ left: `${e.target.value}px` })} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"/>
                </div>
                 <div>
                    <label className="block text-xs text-gray-500 mb-1">Top (Y)</label>
                    <input type="number" value={parseStyle(styles.top as string, 0)} onChange={e => handleStyleChange({ top: `${e.target.value}px` })} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"/>
                </div>
                 <div>
                    <label className="block text-xs text-gray-500 mb-1">Width</label>
                    <input type="number" value={parseStyle(styles.width as string, 100)} onChange={e => handleStyleChange({ width: `${e.target.value}px` })} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"/>
                </div>
                 <div>
                    <label className="block text-xs text-gray-500 mb-1">Height</label>
                    <input type="number" value={parseStyle(styles.height as string, 100)} onChange={e => handleStyleChange({ height: `${e.target.value}px` })} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"/>
                </div>
            </div>
            <div className="pt-2">
                <label className="block text-xs text-gray-500 mb-1">Rotation ({currentRotation}°)</label>
                <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={currentRotation}
                    onChange={e => handleStyleChange({ transform: `rotate(${e.target.value}deg)`})}
                    className="w-full"
                />
            </div>
        </details>
        
        {/* Fill & Border */}
        <details className="space-y-2" open>
            <summary className="font-medium cursor-pointer">Style</summary>
            <div className="space-y-2 pt-2">
                 <div>
                    <label className="block text-xs text-gray-500 mb-1">Fill Color</label>
                    <input type="color" value={currentBgColor} onChange={e => handleStyleChange({ backgroundColor: e.target.value })} className="w-full h-8 p-0 border-none rounded-md cursor-pointer"/>
                </div>
                 <div>
                    <label className="block text-xs text-gray-500 mb-1">{shapeType === 'textbox' ? 'Background Opacity' : 'Opacity'}</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={currentOpacity}
                        onChange={e => handleStyleChange({ opacity: e.target.value })}
                        className="w-full"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Border Color</label>
                        <input type="color" value={parseColor(styles.borderColor, '#000000')} onChange={e => handleStyleChange({ borderColor: e.target.value })} className="w-full h-8 p-0 border-none rounded-md cursor-pointer"/>
                    </div>
                     <div>
                        <label className="block text-xs text-gray-500 mb-1">Border Width</label>
                        <input type="number" min="0" value={parseStyle(styles.borderWidth as string, 1)} onChange={e => handleStyleChange({ borderWidth: `${e.target.value}px` })} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"/>
                    </div>
                </div>
                <div>
                     <label className="block text-xs text-gray-500 mb-1">Border Style</label>
                     <select
                        value={styles.borderStyle}
                        onChange={(e) => handleStyleChange({ borderStyle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="none">None</option>
                    </select>
                </div>
                {(shapeType === 'rectangle' || shapeType === 'textbox') && (
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Corner Radius</label>
                        <input type="number" min="0" value={parseStyle(styles.borderRadius as string, 0)} onChange={e => handleStyleChange({ borderRadius: `${e.target.value}px` })} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"/>
                    </div>
                )}
            </div>
        </details>

         <details className="space-y-2" open>
            <summary className="font-medium cursor-pointer">Shadow</summary>
            <div className="space-y-2 pt-2">
                <div className="flex items-center">
                    <input id="shadow-enabled" type="checkbox" checked={currentShadow.enabled} onChange={e => handleShadowChange('enabled', e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <label htmlFor="shadow-enabled" className="ml-2 text-xs text-gray-700 dark:text-gray-300">Enable Shadow</label>
                </div>
                {currentShadow.enabled && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">X offset</label>
                                <input type="number" value={currentShadow.offsetX} onChange={e => handleShadowChange('offsetX', parseInt(e.target.value, 10))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Y offset</label>
                                <input type="number" value={currentShadow.offsetY} onChange={e => handleShadowChange('offsetY', parseInt(e.target.value, 10))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Blur</label>
                            <input type="number" min="0" value={currentShadow.blur} onChange={e => handleShadowChange('blur', parseInt(e.target.value, 10))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"/>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Color</label>
                            <input type="color" value={currentShadow.color} onChange={e => handleShadowChange('color', e.target.value)} className="w-full h-8 p-0 border-none rounded-md cursor-pointer"/>
                        </div>
                    </>
                )}
            </div>
        </details>

        {shapeType === 'textbox' && (
             <details className="space-y-2" open>
                <summary className="font-medium cursor-pointer">Text</summary>
                 <div className="space-y-2 pt-2">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Padding</label>
                        <input type="number" min="0" value={parseStyle(styles.padding as string, 5)} onChange={e => handleStyleChange({ padding: `${e.target.value}px` })} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"/>
                    </div>
                </div>
            </details>
        )}
        
        <details className="space-y-2" open>
            <summary className="font-medium cursor-pointer">Arrange</summary>
            <div className="flex items-center gap-2 pt-2">
                <button onClick={() => onChangeZIndex(editingElement, 'front')} className="px-3 py-1.5 text-xs rounded-md flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Bring Forward</button>
                <button onClick={() => onChangeZIndex(editingElement, 'back')} className="px-3 py-1.5 text-xs rounded-md flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Send Backward</button>
            </div>
        </details>
    </div>
  );
};

export default ShapePane;