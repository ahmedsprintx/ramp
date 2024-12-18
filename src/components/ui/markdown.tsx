import { FC, memo } from "react";
import ReactMarkdown, { Options, Components } from "react-markdown";

interface CustomComponents extends Components {
  graph?: (props: any) => JSX.Element;
  cusomized?: (props: any) => JSX.Element;
}

interface CustomOptions extends Options {
  components?: CustomComponents;
}

export const MemoizedReactMarkdown: FC<CustomOptions> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
);
