// CLIENT SAFE API WRAPPER LAYER
// This file prevents direct server imports from UI

export function serverError() {
  throw new Error(
    "Direct server import blocked. Use createServerFn() or API bridge instead."
  );
}
