"use client";
import { CircleMinus, Pencil, SearchIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useOrganizationContext } from "@/lib/context/organisation.context";
import { getAllInvitedUsers, getAllUsers, removeUserHandler } from "./helper";
import InviteModal from "./invite-modal";
import GenericTable from "../ui/generic-table";
import { toast } from "react-toastify";
import { useAuthInfo } from "@propelauth/react";
import { usePostHogEvents } from "@/lib/hooks/usePostHogEvents";

interface User {
  userId: string;
  email: string;
  roleInOrg: string;
  enabled: boolean;
  properties: {
    metadata?: string[];
  };
}
interface InvitedUser {
  inviteeEmail: string;
  orgId: string;
  orgName: string;
  roleInOrg: string;
  additionalRolesInOrg: string[];
  createdAt: number;
  expiresAt: number;
  inviterEmail: string;
  inviterUserId: string;
}

function Index() {
  const { orgId, orgName, orgSettingData } = useOrganizationContext();
  const [usersData, setUsersData] = useState<User[]>([]);
  const [invitedUsersData, setInvitedUsersData] = useState<InvitedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkInvitedUsers, setCheckInvitedUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuthInfo();
  const { captureEvent } = usePostHogEvents(`${user?.email}`);

  const fetchUserHandler = useCallback(async () => {
    try {
      setIsLoading(true);
      const users: any = await getAllUsers(orgId);
      const invitedUsers: any = await getAllInvitedUsers(orgId);

      console.log(orgId, users, invitedUsers);

      if (users?.users && Array.isArray(users.users)) {
        setUsersData(users?.users?.length > 0 ? users?.users : []);
      } else {
        console.error("Failed to retrieve users or users is not an array");
      }
      if (invitedUsers?.invites && Array.isArray(invitedUsers?.invites)) {
        setInvitedUsersData(
          invitedUsers?.invites?.length > 0 ? invitedUsers?.invites : []
        );
      } else {
        console.error(
          "Failed to retrieve invitedUsers or users is not an array"
        );
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching users:", error);
    }
  }, [orgId]);

  // Fetch Users
  useEffect(() => {
    if (orgId && !isModalOpen) {
      captureEvent("visited_user_management_page", {});
      fetchUserHandler();
    }
  }, [fetchUserHandler, orgId, isModalOpen, captureEvent]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handlerRemoveUser = async (userId: string) => {
    const res: any = await removeUserHandler(userId, orgId);
    if (res) {
      captureEvent("user_deleted", {
        deletedUserId: `${userId}`,
        deletedByUserId: `${user?.userId}`,
        organisationFromWhichUserIsDeleted: `${orgId}`,
      });
      await fetchUserHandler();
      toast.success("User removed From organization");
    }
  };

  const filteredUsers = usersData.filter((user) =>
    user?.email?.toLowerCase()?.includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Role",
      accessorKey: "roleInOrg",
    },
    // {
    //   header: "Integrations",
    //   cell: ({ row }: any) => {
    //     const integrations =
    //       //@ts-ignore
    //       row.original.properties?.metadata?.company_urls?.map((item) =>
    //         item.split("_").pop()
    //       );

    //     return integrations ? (
    //       //@ts-ignore
    //       integrations?.map((x) => {
    //         return (
    //           <span
    //             key={x}
    //             className={`max-w-[108px] px-3 py-1 rounded-full text-sm border capitalize`}
    //           >
    //             {x}
    //           </span>
    //         );
    //       })
    //     ) : (
    //       <></>
    //     );
    //   },
    // },
    {
      header: "Status",
      cell: ({ row }: any) => (
        <span
          className={`max-w-[108px] px-3 py-1 rounded-full text-sm ${
            row.original.enabled
              ? "bg-[#6329D6] text-white"
              : "bg-gray-500 text-white"
          }`}
        >
          {row.original.enabled ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Action",
      cell: ({ row }: any) => (
        <div className='flex gap-2 justify-center'>
          <button
            onClick={() => {
              handlerRemoveUser(row.original.userId);
            }}
          >
            <CircleMinus className='text-black dark:text-white' />
          </button>
          <button
            onClick={() => {
              setSelectedUser(row.original);
              setIsModalOpen(true);
            }}
          >
            <Pencil className='text-black dark:text-white' />
          </button>
        </div>
      ),
    },
  ];

  const filteredInvitedUsers = invitedUsersData.filter((user) =>
    user?.inviteeEmail?.toLowerCase()?.includes(searchQuery.toLowerCase())
  );

  const invitedUserColumn = [
    {
      header: "Email",
      accessorKey: "inviteeEmail",
    },
    {
      header: "Role",
      accessorKey: "roleInOrg",
    },

    {
      header: "Status",
      cell: ({ row }: any) => (
        <span
          className={`max-w-[108px] px-3 py-1 rounded-full text-sm ${
            Math.floor(Date.now() / 1000) > row.original.expiresAt
              ? "bg-[#ef1a1a] text-white"
              : "bg-gray-500 text-white"
          }`}
        >
          {Math.floor(Date.now() / 1000) > row.original.expiresAt
            ? "Expired"
            : "Inactive"}
        </span>
      ),
    },
    {
      header: "Expires On",
      cell: ({ row }: any) => {
        const timestamp = row.original.expiresAt;
        const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      },
      // accessorKey: "inviterEmail",
    },
  ];

  return (
    <div className='mt-8 text-black dark:text-white'>
      <h1 className='text-sm mb-4'>Users</h1>
      <p className='text-gray-400 text-sm mb-4 italic'>
        Use this page to view, invite, and manage the user in {orgName},{" "}
        <span
          className='underline cursor-pointer'
          style={{
            color: orgSettingData?.orgColor
              ? orgSettingData?.orgColor
              : "#6329D6",
          }}
          onClick={() => setCheckInvitedUsers((pre) => !pre)}
        >
          {checkInvitedUsers ? "View Users" : "View invited User"}
        </span>
      </p>
      <div
        className={`flex ${
          checkInvitedUsers ? "justify-end" : "justify-between"
        } items-center mb-6 flex-wrap`}
      >
        {!checkInvitedUsers && (
          <button
            className='text-white p-[10px] text-[12px] rounded-full '
            style={{
              backgroundColor: orgSettingData?.orgColor
                ? orgSettingData?.orgColor
                : " #6329D6",
            }}
            onClick={handleOpenModal}
          >
            &#43; Invite User
          </button>
        )}

        <div className='relative w-[713px]'>
          <input
            type='text'
            placeholder='Search by email'
            className='sm:w-[315px] md:w-[713px] w-full mt-3 px-4 py-2 border border-gray-500 rounded-full bg-transparent text-black dark:text-white pl-10'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon className='absolute left-3 top-1/2 transform sm:-translate-y-[1px] -translate-y-1/2 h-[16px] w-[16px] object-cover text-black dark:text-white' />
        </div>
      </div>

      {checkInvitedUsers ? (
        <GenericTable<InvitedUser>
          columns={invitedUserColumn}
          data={filteredInvitedUsers}
          isLoading={isLoading}
        />
      ) : (
        <GenericTable<User>
          columns={columns}
          data={filteredUsers}
          isLoading={isLoading}
        />
      )}

      {isModalOpen && (
        <InviteModal
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        />
      )}
    </div>
  );
}

export default Index;
