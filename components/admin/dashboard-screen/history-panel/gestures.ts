export const GESTURE_MOVE_THRESHOLD_PX = 4;
export const SWIPE_THRESHOLD_PX = 48;
export const SWIPE_VERTICAL_RATIO = 1.25;

export function isGestureMovement(deltaX: number, deltaY: number): boolean {
  return (
    Math.abs(deltaX) >= GESTURE_MOVE_THRESHOLD_PX ||
    Math.abs(deltaY) >= GESTURE_MOVE_THRESHOLD_PX
  );
}

export function isHorizontalSwipe(deltaX: number, deltaY: number): boolean {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  return absX >= SWIPE_THRESHOLD_PX && absX >= absY * SWIPE_VERTICAL_RATIO;
}
