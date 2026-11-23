import { logger } from '@/lib/log'

const log = logger('parent')

const EVERY_MS = 2000

/**
 * Exits when the process that spawned us goes away.
 *
 * A launcher can stop the factory on a graceful quit. Watching the parent
 * also covers crashes that could leave the factory holding SQLite claims.
 *
 * Watching the parent pid covers every death rather than the polite ones.
 * When the parent goes, the OS reparents us to pid 1, which is the signal.
 * Closing stdin looked cleaner and does not fire under the shell's pipe.
 */
export function exitWithParent(): void {
  const started = process.ppid
  if (started <= 1) return

  const timer = setInterval(() => {
    if (process.ppid === started) return
    log.info('the process that started us is gone, stopping')
    clearInterval(timer)
    process.exit(0)
  }, EVERY_MS)

  // Do not hold the loop open on this alone.
  timer.unref?.()
}
