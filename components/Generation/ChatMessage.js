'use client';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
// Utilisez un thème sombre pour la coloration syntaxique
import 'highlight.js/styles/atom-one-dark.css';
import CodeBlock from './CodeBlock';
import Image from 'next/image';

// Chemins vers vos logos (dans le dossier public)
const openaiLogo = "/openai-logo.png";
const mistralLogo = "/mistral-logo.png";

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const displayText = message.message;
  // Utilisez le provider enregistré dans le message (ou 'gpt' par défaut)
  const provider = message.provider || 'gpt';

  const [copied, setCopied] = useState(false);
  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(displayText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = displayText;
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
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] p-3 rounded-md ${isUser ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'} relative`}>
        {/* Pour les messages du bot, affichage du logo correspondant */}
        {!isUser && (
          <div className="flex items-center mb-2">
            <Image 
              src={provider === 'mistral' ? mistralLogo : openaiLogo} 
              alt="Logo" 
              width={24} 
              height={24} 
              className="mr-2" 
            />
            <button
              onClick={handleCopyMessage}
              className="ml-auto text-xs text-gray-400 hover:text-gray-200 p-1"
              title="Copier le message"
            >
              {copied ? '✔️' : '📋'}
            </button>
          </div>
        )}
        <ReactMarkdown
          className="prose prose-invert whitespace-pre-wrap"
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize, rehypeHighlight]}
          components={{
            code({ node, inline, className, children, ...props }) {
              if (inline) {
                return (
                  <code className={`bg-gray-700 text-white p-1 rounded ${className}`} {...props}>
                    {children}
                  </code>
                );
              }
              return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
            }
          }}
        >
          {displayText}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default ChatMessage;
