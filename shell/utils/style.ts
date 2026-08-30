export type StateColor = 'success' | 'warning' | 'error' | 'info' | 'disabled';

export function stateColorCssVar(color: StateColor) {
  return `var(--${ color })`;
}

/**
 * Checks if 'a' is considered a higher alert than 'b'
 * @param a target
 * @param b comparison
 * @returns true if 'a' is a higher alert than 'b' and false otherwise.
 */
export function isHigherAlert(a: StateColor, b: StateColor) {
  const order: StateColor[] = ['info', 'success', 'warning', 'error'];

  const aIndex = order.indexOf(a);
  const bIndex = order.indexOf(b);

  return aIndex > bIndex;
}

// 1x1 transparent image as a placeholder image
export const BLANK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Checks if the given element's text is truncated.
 *
 * @param element The DOM element to check for truncation
 * @returns boolean indicating if the element's text is truncated
 */
export function isTruncated(element: HTMLElement | null): boolean {
  if (!element) {
    return false;
  }

  const isHorizontallyTruncated = element.scrollWidth > element.clientWidth;
  const isVerticallyTruncated = element.scrollHeight - element.clientHeight > 1;

  return isHorizontallyTruncated || isVerticallyTruncated;
}
