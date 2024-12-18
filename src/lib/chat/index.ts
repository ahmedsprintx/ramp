"use server";
//this file is being used for CURD chats
import { Redis } from "@upstash/redis";
import { type Chat } from "@/lib/types";
import { redirect } from "next/navigation";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export async function getChats(userId?: string | null) {
  if (!userId) {
    return [];
  }

  try {
    const pipeline = redis.pipeline();
    const chats: string[] = await redis.zrange(`user:chat:${userId}`, 0, -1, {
      rev: true,
    });

    for (const chat of chats) {
      pipeline.hgetall(chat);
    }

    const results = await pipeline.exec();
    return results as Chat[];
  } catch (error) {
    return [];
  }
}

export async function getChat(id: string) {
  const chat = await redis.hgetall<Chat>(`chat:${id}`);
  if (!chat) {
    return null;
  }
  return chat;
}

export async function clearChats(userId: string): Promise<{ error?: string }> {
  const chats: string[] = await redis.zrange(`user:chat:${userId}`, 0, -1);
  if (!chats.length) {
    return { error: "No chats to clear" };
  }
  const pipeline = redis.pipeline();

  for (const chat of chats) {
    pipeline.del(chat);
    pipeline.zrem(`user:chat:${userId}`, chat);
  }

  await pipeline.exec();

  redirect("/chat");
}

export async function saveChat(chat: Chat, userId: string) {
  try {
    const pipeline = redis.pipeline();
    const existingChat = await redis.hgetall<Chat>(`chat:${chat.id}`);

    if (existingChat) {
      chat.orgType = existingChat.orgType;
    } else {
      chat.orgType = chat.orgType;
    }

    pipeline.hmset(`chat:${chat.id}`, chat);
    pipeline.zadd(`user:chat:${userId}`, {
      score: Date.now(),
      member: `chat:${chat.id}`,
    });
    const response = await pipeline.exec();

    return response;
  } catch (error) {
    console.error("Error in saveChat:", error);
  }
}

// export async function getSharedChat(id: string) {
//   //   const chat = await redis.hgetall<Chat>(`chat:${id}`);
//   //   if (!chat || !chat.sharePath) {
//   //     return null;
//   //   }
//   //   return chat;
// }

export async function getSharedChat(id: string) {
  const chat = await redis.hgetall<Chat>(`chat:${id}`);
  if (!chat || !chat.sharePath) {
    return null;
  }
  return chat;
}

// export async function shareChat(id: string, userId: string = "anonymous") {
//   //   const chat = await redis.hgetall<Chat>(`chat:${id}`);
//   //   if (!chat || chat.userId !== userId) {
//   //     return null;
//   //   }
//   //   const payload = {
//   //     ...chat,
//   //     sharePath: `/share/${id}`,
//   //   };
//   //   await redis.hmset(`chat:${id}`, payload);
//   //   return payload;
// }

export async function shareChat(id: string, userId: string = "anonymous") {
  const chat = await redis.hgetall<Chat>(`chat:${id}`);
  if (!chat || chat.userId !== userId) {
    return null;
  }
  const sharePath = `/chat/share/${id}`;
  const payload = {
    ...chat,
    sharePath,
  };
  await redis.hmset(`chat:${id}`, payload);

  // Store the shared chat ID in a separate set for quick lookup
  await redis.sadd("shared:chats", id);

  return payload;
}

export async function favouriteChat(id: string, userId: string = "anonymous") {
  const chat = await redis.hgetall<Chat>(`chat:${id}`);
  if (!chat || chat.userId !== userId) {
    return null;
  }
  const isFavourite = true;
  const payload = {
    ...chat,
    isFavourite,
  };

  await redis.hmset(`chat:${id}`, payload);
  await redis.sadd(`user:favourite:${userId}`, {
    id: id,
    chatTitle: chat?.title,
    orgType: chat?.orgType,
  });

  return payload;
}

export async function deleteChat(chatId: string, userId: string) {
  try {
    const pipeline = redis.pipeline();

    pipeline.del(`chat:${chatId}`);

    pipeline.zrem(`user:chat:${userId}`, `chat:${chatId}`);
    await pipeline.exec();
    return true;
  } catch (error) {
    console.error("Error in deleteChat function:", error);
    return false;
  }
}

async function updateFavoriteChat(
  userId: string,
  chatId: string,
  newTitle: string
): Promise<boolean> {
  try {
    const favoriteChats = await redis.smembers(`user:favourite:${userId}`);
    const chatToUpdate: any = favoriteChats.find(
      (chat: any) => chat.id === chatId
    );

    if (chatToUpdate) {
      const updatedChat = {
        ...chatToUpdate,
        chatTitle: newTitle,
      };

      const pipeline = redis.pipeline();
      pipeline.srem(`user:favourite:${userId}`, chatToUpdate);
      pipeline.sadd(`user:favourite:${userId}`, JSON.stringify(updatedChat));
      await pipeline.exec();

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error in updateFavoriteChat:", error);
    return false;
  }
}

export async function renameChatTitle(
  chatId: string,
  userId: string,
  newTitle: string
): Promise<Chat | null> {
  try {
    const chat = await redis.hgetall<Chat>(`chat:${chatId}`);

    if (!chat || chat.userId !== userId) {
      console.error("Chat not found or user doesn't have permission");
      return null;
    }

    const updatedChat: Chat = {
      ...chat,
      title: newTitle,
    };
    await redis.hmset(`chat:${chatId}`, updatedChat);

    await redis.zadd(`user:chat:${userId}`, {
      score: Date.now(),
      member: `chat:${chatId}`,
    });

    // Update the favorite chat if it exists
    const favoriteUpdated = await updateFavoriteChat(userId, chatId, newTitle);
    console.log(`Favorite chat updated: ${favoriteUpdated}`);

    return updatedChat;
  } catch (error) {
    console.error("Error in renameChatTitle function:", error);
    return null;
  }
}

export async function getFavoriteChats(userId: string): Promise<any[]> {
  try {
    const favoriteChats = await redis.smembers<any>(`user:favourite:${userId}`);
    return favoriteChats;
  } catch (error) {
    console.error("Error in getFavoriteChats:", error);
    return [];
  }
}

export async function unfavoriteChat(
  id: string,
  userId: string = "anonymous"
): Promise<boolean> {
  try {
    const chat = await redis.hgetall<Chat>(`chat:${id}`);
    if (!chat || chat.userId !== userId) {
      return false;
    }

    const pipeline = redis.pipeline();
    pipeline.hdel(`chat:${id}`, "isFavourite");

    pipeline.srem(
      `user:favourite:${userId}`,
      JSON.stringify({
        id,
        chatTitle: chat.title,
        orgType: chat?.orgType,
      })
    );

    await pipeline.exec();

    return true;
  } catch (error) {
    console.error("Error in unfavoriteChat:", error);
    return false;
  }
}

export async function deleteUserAndLastAssistantMessage(
  chatId: string,
  messageId: string
): Promise<{ success: boolean; messages?: any; error?: string }> {
  try {
    const chat = await redis.hgetall<Chat>(`chat:${chatId}`);
    const parsedMessages = chat?.messages || [];

    const userMessageIndex = parsedMessages.findIndex(
      (msg) => msg.id === messageId && msg.role === "user"
    );
    if (userMessageIndex === -1) {
      console.log("User message not found");
      return { success: false, error: "User message not found" };
    }

    const assistantMessageIndex = parsedMessages
      .slice()
      .reverse()
      .findIndex((msg) => msg.role === "assistant" && msg.content !== "end");
    if (assistantMessageIndex === -1) {
      console.log("No assistant message to delete");
      return { success: false, error: "No assistant message to delete" };
    }
    const actualAssistantIndex =
      parsedMessages.length - 1 - assistantMessageIndex;
    parsedMessages.splice(actualAssistantIndex, 1);
    parsedMessages.splice(userMessageIndex, 1);
    await redis.hmset(`chat:${chatId}`, {
      messages: JSON.stringify(parsedMessages),
    });
    const filteredMessages = parsedMessages.filter(
      (msg) => msg.content !== "end"
    );
    return { success: true, messages: filteredMessages };
  } catch (error) {
    console.error("Error deleting messages:", error);
    return { success: false, error: "Error deleting messages" };
  }
}
