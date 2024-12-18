import mongoose from "mongoose";
mongoose.set("strictQuery", false);

const _3PLsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "integrations", // Ensure this refers to a valid model in your application
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Use a proper name for the model that reflects its purpose
const _3PLsModel =
  mongoose.models._3pls || mongoose.model("_3pls", _3PLsSchema);

export default _3PLsModel;
