import { MISSING_BACKEND, supabase } from '@/lib/supabase'

/*
 * Satu-satunya titik pemanggilan RPC (PRD 5.2).
 * Error 42501 (forbidden) dilaporkan dengan field `code` supaya useRpc bisa
 * mengarahkan pengguna ke /forbidden (PRD 16.1); error lain memunculkan
 * status error generik.
 */
const FORBIDDEN_CODE = '42501'

export class RpcError extends Error {
  constructor(message, code = null) {
    super(message)
    this.name = 'RpcError'
    this.code = code
  }
}

export async function rpc(name, params = null) {
  if (!supabase) throw new RpcError(MISSING_BACKEND)
  const { data, error } = await supabase.rpc(name, params ?? {})
  if (error) {
    const code = error.code ?? (error.message?.includes(FORBIDDEN_CODE) ? FORBIDDEN_CODE : null)
    throw new RpcError(error.message || `rpc ${name} gagal`, code)
  }
  return data
}
