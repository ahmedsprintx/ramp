import { NextApiRequest, NextApiResponse } from "next";
import { updateOrganisation } from "@/lib/utils/propelauth";
import Organisation from "@/models/organisation";
import { connectDB } from "@/lib/config/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Ensure database connection is established before proceeding
    await connectDB();

    const { orgId, trackstarAuthCode, orgMetadata } = req.body;

    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    const existingOrg = await Organisation.findOne({ orgId });
    if (existingOrg) {
      const updatedData = {
        orgLogo: orgMetadata.orgLogo || existingOrg.orgLogo,
        trackstarAuthCode: trackstarAuthCode || existingOrg.trackstarAuthCode,
        company_url: orgMetadata.company_url || existingOrg.company_url,
        availableAgents:
          orgMetadata.availableAgents || existingOrg.availableAgents,
        orgColor: orgMetadata.orgColor || existingOrg.orgColor,
      };
      await Organisation.updateOne({ orgId }, { $set: updatedData });
    } else {
      const newOrgData = {
        orgId,
        orgLogo: orgMetadata.orgLogo,
        trackstarAuthCode,
        company_url: orgMetadata.company_url,
        availableAgents: orgMetadata.availableAgents,
        orgColor: orgMetadata.orgColor,
      };

      await Organisation.create(newOrgData);
    }

    const updatedMetadata = {
      ...orgMetadata,
      trackstarAuthCode,
    };

    await updateOrganisation({
      orgId,
      metaDetails: updatedMetadata,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating organisation:", error);
    return res.status(500).json({ error: "Failed to update metadata" });
  }
}
