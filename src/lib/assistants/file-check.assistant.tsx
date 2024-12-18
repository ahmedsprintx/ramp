import { CoreMessage, generateObject } from 'ai';

import { getModel } from '@/lib/utils';
import { createStreamableUI } from 'ai/rsc';
import Analyzer from '@/components/analyzer';
import { getAssistantSystemPrompt } from '../utils/prompt-management/get-prompt';
import { langfuseNode } from '../config/langfuse';
import { MessageRole } from '../types/messages-role.enum';
import { z } from 'zod';

// Types for function returns
type ProcessedResponse = {
  isError: boolean;
  isFileDownloadRequired: boolean;
  kindOfFile: string;
  error?: string;
};

type ProcessingAgent = {
  isFileDownloadRequired: boolean;
  kindOfFile: string;
};
type Messages = {
  content: string; // This is the JSON string
  role: string; // Role could be 'user', 'system', etc.
};

function concatMessagesContent(messages: CoreMessage[]): string {
  return messages
    .map((message) =>
      typeof message.content === 'string' ? message.content : ''
    ) // Pick only if content is a string
    .join(' '); // Join the content with a space
}

export async function fileProcessingAgent(
  userInput: string,
  uiStream: ReturnType<typeof createStreamableUI>,
  traceId: string,
  spanId: string
): Promise<ProcessedResponse> {
  let processingAgent: ProcessingAgent = {
    isFileDownloadRequired: false,
    kindOfFile: '',
  };
  let isError = false;
  let error: string | undefined;
  const streamComponent = (
    <Analyzer
      type={'Analyzing'}
      headTitle={'Checking If User Needs A File Download......... '}
      details={{
        assistantType: 'File Download Processing Assistant',
        text: 'By calling the appropriate tool, the system ensures efficiency, accuracy, and relevance in its responses, allowing the user to achieve their goal with minimal effort.',
      }}
    />
  );

  uiStream.update(streamComponent);

  const { prompt, compiledPrompt } = await getAssistantSystemPrompt(
    'fileProcessingAgent'
  );

  const fileProcessingAgentGen = langfuseNode.generation({
    name: `File-Processing-Check-Generation`,
    model: getModel(true).modelId,
    input: [
      { role: MessageRole.SYSTEM, content: compiledPrompt },
      { role: MessageRole.USER, content: userInput },
    ],
    traceId: traceId,
    parentObservationId: spanId,
    prompt: prompt,
  });

  //First making an Agent that will identify if further Processing is Required and Generate A code
  try {
    const result = await generateObject({
      model: getModel(true),
      system: compiledPrompt,
      prompt: userInput,
      schema: z.object({
        isFileDownloadRequired: z
          .boolean()
          .describe(
            'Indicates whether file creation is required. True if,file Creating based on the data is required is necessary; False if, no  File Download is needed.'
          ),
        kindOfFile: z
          .string()
          .describe(
            'A Detail description for the kind of file like pdf, docx, pptx, etc is Required to DownLoad. And what should it looked like. detailed description'
          ),
      }),
    });

    processingAgent.isFileDownloadRequired =
      result.object.isFileDownloadRequired;
    processingAgent.kindOfFile = result.object.kindOfFile;

    fileProcessingAgentGen.end({
      output: { result: result.object },
      usage: result.usage,
    });

    return {
      isError,
      error,
      isFileDownloadRequired: processingAgent.isFileDownloadRequired,
      kindOfFile: processingAgent.kindOfFile,
    };
  } catch (error) {
    fileProcessingAgentGen.end({
      output: { role: MessageRole.ASSISTANT, content: error },
      level: 'ERROR',
    });
    return {
      error: 'Error: ' + error,
      isError: true,
      isFileDownloadRequired: processingAgent.isFileDownloadRequired,
      kindOfFile: processingAgent.kindOfFile,
    };
  }
}
