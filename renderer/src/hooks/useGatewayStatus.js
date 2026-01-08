import { useCallback, useEffect, useState } from 'react'
import { isGatewayAvailable } from '../gateway/socket.js'

const useGatewayStatus = () => {
  const [status, setStatus] = useState('checking')
  const [error, setError] = useState('')

  const check = useCallback(async () => {
    setStatus('checking')
    setError('')

    const reachable = await isGatewayAvailable()

    if (reachable) {
      setStatus('reachable')
      setError('')
      return
    }

    setStatus('unreachable')
    setError('Desktop runtime not available.')
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      check()
    }, 0)
    return () => {
      clearTimeout(timer)
    }
  }, [check])

  return { status, error, check }
}

export { useGatewayStatus }
