import { Bot } from "lucide-react";
import { Spinner } from "./ui/spinner";
import AnalyzerAccordion from "./ui/analyzer-accordian";

type analyzerType = {
  type: string;
  headTitle?: string;
  details?: {
    assistantType: string;
    text: string;
  };
};

const Analyzer = ({ type, headTitle, details }: analyzerType) => {
  return (
    <div className='flex align-center gap-4 mb-4'>
      <Bot className='h-[24px] w-[24px] text-gray-700 dark:text-white' />
      {type === "spinner" && <Spinner />}
      {type === "Analyzing" && (
        <AnalyzerAccordion
          text={details?.text || ""}
          type={headTitle || ""}
          assistant={details?.assistantType || ""}
        />
      )}
    </div>
  );
};

export default Analyzer;
