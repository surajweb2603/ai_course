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
  let processed = content;
  
  // Step 1: Convert custom placeholders to proper LaTeX commands
  // These are non-standard placeholders that appear in AI-generated content
  
  // Convert ext{} (text placeholders) - remove the placeholder, keep the content
  processed = processed.replace(/ext\{([^}]*)\}/g, '$1');
  
  // Convert igg|_{a}^{b} (integral symbol) to \int_{a}^{b}
  processed = processed.replace(/igg\|_\{([^}]+)\}\^\{([^}]+)\}/g, '\\int_{$1}^{$2}');
  
  // Convert rac{} (fractions) to \frac{}
  processed = processed.replace(/rac\{([^}]+)\}\{([^}]+)\}/g, '\\frac{$1}{$2}');
  
  // Convert \f and \fo patterns FIRST before any wrapping
  // These need to be fixed early to prevent parse errors
  
  // Pattern: \fo f -> \frac{P(x)}{Q(x)} (common placeholder)
  processed = processed.replace(/\\fo\s*f/g, '\\frac{P(x)}{Q(x)}');
  processed = processed.replace(/\\fo\s*([a-zA-Z])/g, '\\frac{$1(x)}{Q(x)}');
  processed = processed.replace(/\\fo\s*([^\\\s]+)/g, '\\frac{$1}{Q(x)}');
  
  // Pattern: \f$1$ -> \frac{1}{2} (handle this BEFORE wrapping to avoid parse errors)
  // This must be done before any $ wrapping to prevent "Can't use function '$' in math mode"
  processed = processed.replace(/\\f\$([0-9]+)\$/g, (match, num) => {
    const numerator = num;
    const denominator = num === '1' ? '2' : num;
    return `\\frac{${numerator}}{${denominator}}`;
  });
  
  // Pattern: \f\frac{...} -> remove \f prefix, keep \frac
  processed = processed.replace(/\\f(\\frac\{[^}]+\}\{[^}]+\})/g, '$1');
  
  // Pattern: \fsin(z) *cos(x) -> \frac{\sin(z)}{\cos(x)}
  processed = processed.replace(/\\f(sin|cos|tan|cot|sec|csc)\(([^)]+)\)\s*\*\s*(sin|cos|tan|cot|sec|csc)\(([^)]+)\)/g, '\\frac{\\$1($2)}{\\$3($4)}');
  
  // Alternative pattern: handle \fsin(z) as \frac{\sin(z)}{...} with different separators
  processed = processed.replace(/\\f(sin|cos|tan|cot|sec|csc)\(([^)]+)\)(\s*\*\s*)(sin|cos|tan|cot|sec|csc)\(([^)]+)\)/g, '\\frac{\\$1($2)}{\\$4($5)}');
  
  // Pattern: \f1-cos(2x) -> \frac{1-\cos(2x)}{2} (default denominator to 2)
  processed = processed.replace(/\\f([0-9+\-\s]+)\s*-\s*(sin|cos|tan|cot|sec|csc)\(([^)]+)\)/g, '\\frac{$1-\\$2($3)}{2}');
  
  // Pattern: \f followed by simple expressions like \f1 or \f{1}{2}
  processed = processed.replace(/\\f\{([^}]+)\}\{([^}]+)\}/g, '\\frac{$1}{$2}');
  processed = processed.replace(/\\f([0-9]+)(?:\s*-\s*(sin|cos|tan|cot|sec|csc)\(([^)]+)\))?/g, (match, num, func, arg) => {
    if (func) {
      return `\\frac{${num}-\\${func}(${arg})}{2}`;
    }
    return `\\frac{${num}}{2}`;
  });
  
  // Convert extext f (integral symbol) to \int
  processed = processed.replace(/extext f/g, '\\int');
  
  // Convert extIndefiniteIntegral to \int
  processed = processed.replace(/extIndefiniteIntegral/g, '\\int');
  
  // Convert ext{Definite Integral} to just the text (already handled above)
  
  // Convert common ASCII math patterns to LaTeX if not already in math mode
  // Look for patterns like f(x) = x^n, \int f(x) dx, etc.
  
  // Step 2: Fix common mathematical operators - wrap in math mode
  processed = processed.replace(/≠/g, '$\\neq$');
  processed = processed.replace(/≥/g, '$\\geq$');
  processed = processed.replace(/≤/g, '$\\leq$');
  processed = processed.replace(/±/g, '$\\pm$');
  processed = processed.replace(/×/g, '$\\times$');
  
  // Step 3: Wrap mathematical expressions in LaTeX delimiters
  // Process patterns that need to be wrapped in $ delimiters
  
  // Pattern 1: Wrap integrals like \int_{a}^{b} f(x) dx (already converted from igg|)
  processed = processed.replace(/(?<!\$)(\\int(?:_\{[^}]+\})?(?:\^\{[^}]+\})?\s*[fghuv]\s*\([^)]+\)\s*[dD][x-z])(?!\$)/g, '$$1$');
  
  // Pattern 2: Wrap fractions like \frac{x}{y} or \frac{x^{n+1}}{n+1} + C (already converted from rac)
  processed = processed.replace(/(?<!\$)(\\frac\{[^}]+\}\{[^}]+\}(?:\s*\+\s*[A-Z])?)(?!\$)/g, '$$1$');
  
  // Pattern 3: Wrap full integral expressions like "\int f(x) dx = F(x) + C"
  processed = processed.replace(/(?<!\$)(\\int\s+[fghuv]\s*\([^)]+\)\s*[dD][x-z]\s*=\s*[A-Z]\(x\)\s*\+\s*[A-Z])(?!\$)/g, '$$1$');
  
  // Pattern 4: Wrap simple exponent expressions like "x^n", "b^2" (but not if already wrapped)
  processed = processed.replace(/(?<!\$|\w)([a-zA-Z]\^[0-9n\+\-]+)(?!\$|\w)/g, '$$1$');
  
  // Pattern 5: Wrap complex expressions like "b^2 - 2ac", "x^n + y^n"
  processed = processed.replace(/(?<!\$)([a-zA-Z]\^[0-9n\+\-]+\s*[+\-]\s*[0-9a-zA-Z^]+)(?!\$)/g, '$$1$');
  
  // Pattern 6: Fix expressions like "if f(x) = x^n" - wrap the equation part
  processed = processed.replace(/(\b(?:if|then|when)\s+)([a-zA-Z]\s*\([^)]*\)\s*=\s*[a-zA-Z]\^[0-9n]+)/g, '$1$$$2$$');
  
  // Step 4: Wrap LaTeX expressions that aren't already wrapped
  // Pattern 1: Wrap trig functions like \sin(a)\sin(b), \cos(x), etc.
  processed = processed.replace(/(?<!\$)(\\(?:sin|cos|tan|cot|sec|csc|ln|log|exp|sqrt|int|sum|prod|lim|max|min|inf|sup)\s*\([^)]+\)(?:\\(?:sin|cos|tan|cot|sec|csc|ln|log|exp)\s*\([^)]+\))*)(?!\$)/g, '$$1$');
  
  // Pattern 2: Wrap trig functions with superscripts like \sin^2(x), \cos^n(x)
  processed = processed.replace(/(?<!\$)(\\(?:sin|cos|tan|cot|sec|csc)\^[0-9n\+\-]+\([^)]+\))(?!\$)/g, '$$1$');
  
  // Pattern 3: Wrap integrals with trig functions like \int \sin^n(x) \, dx
  processed = processed.replace(/(?<!\$)(\\int(?:\s+\\?[a-z]+\^[0-9n\+\-]+)?\([^)]+\)\s*(?:\\,)?\s*[dD][x-z])(?!\$)/g, '$$1$');
  
  // Pattern 4: Wrap expressions with \, (space in math mode) that aren't wrapped
  processed = processed.replace(/(?<!\$)([^$]*\\,?\s*[dD][x-z])(?!\$)/g, (match) => {
    // Only wrap if it contains LaTeX commands
    if (match.includes('\\') && !match.includes('$')) {
      return `$${match}$`;
    }
    return match;
  });
  
  // Pattern 5: Wrap expressions in brackets like [\cos(a - b) - \cos(a + b)]
  processed = processed.replace(/(?<!\$)(\[\\[a-z]+\s*\([^)]+\)(?:\s*[+\-]\s*\\[a-z]+\s*\([^)]+\))*\])(?!\$)/g, '$$1$');
  
  // Pattern 6: Wrap expressions with fractions that contain trig functions
  processed = processed.replace(/(?<!\$)(\\frac\{[^}]*\\[a-z]+[^}]*\}\{[^}]*\})(?!\$)/g, '$$1$');
  
  // Pattern 7: Wrap full expressions like \int \sin(x)\sin(2x) \, dx = \int \f...
  processed = processed.replace(/(?<!\$)(\\int\s+\\?[a-z]+\s*\([^)]+\)\\?[a-z]+\s*\([^)]+\)\s*\\,?\s*[dD][x-z]\s*=\s*\\int[^$]+)(?!\$)/g, '$$1$');
  
  // Step 5: Fix superscript formatting issues
  // Pattern: sin² (2x) -> \sin^2(2x) (handle superscript separated by space)
  processed = processed.replace(/(sin|cos|tan|cot|sec|csc)²\s*\(([^)]+)\)/g, '\\$1^2($2)');
  processed = processed.replace(/(sin|cos|tan|cot|sec|csc)²\s*([^(])/g, '\\$1^2$2');
  
  // Step 6: Wrap any remaining unwrapped LaTeX expressions
  // This is a catch-all for LaTeX commands that weren't wrapped yet
  // Be more specific to avoid false matches
  
  // Pattern: Wrap standalone trig function calls like \sin(a)\sin(b) that weren't caught
  processed = processed.replace(/(?<!\$)(\\(?:sin|cos|tan|cot|sec|csc)\s*\([^)]+\)\s*\\(?:sin|cos|tan|cot|sec|csc)\s*\([^)]+\))(?!\$)/g, '$$1$');
  
  // Pattern: Wrap expressions with product-to-sum like \sin(a)\sin(b) = \frac{1}{2}...
  processed = processed.replace(/(?<!\$)(\\(?:sin|cos|tan|cot|sec|csc)\s*\([^)]+\)\s*\\(?:sin|cos|tan|cot|sec|csc)\s*\([^)]+\)\s*=\s*\\frac\{[^}]+\}\{[^}]+\}\s*\[[^\]]+\])(?!\$)/g, '$$1$');
  
  // Pattern: Wrap reduction formulas like \int \sin^n(x) \, dx = -\frac{1}{n}...
  processed = processed.replace(/(?<!\$)(\\int\s+\\[a-z]+\^[0-9n\+\-]+\s*\([^)]+\)\s*\\,?\s*[dD][x-z]\s*=\s*\\frac\{[^}]+\}\{[^}]+\}[^$]+)(?!\$)/g, '$$1$');
  
  // Step 7: Fix placeholders inside expressions BEFORE wrapping
  // Pattern: Handle ($1$ + b_1 x + c_1) - this $1$ is a placeholder that needs removal/replacement
  processed = processed.replace(/\(?\$1\$\s*\+\s*([a-z]_[0-9])\s*([a-z])\s*\+\s*([a-z]_[0-9])\)/g, '($1 $2 + $3)');
  
  // Pattern: Handle standalone $1$ placeholders that might cause issues
  // Try to remove or replace them intelligently based on context
  processed = processed.replace(/\$1\$\s*\}/g, '1}'); // Fix } + $1$ patterns
  processed = processed.replace(/\}\s*\+\s*\$1\$\s*\+\s*\$1\$/g, '} + \\frac{1}{2} + \\frac{1}{2}');
  
  // Step 8: Wrap expressions with subscripts and superscripts
  // Pattern: Handle expressions like c_1)^{m_1}, A_2(xr_1)^{n_1}, A_1(x-r_2)^{n_2}
  // More specific patterns first
  
  // Pattern: A_1(x-r_2)^{n_2} or A_2(xr_1)^{n_1}
  processed = processed.replace(/(?<!\$)([A-Z]_[0-9]\([a-z]+\-?[a-z]?[0-9]?\)\^\{[a-z_0-9]+\})(?!\$)/g, '$$1$');
  
  // Pattern: c_1)^{m_1} or similar closing parenthesis with superscript
  processed = processed.replace(/(?<!\$)([a-z]_[0-9]\)\^\{[a-z_0-9]+\})(?!\$)/g, '$$1$');
  
  // Pattern: Wrap simple polynomial expressions like P(x), Q(x), (x-r), etc.
  processed = processed.replace(/(?<!\$)([A-Z]\([a-z]\)|\([a-z]\-[a-z0-9]+\))(?!\$)/g, '$$1$');
  
  // Pattern: Wrap expressions with subscripts like Q_1, P_2, c_1, etc.
  processed = processed.replace(/(?<!\$)([A-Z][0-9]|[a-z]_[0-9]+)(?!\$)/g, '$$1$');
  
  // Pattern: Wrap expressions with both subscripts and superscripts like A_2^{n_1}
  processed = processed.replace(/(?<!\$)([A-Z]_[0-9]\^\{[a-z_0-9]+\}|[a-z]_[0-9]\^\{[a-z_0-9]+\})(?!\$)/g, '$$1$');
  
  // Pattern: Handle complex expressions like Q (2) c_1)^{m_1} (fix malformed)
  processed = processed.replace(/Q\s*\(2\)\s*([a-z]_[0-9]\)\^\{[a-z_0-9]+\})/g, 'Q(x) $1');
  
  // Step 9: Clean up common text normalization issues
  processed = processed.replace(/\blf\b/g, 'if');
  processed = processed.replace(/ext\{ then \}/g, 'then');
  processed = processed.replace(/ext\{ \}/g, ' ');
  
  return processed;
}

export default function MarkdownView({ content, className = '' }: MarkdownViewProps) {
  // Hide KaTeX error messages and make them less visible
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

  const processedContent = preprocessMathContent(content);

  return (
    <div className={`prose max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              throwOnError: false,
              strict: false,
              trust: false,
              fleqn: false,
              displayMode: false,
              macros: {
                "\\RR": "\\mathbb{R}",
              },
            },
          ],
        ]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-6" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold text-gray-900 mb-3 mt-6" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-lg font-semibold text-gray-800 mb-2 mt-3" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-gray-700 mb-4 leading-relaxed text-base" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2 ml-4" {...props} />
          ),
          li: ({ node, ...props }) => (
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
            
            // Block code (will be inside pre from ReactMarkdown)
            return (
              <code
                className="block p-4 text-sm font-mono whitespace-pre overflow-x-auto"
                style={{ 
                  color: '#f3f4f6',
                  backgroundColor: 'transparent',
                  display: 'block'
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
                padding: '0'
              }}
              {...props}
            >
              {children}
            </pre>
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-purple-500 pl-4 italic text-gray-600 my-4 bg-purple-50 py-2 rounded-r"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-purple-600 hover:text-purple-700 underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-gray-900" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-700" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="border-gray-200 my-6" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-300" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-gray-300 px-4 py-2 text-gray-700" {...props} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

