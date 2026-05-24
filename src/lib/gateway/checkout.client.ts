import {
  createBlessingCheckout,
  verifyFulfillmentBeforeCheckout,
  verifyFundingPackage,
} from '@/server/api/gateway';

export const checkoutClient = {
  createBlessingCheckout,
  verifyFulfillmentBeforeCheckout,
  verifyFundingPackage,
};
