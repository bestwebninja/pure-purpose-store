import {
  listNgoApplications,
  updateNgoStatus,
  submitNgoApplication,
} from '@/server/api/gateway';

export const ngoClient = {
  listNgoApplications,
  updateNgoStatus,
  submitNgoApplication,
};
