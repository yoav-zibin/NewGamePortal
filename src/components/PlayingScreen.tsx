import * as React from 'react';
import Board from './Board';
import VideoArea from './VideoArea';
import { StoreState, MatchInfo } from '../types/index';
import { connect } from 'react-redux';
import { FloatingActionButton } from 'material-ui';
import ContentAdd from 'material-ui/svg-icons/content/add';
import { History } from 'history';

interface PlayingScreenProps {
  // pieces: Piece[];
  matchesList: MatchInfo[];
  match: {
    params: {
      matchId: string;
    };
  };
  history: History;
}

class PlayingScreen extends React.Component<PlayingScreenProps, {}> {
  matchInfo: MatchInfo;

  constructor(props: PlayingScreenProps) {
    super(props);
    for (let match of this.props.matchesList) {
      if (this.props.match.params.matchId === match.matchId) {
        this.matchInfo = match;
      }
    }
  }

  render() {
    if (!this.matchInfo) {
      return <div>The matchId doesn't exist.</div>;
    }

    return (
      <div>
        <Board match={this.props.match} />
        <VideoArea />
        <FloatingActionButton
          style={{ marginRight: 20 }}
          onClick={() =>
            this.props.history.push('/contactsList/' + this.matchInfo.matchId)
          }
        >
          <ContentAdd />
        </FloatingActionButton>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => {
  return {
    matchesList: state.matchesList
  };
};
export default connect(mapStateToProps)(PlayingScreen);
