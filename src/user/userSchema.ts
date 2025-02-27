import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minLength: 3,
            maxLength: 30
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minLength: 6
        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        profilePic: {
            type: String,
            default: "default-avatar.png"
        },
        status: {
            type: String,
            default: "Hey there! I am using this chat app.",
            maxLength: 100
        },
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: Date.now },
        socketId: { type: String },
        friends: [{
            friendId: {
                type: Schema.Types.ObjectId,
                ref: 'users'
            },
            conversationId: {
                type: Schema.Types.ObjectId,
                ref: 'conversations'
            }
        }],
        groups: [

        ],
        blockedUsers: [{
            type: Schema.Types.ObjectId,
            ref: 'users'
        }],
        notifications: [{
            type: {
                type: String,
                enum: ["friend_request", "message", "group_invite"],
                required: true
            },
            from: {
                type: Schema.Types.ObjectId,
                ref: 'users'
            },
            text: String,
            read: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }],
        step: { type: Number, default: 0 }
    },
    { timestamps: true }
);

// Add index for better search performance
userSchema.index({ username: 'text', email: 'text' });

const UserModel = mongoose.model('users', userSchema);

export default UserModel;
