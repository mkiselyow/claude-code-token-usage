# Token Usage Line

A Claude Code mod that draws one line above the prompt:

```
✻ Last in 48.2k (85% cached) out 1.3k │ Session in 512.7k (84% cached) out 18.4k │ ~$2.41 │ context 37%
```

- **Last**: tokens of the most recent response, including the subagents it started.
- **Session**: running total since the session started (`/clear` resets it).
- **~$**: Claude Code's own cost estimate (as `/cost` shows it), from list prices; not what a Pro/Max plan bills.
- **context**: how full the context window is.
- **% cached**: share of input tokens served from the prompt cache, which are billed far cheaper.

Colours come from the active Claude Code theme, so it follows light and dark mode.

## Install

```bash
claude plugin marketplace add mkiselyow/claude-code-token-usage
claude plugin install token-usage-line@token-usage-line
```

Or for one session: `claude --plugin-dir ./claude-code-token-usage`.

Requires a Claude Code build with function-hook plugins (mods).
