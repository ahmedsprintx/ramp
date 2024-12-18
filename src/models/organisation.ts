import mongoose from "mongoose";

const OrganisationSchema = new mongoose.Schema({
  orgId: { type: String, required: true },
  orgLogo: { type: String },
  trackstarAuthCode: { type: String },
  company_url: { type: String },
  availableAgents: { type: [String] },
  orgColor: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Organisation = mongoose.models.Organisation || mongoose.model("Organisation", OrganisationSchema);

export default Organisation;
