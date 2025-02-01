import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from "express";
import { SECRATE_PASS } from "./config";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Access denied: No token provided" });
        }

        if (!SECRATE_PASS) {
            return res.status(500).json({ success: false, message: "Server error: Missing secret key" });
        }

        const decoded = jwt.verify(token, SECRATE_PASS) as { userId: string; email: string };
        req.body.userId = decoded.userId;
        next();
    } catch (error) {
        console.error("Error in auth middleware:", error);
        return res.status(401).json({ success: false, message: "Access denied: Invalid token" });
    }
}