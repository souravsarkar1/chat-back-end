import { Request, Response } from "express";
import MessageModel from "./messageSchema";
import ConversationModel from "../conversation/conversationSchema";
import UserModel from "../user/userSchema";

/**
 * Create a new message
 */
export const makeMessage = async (req: Request, res: Response) => {
    try {
        const { conversationId, senderId, text, media, type } = req.body;

        // Validate required fields
        if (!conversationId || !senderId) {
            return res.status(400).json({
                success: false,
                message: "Conversation ID and Sender ID are required",
            });
        }

        // Validate conversation exists
        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        // Validate sender exists
        const sender = await UserModel.findById(senderId);
        if (!sender) {
            return res.status(404).json({
                success: false,
                message: "Sender not found",
            });
        }

        // Ensure at least text or media is present
        if (!text && !media) {
            return res.status(400).json({
                success: false,
                message: "Either text or media is required",
            });
        }

        // Create new message
        const message = await MessageModel.create({
            conversationId,
            senderId,
            text,
            media,
            type,
        });

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: message,
        });
    } catch (error) {
        console.error("Error in making message:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

/**
 * Get all messages for a conversation
 */
export const getAllMessages = async (req: Request, res: Response) => {
    try {
        const { id: conversationId } = req.body;

        // Validate conversation exists
        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        // Fetch messages sorted by createdAt
        const messages = await MessageModel.find({ conversationId }).sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            messages,
        });
    } catch (error) {
        console.error("Error in getting messages:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req: Request, res: Response) => {
    try {
        const { id: messageId } = req.params;

        // Validate message exists
        const message = await MessageModel.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        await MessageModel.findByIdAndDelete(messageId);

        return res.status(200).json({
            success: true,
            message: "Message deleted successfully",
        });
    } catch (error) {
        console.error("Error in deleting message:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

/**
 * Update a message
 */
export const updateMessage = async (req: Request, res: Response) => {
    try {
        const { id: messageId } = req.params;
        const { text, media, type } = req.body;

        // Validate message exists
        const message = await MessageModel.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        // Ensure at least one field is being updated
        if (!text && !media) {
            return res.status(400).json({
                success: false,
                message: "At least text or media must be provided",
            });
        }

        // Update message
        const updatedMessage = await MessageModel.findByIdAndUpdate(
            messageId,
            { text, media, type },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Message updated successfully",
            data: updatedMessage,
        });
    } catch (error) {
        console.error("Error in updating message:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};
