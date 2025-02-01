import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from "express";
import { SECRATE_PASS } from './config';

export const userAuthenticatedOrNot = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token is required"
            });
        }
        const decodedToken = jwt.verify(token, SECRATE_PASS as string) as { userId: string, email: string };
        const { userId, email } = decodedToken;
        req.body.userId = userId;
        req.body.email = email;
        next();
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: "Invalid token",
            error: error.message || error

        })

    }
}