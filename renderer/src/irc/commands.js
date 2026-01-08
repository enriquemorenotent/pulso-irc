const parseInput = (input) => {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  if (!trimmed.startsWith('/')) {
    return { type: 'message', text: trimmed }
  }

  const [command, ...rest] = trimmed.slice(1).split(' ')
  return {
    type: 'command',
    command: (command || '').toLowerCase(),
    args: rest.filter(Boolean),
    raw: rest.join(' '),
  }
}

export { parseInput }
