import express from "express";
import { deleteMessage, getAllMessages, makeMessage, updateMessage } from "./messageService";

const messageRouter = express.Router();

messageRouter.post("/create", makeMessage as any);
messageRouter.post("/get-all", getAllMessages as any);
messageRouter.post("/delete", deleteMessage as any);
messageRouter.post("/update", updateMessage as any);

export default messageRouter;