'use client';
import React, { useState } from 'react';

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  // On s'assure que children est bien une chaîne de caractères.
  const codeText = Array.isArray(children) ? children.join('') : children;
  
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codeText.trim());
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = codeText.trim();
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
    }
  };

  return (
    <div className="relative my-2">
      {/* Fond très sombre pour le bloc de code */}
      <pre className={`bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto ${className}`}>
        <code className={className}>{children}</code>
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
