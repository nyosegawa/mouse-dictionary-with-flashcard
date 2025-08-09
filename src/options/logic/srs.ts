/**
 * Mouse Dictionary (https://github.com/wtetsu/mouse-dictionary/)
 * Copyright 2018-present wtetsu
 * Licensed under MIT
 */

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
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  const dueDate = now.getTime() + interval * 24 * 60 * 60 * 1000;

  return {
    ...card,
    repetitions,
    interval,
    easeFactor,
    dueDate,
  };
}

export const getTodayCards = (allCards: Record<string, FlashCard>): FlashCard[] => {
  const now = new Date();
  now.setHours(23, 59, 59, 999); // End of today
  const todayTimestamp = now.getTime();

  return Object.values(allCards)
    .filter((card) => card.dueDate <= todayTimestamp)
    .sort((a, b) => a.dueDate - b.dueDate);
};