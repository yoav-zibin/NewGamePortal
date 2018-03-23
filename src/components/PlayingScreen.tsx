import * as React from 'react';
import { MatchInfo } from '../types';
import Board from './Board';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import VideoArea from './VideoArea';

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
        <VideoArea />
      </>
    );
  } else {
    return <div>Match not found!</div>;
  }
};

const mapStateToProps = (state: StoreState) => ({
  myMatches: state.matchesList
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(PlayingScreen);
