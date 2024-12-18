// import mongoose from "mongoose";
// import Integrations from "@/models/integrations";
// import _3PLs from "@/models/3pls";

// interface ConnectOptions extends mongoose.ConnectOptions {
//   bufferCommands?: boolean;
//   dbName?: string;
// }

// let cachedConnection: typeof mongoose | null = null;

// export const connectDB = async () => {
//   // Early return if we already have a cached connection
//   if (cachedConnection) {
//     console.log("Using cached database connection");
//     return cachedConnection;
//   }

//   // Validate environment variables
//   const MONGO_URI = process.env.MONGO_DB_URI;
//   const DB_NAME = process.env.MONGO_DB_NAME;

//   if (!MONGO_URI) {
//     throw new Error("Please define MONGO_DB_URI in your environment variables");
//   }

//   try {
//     // Check existing connection state
//     const connectionState = mongoose.connection.readyState;

//     if (connectionState === 1) {
//       console.log("Existing connection found");
//       return mongoose;
//     }

//     if (connectionState === 2) {
//       console.log("Database connection in progress...");
//       return mongoose;
//     }

//     const options: ConnectOptions = {
//       dbName: DB_NAME || "default",
//       bufferCommands: false,
//       // Additional recommended options
//       maxPoolSize: 10,
//       serverSelectionTimeoutMS: 5000,
//       socketTimeoutMS: 45000,
//     };

//     // Connect to database
//     const connection = await mongoose.connect(MONGO_URI, options);

//     // Cache the connection
//     cachedConnection = connection;

//     // Handle connection events
//     mongoose.connection.on("connected", () => {
//       console.log("MongoDB connected successfully");
//     });

//     mongoose.connection.on("error", (err) => {
//       console.error("MongoDB connection error:", err);
//     });

//     mongoose.connection.on("disconnected", () => {
//       console.log("MongoDB disconnected");
//       cachedConnection = null;
//     });
//     await registerAllModels();
//     return connection;
//   } catch (error) {
//     console.error("Database connection error:", error);
//     throw new Error("Failed to connect to database");
//   }
// };

// // Function to register all models
// const registerAllModels = async () => {
//   const models = [Integrations, _3PLs];

//   models.forEach((model) => {
//     if (!mongoose.models[model.modelName]) {
//       mongoose.model(model.modelName, model.schema); // Register the model
//       console.log(`Model registered: ${model.modelName}`);
//     } else {
//       console.log(`Model already registered: ${model.modelName}`);
//     }
//   });
// };
