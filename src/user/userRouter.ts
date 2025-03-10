import express from "express";
import { acceptFriendRequest, addManyUsers, addNewFriend, allAllUserOffline, cancelFcriendRequest, findFreiendRequesFriendDetails, getAllFriends, getAllNotFriends, getAllSenedFriendRequest, getMySelf, getUserById, registerMobileView, updateUserOnlineOffline, userFriendRequest, userLogin, userRegister } from "./userServices";
import { authMiddleware } from "../helpers/authMiddleware";
const userRouter = express.Router();

userRouter.post("/register", userRegister as any);
userRouter.post("/mobile/register", registerMobileView as any)
userRouter.post("/login", userLogin as any);
userRouter.post("/get-friend", authMiddleware as any, getAllFriends as any);
userRouter.post("/get-all-suggested-friends", authMiddleware as any, getAllNotFriends as any);
userRouter.post("/add-new-friend", authMiddleware as any, addNewFriend as any);
userRouter.post("/status-change", authMiddleware as any, updateUserOnlineOffline as any);
// userRouter.post("/get-all-user", authMiddleware as any, getAllUser as any);
userRouter.post("/friend-request", authMiddleware as any, userFriendRequest as any);
userRouter.post("/me", authMiddleware as any, getMySelf as any);
userRouter.post("/user-by-id", authMiddleware as any, getUserById as any);
userRouter.post("/find-friend-request", authMiddleware as any, findFreiendRequesFriendDetails as any);
userRouter.post("/accept-frined-request", authMiddleware as any, acceptFriendRequest as any);
userRouter.post("/get-all-sened-friend-request-by-me", authMiddleware as any, getAllSenedFriendRequest as any);
userRouter.post("/cancel-friend-request", authMiddleware as any, cancelFcriendRequest as any);
userRouter.post("/make-offline", allAllUserOffline as any);
userRouter.post("/add-many-users", addManyUsers as any);
export default userRouter;