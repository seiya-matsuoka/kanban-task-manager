export const QUOTA = {
  MAX_BOARDS: 15,
  MAX_LISTS_PER_BOARD: 8,
  MAX_CARDS_PER_BOARD: 40,
};

export function getQuotaSnapshot() {
  return {
    MAX_BOARDS: QUOTA.MAX_BOARDS,
    MAX_LISTS_PER_BOARD: QUOTA.MAX_LISTS_PER_BOARD,
    MAX_CARDS_PER_BOARD: QUOTA.MAX_CARDS_PER_BOARD,
  } as const;
}
