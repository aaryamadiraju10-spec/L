import React, { useMemo } from 'react';
import katex from 'katex';

interface MathProps {
  math?: string;
  expression?: string;
  block?: boolean;
  displayMode?: boolean;
  className?: string;
}

export const MathView: React.FC<MathProps> = ({
  math,
  expression,
  block = false,
  displayMode = false,
  className = '',
}) => {
  const isBlock = block || displayMode;
  const content = math || expression || '';
  const html = useMemo(() => {
    if (!content) return '';
    try {
      // Clean leading and trailing delimiters like $$ or $ if present
      let cleanMath = content.trim();
      if (cleanMath.startsWith('$$') && cleanMath.endsWith('$$')) {
        cleanMath = cleanMath.slice(2, -2).trim();
      } else if (cleanMath.startsWith('$') && cleanMath.endsWith('$')) {
        cleanMath = cleanMath.slice(1, -1).trim();
      } else if (cleanMath.startsWith('\\[') && cleanMath.endsWith('\\]')) {
        cleanMath = cleanMath.slice(2, -2).trim();
      }
      return katex.renderToString(cleanMath, {
        displayMode: isBlock,
        throwOnError: false,
      });
    } catch {
      return `<span class="font-mono text-emerald-600 dark:text-emerald-400">${content}</span>`;
    }
  }, [content, isBlock]);

  if (!html) return null;

  return (
    <span
      className={`inline-block select-text ${isBlock ? 'my-2 block overflow-x-auto py-1' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
