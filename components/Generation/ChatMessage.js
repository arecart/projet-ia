'use client';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import CodeBlock from './CodeBlock';
import Image from 'next/image';

const openaiLogo = "/openai-logo.png";
const mistralLogo = "/mistral-logo.png";

// Copier du texte dans le presse-papiers
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

// Nettoyer le texte pour corriger les erreurs d'encodage
const cleanText = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .normalize('NFC')
    .replace(/\\x([0-9A-Fa-f]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)))
    .replace(/\\u([0-9A-Fa-f]{4})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)))
    .replace(/â€™/g, "'")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã¢/g, "â")
    .replace(/Ã/g, "à")
    .replace(/\s+/g, ' ')
    .replace(/([.,!?])([^\s])/g, '$1 $2')
    .replace(/([a-zA-Z])([.,!?])([a-zA-Z])/g, '$1$2 $3')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
};

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const rawText = message.message || '';
  const displayText = cleanText(rawText);
  const provider = message.provider || 'gpt';
  const providerLogo = provider === 'mistral' || provider === 'pixtral' ? mistralLogo : openaiLogo;
  const [copied, setCopied] = useState(false);

  // Gestion de la copie du message
  const handleCopyMessage = async () => {
    const success = await copyToClipboard(displayText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };



  return (
    <div className={`mb-6 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`w-full max-w-[70%] p-4 rounded-lg shadow-md ${
          isUser ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-200'
        }`}
      >
        {!isUser && (
          <div className="flex items-center mb-2">
            <Image
              src={providerLogo}
              alt={`${provider} logo`}
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

        {/* Affichage de l'image si elle existe */}
        {message.image && (
          <div className="mb-2">
            <img src={message.image} alt="Image attachée" className="max-w-xs rounded" />
          </div>
        )}

        {/* Affichage du texte avec Markdown */}
        {displayText && (
          <ReactMarkdown
            className="prose prose-invert max-w-none text-gray-200 leading-relaxed break-words"
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize, rehypeHighlight]}
            components={{
              code({ node, inline, className, children, ...props }) {
                return inline ? (
                  <code className={`bg-gray-700 text-white px-1 py-0.5 rounded ${className}`} {...props}>
                    {children}
                  </code>
                ) : (
                  <CodeBlock className={className} {...props}>{children}</CodeBlock>
                );
              },
              p({ children }) {
                return <p className="mb-4">{children}</p>;
              },
              ul({ children }) {
                return <ul className="list-disc pl-6 mb-4">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal pl-6 mb-4">{children}</ol>;
              },
            }}
          >
            {displayText}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;