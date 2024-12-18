import mongoose from "mongoose";
mongoose.set("strictQuery", false);

const IntegrationsSchema = new mongoose.Schema(
  {
    trackstarAccessToken: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    orgId: {
      type: String,
      required: true,
    },
    connectionId: {
      type: String,
      required: true,
    },
    vendor: {
      type: String,
      required: true,
    },
    tenant: {
      type: String,
      required: true,
    },
    company_url: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    availableActions: [
      {
        name: {
          type: String,
          required: true,
        },
        syncStatus: {
          type: String,
          required: true,
          default: "in progress",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const IntegrationModel =
  mongoose.models.integrations ||
  mongoose.model("integrations", IntegrationsSchema);

export default IntegrationModel;
