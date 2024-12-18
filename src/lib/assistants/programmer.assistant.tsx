import CodeInterpreter from "@e2b/code-interpreter";
import { CoreMessage, generateObject } from "ai";

import {
  generateUniqueFilename,
  getModel,
  storeFileLocally,
} from "@/lib/utils";
import { z } from "zod";

import { langfuseNode } from "@/lib/config/langfuse";
import { createStreamableUI } from "ai/rsc";
import Analyzer from "@/components/analyzer";
import { getAssistantSystemPrompt } from "../utils/prompt-management/get-prompt";
import { MessageRole } from "../types/messages-role.enum";

// Types for function returns
type ProcessedResponse = {
  isError: boolean;
  processedToolResponse: any;
  error?: string;
};

type PythonExecutionResult = {
  hasError: boolean;
  response: string;
  data: any[];
};

export async function ProgrammerAssistant(
  messages: CoreMessage[], // updated Messages
  kindOfProcessing: string,
  uiStream: ReturnType<typeof createStreamableUI>,
  toolResponseData: any,
  keys: string,
  traceId: string,
  spanId: string
): Promise<ProcessedResponse> {
  let code = ``;
  let isError = false;
  let error: string | undefined;

  const streamComponent = (
    <Analyzer
      type={"Analyzing"}
      headTitle={"Processing Data......... "}
      details={{
        assistantType: "Programmer Assistant",
        text: "By calling the appropriate tool, the system ensures efficiency, accuracy, and relevance in its responses, allowing the user to achieve their goal with minimal effort.",
      }}
    />
  );

  uiStream.update(streamComponent);

  const { prompt } = await getAssistantSystemPrompt("forecastingAgent");

  const compiledPrompt = prompt.compile({
    kindOfProcessing: kindOfProcessing,
    keys: keys,
  });

  const forecastAgentGen = langfuseNode.generation({
    name: `Forecast-agent-Generation`,
    model: getModel(false, true).modelId,
    input: [
      { role: MessageRole.SYSTEM, content: compiledPrompt },
      messages[messages.length - 1].content,
    ],
    parentObservationId: spanId,
    traceId: traceId,
    prompt: prompt,
  });

  //First making an Agent that will identify if further Processing is Required and Generate A code

  try {
    const result = await generateObject({
      model: getModel(false, true),
      system: compiledPrompt,
      messages: messages,
      schema: z.object({
        code: z.string()
          .describe(`Full Python code that implements the required processing functionality using data from a JSON file. Always use the sample path "path/to/your/file.json" for the file. The code should:
        - **Exclude any sample data**: Do not include any hardcoded data in the code.
        - **Ensure JSON output as a Data URI**: The processed data should be returned as an array of objects in JSON format, encoded as a Data URI. The result must be a Data URI.
        - **Use existing column names**: Only use the keys and values from the data; do not add or infer new column names unless explicitly mentioned.
        - **Process entire data**: Since the data is not nested under 'data', load it using \`df = pd.DataFrame(data)\`.
        - **Handle dates appropriately**:
          - Automatically detect and convert datetime columns into ISO 8601 format (\`YYYY-MM-DDTHH:MM:SS\`).
          - Convert Period types to strings.
        - **Avoid recursion depth errors**: Optimize function calls and loops to prevent max recursion depth issues.
        - **Exclude visualizations**: Do not include any graphs, charts, or tables.
        - **Handle empty or null values gracefully**: Ensure the code can handle missing data without errors.
        - **Keep the code efficient**: Write simple, clear, and optimized code.
        - **No hardcoded dynamic values**: Do not include hardcoded timestamps or dynamic values.
        - **Sandbox compatibility**: The code should be suitable for execution in a sandboxed environment.
        - **Finalize with 'result'**: Always add the line \`result\` at the end of the code.
        - **Return Data URI**: Ensure that the final output is the Data URI created in Step 3. Always follow Step 3 to create and return the Data URI.`),
      }),
    });

    code = result.object.code;
    forecastAgentGen.end({
      output: { role: MessageRole.ASSISTANT, content: code },
      usage: result.usage,
    });
  } catch (err) {
    forecastAgentGen.end({
      output: { role: MessageRole.ASSISTANT, content: "Error: " + err },
      statusMessage: error,
      level: "ERROR",
    });
    isError = true;
    error = "Error during code generation";
    console.error(err);
  }

  try {
    const fileBuffer: Buffer | undefined = await storeFileLocally(
      toolResponseData
    );
    if (!fileBuffer) {
      console.error("file Upload fail");
      langfuseNode.event({
        name: "File Upload Fail",
        traceId: traceId,
        parentObservationId: spanId,
        statusMessage: "File Upload Fail",
        level: "ERROR",
      });
      return { isError: true, processedToolResponse: [] };
    } else {
      langfuseNode.event({
        name: "File Upload Success",
        traceId: traceId,
        parentObservationId: spanId,
        statusMessage: "File Upload Successfully",
      });
    }
    const sandboxSpan = langfuseNode.span({
      name: `Sandbox-Environment`,
      traceId: traceId,
      parentObservationId: spanId,
      input: { code, fileBuffer },
    });
    spanId = sandboxSpan.id;
    const { hasError, response, data } = await executePythonCode(
      code,
      fileBuffer,
      traceId,
      spanId
    );

    if (!hasError && !(data.length < 0)) {
      return { isError, processedToolResponse: data };
    } else {
      isError = true;
      error = response;
      return { isError, processedToolResponse: [], error };
    }
  } catch (err) {
    isError = true;
    error = "Error during processing execution";
    console.error(err);
    return { isError, processedToolResponse: [], error };
  }
}

async function executePythonCode(
  code: string,
  fileBuffer: Buffer,
  traceId: string,
  spanId: string
): Promise<PythonExecutionResult> {
  let data: any[] = [];
  let hasError = false;
  let response: any;

  const pythonRuntime = langfuseNode.span({
    name: `Python-Runtime`,
    traceId: traceId,
    parentObservationId: spanId,
    input: { code, fileBuffer },
  });

  const sandbox = await CodeInterpreter.create({
    apiKey: process.env.E2B_API_KEY,
  });

  try {
    let searchResults;

    const fileName = generateUniqueFilename("json");

    const remotePath = await sandbox.uploadFile(fileBuffer, fileName);
    console.log("[Files for Interpreter]", {
      remotePath,
      fileName,
      fileBuffer,
    });

    const newCode = code.replace("path/to/your/file.json", remotePath);
    console.log("[Code for Interpreter]", newCode);
    const exec = await sandbox.notebook.execCell(newCode, {
      onResult(data) {
        console.log("[Code Interpreter Data]", data);
        return data;
      },
      onStderr: (msg) => {
        console.warn("[Code Interpreter stderr]", msg);
        return msg;
      },
      onStdout: (stdout) => {
        console.log("[Code Interpreter stdout]", stdout);
        return stdout;
      },
    });
    if (exec.error) {
      console.error("[Code Interpreter error]", exec.error);
      pythonRuntime.event({
        name: "Code Interpreter Error",
        level: "ERROR",
        output: exec.error.value,
      });
      throw new Error(exec.error.value);
    }
    searchResults = exec.results.map((result) => result.toJSON().text);
    const toolResult = searchResults?.[0];

    pythonRuntime.event({
      name: "Code Interpreter Result",
      level: "DEFAULT",
      output: exec,
    });

    if (!toolResult) {
      hasError = true;
      response = "No tool result found";
      console.error("[No processed Data Error]", toolResult);

      pythonRuntime.end({
        output: data,
        statusMessage: response,
        level: "ERROR",
      });
      return { data, hasError, response };
    } else {
      try {
        // const sanitizedData = toolResult
        //   .replace(/([{,])\s*'([^']+?)'\s*:/g, '$1"$2":') // Replace single quotes around keys
        //   .replace(/:\s*'([^']+?)'\s*([,}])/g, ':"$1"$2') // Replace single quotes around values
        //   .replace(/\n/g, "") // Remove line breaks
        //   .replace(/\\/g, "/") // Replace backslashes with forward slashes
        //   .replace(/\bnan\b/gi, "null") // Replace NaN with null (case insensitive)
        //   .replace(/\bnone\b/gi, "null") // Replace None with null (case insensitive)
        //   .replace(/'/g, '"') // Replace single quotes with double quotes
        //   .replace(/True/g, "true") // Replace True with true
        //   .replace(/False/g, "false") // Replace False with false
        //   .replace(/\)$/, ""); // Remove any trailing parenthesis
        // console.log({ sanitizedData });
        // data = JSON.parse(sanitizedData);
        const sanitizedData = toolResult.replace(/^['"]|['"]$/g, ""); // Remove any trailing parenthesis

        pythonRuntime.event({
          name: "Sanitized Data",
          input: toolResult,
          output: sanitizedData,
          startTime: new Date(),
          statusMessage: "Data Sanitized Successfully",
        });

        console.log("[Got this Response from E2b Programmer Assistant]", {
          sanitizedData,
        });

        if (sanitizedData) {
          data = parseJsonDataUri(sanitizedData);
          pythonRuntime.event({
            name: "Data Parsed to Data URI",
            input: sanitizedData,
            output: data,
            statusMessage: "Data Parsed Successfully",
          });
        } else {
          pythonRuntime.event({
            name: "No Data Found",
            statusMessage: "No Data Found",
            level: "ERROR",
          });
          data = [];
        }
        console.log("[Got this Response from E2b Programmer Assistant]", {
          data,
        });
        pythonRuntime.end({
          output: data,
          statusMessage: "Data Parsed Successfully",
        });
        return { data, hasError, response };
      } catch (error) {
        console.error("[Sanitization Error]", error);
        hasError = true;
        response = "There is an Error Occurred during Sanitization of Data";
        pythonRuntime.event({
          name: "Sanitization Error",
          input: toolResult,
          output: error,
          statusMessage: "Sanitization Error",
          level: "ERROR",
        });
        pythonRuntime.end({
          output: data,
          statusMessage: response,
          level: "ERROR",
        });
        return { data, hasError, response };
      }
    }
  } catch (error) {
    console.error("[Execution Error]", error);
    hasError = true;
    response = error;
    pythonRuntime.event({
      name: "Execution Error",
      input: error,
      statusMessage: "Execution Error",
      level: "ERROR",
    });
    return { data, hasError, response };
  } finally {
    await sandbox.close();
    // await deleteLocalFile(filePath);
    return { data, hasError, response };
  }
}

function parseJsonDataUri(dataUri: string): any {
  // Regular expression to match Data URIs
  const regex = /^data:(.*?)(;base64)?,(.*)$/;

  const matches = dataUri.match(regex);
  if (!matches) {
    throw new Error("Invalid Data URI");
  }

  const mediaType = matches[1]; // e.g., "application/json"
  const isBase64 = !!matches[2]; // true if ";base64" is present
  const data = matches[3]; // The actual data part

  let jsonString: string;
  if (isBase64) {
    // Decode Base64 data
    if (typeof Buffer !== "undefined") {
      // Node.js environment
      jsonString = Buffer.from(data, "base64").toString("utf-8");
    } else if (typeof atob !== "undefined") {
      // Browser environment
      jsonString = atob(data);
    } else {
      throw new Error("No Base64 decoding function available");
    }
  } else {
    // Decode URL-encoded data
    jsonString = decodeURIComponent(data);
  }

  // Parse the JSON string
  const jsonData = JSON.parse(jsonString);

  return jsonData;
}
