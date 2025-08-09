import React, { useState } from "react";
import { res } from "../../logic";
import type { FlashCard } from "../../types";
import { Button } from "../atom/Button";

type Props = {
  cards: Record<string, FlashCard>;
  onUpdate: (updatedCard: FlashCard) => void;
  onDelete: (cardId: string) => void;
  onReset: (cardId: string) => void;
};

export const FlashcardList: React.FC<Props> = ({ cards, onUpdate, onDelete, onReset }) => {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editedTranslation, setEditedTranslation] = useState("");

  const sortedCards = Object.values(cards).sort((a, b) => b.addedDate - a.addedDate);

  const handleEdit = (card: FlashCard) => {
    setEditingCardId(card.id);
    setEditedTranslation(card.translation.replace(/<br\s*\/?>/gi, "\n"));
  };

  const handleSave = (card: FlashCard) => {
    const updatedCard = { ...card, translation: editedTranslation.replace(/\n/g, "<br/>") };
    onUpdate(updatedCard);
    setEditingCardId(null);
  };

  const renderTranslation = (card: FlashCard) => {
    if (editingCardId === card.id) {
      return (
        <textarea
          value={editedTranslation}
          onChange={(e) => setEditedTranslation(e.target.value)}
          rows={4}
          style={{ width: "95%", boxSizing: "border-box" }}
        />
      );
    }
    return <div dangerouslySetInnerHTML={{ __html: card.translation }} />;
  };

  return (
    <div className="flashcard-list-container">
      <h3>{res.get("allFlashcards")}</h3>
      <table className="flashcard-table">
        <thead>
          <tr>
            <th>{res.get("word")}</th>
            <th>{res.get("translation")}</th>
            <th>{res.get("nextReviewDate")}</th>
            <th>{res.get("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {sortedCards.map((card) => (
            <tr key={card.id}>
              <td>{card.word}</td>
              <td className="translation-cell">{renderTranslation(card)}</td>
              <td>{new Date(card.dueDate).toLocaleDateString()}</td>
              <td className="actions-cell">
                {editingCardId === card.id ? (
                  <Button type="primary" onClick={() => handleSave(card)} text={res.get("save")} />
                ) : (
                  <Button type="primary" onClick={() => handleEdit(card)} text={res.get("edit")} />
                )}
                <Button type="revert" onClick={() => onReset(card.id)} text={res.get("reviewNow")} />
                <Button type="cancel" onClick={() => onDelete(card.id)} text={res.get("delete")} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};