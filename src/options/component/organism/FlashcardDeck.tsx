import type React from "react";
import { useEffect, useRef, useState } from "react";
import { res } from "../../logic";
import type { AnswerQuality, FlashCard } from "../../types";
import { Button } from "../atom/Button";

type Props = {
  cards: FlashCard[];
  onAnswer: (card: FlashCard, quality: AnswerQuality) => void;
};

const TranslationViewer: React.FC<{ html: string }> = ({ html }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const document = iframeRef.current.contentDocument;
      if (document) {
        document.open();
        document.write(`
          <html>
            <head>
              <style>
                body { font-family: sans-serif; margin: 10px; }
              </style>
            </head>
            <body>
              ${html}
            </body>
          </html>
        `);
        document.close();
      }
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width: "100%",
        minHeight: "100px",
        marginBottom: "20px",
        border: "none",
      }}
      sandbox="allow-same-origin"
      title="translation"
    />
  );
};

export const FlashcardDeck: React.FC<Props> = ({ cards, onAnswer }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);

  if (cards.length === 0) {
    return <div>{res.get("noCardsToReview")}</div>;
  }

  if (currentIndex >= cards.length) {
    return <div>{res.get("reviewComplete")}</div>;
  }

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(true);
  };

  const handleAnswer = (quality: AnswerQuality) => {
    onAnswer(currentCard, quality);
    setIsFlipped(false);
    setCurrentIndex(currentIndex + 1);
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "20px", marginTop: "20px", textAlign: "center" }}>
      <div style={{ fontSize: "2em", marginBottom: "20px" }}>{currentCard.word}</div>
      <hr />
      {isFlipped ? (
        <>
          <TranslationViewer html={currentCard.translation} />
          <div>
            <Button type="primary" onClick={() => handleAnswer("again")} text={res.get("again")} />
            <Button type="primary" onClick={() => handleAnswer("hard")} text={res.get("hard")} />
            <Button type="primary" onClick={() => handleAnswer("good")} text={res.get("good")} />
            <Button type="primary" onClick={() => handleAnswer("easy")} text={res.get("easy")} />
          </div>
        </>
      ) : (
        <Button type="primary" onClick={handleFlip} text={res.get("showAnswer")} />
      )}
    </div>
  );
};