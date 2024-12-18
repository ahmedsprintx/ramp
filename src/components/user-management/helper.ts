"use server";

import { getPropelAuthApis } from "@propelauth/nextjs/server";

interface CreateUserParams {
  email: string;
  emailConfirmed?: boolean;
  sendEmailToConfirmEmailAddress?: boolean;
  password?: string;
  askUserToUpdatePasswordOnLogin?: boolean;
  properties?: {
    metadata: {
      company_urls: string[];
    };
  };
}

interface InviteUserParams {
  email: string;
  orgId: string;
  role: string;
  additionalRoles?: string[];
}

interface handleInviteParams {
  email: string;
  selectedRole: string;
  selectedIntegrations: string[];
  company_url: string;
  orgId: string;
}
interface handle3plInviteParams {
  email: string;
  selectedRole: string;
  metadata: any;
  orgId: string;
}
interface handleInviteParams2 {
  userId: string;
  selectedRole: string;
  selectedIntegrations: string[];
  company_url: string;
  orgId: string;
}
interface handle3plInviteParams2 {
  userId: string;
  selectedRole: string;
  orgId: string;
}

const getAllUsers = async (orgId: string, page = 0, count = 100) => {
  const propelAuthInit = getPropelAuthApis();
  try {
    const users = await propelAuthInit.fetchUsersInOrg({
      orgId: orgId,
      role: undefined,
      includeOrgs: false,
      pageSize: count,
      pageNumber: page,
    });
    return { ...users };
  } catch (error) {
    console.error(error);
    return {};
  }
};
const getAllInvitedUsers = async (orgId: string, page = 0, count = 100) => {
  const propelAuthInit = getPropelAuthApis();
  try {
    const users = await propelAuthInit.fetchPendingInvites({
      orgId: orgId,
      pageSize: count,
      pageNumber: page,
    });
    return { ...users };
  } catch (error) {
    console.error(error);
    return {};
  }
};

// Create User Function
const createUser = async ({
  email,
  properties,
  emailConfirmed = true,
  sendEmailToConfirmEmailAddress = false,
  password,
  askUserToUpdatePasswordOnLogin = false,
}: CreateUserParams) => {
  const propelAuthInit = getPropelAuthApis();
  try {
    const newUser = await propelAuthInit.createUser({
      email,
      properties,
      emailConfirmed,
      sendEmailToConfirmEmailAddress,
      password,
      askUserToUpdatePasswordOnLogin,
    });
    return { ...newUser };
  } catch (error) {
    console.error(error);
    return {};
  }
};

// Invite User To Organisation
const inviteUserToOrg = async (props: InviteUserParams) => {
  const propelAuthInit = getPropelAuthApis();
  try {
    const invitation = await propelAuthInit.inviteUserToOrg(props);
    return invitation;
  } catch (error) {
    console.error(error);
    return {};
  }
};

// handle Invite fn
const handleInviteUser = async ({
  email,
  selectedRole,
  selectedIntegrations,
  company_url,
  orgId,
}: handleInviteParams) => {
  try {
    console.log("Inviting user with email:", email);
    console.log("Role:", selectedRole);
    console.log("Integrations:", selectedIntegrations);
    console.log("company Url :", company_url);

    const userCompanyUrls = selectedIntegrations.map((x) => {
      return `${company_url}_${x}`;
    });

    console.log(userCompanyUrls);

    const user = await createUser({
      email,
      properties: {
        metadata: { company_urls: userCompanyUrls },
      },
    });

    //@ts-ignore
    if (user?.userId) {
      const invite = await inviteUserToOrg({
        email,
        role: selectedRole,
        orgId,
      });
      return {
        success: invite,
        message: invite ? "SuccessFul" : "Error",
      };
    } else {
      return {
        success: false,
        message: "User Not able To create",
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: error,
    };
  }
};
const handle3plInviteUser = async ({
  email,
  selectedRole,
  metadata,
  orgId,
}: handle3plInviteParams) => {
  try {
    const user = await createUser({
      email,
      properties: {
        metadata,
      },
    });

    //@ts-ignore
    if (user?.userId) {
      const invite = await inviteUserToOrg({
        email,
        role: selectedRole,
        orgId,
      });
      return {
        success: invite,
        message: invite ? "SuccessFul" : "Error",
      };
    } else {
      return {
        success: false,
        message: "User Not able To create",
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: error,
    };
  }
};

const handleUpdateUser = async ({
  userId,
  selectedRole,
  selectedIntegrations,
  company_url,
  orgId,
}: handleInviteParams2) => {
  const propelAuthInit = getPropelAuthApis();
  try {
    const userCompanyUrls = selectedIntegrations.map((x) => {
      return `${company_url}_${x}`;
    });

    const user = await propelAuthInit.updateUserMetadata(userId, {
      properties: {
        metadata: { company_urls: userCompanyUrls },
      },
    });

    console.log(user);

    //@ts-ignore
    if (user) {
      const invite = await propelAuthInit.changeUserRoleInOrg({
        userId,
        orgId,
        role: selectedRole,
      });

      console.log(invite);
      return {
        success: invite,
        message: invite ? "SuccessFul" : "Error",
      };
    } else {
      return {
        success: false,
        message: "User Not able To create",
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: error,
    };
  }
};
const handle3plUpdateUser = async ({
  userId,
  selectedRole,
  orgId,
}: handle3plInviteParams2) => {
  const propelAuthInit = getPropelAuthApis();
  try {
    //@ts-ignore
    if (userId) {
      const invite = await propelAuthInit.changeUserRoleInOrg({
        userId,
        orgId,
        role: selectedRole,
      });

      return {
        success: invite,
        message: invite ? "SuccessFul" : "Error",
      };
    } else {
      return {
        success: false,
        message: "User Not able To create",
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: error,
    };
  }
};

const handleUpdateUerMetaData = async (
  userId: string,
  company_urls: string[],
  tenant: string,
  vendor: string
) => {
  try {
    const propelAuthInit = getPropelAuthApis();
    const ExistingCompanyURL = company_urls || [];
    ExistingCompanyURL.push(tenant.toLowerCase() + "_" + vendor.toLowerCase());
    const data = await propelAuthInit.updateUserMetadata(userId, {
      properties: {
        metadata: {
          company_urls: ExistingCompanyURL,
        },
      },
    });
    return {
      success: data,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
    };
  }
};

const removeUserHandler = async (userId: string, orgId: string) => {
  const propelAuthInit = getPropelAuthApis();

  try {
    const removeUserFromOrg = await propelAuthInit.removeUserFromOrg({
      userId,
      orgId,
    });
    const removeUserSession = await propelAuthInit.logoutAllUserSessions(
      userId
    );

    if (removeUserFromOrg) {
      const deleteUser = await propelAuthInit.deleteUser(userId);
      return deleteUser;
    }
  } catch (error) {
    return false;
  }
};

export {
  getAllUsers,
  getAllInvitedUsers,
  createUser,
  inviteUserToOrg,
  handleUpdateUser,
  handleInviteUser,
  handleUpdateUerMetaData,
  removeUserHandler,
  handle3plInviteUser,
  handle3plUpdateUser,
};
