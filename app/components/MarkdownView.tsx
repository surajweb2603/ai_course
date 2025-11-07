'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useEffect } from 'react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

// Preprocess content to normalize mathematical expressions
function preprocessMathContent(content: string): string {
  const steps = [
    normalizeCustomPlaceholders,
    wrapBasicOperators,
    wrapCommonExpressions,
    wrapAdvancedExpressions,
    fixSuperscriptsAndPlaceholders,
    wrapSubscriptsAndPolynomials,
    cleanupResidualArtifacts,
  ];

  return steps.reduce((text, transform) => transform(text), content);
}

function normalizeCustomPlaceholders(input: string): string {
  let result = input;

  result = result.replace(/ext\{([^}]*)\}/g, '$1');
  result = result.replace(/igg\|_\{([^}]+)\}\^\{([^}]+)\}/g, '\\int_{$1}^{$2}');
  result = result.replace(/rac\{([^}]+)\}\{([^}]+)\}/g, '\\frac{$1}{$2}');
  result = result.replace(/\\fo\s*f/g, '\\frac{P(x)}{Q(x)}');
  result = result.replace(/\\fo\s*([a-zA-Z])/g, '\\frac{$1(x)}{Q(x)}');
  result = result.replace(/\\fo\s*([^\\\s]+)/g, '\\frac{$1}{Q(x)}');
  result = result.replace(/\\f\$([0-9]+)\$/g, (match, num) => {
    const numerator = num;
    const denominator = num === '1' ? '2' : num;
    return `\\frac{${numerator}}{${denominator}}`;
  });
  result = result.replace(/\\f(\\frac\{[^}]+\}\{[^}]+\})/g, '$1');
  result = result.replace(
    /\\f(sin|cos|tan|cot|sec|csc)\(([^)]+)\)\s*\*\s*(sin|cos|tan|cot|sec|csc)\(([^)]+)\)/g,
    '\\frac{\\$1($2)}{\\$3($4)}'
  );
  result = result.replace(
    /\\f(sin|cos|tan|cot|sec|csc)\(([^)]+)\)(\s*\*\s*)(sin|cos|tan|cot|sec|csc)\(([^)]+)\)/g,
    '\\frac{\\$1($2)}{\\$4($5)}'
  );
  result = result.replace(/\f([0-9+\-\s]+)\s*-\s*(sin|cos|tan|cot|sec|csc)\(([^)]+)\)/g, '\\frac{$1-\\$2($3)}{2}');
  result = result.replace(/\\f\{([^}]+)\}\{([^}]+)\}/g, '\\frac{$1}{$2}');
  result = result.replace(/\\f([0-9]+)(?:\s*-\s*(sin|cos|tan|cot|sec|csc)\(([^)]+)\))?/g, (match, num, func, arg) => {
    if (func) {
      return `\\frac{${num}-\\${func}(${arg})}{2}`;
    }
    return `\\frac{${num}}{2}`;
  });
  result = result.replace(/extext f/g, '\\int');
  result = result.replace(/extIndefiniteIntegral/g, '\\int');

  return result;
}

function wrapBasicOperators(input: string): string {
  return input
    .replace(/≠/g, '$\\neq$')
    .replace(/≥/g, '$\\geq$')
    .replace(/≤/g, '$\\leq$')
    .replace(/±/g, '$\\pm$')
    .replace(/×/g, '$\\times$');
}

function wrapCommonExpressions(input: string): string {
  let result = input;

  result = result.replace(/(?<!\$)(\\int(?:_\{[^}]+\})?(?:\^\{[^}]+\})?\s*[fghuv]\s*\([^)]+\)\s*[dD][x-z])(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)(\\frac\{[^}]+\}\{[^}]+\}(?:\s*\+\s*[A-Z])?)(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)(\\int\s+[fghuv]\s*\([^)]+\)\s*[dD][x-z]\s*=\s*[A-Z]\(x\)\s*\+\s*[A-Z])(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$|\w)([a-zA-Z]\^[0-9n+-]+)(?!\$|\w)/g, '$$1$');
  result = result.replace(/(?<!\$)([a-zA-Z]\^[0-9n+-]+\s*[+-]\s*[0-9a-zA-Z^]+)(?!\$)/g, '$$1$');
  result = result.replace(/(\b(?:if|then|when)\s+)([a-zA-Z]\s*\([^)]*\)\s*=\s*[a-zA-Z]\^[0-9n]+)/g, '$1$$$2$$');

  return result;
}

function wrapAdvancedExpressions(input: string): string {
  let result = input;

  result = result.replace(/(?<!\$)(\\(?:sin|cos|tan|cot|sec|csc|ln|log|exp|sqrt|int|sum|prod|lim|max|min|inf|sup)\s*\([^)]+\)(?:\\(?:sin|cos|tan|cot|sec|csc|ln|log|exp)\s*\([^)]+\))*)(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)(\\(?:sin|cos|tan|cot|sec|csc)\^[0-9n+-]+\([^)]+\))(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)(\\int(?:\s+\\?[a-z]+\^[0-9n+-]+)?\([^)]+\)\s*(?:\\,)?\s*[dD][x-z])(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)([^$]*\\,?\s*[dD][x-z])(?!\$)/g, (match) => {
    if (match.includes('\\') && !match.includes('$')) {
      return `$${match}$`;
    }
    return match;
  });
  result = result.replace(/(?<!\$)(\[\\[a-z]+\s*\([^)]+\)(?:\s*[+-]\s*\\[a-z]+\s*\([^)]+\))*\])(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)(\\frac\{[^}]*\\[a-z]+[^}]*\}\{[^}]*\})(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)(\\int\s+\\?[a-z]+\s*\([^)]+\)\\?[a-z]+\s*\([^)]+\)\s*\\,?\s*[dD][x-z]\s*=\s*\\int[^$]+)(?!\$)/g, '$$1$');

  return result;
}

function fixSuperscriptsAndPlaceholders(input: string): string {
  let result = input;

  result = result.replace(/(sin|cos|tan|cot|sec|csc)²\s*\(([^)]+)\)/g, '\\$1^2($2)');
  result = result.replace(/(sin|cos|tan|cot|sec|csc)²\s*([^(])/g, '\\$1^2$2');
  result = result.replace(/(?<!\$)(\\(?:sin|cos|tan|cot|sec|csc)\s*\([^)]+\)\s*\\(?:sin|cos|tan|cot|sec|csc)\s*\([^)]+\))(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)(\\(?:sin|cos|tan|cot|sec|csc)\s*\([^)]+\)\s*\\(?:sin|cos|tan|cot|sec|csc)\s*\([^)]+\)\s*=\s*\\frac\{[^}]+\}\{[^}]+\}\s*\[[^\]]+\])(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)(\\int\s+\\[a-z]+\^[0-9n+-]+\s*\([^)]+\)\s*\\,?\s*[dD][x-z]\s*=\s*\\frac\{[^}]+\}\{[^}]+\}[^$]+)(?!\$)/g, '$$1$');
  result = result.replace(/\(?\$1\$\s*\+\s*([a-z]_[0-9])\s*([a-z])\s*\+\s*([a-z]_[0-9])\)/g, '($1 $2 + $3)');
  result = result.replace(/\$1\$\s*\}/g, '1}');
  result = result.replace(/\}\s*\+\s*\$1\$\s*\+\s*\$1\$/g, '} + \\frac{1}{2} + \\frac{1}{2}');

  return result;
}

function wrapSubscriptsAndPolynomials(input: string): string {
  let result = input;

  result = result.replace(/(?<!\$)([A-Z]_[0-9]\([a-z]+-?[a-z]?[0-9]?\)\^\{[a-z_0-9]+\})(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)([a-z]_[0-9]\)\^\{[a-z_0-9]+\})(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)([A-Z]\([a-z]\)|\([a-z]-[a-z0-9]+\))(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)([A-Z][0-9]|[a-z]_[0-9]+)(?!\$)/g, '$$1$');
  result = result.replace(/(?<!\$)([A-Z]_[0-9]\^\{[a-z_0-9]+\}|[a-z]_[0-9]\^\{[a-z_0-9]+\})(?!\$)/g, '$$1$');
  result = result.replace(/Q\s*\(2\)\s*([a-z]_[0-9]\)\^\{[a-z_0-9]+\})/g, 'Q(x) $1');

  return result;
}

function cleanupResidualArtifacts(input: string): string {
  return input
    .replace(/\blf\b/g, 'if')
    .replace(/ext\{ then \}/g, 'then')
    .replace(/ext\{ \}/g, ' ');
}

function useKatexErrorHiding() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Make all KaTeX errors use normal text color instead of red */
      .katex-error {
        color: inherit !important;
        background-color: transparent !important;
        border: none !important;
        display: none !important;
      }
      /* Hide KaTeX error tooltips and boxes completely */
      .katex-error::before,
      .katex-error::after {
        display: none !important;
      }
      /* Target error spans specifically */
      span.katex-error,
      .katex-error span,
      div.katex-error {
        color: inherit !important;
        background: transparent !important;
        border: none !important;
        display: none !important;
        visibility: hidden !important;
      }
      /* Hide error indicator dots */
      .katex .mord.error,
      .katex .mord.error::before {
        color: inherit !important;
        display: none !important;
      }
      /* Make nested katex elements inherit color */
      .katex-error > .katex,
      .katex-error .katex {
        color: inherit !important;
        display: none !important;
      }
      /* Target KaTeX error classes specifically */
      [class*="katex-error"],
      [class*="error"] {
        color: inherit !important;
        display: none !important;
        visibility: hidden !important;
      }
      /* Hide ParseError boxes specifically */
      [title*="ParseError"],
      [title*="KaTeX parse error"],
      [class*="ParseError"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
}

const katexOptions = {
  throwOnError: false,
  strict: false,
  trust: false,
  fleqn: false,
  displayMode: false,
  macros: {
    "\\RR": "\\mathbb{R}",
  },
};

const markdownComponents = {
  h1: ({ node, ...props }: any) => (
    <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-6" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="text-2xl font-bold text-gray-900 mb-3 mt-6" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4" {...props} />
  ),
  h4: ({ node, ...props }: any) => (
    <h4 className="text-lg font-semibold text-gray-800 mb-2 mt-3" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="text-gray-700 mb-4 leading-relaxed text-base" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2 ml-4" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="text-gray-700 mb-1 leading-relaxed" {...props} />
  ),
  code: ({ node, inline, children, ...props }: any) => {
    if (inline) {
      return (
        <code
          className="bg-gray-100 text-purple-700 px-2 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        className="block p-4 text-sm font-mono whitespace-pre overflow-x-auto"
        style={{
          color: '#f3f4f6',
          backgroundColor: 'transparent',
          display: 'block',
        }}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ node, children, ...props }: any) => (
    <pre
      className="bg-gray-900 rounded-lg overflow-x-auto mb-4 font-mono"
      style={{
        backgroundColor: '#111827',
        color: '#f3f4f6',
        padding: '0',
      }}
      {...props}
    >
      {children}
    </pre>
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="border-l-4 border-purple-500 pl-4 italic text-gray-600 my-4 bg-purple-50 py-2 rounded-r"
      {...props}
    />
  ),
  a: ({ node, ...props }: any) => (
    <a
      className="text-purple-600 hover:text-purple-700 underline font-medium"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-bold text-gray-900" {...props} />
  ),
  em: ({ node, ...props }: any) => (
    <em className="italic text-gray-700" {...props} />
  ),
  hr: ({ node, ...props }: any) => (
    <hr className="border-gray-200 my-6" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-gray-300" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-gray-100" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="border border-gray-300 px-4 py-2 text-gray-700" {...props} />
  ),
};

export default function MarkdownView({ content, className = '' }: MarkdownViewProps) {
  useKatexErrorHiding();

  const processedContent = preprocessMathContent(content);

  return (
    <div className={`prose max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, katexOptions]]}
        components={markdownComponents}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

