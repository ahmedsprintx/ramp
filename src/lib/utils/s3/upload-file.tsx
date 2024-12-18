import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createObjectCsvStringifier } from "csv-writer";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function createLocalFileAndUploadToS3(
  data: any[],
  fileName: string
): Promise<string> {
  // Create CSV content
  // const csvStringifier = createObjectCsvStringifier({
  //     header: Object.keys(data[0]).map(key => ({ id: key, title: key }))
  // });
  // const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data);

  const jsonData = JSON.stringify(data);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: Buffer.from(jsonData),
    ContentType: "application/json",
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}
