import type { Register, TurnUsage } from 'claude-code'

import type { Tokens } from '../types'

const ZERO: Tokens = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 }

const LAST = { plugin: 'token-usage-line', key: 'last' } as const
const TOTAL = { plugin: 'token-usage-line', key: 'total' } as const
const PENDING = { plugin: 'token-usage-line', key: 'pending' } as const

const ACCENT = 'claude'
const LABEL = 'inactive'
const VALUE = 'text'

const fromUsage = (u: TurnUsage): Tokens => ({
  input: u.input_tokens,
  cacheRead: u.cache_read_input_tokens,
  cacheWrite: u.cache_creation_input_tokens,
  output: u.output_tokens,
})

const add = (a: Tokens, b: Tokens): Tokens => ({
  input: a.input + b.input,
  cacheRead: a.cacheRead + b.cacheRead,
  cacheWrite: a.cacheWrite + b.cacheWrite,
  output: a.output + b.output,
})

const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : `${n}`)

const inputOf = (t: Tokens) => t.input + t.cacheRead + t.cacheWrite

const cachedPercent = (t: Tokens) => (inputOf(t) === 0 ? 0 : Math.round((t.cacheRead / inputOf(t)) * 100))

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    $.ui.status(undefined)
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await $.state.set(LAST, null)
      await $.state.set(PENDING, ZERO)
      await $.state.set(TOTAL, ZERO)
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const used = e.usage ? fromUsage(e.usage) : ZERO

    const { value: total = ZERO } = await $.state.get(TOTAL)
    await $.state.set(TOTAL, add(total, used))

    const { value: subagents = ZERO } = await $.state.get(PENDING)
    if (e.agentId !== undefined) {
      await $.state.set(PENDING, add(subagents, used))
      return result
    }

    await $.state.set(LAST, add(used, subagents))
    await $.state.set(PENDING, ZERO)
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    if (e.props.hasSurvey) return below

    const [{ value: last = null }, { value: total = ZERO }, usage] = await Promise.all([
      $.state.get(LAST),
      $.state.get(TOTAL),
      $.session.usage(),
    ])
    const { Box, Text } = $.ui.resolve(e)

    const pair = (label: string, value: string) => (
      <Box flexDirection="row" gap={1}>
        <Text color={LABEL}>{label}</Text>
        <Text color={VALUE} bold>
          {value}
        </Text>
      </Box>
    )
    const group = (title: string, t: Tokens) => (
      <Box flexDirection="row" gap={1}>
        <Text color={ACCENT} bold>
          {title}
        </Text>
        {pair('in', k(inputOf(t)))}
        <Text color={LABEL}>{`(${cachedPercent(t)}% cached)`}</Text>
        {pair('out', k(t.output))}
      </Box>
    )

    const sections = [
      last ? group('Last', last) : null,
      group('Session', total),
      usage.cost ? (
        <Text color={VALUE} bold>{`~$${usage.cost.usd.toFixed(2)}`}</Text>
      ) : null,
      usage.context.percent !== undefined ? pair('context', `${Math.round(usage.context.percent)}%`) : null,
    ].filter(section => section !== null)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" flexWrap="nowrap" gap={1}>
          <Text color={ACCENT}>✻</Text>
          {sections.flatMap((section, i) => (i === 0 ? [section] : [<Text color={LABEL}>│</Text>, section]))}
        </Box>
        {below}
      </Box>
    )
  })
}
