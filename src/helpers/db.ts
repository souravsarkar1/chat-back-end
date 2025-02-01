import mongoose from "mongoose";
import { MONGO_URI } from "./config";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI as string);

    } catch (error) {
        console.log(error);
    }
};

export default connectDB;