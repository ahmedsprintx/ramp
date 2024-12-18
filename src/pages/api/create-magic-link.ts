import { NextApiRequest, NextApiResponse } from "next";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { createAMagicLink, updateOrganisation } from "@/lib/utils/propelauth";

const s3 = new AWS.S3({
  accessKeyId: `${process.env.AWS_ACCESS_ID}` || "AWS_ACCESS_ID",
  secretAccessKey:
    `${process.env.AWS_SECRET_ACCESS_KEY}` || "AWS_SECRET_ACCESS_KEY",
  region: `${process.env.AWS_REGION}` || "AWS_REGION",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const magicLink = await createAMagicLink();
    console.log({ magicLink });

    return res.status(200).json({ success: true, magicLink });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({ error: "Failed to upload image" });
  }
}
