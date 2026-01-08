const resolveValue = (override, fallback) => (
  override === undefined || override === '' ? fallback : override
)

export { resolveValue }
