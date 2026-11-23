import { logger } from '@/lib/log'
import { exitWithParent } from '@/lib/parent'
import { publishToolEndpoint } from '@/modules/tools/endpoint'
import { app } from '@/server/app'

const log = logger('server')

export interface ServerHandle {
  readonly port: number
  readonly token: string | null
}

/**
 * Serves the local API. Vite serves the dashboard and proxies requests here.
 *
 * Port 0 asks the OS for a free port and the caller reads the real one back.
 *
 * The token, when set, is required by every route except health. This server
 * can open pull requests and any local process can reach 127.0.0.1, so an
 * unauthenticated localhost port is a real hole rather than a theoretical one.
 */
let running: ReturnType<typeof Bun.serve> | null = null

export function startServer(port: number, token?: string): ServerHandle | null {
  try {
    const server = Bun.serve({
      port,
      hostname: '127.0.0.1',
      idleTimeout: 0,
      fetch: (request) => {
        const url = new URL(request.url)
        if (!url.pathname.startsWith('/api')) {
          return new Response('altimatrix api\n', { status: 404 })
        }
        if (
          token &&
          url.pathname !== '/api/health' &&
          !authorised(request, token)
        ) {
          return new Response('unauthorised\n', { status: 401 })
        }
        return app.fetch(request)
      },
    })

    // Bun types the port as optional because a unix socket server has none.
    // This one always binds TCP, so an absent port is a broken assumption
    // rather than a case to handle quietly.
    const bound = server.port
    if (bound === undefined) throw new Error('server bound without a port')

    log.info('api ready', { url: `http://127.0.0.1:${bound}` })
    const handle = { port: bound, token: token ?? null }
    // Published rather than exported, so a station can find the tool surface
    // without the run layer importing the server layer.
    publishToolEndpoint(handle)
    running = server
    return handle
  } catch (error) {
    // The API is an observer. A port problem must not take the factory down
    // with it: the run is the product and the screen is a convenience.
    log.warn('api not started, continuing without it', {
      port,
      error: error instanceof Error ? error.message : error,
    })
    return null
  }
}

function authorised(request: Request, token: string): boolean {
  const header = request.headers.get('authorization')
  return header === `Bearer ${token}`
}

/** Reports the bound port as JSON for callers that launch the engine. */
function announceReady(handle: ServerHandle): void {
  process.stdout.write(
    `${JSON.stringify({ ready: true, port: handle.port, pid: process.pid })}\n`,
  )
}

/**
 * Stops the api, for the commands that run one pass and exit.
 *
 * A single pass still needs the tool surface, because a station that records
 * through tools on one path and through parsed prose on another produces two
 * different sets of artifacts for the same work.
 */
export function stopServer(): void {
  running?.stop(true)
  running = null
  publishToolEndpoint(null)
}

/** Starts the API and reports its port. An explicit port enables parent supervision. */
export function startApi(input: {
  defaultPort: number
  port?: string | undefined
  token?: string | undefined
}): void {
  if (input.port !== undefined) {
    exitWithParent()
  }
  const handle = startServer(
    input.port === undefined ? input.defaultPort : Number(input.port),
    input.token,
  )
  if (handle) {
    announceReady(handle)
  }
}
