"use client";

import React, {
  SetStateAction,
  Dispatch,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearChats,
  deleteChat,
  favouriteChat,
  getChats,
  getFavoriteChats,
  renameChatTitle,
  shareChat,
  unfavoriteChat,
} from "@/lib/chat";
import { useAuthInfo, useLogoutFunction } from "@propelauth/react";
import cookie from "js-cookie";
import "../../app/globals.css";
import { useChatContext } from "@/lib/context/agent.context";
import ShareModal from "./share-modal";
import Image from "next/image";
import DeleteModal from "./deleteModal";
import { useOrganizationContext } from "@/lib/context/organisation.context";
import { useWindowSize } from "@/lib/hooks/use-window-size";
import { useAppState } from "@/lib/utils/app-state";
import {
  Check,
  ChevronDown,
  EllipsisVertical,
  LogOut,
  Search,
  Settings,
  Pencil,
  Star,
} from "lucide-react";
import ThemeSwitch from "./theme-switch";
import { usePostHog } from 'posthog-js/react';
import { usePostHogEvents } from "@/lib/hooks/usePostHogEvents";
import posthog from "posthog-js";

interface ChildComponentProps {
  handleCloseSidebar: () => void;
}

const Sidebar: FC<any> = ({ handleCloseSidebar }: ChildComponentProps) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null);


  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user, userClass } = useAuthInfo();
  const { newChatData, currentOrgType } = useChatContext();
  const { isGenerating } = useAppState();

  const { orgId, orgName, orgSettingData } = useOrganizationContext();
  const logout = useLogoutFunction();
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [favoriteChats, setFavoriteChats] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalType, setModalType] = useState<"delete" | "clear">("delete");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTitleEditable, setIsTitleEditable] = useState(false);
  const [isFavTitleEditable, setIsFavTitleEditable] = useState(false);
  const [recentlyChangedChatId, setRecentlyChangedChatId] = useState<
    string | null
  >(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [isEditableLoading, setIsEditableLoading] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [showFavorite, setShowFavorites] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChats, setFilteredChats] = useState<any[]>([]);
  const [newChatId, setNewChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { captureEvent } = usePostHogEvents(`${user?.email}`)

  const { width } = useWindowSize();
  const isMobile = width <= 768;

  const getAllChats = useCallback(async () => {
    try {
      const result = await getChats(`${user?.userId}`);
      const filteredChats = result?.filter((res) => res !== null);

      setChats((prevChats) => {
        const newChats = filteredChats.filter(
          (chat) => !prevChats.some((prevChat) => prevChat.id === chat.id)
        );
        if (newChats.length > 0) {
          setNewChatId(newChats[0].id);
          setTimeout(() => setNewChatId(null), 2000);
        }
        return filteredChats?.filter(
          (chat) => chat?.orgType === currentOrgType || "3pl"
        );
      });

      let intervalId = setInterval(() => {
        if (filteredChats.length > 0) {
          setLoading(false); // Chats found, stop loading
          clearInterval(intervalId);
        }
      }, 500);

      // Clear interval after 5 seconds to avoid infinite loop
      setTimeout(() => {
        clearInterval(intervalId);
        if (filteredChats.length === 0) {
          setLoading(false);
        }
      }, 5000);
    } catch (err) {
      setError("Failed to load chats");
      setLoading(false);
    }
  }, [user?.userId, currentOrgType]);

  const getFavourites = useCallback(async () => {
    try {
      const result = await getFavoriteChats(`${user?.userId}`);
      const filteredChats = result?.filter((res) => res !== null);
      setFavoriteChats(
        filteredChats?.filter(
          (chat) => chat?.orgType === currentOrgType || "3pl"
        )
      );
    } catch (err) {
      setError("Failed to load chats");
    }
  }, [user?.userId, currentOrgType]);

  useEffect(() => {
    if (user?.userId) {
      cookie.set("userID", `${user?.userId}`, { expires: 7 });
    }
    getAllChats();
    getFavourites();
  }, [getAllChats, getFavourites, user?.userId]);

  useEffect(() => {
    if (newChatData) {
      getAllChats();
    }
  }, [newChatData, getAllChats, isGenerating]);

  const toggleDropdown = (index: number) => {
    setDropdownOpen(dropdownOpen === index ? null : index);
  };

  const openDeleteModal = (chat: any) => {
    setSelectedChat(chat);
    setModalType("delete");
    setIsModalOpen(true);
  };
  const openClearHistoryModal = () => {
    if (filteredChats?.length > 0) {
      setModalType("clear");
      setIsModalOpen(true);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (selectedChat.isFavourite) {
        await unfavoriteChat(selectedChat.id, `${user?.userId}`);
        const filteredChats = favoriteChats?.filter(
          (chat) => chat?.id !== selectedChat.id
        );
        setFavoriteChats(filteredChats);
      }
      await deleteChat(selectedChat.id, user?.userId!);
      setDeletingChatId(selectedChat.id);
      setTimeout(() => {
        setChats(chats.filter((chat) => chat.id !== selectedChat.id));
        setDeletingChatId(null);
        router.push(`/chat`);
      }, 100);
      setDropdownOpen(null);
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearHistory = async () => {
    captureEvent('chat_clicked', {})
    setIsDeleting(true);
    await clearChats(`${user?.userId}`);
    setIsDeleting(false);
    setIsModalOpen(false);
    await getAllChats();
  };

  const handleChatClick = async (chatId: string) => {
    if (isTitleEditable) setIsTitleEditable(false);
    if (isFavTitleEditable) setIsFavTitleEditable(false);
    router.push(`/chat/${chatId}`);
    handleCloseSidebar();
  };

  const chatIdFromPath = pathname?.split("/").pop();

  const handleNewConversationNavigate = () => {
    captureEvent('new_chat_clicked', {})
    if (isTitleEditable) setIsTitleEditable(false);
    if (isFavTitleEditable) setIsFavTitleEditable(false);
    router.push("/chat/new");
  };

  const handleShare = async (chatId: string) => {
    try {
      const sharedChat = await shareChat(chatId, `${user?.userId}`);
      if (sharedChat) {
        const sharedUrl = `${sharedChat.sharePath}`;
        setSelectedChat({ ...sharedChat, sharePath: sharedUrl });
      } else {
        alert("Failed to share chat");
      }
    } catch (error) {
      console.error("Error sharing chat:", error);
    }
    setDropdownOpen(null);
  };
  const handleFavourite = async (chatId: string) => {
    try {
      const chat = await favouriteChat(chatId, `${user?.userId}`);
      if (chat) {
        setFavoriteChats([
          {
            id: chat?.id,
            chatTitle: chat?.title,
          },
          ...favoriteChats,
        ]);
        getAllChats();
        setDropdownOpen(null);
      }
    } catch (error) {
      console.error("Error sharing chat:", error);
    }
    setDropdownOpen(null);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setDropdownOpen(null);
    }
  };
  useEffect(() => {
    // const handleClickOutside = (event: MouseEvent) => {
    //   if (
    //     dropdownRef.current &&
    //     !dropdownRef.current.contains(event.target as Node)
    //   ) {
    //     setDropdownOpen(null);
    //   }
    // };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(null);
        setIsTitleEditable(false);
        setIsFavTitleEditable(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSaveTitle = async (chatId: string, oldChatTitle: string) => {
    if (oldChatTitle === newChatTitle) {
      setIsTitleEditable(false);
      setIsFavTitleEditable(false);
    } else {
      setIsEditableLoading(true);
      const updatedChat = await renameChatTitle(
        chatId,
        `${user?.userId}`,
        newChatTitle
      );
      if (updatedChat) {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId ? { ...chat, title: newChatTitle } : chat
          )
        );
        setFavoriteChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId ? { ...chat, chatTitle: newChatTitle } : chat
          )
        );

        setRecentlyChangedChatId(chatId);
        setNewChatTitle("");
        setIsTitleEditable(false);
        setIsFavTitleEditable(false);
        setIsEditableLoading(false);
        setTimeout(() => setRecentlyChangedChatId(null), 1000);
      }
    }
  };

  const handleUnfavoriteChat = async (chatId: string) => {
    const result = await unfavoriteChat(chatId, `${user?.userId}`);
    if (result) {
      const filteredChats = favoriteChats?.filter(
        (chat) => chat?.id !== chatId
      );
      setFavoriteChats(filteredChats);
      getAllChats();
      setDropdownOpen(null);
    }
  };

  useEffect(() => {
    const filtered = chats?.filter((chat) =>
      chat?.title?.toLowerCase()?.includes(searchTerm?.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [searchTerm, chats]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };


  return (
    <div
      className={`w-full flex flex-col  p-[20px]  gap-[30px] bg-sidebarBackgroundLight dark:bg-sidebarBackgroundDark ${isMobile ? "rounded-none" : "rounded-[10px]"
        } text-textPrimaryLight dark:text-textPrimaryDark transition-width duration-300 ${isLoggedIn && pathname?.includes("/chat") ? "block" : "hidden"
        }`}
      style={{ height: isMobile ? "100vh" : "calc(100vh - 60px)" }}
    >
      <div className='flex justify-center h-[50px]  '>
        <Image
          src={
            orgSettingData?.orgLogo
              ? `${orgSettingData?.orgLogo}`
              : "/assets/images/logo/tempLogoHeftIQ.png"
          }
          alt='Logo'
          height={100}
          width={100}
          className='h-[50px] w-[167px] object-contain'
        />
      </div>

      <div className='flex flex-col gap-[15px] h-full'>
        <div
          onClick={handleNewConversationNavigate}
          style={{ backgroundColor: orgSettingData?.orgColor || "#6329D6" }}
          className={`p-[10px] rounded-[38px] text-white text-center cursor-pointer hidden md:block`}
        >
          <span className='font-poppins text-[12px] font-medium'>New chat</span>
        </div>
        <div className='flex flex-col justify-start items-start gap-[10px]  md:hidden'>
          <div
            style={{ color: orgSettingData?.orgColor || "#6329D6" }}
            className={`w-[80%] overflow-hidden text-ellipsis rounded-[38px] text-[16px] font-medium cursor-pointer block md:hidden`}
          >
            {orgName}
          </div>
          <div className='flex justify-center items-center gap-[10px]'>
            <div className='object-contain min-h-[24px] min-w-[24px]'>
              {userClass?.orgIdToUserOrgInfo &&
                userClass?.orgIdToUserOrgInfo[orgId || ""]?.userAssignedRole ===
                "Owner" ? (
                <Settings
                  onClick={() => {
                    router.push("/settings");
                  }}
                  className='text-black dark:text-white h-[24px] w-[24px] cursor-pointer'
                />
              ) : (
                ""
              )}
            </div>
            <ThemeSwitch />
          </div>
        </div>
        <div className='flex justify-start items-center gap-[5px]'>
          <div className='font-poppins text-xs font-medium text-chatHistoryTextLight dark:text-chatHistoryTextDark'>
            Favorite Chats
          </div>

          <ChevronDown
            onClick={() => setShowFavorites(!showFavorite)}
            className={`text-chatHistoryTextLight dark:text-chatHistoryTextDark cursor-pointer h-[16px] w-[16px] transform transition-transform duration-300 ${showFavorite ? "rotate-0" : "-rotate-90"
              }`}
          />
        </div>

        {showFavorite && (
          <div className='overflow-y-scroll no-scrollbar h-[100px] animate-fadeInSlideDown transition-all duration-300'>
            {error ? (
              <div className='flex items-center justify-center h-full text-red-500'>
                {error}
              </div>
            ) : favoriteChats.length > 0 ? (
              <div>
                {favoriteChats.map((chat: any, index: number) => (
                  <div
                    key={index}
                    className={`cursor-pointer relative p-[10px] rounded-[5px] group hover:bg-selectedOptionColorLght dark:hover:bg-selectedOptionColorDark ${chat.id === chatIdFromPath
                      ? "bg-selectedOptionColorLght dark:bg-selectedOptionColorDark text-textPrimaryLight dark:text-textPrimaryDark"
                      : ""
                      } ${chat.id === newChatId ? "animate-fadeInSlideDown" : ""
                      } ${deletingChatId === chat.id ? "animate-fadeOutSlideUp" : ""
                      }`}
                    style={{
                      boxShadow:
                        selectedChat?.id === chat?.id &&
                          (isTitleEditable || isFavTitleEditable)
                          ? `0px 0px 4px 0px ${orgSettingData?.orgColor || "#ED3735"
                          } `
                          : "",
                      border:
                        selectedChat?.id === chat?.id &&
                          (isTitleEditable || isFavTitleEditable)
                          ? `0.5px solid ${orgSettingData?.orgColor || "#ED3735"
                          }`
                          : "0.5px solid transparent",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();

                      if (!(isTitleEditable || isFavTitleEditable)) {
                        handleChatClick(chat.id);
                        captureEvent('favorite_chat_clicked', { chatName: `${chat?.chatTitle}`, chatId: `${chat?.id}` })
                      }
                    }}
                  >
                    <div className='flex justify-between items-center gap-[10px]'>
                      <div
                        className={`flex justify-between items-center font-poppins text-[12px] font-normal w-[100%] ${recentlyChangedChatId === chat.id
                          ? "animate-fadeIn"
                          : ""
                          }`}
                      >
                        <div className='w-[80%]  overflow-hidden text-ellipsis whitespace-nowrap'>
                          {isFavTitleEditable &&
                            selectedChat?.id === chat?.id ? (
                            <input
                              type='text'
                              value={newChatTitle}
                              onChange={(e) => setNewChatTitle(e.target.value)}
                              className='w-full bg-transparent border-none focus:outline-none'
                            />
                          ) : (
                            <> {chat?.chatTitle}</>
                          )}
                        </div>
                        <div>
                          {selectedChat?.id === chat?.id &&
                            isFavTitleEditable ? (
                            <div className='flex gap-[5px] items-center w-[40px]'>
                              {isEditableLoading ? (
                                <div className='flex justify-center items-center'>
                                  <div
                                    className={`w-[16px] h-[16px] border-t-4 border-blue-500 border-solid rounded-full animate-spin`}
                                  ></div>
                                </div>
                              ) : (
                                <>
                                  <Image
                                    onClick={() => setIsFavTitleEditable(false)}
                                    src={"/assets/icons/cross-grey.svg"}
                                    alt='menu'
                                    height={16}
                                    width={16}
                                    className='h-[16px] w-[16px] cursor-pointer'
                                  />
                                  <Check
                                    onClick={() => {
                                      if (String(chat?.title)?.trim()) {
                                        handleSaveTitle(chat?.id, chat?.title);
                                      }
                                    }}
                                    className={`h-[16px] w-[16px]  text-black dark:text-white ${newChatTitle.length
                                      ? " cursor-pointer"
                                      : " opacity-50 cursor-not-allowed"
                                      }`}
                                  />
                                </>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`cursor-pointer group-hover:block ${isMobile ? "block" : "hidden"
                                }`}
                            >
                              <div className='flex items-center space-x-2'>
                                <Star
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnfavoriteChat(chat?.id);
                                  }}
                                  className='h-[12px] w-[12px] fill-orange-500 text-orange-500'
                                />
                                <Pencil
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChat(chat);
                                    setNewChatTitle(chat?.chatTitle);
                                    setIsTitleEditable(false);
                                    setIsFavTitleEditable(true);
                                    setDropdownOpen(null);
                                  }}
                                  className='h-[12px] w-[12px] text-chatHistoryTextLight dark:text-white'
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='font-poppins text-sm text-center mt-10'>
                No Favorite Chats
              </div>
            )}
          </div>
        )}

        <div className='flex justify-between items-center'>
          <div className='font-poppins text-xs font-medium text-chatHistoryTextLight dark:text-chatHistoryTextDark'>
            Chat History
          </div>

          <Search
            className='h-[16px] w-[16px] text-chatHistoryTextLight dark:text-chatHistoryTextDark cursor-pointer'
            onClick={() => setShowSearchBar(!showSearchBar)}
          />
        </div>

        {showSearchBar && (
          <div
            className={`w-full flex justify-start items-center px-[10px] py-[10px] gap-[10px] rounded-[5px] animate-fadeInSlideDown`}
            style={{
              border: `0.5px solid ${orgSettingData?.orgColor || "#6329d6"}`,
              boxShadow: `0px 0px 4px 0px ${orgSettingData?.orgColor || "#6329d6"
                }`,
            }}
          >
            <Search
              className='h-[16px] w-[16px] '
              style={{ color: orgSettingData?.orgColor || "#6329d6" }}
            />
            <input
              type='text'
              placeholder='Search'
              className='w-full focus:outline-none border-none bg-transparent text-[12px] text-chatHistoryTextDark'
              onChange={handleSearch}
            />
          </div>
        )}

        <div
          className=' overflow-y-scroll no-scrollbar '
          style={{
            height:
              showFavorite && !showSearchBar
                ? "calc(100vh - 520px)"
                : !showFavorite && showSearchBar
                  ? "calc(100vh - 450px)"
                  : showFavorite && showSearchBar
                    ? "calc(100vh - 570px)"
                    : "calc(100vh - 400px)",
          }}
        >
          {error ? (
            <div className='flex items-center justify-center h-full text-red-500'>
              {error}
            </div>
          ) : loading ? (
            <div className='flex items-center justify-center h-full'>
              <div className='w-[16px] h-[16px] border-t-4 border-customPink border-solid rounded-full animate-spin'></div>{" "}
              {/* Loading spinner */}
            </div>
          ) : filteredChats.length > 0 ? (
            <div>
              {filteredChats.map((chat: any, index: number) => (
                <div
                  key={index}
                  className={`cursor-pointer relative p-[10px] rounded-[5px] group hover:bg-selectedOptionColorLght dark:hover:bg-selectedOptionColorDark ' ${chat.id === chatIdFromPath
                    ? "bg-selectedOptionColorLght dark:bg-selectedOptionColorDark text-textPrimaryLight dark:text-textPrimaryDark"
                    : ""
                    }  ${chat.id === newChatId ? "animate-fadeInSlideDown " : ""}
                                        ${deletingChatId === chat.id
                      ? "animate-fadeOutSlideUp"
                      : ""
                    }`}
                  style={{
                    boxShadow:
                      selectedChat?.id === chat?.id && isTitleEditable
                        ? `0px 0px 4px 0px ${orgSettingData?.orgColor || "#6329d6"
                        }`
                        : "",
                    border:
                      selectedChat?.id === chat?.id && isTitleEditable
                        ? `0.5px solid ${orgSettingData?.orgColor || "#6329d6"}`
                        : "0.5px solid transparent",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();

                    if (!isTitleEditable) {
                      handleChatClick(chat.id);
                      captureEvent('chat_clicked', { chatName: `${chat?.title}`, chatId: `${chat?.id}` })
                    }
                  }}
                >
                  <div className=' flex justify-between items-center gap-[10px] '>
                    <div
                      className={`font-poppins text-[12px] font-normal w-[80%] overflow-hidden text-ellipsis whitespace-nowrap  ${recentlyChangedChatId === chat.id
                        ? "animate-fadeIn"
                        : ""
                        }`}
                    >
                      {selectedChat?.id === chat?.id && isTitleEditable ? (
                        <input
                          type='text'
                          value={newChatTitle}
                          onChange={(e) => setNewChatTitle(e.target.value)}
                          className='w-full bg-transparent border-none focus:outline-none'
                        />
                      ) : (
                        <>{chat?.title}</>
                      )}
                    </div>
                    {selectedChat?.id === chat?.id && isTitleEditable ? (
                      <div className='flex gap-[5px] items-center w-[32px]'>
                        {isEditableLoading ? (
                          <div className='flex justify-center items-center'>
                            <div
                              className={`w-[16px] h-[16px] border-t-4 border-blue-500 border-solid rounded-full animate-spin`}
                            ></div>
                          </div>
                        ) : (
                          <>
                            <Image
                              onClick={() => setIsTitleEditable(false)}
                              src={"/assets/icons/cross-grey.svg"}
                              alt='menu'
                              height={16}
                              width={16}
                              className='h-[16px] w-[16px] cursor-pointer'
                            />
                            <Check
                              onClick={() => {
                                if (String(chat?.title)?.trim()) {
                                  handleSaveTitle(chat?.id, chat?.title);
                                }
                              }}
                              className={`h-[16px] w-[16px]  text-black dark:text-white ${newChatTitle.length
                                ? " cursor-pointer"
                                : " opacity-50 cursor-not-allowed"
                                }`}
                            />
                          </>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(index);
                        }}
                        className={`cursor-pointer h-[16px] w-[16px] group-hover:block ${isMobile
                          ? "block"
                          : chat.id === chatIdFromPath
                            ? "block"
                            : "hidden"
                          } `}
                      >
                        <EllipsisVertical className='h-[16px] w-[16px] text-black dark:text-white' />
                      </div>
                    )}
                  </div>

                  {dropdownOpen === index && (
                    <div
                      ref={dropdownRef}
                      className='absolute top-[30px] right-0 p-[5px] w-[120px]  rounded-md bg-[#141414] z-10 shadow-custom-white'
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChat(chat);
                          setNewChatTitle(chat?.title);
                          setIsTitleEditable(true);
                          setDropdownOpen(null);
                        }}
                        className='px-4 py-2 text-xs text-gray-700  cursor-pointer flex justify-start items-center gap-[10px]'
                      >
                        <Image
                          src={"/assets/icons/pencil-minus.svg"}
                          alt='shareicon'
                          height={16}
                          width={16}
                          className='h-[16] w-[16]'
                        />
                        <span className='font-poppins text-[12px] text-white font-normal'>
                          Rename
                        </span>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          chat?.isFavourite
                            ? handleUnfavoriteChat(chat?.id)
                            : handleFavourite(chat?.id);
                        }}
                        className='px-4 py-2 text-xs text-gray-700  cursor-pointer flex justify-start items-center gap-[10px]'
                      >
                        <div className='h-[16px] w-[16px]'>
                          <Star
                            className={`h-[16px] w-[16px] ${chat?.isFavourite
                              ? "text-orange-500"
                              : "text-white"
                              } `}
                          />
                        </div>
                        <p className='font-poppins text-[12px] text-white font-normal'>
                          {chat?.isFavourite ? "Unfavorite" : "Favorite"}
                        </p>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChat(chat);
                          setModalOpen(true);
                          // setDropdownOpen(null)
                        }}
                        className='px-4 py-2 text-xs text-gray-700  cursor-pointer flex justify-start items-center gap-[10px]'
                      >
                        <Image
                          src={"/assets/icons/share.svg"}
                          alt='shareicon'
                          height={16}
                          width={16}
                          className='h-[16] w-[16]'
                        />
                        <span className='font-poppins text-[12px] text-white font-normal'>
                          Share
                        </span>
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(chat);
                          // setDropdownOpen(null)
                        }}
                        className=' px-4 py-2 text-xs text-gray-700 cursor-pointer flex justify-start items-center gap-[10px]'
                      >
                        <Image
                          src={"/assets/icons/trash.svg"}
                          alt='shareicon'
                          height={16}
                          width={16}
                          className='h-[16] w-[16]'
                        />
                        <span className='font-poppins text-[12px] text-white font-normal'>
                          Delete
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='font-poppins  text-sm text-center mt-10'>
              No conversations found
            </div>
          )}
        </div>

        <div className='mt-auto flex flex-col gap-[0px]'>
          <div
            onClick={openClearHistoryModal}
            className={`flex justify-center items-center gap-[5px] p-[10px] rounded-[5px]    ${filteredChats?.length > 0
              ? "cursor-pointer hover:bg-[#ff000028]"
              : "cursor-not-allowed"
              }`}
          >
            <Image
              src={"/assets/icons/trash.svg"}
              alt='trashlogo'
              height={16}
              width={16}
              className='h-[16px] w-[16px]'
            />
            <span className='font-poppins  text-[12px] font-normal text-[#FF0000]'>
              Clear All Chats
            </span>
          </div>
          <div
            onClick={() => {
              captureEvent('logout_button_clicked', {})
              logout(true)
            }

            }
            className='flex justify-center items-center gap-[5px] p-[10px] rounded-[5px] cursor-pointer'
          >
            <LogOut className='w-[16px] h-[16px] text-black dark:text-white' />
            <span className='font-poppins  text-[12px] font-normal'>
              Logout
            </span>
          </div>
        </div>
      </div>
      <ShareModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        chatId={selectedChat?.id}
        onShare={handleShare}
        sharePath={
          selectedChat?.sharePath &&
          `${process.env.NEXT_PUBLIC_URL}${selectedChat?.sharePath}`
        }
      />
      <DeleteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={modalType === "delete" ? handleDelete : handleClearHistory}
        isDeleting={isDeleting}
        title={modalType === "delete" ? "Delete Chat" : "Clear All Chats"}
        description={
          modalType === "delete"
            ? "Are you sure you want to delete this chat ?"
            : "Are you sure you want to delete all chats ?"
        }
        confirmText={modalType === "delete" ? "Delete Chat" : "Clear all chats"}
        cancelText='Cancel'
      />
    </div>
  );
};

export default React.memo(Sidebar);
