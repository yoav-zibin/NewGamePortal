// TODO: Add more information to the state
export interface StoreState {
  games: {
    current: {
      info: {
        boardImage: string;
        pieces: Pieces[]
      };
    };
    list: {
      // TODO: Create a new type explaining everything about spec.
    }
  };
}

// TODO: Complete Piece Interface.
export interface Piece {
  pieceElementId: string;
  initialState: InitialState;
  deckPieceIndex: number;
  }
  
  export interface Pieces {
  [pieceIndex: string]: Piece;
  }
  
  interface InitialState {
  x: number;
  y: number;
  zDepth: number;
  currentImageIndex: number;
  cardVisibility: CardVisibility;
  rotationDegrees: number;
  drawing: Drawing;
  }
  
  interface Line {
  userId: string;
  timestamp: number/*firebase.database.ServerValue.TIMESTAMP*/;
  color: string;
  lineThickness: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  }
  
  interface Drawing {
  [lineId: string]: Line;
  }
  
  interface CardVisibility {
  [participantIndex: string]: boolean;
  }