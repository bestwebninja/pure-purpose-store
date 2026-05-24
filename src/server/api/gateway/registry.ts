// src/server/api/gateway/registry.ts

export type GatewayModule = Record<string, any>;

class GatewayRegistry {
  private modules: Record<string, GatewayModule> = {};

  register(namespace: string, module: GatewayModule) {
    this.modules[namespace] = module;
  }

  get(namespace: string) {
    const mod = this.modules[namespace];
    if (!mod) throw new Error(`Gateway module not found: ${namespace}`);
    return mod;
  }

  all() {
    return this.modules;
  }
}

export const gatewayRegistry = new GatewayRegistry();