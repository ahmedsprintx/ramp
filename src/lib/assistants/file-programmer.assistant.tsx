import { CoreMessage, generateObject } from "ai";
import { langfuseNode } from "@/lib/config/langfuse";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

import {
  generateUniqueFilename,
  getModel,
  storeFileLocally,
} from "@/lib/utils";
import { CodeInterpreter } from "@e2b/code-interpreter";

import { createStreamableUI } from "ai/rsc";
import Analyzer from "@/components/analyzer";
import { getAssistantSystemPrompt } from "../utils/prompt-management/get-prompt";
import { z } from "zod";

type PythonExecutionResult = {
  hasError: boolean;
  response: string;
  s3_Link: string;
};

// Types for function returns
type ProcessedResponse = {
  isError: boolean;
  s3_link: string;
  error?: string;
};

export async function fileProgrammer(
  messages: CoreMessage[], // updated Messages
  kindOfFile: string,
  uiStream: ReturnType<typeof createStreamableUI>, // updated Messages
  toolResponseData: any,
  traceId: string,
  spanId: string,
  orgId: string
): Promise<ProcessedResponse> {
  let isError = false;
  let error = "";
  let packages = "";
  let code = "";

  const streamComponent = (
    <Analyzer
      type={"Analyzing"}
      headTitle={"Creating the User Required File"}
      details={{
        assistantType: "File Programmer Assistant",
        text: kindOfFile,
      }}
    />
  );

  uiStream.update(streamComponent);

  const { prompt } = await getAssistantSystemPrompt("fileProgrammerAgent");
  const compiledPrompt = prompt.compile({
    kindOfFile: "Code Need to set in a way like to fulfill " + kindOfFile,
  });

  const fileProgrammerGen = langfuseNode.generation({
    name: `File-Programmer-Generation`,
    model: getModel(true).modelId,
    input: [
      { role: "system", content: compiledPrompt },
      messages[messages.length - 1].content,
    ],
    traceId: traceId,
    parentObservationId: spanId,
    prompt: prompt,
  });

  try {
    const result = await generateObject({
      model: getModel(true),
      system: compiledPrompt,
      messages: messages,
      schema: z.object({
        packages: z
          .string()
          .describe(
            "A string listing any additional Python packages that must be installed prior to executing the provided Python code. If all necessary packages are part of the Python standard library, this field will be empty."
          ),
        code: z
          .string()
          .describe(
            `A Python code snippet generated to meet the user's specific file processing needs. The code includes clear steps on reading a file, processing the data, and uploading the result to AWS S3 (if required). Sample data or any actual data is not embedded in the code, ensuring it remains generic and reusable.`
          ),
      }),
    });

    packages = result.object.packages;
    code = result.object.code;

    if (toolResponseData.length > 0 && !isError) {
      const sandbox = langfuseNode.span({
        name: `Sandbox Execution`,
        traceId: traceId,
        parentObservationId: spanId,
        input: result.object,
      });
      try {
        const fileBuffer: Buffer | undefined = await storeFileLocally(
          toolResponseData
        );

        if (!fileBuffer) {
          console.error("file Upload fail");
          sandbox.event({
            output: "Error: File Upload fail",
            level: "ERROR",
          });
          return { isError: true, s3_link: "" };
        }

        const codeExecution = langfuseNode.span({
          name: `Code Execution`,
          traceId: traceId,
          parentObservationId: sandbox.id,
          input: { packages, code },
        });
        const { s3_Link, hasError, response } = await executePythonCode(
          packages,
          code,
          fileBuffer,
          orgId
        );
        isError = hasError;
        error = response;

        codeExecution.end({
          output: { s3_Link, hasError, response },
          statusMessage: "Data successfully uploaded to S3",
        });

        sandbox.end({
          output: { s3_Link, hasError, response },
          statusMessage: "Data successfully uploaded to S3",
        });

        return {
          s3_link: s3_Link,
          isError,
          error,
        };
      } catch (error) {
        console.error(error);
        sandbox.end({
          output: "Error: " + error,
          level: "ERROR",
        });
        return {
          isError: true,
          s3_link: "",
          error: `ERROR: ${error}`,
        };
      }
    } else {
      return {
        isError: true,
        s3_link: "",
        error: toolResponseData.length
          ? "No Data Found to make A file "
          : isError
          ? "There is An error Occur in making a file"
          : "Unregistered Error :",
      };
    }
  } catch (err) {
    isError = true;
    error = "Error during File code generation";
    fileProgrammerGen.end({
      output: error,
      level: "ERROR",
      statusMessage: error,
    });
    console.error(err);
    return {
      isError,
      s3_link: "",
      error,
    };
  }
}

async function executePythonCode(
  packages: string,
  code: string,
  fileBuffer: Buffer,
  orgId: string
): Promise<PythonExecutionResult> {
  let s3_Link: string = "";
  let hasError = false;
  let response: any;

  const sandbox = await CodeInterpreter.create({
    apiKey: process.env.E2B_API_KEY,
    envVars: {
      S3_BUCKET_NAME: process.env.AWS_BUCKET_NAME || "",
      AWS_ACCESS_ID: process.env.AWS_ACCESS_ID || "",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
      AWS_REGION: process.env.AWS_REGION || "",
    },
  });

  const pipInit = await sandbox.process.start({
    cmd: `pip install ${packages.replaceAll(",", " ")}`,
  });

  await pipInit.wait();
  console.log(pipInit.output.stdout);

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
      throw new Error(exec.error.value);
    }
    searchResults = exec.results.map((result) => result.toJSON().text);
    const toolResult = searchResults?.[0];

    if (!toolResult) {
      hasError = true;
      response = "No tool result found";
      console.error("[No processed Data Error]", toolResult);

      return { s3_Link, hasError, response };
    } else {
      try {
        const sanitizedData = toolResult.replace(/^['"]|['"]$/g, ""); // Remove any trailing parenthesis

        const uploadedLink = await uploadBase64ToS3(sanitizedData, orgId);

        s3_Link = uploadedLink;

        return { s3_Link, hasError, response };
      } catch (error) {
        console.error("[Sanitization Error]", error);
        hasError = true;
        response = "There is an Error Occurred during Sanitization of Data";
        return { s3_Link, hasError, response };
      }
    }
  } catch (error) {
    console.error("[File Code Execution Error]", error);
    hasError = true;
    response = error;
    return { s3_Link: "", hasError, response };
  } finally {
    await sandbox.close();
    // await deleteLocalFile(filePath);
    return { s3_Link, hasError, response };
  }
}
async function uploadBase64ToS3(base64Uri: string, orgId: string) {
  try {
    // Create a new instance of the S3Client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "your-default-region", // Replace with your default region
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    // Remove the Base64 prefix from the data URI
    const base64Data = base64Uri.split(",")[1];

    // Buffer from base64 data
    const buffer = Buffer.from(base64Data, "base64");
    const ContentType = base64Uri.split(";")[0].replace("data:", "");

    // Prepare the parameters for the S3 upload
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME || "",
      Key: `${orgId || "orgId"}/files/${uuidv4()}`,
      Body: buffer,
      ContentEncoding: "base64",
      ContentType,
    };

    // Create a PutObjectCommand
    const command = new PutObjectCommand(params);

    // Upload to S3
    await s3Client.send(command);

    // Construct the URL of the uploaded object
    const s3Url = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

    return s3Url;
  } catch (error) {
    console.error(`An error occurred: ${error}`);
    return "";
  }
}
