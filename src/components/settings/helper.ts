"use server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import s3Client from "@/lib/config/aws";
import { getPropelAuthApis } from "@propelauth/nextjs/server";

async function uploadOrganizationLogo(
  orgId: string,
  logoData: string
): Promise<string> {
  try {
    const buffer = Buffer.from(
      logoData.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME || "AWS_BUCKET_NAME",
      Key: `/${orgId}/logo/${uuidv4()}`,
      Body: buffer,
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    return `https://${uploadParams.Bucket}.s3.amazonaws.com/${uploadParams.Key}`;
  } catch (error) {
    console.error(error);
    return "";
  }
}

export const onSaveSettings = async (props: string) => {
  try {
    const { orgColor, orgId, orgLogo, orgSettingData } = JSON.parse(props);

    console.log({ orgColor, orgId, orgLogo });
    const base64Pattern = /^data:image\/[a-zA-Z]+;base64,/;
    const isBase64 = base64Pattern.test(orgLogo);

    // Update ORG MetaData
    const orgLogoUploaded = isBase64
      ? await uploadOrganizationLogo(orgId, orgLogo)
      : orgLogo;

    await updateOrganizationMetadata(
      JSON.stringify({
        orgId,
        metadata: {
          ...orgSettingData,
          orgColor,
          orgLogo: orgLogoUploaded,
        },
      })
    );

    return {
      msg: "Updated Successfully",
      success: true,
      data: {
        orgLogo: orgLogoUploaded,
        orgColor,
      },
    };
  } catch (error) {
    console.error(error);

    // Ensure only serializable data is returned
    return {
      success: false,
      msg: "Failed to update settings",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

const updateOrganizationMetadata = async (props: string) => {
  const { orgId, metadata } = JSON.parse(props);
  const propelAuthInit = getPropelAuthApis();
  try {
    const result = await propelAuthInit.updateOrg({ orgId, metadata });
    return result;
  } catch (error) {
    throw new Error("Failed to update organization metadata");
  }
};
