/* Sync confirmed real-ride interests on entry. Commerce and demo catalogues stay separate. */
try { window.VPJourneyBridge?.sync(localStorage, window.VP3 ? { createAState: VP3.emptyState } : {}); } catch (_) { /* Native module retains control of unavailable storage. */ }
