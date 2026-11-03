// Curated records are maintained separately from the automatically replaced feed.
// Never infer a match from a title, city, or similar activity.
export function reviewsForEvent(event, reviews) {
  if (!event || !/^(ENDED|FINISHED|COMPLETED)$/.test(event.lifecycleStatus || '')) return [];
  const id = typeof event.id === 'string' ? event.id :
    (Number.isSafeInteger(event.id) && event.id > 0 ? String(event.id) : '');
  if (!id || !Array.isArray(reviews)) return [];
  return reviews.filter(review => review && typeof review.eventId === 'string' && review.eventId === id &&
    typeof review.author === 'string' && review.author.trim() &&
    typeof review.text === 'string' && review.text.trim() &&
    typeof review.sourceId === 'string' && review.sourceId.trim());
}
