import React, { useEffect, useState } from "react";
import { produce } from "immer";
import { storage } from "../extern";
import { getTodayCards, updateCard } from "../logic/srs";
import type { AnswerQuality, FlashCard, FlashcardStorage } from "../types";
import { FlashcardDeck, FlashcardList, FlashcardStats } from "../component/organism";
import { res, message } from "../logic";

export const FlashcardPage: React.FC = () => {
  const [storageState, setStorageState] = useState<FlashcardStorage>({ flashcards: {}, learningLogs: {} });
  const [todayCards, setTodayCards] = useState<FlashCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"review" | "list">("review");

  const loadData = async () => {
    const data = await storage.local.get(["flashcards", "learningLogs"]);
    const flashcards = data.flashcards ?? {};
    setStorageState({
      flashcards: flashcards,
      learningLogs: data.learningLogs ?? {},
    });
    const cardsToReview = getTodayCards(flashcards);
    setTodayCards(cardsToReview);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStorage = async (newStorage: FlashcardStorage) => {
    setStorageState(newStorage);
    await storage.local.set(newStorage);
  };

  const handleAnswer = async (card: FlashCard, quality: AnswerQuality) => {
    const updatedCard = updateCard(card, quality);
    const today = new Date().toISOString().slice(0, 10);

    const newStorage = produce(storageState, (draft) => {
      if (draft.flashcards) {
        draft.flashcards[updatedCard.id] = updatedCard;
      }
      if (!draft.learningLogs) {
        draft.learningLogs = {};
      }
      if (!draft.learningLogs[today]) {
        draft.learningLogs[today] = { date: today, count: 0 };
      }
      draft.learningLogs[today].count += 1;
    });
    await updateStorage(newStorage);
  };

  const handleUpdateCard = async (updatedCard: FlashCard) => {
    const newStorage = produce(storageState, (draft) => {
      if (draft.flashcards) {
        draft.flashcards[updatedCard.id] = updatedCard;
      }
    });
    await updateStorage(newStorage);
  };

  const handleDeleteCard = async (cardId: string) => {
    const willDelete = await message.warn(res.get("confirmDeleteCard"), "okCancel");
    if (!willDelete) return;

    const newStorage = produce(storageState, (draft) => {
      if (draft.flashcards) {
        delete draft.flashcards[cardId];
      }
    });
    await updateStorage(newStorage);
    // Refresh today's cards if the deleted card was in the review list
    setTodayCards(getTodayCards(newStorage.flashcards ?? {}));
  };

  const handleResetCard = async (cardId: string) => {
    const now = Date.now();
    const newStorage = produce(storageState, (draft) => {
      if (draft.flashcards?.[cardId]) {
        const card = draft.flashcards[cardId];
        card.dueDate = now;
        card.interval = 1;
        card.repetitions = 0;
        card.easeFactor = 2.5;
      }
    });
    await updateStorage(newStorage);
    setTodayCards(getTodayCards(newStorage.flashcards ?? {}));
    message.success(res.get("cardReset"));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const { flashcards = {}, learningLogs = {} } = storageState;
  const totalCards = Object.keys(flashcards).length;

  return (
    <div>
      <h2>{res.get("flashcards")}</h2>
      <div className="sub-nav">
        <button className={activeView === "review" ? "" : "button-clear"} onClick={() => setActiveView("review")}>
          {res.get("review")}
        </button>
        <button className={activeView === "list" ? "" : "button-clear"} onClick={() => setActiveView("list")}>
          {res.get("cardList")}
        </button>
      </div>

      {activeView === "review" && (
        <>
          <p>{res.get("newCardNotice")}</p>
          <FlashcardStats logs={learningLogs} totalCards={totalCards} dueCards={todayCards.length} />
          <FlashcardDeck cards={todayCards} onAnswer={handleAnswer} />
        </>
      )}

      {activeView === "list" && (
        <FlashcardList cards={flashcards} onUpdate={handleUpdateCard} onDelete={handleDeleteCard} onReset={handleResetCard} />
      )}
    </div>
  );
};