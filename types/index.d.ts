export type Tokens = { input: number; cacheRead: number; cacheWrite: number; output: number }

declare module 'claude-code' {
  interface PluginState {
    'token-usage-line': { last: Tokens | null; pending: Tokens; total: Tokens }
  }
}
