"use client";

import { FC, memo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import { generateId } from "ai";
import { Check, Copy, Download } from "lucide-react";

interface Props {
  language: string;
  value: string;
}

interface LanguageMap {
  [key: string]: string | undefined;
}

export const programmingLanguages: LanguageMap = {
  javascript: ".js",
  python: ".py",
  java: ".java",
  c: ".c",
  cpp: ".cpp",
  "c++": ".cpp",
  "c#": ".cs",
  ruby: ".rb",
  php: ".php",
  swift: ".swift",
  "objective-c": ".m",
  kotlin: ".kt",
  typescript: ".ts",
  go: ".go",
  perl: ".pl",
  rust: ".rs",
  scala: ".scala",
  haskell: ".hs",
  lua: ".lua",
  shell: ".sh",
  sql: ".sql",
  html: ".html",
  css: ".css",
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
};

const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const downloadAsFile = () => {
    if (typeof window === "undefined") return;

    const fileExtension = programmingLanguages[language] || ".file";
    const suggestedFileName = `file-${generateId()}${fileExtension}`;
    const fileName = window.prompt("Enter file name", suggestedFileName);

    if (!fileName) return;

    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(value);
  };
  console.log(language);

  return (
    <div className='relative w-full font-mono bg-neutral-900 rounded-lg shadow-md overflow-hidden '>
      <div className='flex items-center justify-between px-4 py-2 bg-neutral-800 text-white rounded-t-lg'>
        <span className='text-sm text-white font-medium lowercase'>
          {language}
        </span>
        <div className='flex items-center space-x-2'>
          <button
            onClick={downloadAsFile}
            className='p-1 text-white hover:text-white transition-colors cursor-pointer'
            title='Download file'
          >
            <Download color='white' className='w-4 h-4' />
          </button>
          <button
            onClick={onCopy}
            className='p-1 text-white hover:text-white transition-colors cursor-pointer'
            title='Copy code'
          >
            {isCopied ? (
              <Check color='white' className='w-4 h-4' />
            ) : (
              <Copy color='white' className='w-4 h-4' />
            )}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={a11yDark}
        PreTag='div'
        showLineNumbers
        customStyle={{
          cursor: "text",
          margin: 0,
          padding: "1rem",
          background: "transparent",
        }}
        lineNumberStyle={{
          userSelect: "none",
          color: "#6b7280",
        }}
        codeTagProps={{
          style: {
            color: "white",
            fontSize: "0.875rem",
            fontFamily: "inherit",
          },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";

export { CodeBlock };
