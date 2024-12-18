import { propelauth } from "@/lib/config/propelauth";

interface UpdateOrganisationParams {
  orgId: string;
  orgColor?: string;
  orgLogo?: string;
  trackstarAuthCode?: string;
  metaDetails: {
    availableAgents: string[];
    company_url: string;
  };
}

export async function updateOrganisation({
  orgId,
  orgColor,
  orgLogo,
  metaDetails,
}: UpdateOrganisationParams): Promise<boolean> {
  try {
    const data = await propelauth.updateOrg({
      orgId: orgId,
      metadata: {
        orgColor,
        orgLogo,
        ...metaDetails,
      },
    });
    return !!data;
  } catch (error) {
    console.error("Error updating organization:", error);
    return false;
  }
}

export async function createAMagicLink() {
  try {
    const magicLink = await propelauth.createMagicLink({
      email: "ahmed.tahir+23@sprintx.net",
      redirectToUrl: "https://ai-dev.heftiq.com/chat",
      expiresInHours: 24,
      createNewUserIfOneDoesntExist: false,
    });
    console.log({ magicLink });

    return magicLink;
  } catch (error) {
    console.error("Error updating organization:", error);
    return false;
  }
}

export default propelauth;
