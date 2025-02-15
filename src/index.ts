import express from "express";
import { PORT } from "./helpers/config";
import connectDB from "./helpers/db";
import cors from "cors";
import userRouter from "./user/userRouter";
import http from "http";
import { Server } from "socket.io";
import conversationRouter from "./conversation/conversationRouter";
import messageRouter from "./message/messageRouter";
import UserModel from "./user/userSchema";


const app = express();

// Create an HTTP server
const httpServer = http.createServer(app);

// Backend (Express + Socket.IO)
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Ensure this matches your frontend URL
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
    },
});


// Handle Socket.IO connections
io.on("connection", (socket) => {
    console.log("A user connected");

    // Extract userId from the handshake query (assuming you pass it during connection)
    const userId = socket.handshake.query.userId;

    // Update user's online status when they connect
    UserModel.findByIdAndUpdate(userId, { isOnline: true, socketId: socket.id })
        .then((user) => {
            if (user) {
                console.log(`User ${userId} is now online`);

                // Notify friends about the status change
                user.friends.forEach((friend: any) => {
                    io.to(friend.friendId.socketId).emit("user_status_change", {
                        userId: user._id,
                        isOnline: true,
                    });
                });
            }
        })
        .catch((err) => {
            console.error("Error updating user status:", err);
        });

    // Handle user joining a conversation
    socket.on("join_conversation", (conversationId: string) => {
        socket.join(conversationId);
        console.log(`User ${userId} joined conversation: ${conversationId}`);
    });

    // Handle new messages
    socket.on("send_message", (data: { conversationId: string; message: any }) => {
        // Broadcast the message to all users in the conversation except the sender
        socket.to(data.conversationId).emit("receive_message", data.message);
        console.log(`User ${userId} sent a message in conversation ${data.conversationId}`);
    });

    // Handle typing status
    socket.on("typing", (data: { conversationId: string; userId: string }) => {
        socket.to(data.conversationId).emit("user_typing", data.userId);
        console.log(`User ${data.userId} is typing in conversation ${data.conversationId}`);
    });

    // Handle stop typing status
    socket.on("stop_typing", (data: { conversationId: string; userId: string }) => {
        socket.to(data.conversationId).emit("user_stop_typing", data.userId);
        console.log(`User ${data.userId} stopped typing in conversation ${data.conversationId}`);
    });

    // Handle user leaving a conversation
    socket.on("leave_conversation", (conversationId: string) => {
        socket.leave(conversationId);
        console.log(`User ${userId} left conversation: ${conversationId}`);
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
        console.log(`User ${userId} disconnected`);

        // Update user's online status and last seen time
        try {
            const user = await UserModel.findByIdAndUpdate(
                userId,
                {
                    isOnline: false,
                    lastSeen: Date.now(),
                    socketId: null, // Clear the socketId
                },
                { new: true } // Return the updated document
            );

            if (user) {
                console.log(`User ${userId} is now offline`);

                // Notify friends about the status change
                user.friends.forEach((friend: any) => {
                    io.to(friend.friendId.socketId).emit("user_status_change", {
                        userId: user._id,
                        isOnline: false,
                    });
                });
            }
        } catch (err) {
            console.error("Error updating user status on disconnect:", err);
        }
    });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/user", userRouter);
app.use('/conversation', conversationRouter);
app.use("/message", messageRouter);

const port = PORT || 3000;

// Start the HTTP server
httpServer.listen(port, async () => {
    try {
        await connectDB(); // Connect to the database
        console.log("Connected to MongoDB");
        console.log(`Server is running on http://localhost:${port}`);
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1); // Exit the process on failure
    }
});
