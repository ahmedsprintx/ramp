import { CoreMessage, generateText } from "ai";
import { createStreamableUI } from "ai/rsc";

import { getModel } from "@/lib/utils";
import { langfuseNode } from "@/lib/config/langfuse";
import Analyzer from "@/components/analyzer";
import { MessageRole } from "../types/messages-role.enum";
// import { getDesiredManager } from "./managers";
import { getDesiredManagerTools } from "./managers";

export async function InquiryAssistant(
  messages: CoreMessage[], // updated Messages
  uiStream: ReturnType<typeof createStreamableUI>, // updated Messages
  company_url: string,
  orgType?: string,
  traceId?: string
) {
  let error: string | undefined;
  let isError: boolean = false;

  let toolResponses: any = [];

  const streamComponent = (
    <Analyzer
      type={"Analyzing"}
      headTitle={"Analyzing User Query......."}
      details={{
        assistantType: "Inquiry Assistant",
        text: "The system is in the process of evaluating the user’s input to determine the exact nature of the request. This step involves parsing the query, identifying key phrases, and understanding the context to generate an appropriate response or action",
      }}
    />
  );
  uiStream.update(streamComponent);

  const inquirySpan = langfuseNode.span({
    name: "inquiry-agent-function",
    startTime: new Date(),
    input: { chatHistory: { messages }, orgType: { orgType } },
    traceId: traceId,
  });
  langfuseNode.flush();
  //Geting the Prompt for inquiryAssistant
  const prompt = await langfuseNode.getPrompt("inquiryAgent");
  const compiledPrompt = prompt.compile({});

  const inquiryGen = langfuseNode.generation({
    name: "inquiry-generation",
    input: [
      { role: MessageRole.SYSTEM, content: compiledPrompt },
      {
        role: MessageRole.USER,
        content: messages[messages.length - 1].content,
      },
    ],
    model: getModel().modelId,
    traceId: traceId,
    parentObservationId: inquirySpan.id,
    prompt: prompt,
  });

  try {
    const result = await generateText({
      model: getModel(),
      system: compiledPrompt,
      messages,
      toolChoice: "required",
      temperature: 0.5,
      tools: getDesiredManagerTools(
        uiStream,
        company_url,
        traceId,
        inquirySpan.id
      ),
    });

    if (result?.toolResults?.length) {
      const toolContents = result.toolResults
        .map((toolResult) => toolResult.result?.toolResponses)
        .flat();

      console.log("Tool Contents =======>>>", { toolContents });
      toolResponses = toolContents;
      // Finalize Span with Success Data
      inquiryGen.end({
        level: "DEFAULT",
        output: { toolResponses },
      });
      return { isError: false, error: "", toolResponses: toolResponses };
    }
  } catch (error) {
    console.log(error);
    // Finalize Span with Success Data
    inquiryGen.end({
      level: "ERROR",
      output: { error },
    });
    return { isError: true, error: error, toolResponses: [] };
  }

  return { isError: false, error: "", toolResponses: toolResponses };
}
