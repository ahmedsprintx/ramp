import { NextApiRequest, NextApiResponse } from "next";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { updateOrganisation } from "@/lib/utils/propelauth";

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
    const { file, fileName, orgColor, orgId, orgLogo, ...rest } = req.body;

    let logoUrl = orgLogo;

    // Only upload to S3 if a new file is provided
    if (file) {
      const buffer = Buffer.from(
        file.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      const uploadParams = {
        Bucket: `${process.env.AWS_BUCKET_NAME}` || "AWS_BUCKET_NAME",
        Key: `${uuidv4()}-${fileName}`,
        Body: buffer,
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
      };

      const data = await s3.upload(uploadParams).promise();
      logoUrl = data.Location;
    }

    if (orgId) {
      await updateOrganisation({
        orgId,
        orgColor,
        orgLogo: logoUrl, // This will be undefined if orgLogo is an empty string, effectively removing the logo
        metaDetails: {
          ...rest,
        },
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating organization:", error);
    return res.status(500).json({ error: "Failed to update organization" });
  }
}
