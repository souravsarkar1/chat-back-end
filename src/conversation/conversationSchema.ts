import { Schema, model } from "mongoose";

const conversationSchema = new Schema(
    {
        participants: [{
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }],
        isGroup: { type: Boolean, default: false },
        groupName: {
            type: String,
            trim: true,
            maxLength: 50,
            required: function () { return this.isGroup; }
        },
        groupAvatar: {
            type: String,
            default: "default-group.png"
        },
        admins: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
        unreadCount: {
            type: Map,
            of: Number,
            default: new Map()
        },
        settings: {
            muted: {
                type: Map,
                of: Boolean,
                default: new Map()
            },
            pinned: {
                type: Map,
                of: Boolean,
                default: new Map()
            }
        },
        metadata: {
            description: { type: String, maxLength: 200 },
            createdBy: { type: Schema.Types.ObjectId, ref: "User" },
            isArchived: { type: Boolean, default: false }
        },
        messages: [{
            sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
            receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
            text: { type: String, required: true },
            messageType: {
                type: String,
                enum: ["text", "image", "file", "audio", "video"],
                default: "text"
            },
            fileUrl: { type: String },
            fileName: { type: String },
            fileSize: { type: Number },
            sendingTime: { type: Date, default: Date.now },
            status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
            isEdited: { type: Boolean, default: false },
            editHistory: [{
                text: { type: String },
                editedAt: { type: Date }
            }],
            replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
            reactions: [{
                user: { type: Schema.Types.ObjectId, ref: "User" },
                emoji: { type: String }
            }],
            deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }]
        }]
    },
    { timestamps: true }
);

// Add index for better query performance
conversationSchema.index({ participants: 1 });

const ConversationModel = model("Conversation", conversationSchema);

export default ConversationModel;
