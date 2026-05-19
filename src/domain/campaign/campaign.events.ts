export type CampaignEvent =
  | { type: "CampaignCreated"; campaignId: string }
  | { type: "CampaignUpdated"; campaignId: string }
  | { type: "DonationReceived"; campaignId: string; amount: number }
  | { type: "CampaignFunded"; campaignId: string };
