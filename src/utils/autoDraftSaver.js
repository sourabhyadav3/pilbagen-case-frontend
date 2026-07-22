/**
 * Auto-Save Draft Utility for long forms in Pilbågen system (Section 22 Requirement)
 * Ensures user never loses typed data on browser refresh or network disconnect.
 */

export function saveDraft(formKey, data) {
  try {
    if (!formKey || !data) return;
    const payload = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(`pilbagen_draft_${formKey}`, JSON.stringify(payload));
  } catch (e) {
    console.warn('AutoDraft save error:', e);
  }
}

export function loadDraft(formKey) {
  try {
    if (!formKey) return null;
    const raw = localStorage.getItem(`pilbagen_draft_${formKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data || null;
  } catch (e) {
    console.warn('AutoDraft load error:', e);
    return null;
  }
}

export function clearDraft(formKey) {
  try {
    if (!formKey) return;
    localStorage.removeItem(`pilbagen_draft_${formKey}`);
  } catch (e) {
    console.warn('AutoDraft clear error:', e);
  }
}
