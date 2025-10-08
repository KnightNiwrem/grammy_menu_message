declare module "jsr:@std/testing/bdd" {
  export const describe: (...args: unknown[]) => void;
  export const it: (...args: unknown[]) => void;
}

declare module "jsr:@std/assert/fail" {
  export function fail(message?: string): never;
}
