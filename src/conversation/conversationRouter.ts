import express from "express";
import { addNewMessage, getAllChatMessage, getChatRooms, makeChatRoom } from "./conversationService";
import { authMiddleware } from "../helpers/authMiddleware";

const conversationRouter = express.Router();

conversationRouter.post("/create", makeChatRoom as any);
conversationRouter.post("/get-all", getChatRooms as any);
conversationRouter.post("/get-all-message", authMiddleware as any, getAllChatMessage as any);
conversationRouter.post("/add-new-message", authMiddleware as any, addNewMessage as any);

export default conversationRouter;