"use client";

import React, { useState, useEffect } from "react";
import { MemoizedReactMarkdown } from "@/components/ui/markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import Link from "next/link";
import { Bot } from "lucide-react";
import { CodeBlock } from "./ui/code-block";
import DynamicTable from "./ui/table";
import "katex/dist/katex.min.css";
import DynamicGraph from "./ui/graph";
import { Spinner } from "./ui/spinner";
import "../app/globals.css";
import { useAppState } from "@/lib/utils/app-state";
import BigDataTable from "./ui/csv-url-table";
import CustomFilePreview from "./ui/custom-file-preview";

function validateContentOfMessage(content: string): string | null {
  try {
    if (typeof content !== "string") {
      return null;
    }
    const s3LinkMatch = content.match(/s3LinkforData:(https:\/\/[^,]+)/);
    return s3LinkMatch && s3LinkMatch[1] ? s3LinkMatch[1] : null;
  } catch (error) {
    console.error("Error in validateContentOfMessage:", error);
    return null;
  }
}

export function BotMessage({ content }: { content: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [processedContent, setProcessedContent] = useState<string | null>(null);
  const { isGenerating, setIsGenerating } = useAppState();

  useEffect(() => {
    const processContent = async () => {
      setIsLoading(true);
      const bigDataJson = validateContentOfMessage(content);

      if (bigDataJson) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setProcessedContent(content);
        } catch (error) {
          console.error("Error fetching bigDataJson:", error);
          setProcessedContent(null);
        }
      } else {
        setProcessedContent(content);
      }

      setIsLoading(false);
    };

    processContent();
  }, [content]);

  const containsLaTeX = processedContent
    ? /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/.test(processedContent)
    : false;
  const finalContent =
    containsLaTeX && processedContent
      ? preprocessLaTeX(processedContent)
      : processedContent;

  if (isLoading) {
    return (
      <div className='flex gap-4 mb-6'>
        <Bot className='h-[24px] w-[24px] text-gray-700 dark:text-white' />
        <Spinner />
      </div>
    );
  }

  if (!finalContent) {
    return null;
  }

  function extractS3Links(linkString: any) {
    try {
      // Remove the outer quotes and square brackets
      const cleanedString = linkString
        .replace(/^\"|\"$/g, "") // Remove outer quotes
        .replace(/^\[|\]$/g, ""); // Remove square brackets

      // Split the string into individual links
      const links = cleanedString
        .split(",")
        .map((link: string) => link.trim())
        .filter((link: string) => link.length > 0); // Remove any empty entries

      return links;
    } catch (error) {
      console.error("Error parsing S3 links:", error);
      return [];
    }
  }

  console.log("/////////fin", finalContent);
  return (
    <div className='flex gap-4 mb-6'>
      <Bot className='h-[24px] w-[24px] text-gray-700 dark:text-white' />
      <div className='max-w-[90%] text-textPrimaryLight dark:text-textPrimaryDark rounded-lg gap-3 overflow-hidden no-scrollbar'>
        <MemoizedReactMarkdown
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          remarkPlugins={[remarkGfm, remarkMath]}
          className='prose-sm prose-neutral prose-a:text-accent-foreground/50'
          components={{
            graph: ({ ...props }: any) => {
              const { config, title, type } = props;
              console.log("check zara  g: ", props);
              const observedConfig = config
                .replace(/([{,])\s*'([^']+?)'\s*:/g, '$1"$2":')
                .replace(/:\s*'([^']+?)'\s*([,}])/g, ':"$1"$2')
                .replace(/\n/g, "")
                .replace(/\\/g, "/")
                .replace(/\nan/g, "null")
                .replace(/\none/g, "null");

              return (
                <DynamicGraph
                  config={JSON.parse(observedConfig)}
                  title={title}
                  type={type}
                />
              );
            },
            cusomized: ({ ...props }: any) => {
              const { source, children } = props;

              // Split the source string by commas to get an array of URLs
              const urls = extractS3Links(source);

              return (
                <div>
                  {/* First render the tables */}
                  {urls.map((url: string, index: number) => (
                    <BigDataTable key={index} jsonUrl={url.trim()} />
                  ))}

                  {/* Then render any content that comes after */}
                  <div className='mt-4'>{children}</div>
                </div>
              );
            },
            table({ node, className, children, ...props }) {
              return <DynamicTable>{children}</DynamicTable>;
            },
            code({ node, className, children, ...props }) {
              // @ts-ignore
              const content = children?.[0] || "";

              if (content.trim() === "▍") {
                return (
                  <span className='mt-1 cursor-default animate-pulse text-textPrimaryLight dark:text-textPrimaryDark'>
                    ▍
                  </span>
                );
              }

              const match = /language-(\w+)/.exec(className || "");

              if (!(match && match[1])) {
                return <>{String(children)}</>;
              }

              return (
                <div className='my-4 max-w-[700px] overflow-x-scroll'>
                  <CodeBlock
                    key={Math.random()}
                    language={(match && match[1]) || ""}
                    value={String(children).replace(/\n$/, "")}
                    {...props}
                  />
                </div>
              );
            },
            img({ node, src, alt, width, height, ...props }) {
              return (
                <img
                  src={src || ""}
                  alt={alt || ""}
                  width={
                    typeof width === "number"
                      ? width
                      : parseInt(width || "300", 10)
                  }
                  height={
                    typeof height === "number"
                      ? height
                      : parseInt(height || "300", 10)
                  }
                  className='rounded-sm w-auto h-auto'
                  {...props}
                />
              );
            },
            a({ node, href, children, ...props }) {
              if (href?.includes("data_tables")) {
                return <BigDataTable jsonUrl={href.trim()} />;
              }
              if (href?.includes("files")) {
                return (
                  <CustomFilePreview
                    href={href || "#"}
                    className='text-blue-500'
                    {...props}
                  >
                    {children}
                  </CustomFilePreview>
                );
              } else {
                return (
                  <Link
                    href={href || "#"}
                    className='text-blue-500 underline'
                    target='_blank'
                    rel='noopener noreferrer'
                    {...props}
                  >
                    {children}
                  </Link>
                );
              }
            },
            blockquote({ node, children, ...props }) {
              return (
                <blockquote
                  className='font-poppins border-l-4 border-gray-300 pl-4 italic text-gray-600'
                  {...props}
                >
                  {children}
                </blockquote>
              );
            },
            ul({ node, children, ...props }) {
              return (
                <ul className='list-disc ml-6 my-2 space-y-2' {...props}>
                  {children}
                </ul>
              );
            },
            li({ node, children, ...props }) {
              return (
                <li className='pl-3 ml-0 mb-2' {...props}>
                  <div className='relative'>
                    <div className='prose-sm prose-neutral'>{children}</div>
                  </div>
                </li>
              );
            },
            p({ node, children, ...props }) {
              return (
                <p className='my-3' {...props}>
                  {children}
                </p>
              );
            },
            h1({ node, children, ...props }) {
              return (
                <h1 className='font-poppins text-2xl font-bold mb-3' {...props}>
                  {children}
                </h1>
              );
            },
            h2({ node, children, ...props }) {
              return (
                <h2
                  className='font-poppins text-xl font-semibold mb-2'
                  {...props}
                >
                  {children}
                </h2>
              );
            },
            h3({ node, children, ...props }) {
              return (
                <span
                  className='font-poppins text-lg font-semibold mb-3 block'
                  {...props}
                >
                  {children}
                </span>
              );
            },
            h4({ node, children, ...props }) {
              return (
                <span
                  className='font-poppins text-md font-semibold mb-2'
                  {...props}
                >
                  {children}
                </span>
              );
            },
            h5({ node, children, ...props }) {
              return (
                <span className='font-poppins text-sm font-semibold' {...props}>
                  {children}
                </span>
              );
            },
            h6({ node, children, ...props }) {
              return (
                <span className='font-poppins text-xs font-semibold' {...props}>
                  {children}
                </span>
              );
            },
            strong({ node, children, ...props }) {
              return (
                <strong
                  className='font-semibold text-gray-900 dark:text-gray-100'
                  {...props}
                >
                  {children}
                </strong>
              );
            },
            ol({ node, children, ...props }) {
              return (
                <ol className='list-decimal ml-6 my-2 space-y-1' {...props}>
                  {children}
                </ol>
              );
            },
            hr({ node, ...props }) {
              return <hr className='my-5' {...props} />;
            },
          }}
        >
          {finalContent}
        </MemoizedReactMarkdown>
      </div>
    </div>
  );
}

const preprocessLaTeX = (content: string) => {
  const blockProcessedContent = content.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, equation) => `$$${equation}$$`
  );
  const inlineProcessedContent = blockProcessedContent.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, equation) => `$${equation}$`
  );
  return inlineProcessedContent;
};
