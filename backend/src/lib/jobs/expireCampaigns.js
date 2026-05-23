// src/jobs/expireCampaigns.js
import Campaign from "../../app/models/Campaign.js";

export const expireCampaigns = async () => {
  await Campaign.updateMany(
    {
      status: "active",
      endDate: { $lt: new Date() },
    },
    { status: "expired" }
  );
};
