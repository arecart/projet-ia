'use client';
import React, { useState } from 'react';

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);

  const codeText = Array.isArray(children)
    ? children
        .map((child) =>
          typeof child === 'string'
            ? child
            : child?.props?.children || ''
        )
        .join('')
    : typeof children === 'string'
      ? children
      : children?.props?.children || '';

  const handleCopy = async () => {
    const success = await copyToClipboard(codeText.trim());
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative my-2">
      <pre className={`bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto ${className || ''}`}>
        <code>{codeText}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded hover:bg-gray-600"
        title="Copier le code"
      >
        {copied ? '✔️ Copié' : '📋 Copier'}
      </button>
    </div>
  );
}

export default CodeBlock;