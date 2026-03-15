const SESSION_KEY = 'citycard_session'
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

export function useSession() {
  /**
   * Save current session state to sessionStorage
   * Uses sessionStorage (per-tab) so different tabs can be different players
   */
  function saveSession({ roomId, playerName, currentStep, gameMode, centerCityName }) {
    const session = {
      roomId,
      playerName,
      currentStep,
      gameMode,
      centerCityName,
      timestamp: Date.now()
    }
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch (e) {
      console.warn('[useSession] Failed to save session:', e)
    }
  }

  /**
   * Load and validate session from sessionStorage
   * Returns null if no session, expired, or invalid
   */
  function loadSession() {
    try {
      // Try sessionStorage first (current tab), fall back to localStorage (migration)
      let raw = sessionStorage.getItem(SESSION_KEY)
      if (!raw) {
        raw = localStorage.getItem(SESSION_KEY)
        if (raw) {
          // Migrate: move to sessionStorage, remove from localStorage
          sessionStorage.setItem(SESSION_KEY, raw)
          localStorage.removeItem(SESSION_KEY)
        }
      }
      if (!raw) return null

      const session = JSON.parse(raw)

      // Validate required fields
      if (!session.roomId || !session.playerName || !session.currentStep) {
        return null
      }

      // Check staleness (24h)
      if (Date.now() - session.timestamp > SESSION_MAX_AGE) {
        clearSession()
        return null
      }

      return session
    } catch (e) {
      console.warn('[useSession] Failed to load session:', e)
      clearSession()
      return null
    }
  }

  /**
   * Clear saved session
   */
  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(SESSION_KEY) // clean up old storage too
    } catch (e) {
      // ignore
    }
  }

  return { saveSession, loadSession, clearSession }
}
