// This merge is only used by the offline activity page. Feed records win.
export function mergeVerifiedOfflineEvents(feedEvents, verifiedEvents) {
  const result = Array.isArray(feedEvents) ? [...feedEvents] : [];
  const seen = new Set(result.filter(event => event?.id != null).map(event => String(event.id)));
  for (const event of Array.isArray(verifiedEvents) ? verifiedEvents : []) {
    if (!event || typeof event.id !== 'string' || !event.id ||
        !/^(ENDED|FINISHED|COMPLETED)$/.test(event.lifecycleStatus || '') || seen.has(event.id)) continue;
    result.push(event);
    seen.add(event.id);
  }
  return result;
}
