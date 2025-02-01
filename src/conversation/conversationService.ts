import { Request, Response } from "express";
import ConversationModel from "./conversationSchema";
import UserModel from "../user/userSchema";
export const makeChatRoom = async (req: Request, res: Response) => {
    try {
        const { participants, isGroup, groupName, groupAvatar } = req.body;

        // Validate participants array
        if (!Array.isArray(participants) || participants.length < 2) {
            return res.status(400).json({
                success: false,
                message: "At least two participants are required",
            });
        }

        // Check if participants exist in the database
        const existingUsers = await UserModel.find({ _id: { $in: participants } });
        if (existingUsers.length !== participants.length) {
            return res.status(400).json({
                success: false,
                message: "One or more participants are invalid",
            });
        }

        if (isGroup) {
            // If it's a group chat, validate group name and avatar
            if (!groupName || !groupAvatar) {
                return res.status(400).json({
                    success: false,
                    message: "Group name and avatar are required for group chats",
                });
            }

            // Prevent duplicate group chat creation
            const existingGroup = await ConversationModel.findOne({
                isGroup: true,
                groupName: groupName.trim(),
            });

            if (existingGroup) {
                return res.status(400).json({
                    success: false,
                    message: "A group chat with this name already exists",
                });
            }
        } else {
            // Prevent duplicate one-on-one chat creation
            const existingChat = await ConversationModel.findOne({
                isGroup: false,
                participants: { $all: participants },
            });

            if (existingChat) {
                return res.status(400).json({
                    success: false,
                    message: "A chat between these users already exists",
                });
            }
        }

        // Create a new conversation
        const newConversation = await ConversationModel.create({
            participants,
            isGroup,
            groupName: isGroup ? groupName.trim() : null,
            groupAvatar: isGroup ? groupAvatar : null,
        });

        return res.status(201).json({
            success: true,
            message: "Chat room created successfully",
            conversation: newConversation,
        });
    } catch (error) {
        console.error("Error in making chat room:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};


export const getChatRooms = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Validate user ID
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        // Check if the user exists
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Find all conversations where the user is a participant
        const chatRooms = await ConversationModel.find({ participants: userId });

        return res.status(200).json({
            success: true,
            message: "Chat rooms retrieved successfully",
            data: chatRooms,
        });
    } catch (error) {
        console.error("Error in getting chat rooms:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
}


export const getAllChatMessage = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.body;
        if (!conversationId) {
            return res.status(400).json({
                success: false,
                message: "Conversation ID is required"
            });
        }

        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Messages retrieved successfully",
            data: conversation.messages
        });

    } catch (error) {
        console.error("Error in getting chat messages:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}


export const addNewMessage = async (req: Request, res: Response) => {
    try {
        const { conversationId, content, messageType = 'text', userId } = req.body;

        // Validate required fields
        if (!conversationId || !userId || !content) {
            return res.status(400).json({
                success: false,
                message: "Conversation ID, sender ID, and message content are required"
            });
        }

        // Check if conversation exists
        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        // Verify sender is a participant in the conversation
        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: "User is not a participant in this conversation"
            });
        }

        // Create new message object
        const newMessage = {
            sender: userId,
            content,
            messageType,
            text: content,
            receiver: conversation.participants.filter(id => id.toString() !== userId),
            timestamp: new Date()
        };

        // Add message to conversation
        conversation.messages.push(newMessage);
        await conversation.save();

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: newMessage
        });

    } catch (error) {
        console.error("Error in adding new message:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}