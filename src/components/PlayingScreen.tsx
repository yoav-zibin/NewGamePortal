import * as React from 'react';
import VideoAreaContainer from '../containers/VideoAreaContainer';
import { MatchInfo } from '../types';
import Board from './Board';

interface Props {
  myMatches: MatchInfo[];
  params: {
    matchId: string;
  };
}

const PlayingScreen = (props: Props) => {
  if (
    props.myMatches.filter(e => e.matchId === props.params.matchId).length === 1
  ) {
    return (
      <>
        <Board />
        <VideoAreaContainer />
      </>
    );
  } else {
    return <div>Match not found!</div>;
  }
};

export default PlayingScreen;
