import { Request, Response } from "express";
import UserModel from "./userSchema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SECRATE_PASS } from "../helpers/config";
import mongoose from "mongoose";
import ConversationModel from "../conversation/conversationSchema";
import MessageModel from "../message/messageSchema";

interface UserResponse {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    profilePic: string;
    status: string;
    isOnline: boolean;
    lastSeen: Date;
    socketId: string;
    friends: Array<{
        friendId: string;
        conversationId: string;
    }>;
    blockedUsers: string[];
    notifications: {
        type: string;
        from: string;
        text: string;
        read: boolean;
        createdAt: Date;
    }[];
}

function sanitizeUser(user: any): UserResponse {
    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic,
        status: user.status,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        socketId: user.socketId,
        friends: user.friends.map((friend: any) => ({
            friendId: friend.friendId,
            conversationId: friend.conversationId
        })),
        blockedUsers: user.blockedUsers,
        notifications: user.notifications,
    };
}

export const userRegister = async (req: Request, res: Response) => {
    try {
        const { username, email, password, fullName, profilePic } = req.body;

        // Validate required fields
        if (!username || !email || !password || !fullName) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Validate field lengths and format
        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({
                success: false,
                message: "Username must be between 3 and 30 characters"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        // Check if the username is already taken
        const existingUsername = await UserModel.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: "Username is already taken"
            });
        }

        // Check if the email is already registered
        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered"
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with default values
        const user = await UserModel.create({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            fullName: fullName.trim(),
            isOnline: false,
            lastSeen: new Date(),
            friends: [],
            blockedUsers: [],
            notifications: [],
            profilePic: profilePic || ""
        });

        return res.status(201).json({
            success: true,
            message: "User created successfully"
        });

    } catch (error) {
        console.error("Error in user registration:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

export const userLogin = async (req: Request, res: Response) => {
    try {
        const { email, password, username } = req.body;

        if ((!email && !username) || !password) {
            return res.status(400).json({ success: false, message: "Email/username and password are required" });
        }

        // Find user by email or username
        const user = await UserModel.findOne({
            $or: [
                { email: email?.toLowerCase().trim() },
                { username: username?.trim() }
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Generate JWT Token
        if (!SECRATE_PASS) {
            return res.status(500).json({ success: false, message: "Server error: Missing secret key" });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            SECRATE_PASS,
            { algorithm: "HS256", expiresIn: "24h" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: sanitizeUser(user),
            token,
        });

    } catch (error) {
        console.error("Error in user login:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};


export const getAllUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        const users = await UserModel.find({ _id: { $ne: userId } }).select('-password');

        return res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Error in getting users:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};


export const getAllFriends = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const user = await UserModel.findById(userId)
            .populate({
                path: 'friends.friendId',
                select: '-password -friends -blockedUsers -notifications'
            });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const friendsList = await Promise.all(user.friends.map(async (friend: any) => {
            if (friend.friendId) {
                const conversation = await ConversationModel.findById(friend.conversationId)
                    .populate({
                        path: 'messages',
                        options: { sort: { 'sendingTime': -1 }, limit: 1 }
                    });

                return {
                    friendDetails: {
                        _id: friend.friendId._id,
                        username: friend.friendId.username,
                        email: friend.friendId.email,
                        fullName: friend.friendId.fullName,
                        profilePic: friend.friendId.profilePic,
                        status: friend.friendId.status,
                        isOnline: friend.friendId.isOnline,
                        lastSeen: friend.friendId.lastSeen,
                        socketId: friend.friendId.socketId || "",
                    },
                    conversationId: friend.conversationId,
                    lastMessage: conversation?.messages[0] || null
                };
            }
            return null;
        }));

        return res.status(200).json({
            success: true,
            friends: friendsList.filter(Boolean)
        });

    } catch (error) {
        console.error("Error in getting friends:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
}

export const addNewFriend = async (req: Request, res: Response) => {
    try {
        const { userId, friendId } = req.body;
        if (!userId || !friendId) {
            return res.status(400).json({ success: false, message: "Both userId and friendId are required" });
        }

        // Check if the user exists
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if the friend exists
        const friend = await UserModel.findById(friendId);
        if (!friend) {
            return res.status(404).json({ success: false, message: "Friend not found" });
        }

        // Check if the friend is already added
        if (user.friends.some((f: any) => f.friendId.toString() === friendId)) {
            return res.status(400).json({ success: false, message: "Friend already added" });
        }

        // Create a new conversation
        const newConversation = await ConversationModel.create({
            participants: [userId, friendId],
            isGroup: false,
            metadata: {
                createdBy: userId,
                isArchived: false
            }
        });


        // Add friend to the user's friends list
        user.friends.push({ friendId, conversationId: newConversation._id });
        await user.save();

        // Add the user to the friend's friends list
        friend.friends.push({ friendId: userId, conversationId: newConversation._id });
        await friend.save();

        return res.status(200).json({ success: true, message: "Friend added successfully" });
    } catch (error) {
        console.error("Error in adding friend:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
}