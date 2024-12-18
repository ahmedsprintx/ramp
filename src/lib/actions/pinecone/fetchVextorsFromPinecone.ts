"use server";

import pineconeClient from "@/lib/config/pinecone";

const index = pineconeClient.index("chathistory");

export const fetchVectorsFromPineCone = async () => {
  try {
    const fetchResult = await index.fetch([
      "0.6069801735301494",
      "0.7795616716149103",
    ]);
    // console.log("Fetch Results:==>>", fetchResult)
    return fetchResult;
  } catch (error) {
    console.log("Error in Fetching Data:==>>", error);
  }
};
