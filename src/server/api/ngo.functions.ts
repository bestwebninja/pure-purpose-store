// ---------------- NGO ----------------

export const listNgoApplications = fn(
  async (...args: any[]) =>
    (await ngo()).listNgoApplications?.(...args) ?? []
);

export const updateNgoStatus = fn(
  async (...args: any[]) =>
    (await ngo()).updateNgoStatus?.(...args)
);

export const submitNgoApplication = fn(
  async (...args: any[]) =>
    (await ngo()).submitNgoApplication?.(...args)
);