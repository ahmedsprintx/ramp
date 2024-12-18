import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuthInfo } from "@propelauth/react";
import { useOrganizationContext } from "@/lib/context/organisation.context";
import {
  handle3plInviteUser,
  handle3plUpdateUser,
  handleInviteUser,
  handleUpdateUser,
} from "../helper";
import { useForm } from "react-hook-form";
import { usePostHogEvents } from "@/lib/hooks/usePostHogEvents";

type IndexProps = {
  isModalOpen: boolean;
  selectedUser: any;
  setSelectedUser: React.Dispatch<React.SetStateAction<any>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const Index: React.FC<IndexProps> = ({
  isModalOpen,
  setIsModalOpen,
  setSelectedUser,
  selectedUser,
}) => {
  const { user, orgHelper } = useAuthInfo();
  const { orgSettingData, orgId, orgName } = useOrganizationContext();
  const [isLoading, setIsLoading] = useState(false);

  const { captureEvent } = usePostHogEvents(`${user?.email}`);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      email: selectedUser?.userId ? selectedUser?.email : "",
      selectedRole: selectedUser?.userId ? selectedUser?.roleInOrg : "",
      selectedIntegrations: selectedUser?.userId
        ? selectedUser?.properties?.metadata?.company_urls?.map(
            (item: string) => item.split("_").pop()
          )
        : [],
    },
  });

  const [selectedIntegrations] = useState<string[]>(
    selectedUser?.userId
      ? selectedUser?.properties?.metadata?.company_urls?.map((item: string) =>
          item.split("_").pop()
        ) || []
      : []
  );

  const roles = useMemo(() => {
    return orgHelper?.getOrg(orgId)?.userInheritedRolesPlusCurrentRole;
  }, [orgHelper, orgId]);

  const handleCloseModal = () => {
    reset();
    setSelectedUser({});
    setIsModalOpen(false);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    const result = selectedUser?.userId
      ? orgSettingData?.type === "3pl"
        ? await handle3plUpdateUser({
            userId: selectedUser?.userId,
            orgId: orgId,
            selectedRole: data.selectedRole,
          })
        : await handleUpdateUser({
            userId: selectedUser?.userId,
            selectedIntegrations,
            company_url: orgName,
            orgId: orgId,
            selectedRole: data.selectedRole,
          })
      : orgSettingData?.type === "3pl"
      ? await handle3plInviteUser({
          selectedRole: data.selectedRole,
          email: data.email,
          metadata: (user as any)?.properties.metadata,
          orgId: orgId,
        })
      : await handleInviteUser({
          selectedRole: data.selectedRole,
          email: data.email,
          // selectedIntegrations: [`${integrationsData[0]?.vendor}`],
          selectedIntegrations,
          company_url: orgName,
          orgId: orgId,
        });
    if (result?.success) {
      selectedUser?.userId
        ? orgSettingData?.type === "3pl"
          ? captureEvent("3plUserInfoUpdated", {
              updatedUserId: `${selectedUser?.id}`,
              updatedByUserId: `${user?.userId}`,
              updatedRole: `${data?.selectedRole}`,
            })
          : captureEvent("brandUserInfoUpdated", {
              updatedUserId: `${selectedUser?.id}`,
              updatedByUserId: `${user?.userId}`,
              updatedRole: `${data?.selectedRole}`,
              updatedIntegrations: selectedIntegrations,
            })
        : orgSettingData?.type === "3pl"
        ? captureEvent("3plInvitedNewUser", {
            invitedWithRole: `${data.selectedRole}`,
            invitedWithEmail: `${data?.email}`,
            invitedByUserId: `${user?.userId}`,
          })
        : captureEvent("brandInvitedNewUser", {
            invitedWithRole: `${data.selectedRole}`,
            invitedWithEmail: `${data?.email}`,
            invitedByUserId: `${user?.userId}`,
            integrations: selectedIntegrations,
          });
      toast.success(
        selectedUser?.userId
          ? "User Update Successfully"
          : "User Invited Successfully"
      );
    } else {
      // @ts-ignore
      toast.error(result?.error || "User Not Invited");
    }
    setIsLoading(false);
    handleCloseModal();
  };

  return (
    <div className='fixed inset-0 z-10 bg-black bg-opacity-50 flex justify-center items-center z-[999] '>
      <div className='bg-[#f5f5f5] dark:bg-[#262626] p-6 rounded-lg shadow-lg w-[394px]'>
        <h2 className='text-lg font-semibold mb-4'>
          {selectedUser.userId ? "Update User" : "Invite User "}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label className='block mb-2'>Email:</label>
          <input
            type='email'
            disabled={selectedUser.userId}
            className={`bg-[#e5e5e5] dark:bg-[#262626] border ${
              errors.email ? "border-red-500" : "border-gray-300"
            } p-2 rounded w-full mb-4`}
            placeholder='Email'
            {...register("email", { required: true })}
          />
          {errors.email && (
            <p className='text-red-500 text-sm mb-2'>Email is required</p>
          )}

          <label className='block mb-2'>Role:</label>
          <select
            className={`bg-[#e5e5e5] dark:bg-[#262626] border ${
              errors.selectedRole ? "border-red-500" : "border-gray-300"
            } p-2 rounded w-full mb-4`}
            {...register("selectedRole", { required: true })}
          >
            <option value=''>Select</option>
            {roles &&
              roles
                ?.filter((role: string) =>
                  orgSettingData.type === "3pl"
                    ? role !== "Brand_Owner" && role !== "Owner"
                    : true
                )
                .map((role: string, index: number) => (
                  <option key={index} value={role}>
                    {role}
                  </option>
                ))}
          </select>
          {errors.selectedRole && (
            <p className='text-red-500 text-sm mb-4'>Role is required</p>
          )}

          {/* <>
            {orgSettingData?.type !== "3pl" && (
              <>
                <label className='block mb-2'>Integrations:</label>
                <select
                  className={`bg-[#e5e5e5] dark:bg-[#262626] border ${
                    errors.selectedIntegrations
                      ? "border-red-500"
                      : "border-gray-300"
                  } p-2 rounded w-full mb-4`}
                  {...register("selectedIntegrations", { required: true })}
                  onChange={handleIntegrationChange}
                >
                  <option value=''>Select</option>
                  {integrationsData.map((integration) => (
                    <option key={integration._id} value={integration.vendor}>
                      {integration.vendor}
                    </option>
                  ))}
                </select>
                {errors.selectedIntegrations && (
                  <p className='text-red-500 text-sm mb-2'>
                    At least one integration is required
                  </p>
                )}
              </>
            )}
          </> */}

          {/* {selectedIntegrations?.length > 0 && (
            <div className='flex flex-wrap gap-2 mb-4'>
              {selectedIntegrations.map((integration, index) => (
                <div
                  key={index}
                  className='bg-white text-black px-2 py-1 rounded-full flex items-center space-x-2'
                >
                  <span>{integration}</span>
                  <button
                    className='text-red-500 hover:text-red-300'
                    onClick={() => removeIntegration(integration)}
                  >
                    &#x2716;
                  </button>
                </div>
              ))}
            </div>
          )} */}

          <div className='flex'>
            <button
              className='border p-2 rounded-full mr-2 w-full'
              onClick={handleCloseModal}
              type='button'
            >
              Cancel
            </button>
            <button
              className={`bg-[#6329D6] p-2 rounded-full w-full ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              type='submit'
              disabled={isLoading}
            >
              {selectedUser.userId
                ? isLoading
                  ? "Updating..."
                  : "Update"
                : isLoading
                ? "Inviting..."
                : "Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Index;
