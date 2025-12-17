/**
 * Board membership options for the UD Professionals Directory
 * Centralized board list used across the application
 */

export const BOARDS = [
  "Gamaliel Board",
  "Lay Labblam Board",
  "Lay Builders Board",
  "Accredited Lay Pastors Board",
  "Lay Itinerant Preachers Board",
  "Lay Give Thyself Wholly & Books Board",
  "Lay Healing Jesus Board",
  "Emeritus Board",
  "Lay Abmtc Board",
  "Lay Building Maintenance Board",
  "Lay Treasurers Board",
  "Lay Missions Support Board",
  "Lay Professionals Board",
  "None At The Moment",
] as const;

export type Board = typeof BOARDS[number];

/**
 * Get all available boards
 */
export function getBoards(): readonly string[] {
  return BOARDS;
}

/**
 * Get board options for select components
 */
export function getBoardOptions(): Array<{ value: string; label: string }> {
  return BOARDS.map((board) => ({
    value: board,
    label: board,
  }));
}
