import type { AnswerQuality, FlashCard } from "../types";

/**
 * SM-2 algorithm based implementation
 */
export function updateCard(card: FlashCard, quality: AnswerQuality): FlashCard {
  const q = { again: 0, hard: 3, good: 4, easy: 5 }[quality];

  let { repetitions, interval, easeFactor } = card;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.ceil(interval * easeFactor);
    }
  }

  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  const dueDate = new Date();
  dueDate.setHours(0, 0, 0, 0);
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    ...card,
    repetitions,
    interval,
    easeFactor,
    dueDate: dueDate.getTime(),
  };
}

export const getTodayCards = (allCards: Record<string, FlashCard>): FlashCard[] => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const todayTimestamp = now.getTime();

  return Object.values(allCards)
    .filter((card) => card.dueDate <= todayTimestamp)
    .sort((a, b) => a.dueDate - b.dueDate);
};