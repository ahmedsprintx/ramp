"use server";
import pineconeClient from "@/lib/config/pinecone";
const model = "multilingual-e5-large";

export async function generateVectorEmbeddings(data: any) {
  try {
    //@ts-ignore
    return await pineconeClient.inference.embed(model, [data], {
      inputType: "passage",
      truncate: "END",
    });
  } catch (error) {
    console.error("Error generating embeddings:", error);
  }
}
