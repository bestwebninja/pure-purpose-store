export async function safeModuleCall<T>(
  moduleName: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(
      `[PETRI CONTRACT FAILURE] ${moduleName}`,
      err
    );

    return fallback;
  }
}
