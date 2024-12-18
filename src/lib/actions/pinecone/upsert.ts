"use server";
import pineconeClient from "@/lib/config/pinecone";
import { generateVectorEmbeddings } from "./generateEmbeddings";

const index = pineconeClient.index("chathistory");
export const upserDataInPienecone = async (
  messages: any,
  agent: string,
  organisationId: string,
  userId: string,
  sender: string
) => {
  console.log(messages, "==>>>> from herer");
  try {
    const result = await generateVectorEmbeddings(messages);
    if (result) {
      console.log("got the result", result);
      await index.upsert([
        {
          id: `${Math.random()}`,
          values: result?.data[0]?.values || [],
          metadata: {
            userAgent: agent,
            organisationId: organisationId,
            userId: userId,
            sender: sender,
          },
        },
      ]);
    }
  } catch (error) {
    console.log("//////=======", error);
  }
};
