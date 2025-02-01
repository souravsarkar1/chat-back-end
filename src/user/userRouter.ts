import express from "express";
import { addNewFriend, getAllFriends, getAllUser, userLogin, userRegister } from "./userServices";
import { authMiddleware } from "../helpers/authMiddleware";
const userRouter = express.Router();

userRouter.post("/register", userRegister as any);
userRouter.post("/login", userLogin as any);
userRouter.post("/get-all", authMiddleware as any, getAllUser as any);
userRouter.post("/get-all-friend", authMiddleware as any, getAllFriends as any)
userRouter.post("/add-new-friend", authMiddleware as any, addNewFriend as any)
export default userRouter;