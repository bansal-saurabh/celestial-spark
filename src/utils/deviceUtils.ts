/**
 * Utility functions shared across the game
 */

/**
 * Detects if the current device is a mobile/touch device
 * @returns true if running on a mobile or touch-enabled device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0);
}
