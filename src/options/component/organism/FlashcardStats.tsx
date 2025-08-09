import type React from "react";
import { res } from "../../logic";
import type { LearningLog } from "../../types";

type Props = {
  logs: Record<string, LearningLog>;
  totalCards: number;
  dueCards: number;
};

export const FlashcardStats: React.FC<Props> = ({ logs, totalCards, dueCards }) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = logs[today]?.count || 0;

  return (
    <div>
      <h3>{res.get("learningStats")}</h3>
      <p>
        {res.get("totalCards")}: {totalCards}
      </p>
      <p>
        {res.get("dueCards")}: {dueCards}
      </p>
      <p>
        {res.get("cardsReviewedToday")}: {todayCount}
      </p>
    </div>
  );
};