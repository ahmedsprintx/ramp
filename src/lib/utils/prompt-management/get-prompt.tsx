import { langfuseNode } from '@/lib/config/langfuse';

export async function getManagerSystemPrompt(manager: string) {
  const prompt = await langfuseNode.getPrompt(manager);
  const compiledPrompt = prompt.compile({
    currentDate: new Date().toString(),
  });
  return { prompt, compiledPrompt };
}

export async function getAssistantSystemPrompt(assistant: string) {
  const prompt = await langfuseNode.getPrompt(assistant);
  const compiledPrompt = prompt.compile({
    currentDate: new Date().toString(),
  });
  return { prompt, compiledPrompt };
}
