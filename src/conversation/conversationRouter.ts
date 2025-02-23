import express from "express";
import { addNewMessage, getAllChatMessage, getChatRooms, getConversationFriend, makeChatRoom } from "./conversationService";
import { authMiddleware } from "../helpers/authMiddleware";

const conversationRouter = express.Router();

conversationRouter.post("/create", authMiddleware as any, makeChatRoom as any);
conversationRouter.post("/get-all", authMiddleware as any, getChatRooms as any);
conversationRouter.post("/get-all-message", authMiddleware as any, getAllChatMessage as any);
conversationRouter.post("/add-new-message", authMiddleware as any, addNewMessage as any);
conversationRouter.post("/get-friend", authMiddleware as any, getConversationFriend as any);

export default conversationRouter;