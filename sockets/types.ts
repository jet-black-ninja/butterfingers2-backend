export type TypingResult = {
  timeline: { wpm: number; accuracy: number; raw: number; second: number }[];
  errors: number;
  testType: string | null;
  date?: number;
  quoteAuthor?: string;
};
export type oneVersusOnePlayerState = {
  id: string;
  wordIndex: number;
  charIndex: number;
  result?: TypingResult;
  playAgain?: boolean;
  disconnected?: boolean;
};
export type OneVersusOneStateType = {
  players: {
    player1: oneVersusOnePlayerState;
    player2?: oneVersusOnePlayerState;
  };
  quoteLength: quoteLengthType;
  testText?: string;
};

export type quoteLengthType = "short" | "medium" | "long" | "all";
