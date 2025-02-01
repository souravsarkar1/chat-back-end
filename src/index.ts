import express from "express";
import { PORT } from "./helpers/config";
import connectDB from "./helpers/db";
import cors from "cors";
import userRouter from "./user/userRouter";
import http from "http";
import { Server } from "socket.io";
import conversationRouter from "./conversation/conversationRouter";
import messageRouter from "./message/messageRouter";

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

    // Handle user joining a conversation
    socket.on("join_conversation", (conversationId: string) => {
        socket.join(conversationId);
        console.log(`User joined conversation: ${conversationId}`);
    });

    // Handle new messages
    socket.on("send_message", (data: { conversationId: string, message: any }) => {
        // Broadcast the message to all users in the conversation except sender
        socket.to(data.conversationId).emit("receive_message", data.message);
    });

    // Handle typing status
    socket.on("typing", (data: { conversationId: string, userId: string }) => {
        socket.to(data.conversationId).emit("user_typing", data.userId);
    });

    // Handle stop typing status
    socket.on("stop_typing", (data: { conversationId: string, userId: string }) => {
        socket.to(data.conversationId).emit("user_stop_typing", data.userId);
    });

    // Handle user leaving a conversation
    socket.on("leave_conversation", (conversationId: string) => {
        socket.leave(conversationId);
        console.log(`User left conversation: ${conversationId}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected");
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
