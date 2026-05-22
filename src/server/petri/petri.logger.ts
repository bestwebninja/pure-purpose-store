export function logPetriEvent(
  type: string,
  payload?: unknown
) {
  console.log(
    JSON.stringify({
      layer: "PETRI",
      type,
      timestamp: new Date().toISOString(),
      payload,
    })
  );
}