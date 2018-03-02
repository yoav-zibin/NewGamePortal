import { Reducer } from 'redux';
import {
  StoreState,
  GameInfo,
  GameSpecs,
  MatchInfo,
  PhoneNumberToContact,
  UserIdsAndPhoneNumbers,
  MatchIdToMatchState,
  SignalEntry,
  IdIndexer,
  MyUser
} from '../types';
import { storeStateDefault } from '../stores/defaults';
import { checkCondition } from '../globals';

export interface Action {
  // Actions that start with "set" mean that they replace the matching
  // part in the store.
  // In contrast, actions that start with "update" will update mappigns
  // (using mergeMaps below).
  setGamesList?: GameInfo[];
  updateGameSpecs?: GameSpecs;
  setMatchesList?: MatchInfo[];
  setCurrentMatchIndex?: number; // an index in matchesList
  updateMatchIdToMatchState?: MatchIdToMatchState;
  updatePhoneNumberToContact?: PhoneNumberToContact;
  updateUserIdsAndPhoneNumbers?: UserIdsAndPhoneNumbers;
  setMyUser?: MyUser;
  setSignals?: SignalEntry[];
}

export function mergeMaps<T>(
  original: IdIndexer<T>,
  updateWithEntries: IdIndexer<T>
): IdIndexer<T> {
  return Object.assign(original, updateWithEntries);
}

function isInRange(currentMatchIndex: number, matchesList: MatchInfo[]) {
  return currentMatchIndex >= -1 && currentMatchIndex < matchesList.length;
}

function checkStoreInvariants(state: StoreState) {
  // TODO: check invariants, e.g.,
  // that every Image object in the store (except screenshots) is also present in
  // store.gameSpecs.imageIdToImage.
  // Ensure UserIdsAndPhoneNumbers have two mappings that are exactly the reverse of each other.
  checkCondition(
    'currentMatchIndex is in range',
    isInRange(state.currentMatchIndex, state.matchesList)
  );

  checkCondition(
    'every matchId in matchIdToMatchState is also present in matchesList',
    Object.keys(state.matchIdToMatchState).reduce(
      (accum, matchId) =>
        accum &&
        state.matchesList.filter(match => match.matchId === matchId).length ===
          1,
      true
    )
  );

  const {
    elementIdToElement,
    imageIdToImage,
    gameSpecIdToGameSpec
  } = state.gameSpecs;
  Object.keys(gameSpecIdToGameSpec).forEach(gameSpecId => {
    const gameSpec = gameSpecIdToGameSpec[gameSpecId];
    checkCondition(
      'board image must be in imageIdToImage',
      gameSpec.board === imageIdToImage[gameSpec.board.imageId]
    );
    checkCondition(
      'board image must have isBoardImage=true',
      gameSpec.board.isBoardImage
    );
    gameSpec.pieces.forEach(piece => {
      checkCondition(
        'Every piece element must be in elementIdToElement',
        piece.element === elementIdToElement[piece.element.elementId]
      );
      if (piece.deckPieceIndex !== -1) {
        checkCondition(
          'piece must be a card to have deckPieceIndex',
          piece.element.elementKind === 'card'
        );
        const deck = gameSpec.pieces[piece.deckPieceIndex].element;
        checkCondition(
          'deckPieceIndex points to a deck that contains this piece element',
          deck.elementKind.endsWith('Deck') &&
            deck.deckElements.indexOf(piece.element) !== -1
        );
      }
    });
  });
  Object.keys(elementIdToElement).forEach(elementId => {
    const element = elementIdToElement[elementId];
    element.images.forEach(image => {
      checkCondition(
        'element image must be in imageIdToImage',
        image === imageIdToImage[image.imageId]
      );
    });
    element.deckElements.forEach(deckElement => {
      checkCondition(
        'deckElement must be in elementIdToElement',
        deckElement === elementIdToElement[deckElement.elementId]
      );
      checkCondition(
        'deckElement must be a card',
        deckElement.elementKind === 'card'
      );
    });
    // Some checks based on the element kind
    switch (element.elementKind) {
      case 'standard':
        checkCondition(
          'standard piece has 1 image',
          element.images.length === 1
        );
        break;
      case 'toggable':
      case 'dice':
        checkCondition(
          'toggable|diece piece has 1 or more images',
          element.images.length >= 1
        );
        break;
      case 'card':
        checkCondition('card piece has 2 images', element.images.length === 2);
        break;
      case 'cardsDeck':
      case 'piecesDeck':
        checkCondition('deck has 1 image', element.images.length === 1);
        checkCondition(
          'deckElements has at least 2 elements',
          element.deckElements.length >= 2
        );
        break;
      default:
        checkCondition('Illegal elementKind=' + element.elementKind, false);
        break;
    }
  });
}

function reduce(state: StoreState, action: Action) {
  if (action.setGamesList) {
    return { ...state, gamesList: action.setGamesList };
  } else if (action.setMatchesList) {
    let {
      matchesList,
      matchIdToMatchState,
      currentMatchIndex,
      ...rest
    } = state;
    let newMatchIdToMatchState: MatchIdToMatchState = {};
    action.setMatchesList.forEach(e => {
      if (e.matchId in matchIdToMatchState) {
        newMatchIdToMatchState[e.matchId] = matchIdToMatchState[e.matchId];
      }
    });
    if (!isInRange(state.currentMatchIndex, action.setMatchesList)) {
      currentMatchIndex = -1;
    }
    return {
      ...rest,
      matchesList: action.setMatchesList,
      matchIdToMatchState: newMatchIdToMatchState,
      currentMatchIndex: currentMatchIndex
    };
  } else if (action.setSignals) {
    return { ...state, signals: action.setSignals };
  } else if (action.setMyUser) {
    return { ...state, myUser: action.setMyUser };
  } else if (action.updatePhoneNumberToContact) {
    let { phoneNumberToContact, ...rest } = state;
    return {
      phoneNumberToContact: mergeMaps(
        phoneNumberToContact,
        action.updatePhoneNumberToContact
      ),
      ...rest
    };
  } else if (action.setCurrentMatchIndex) {
    return { ...state, currentMatchIndex: action.setCurrentMatchIndex };
  } else if (action.updateMatchIdToMatchState) {
    return {
      matchIdToMatchState: mergeMaps(
        state.matchIdToMatchState,
        action.updateMatchIdToMatchState
      ),
      ...state
    };
  } else if (action.updateGameSpecs) {
    let {
      imageIdToImage,
      elementIdToElement,
      gameSpecIdToGameSpec
    } = action.updateGameSpecs;
    let { gameSpecs, ...rest } = state;
    return {
      gameSpecs: {
        imageIdToImage: mergeMaps(gameSpecs.imageIdToImage, imageIdToImage),
        elementIdToElement: mergeMaps(
          gameSpecs.elementIdToElement,
          elementIdToElement
        ),
        gameSpecIdToGameSpec: mergeMaps(
          gameSpecs.gameSpecIdToGameSpec,
          gameSpecIdToGameSpec
        )
      },
      ...rest
    };
  } else {
    return state;
  }
}

export const reducer: Reducer<StoreState> = (
  state: StoreState = storeStateDefault,
  actionWithAnyType: any
) => {
  checkStoreInvariants(state);
  const newState = reduce(state, actionWithAnyType);
  checkStoreInvariants(newState);
  return newState;
};
