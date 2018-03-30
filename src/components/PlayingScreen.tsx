import * as React from 'react';
import Board from './Board';
import VideoArea from './VideoArea';

// const mapStateToProps = (state: StoreState) => {
//   const selectedGameId = state.currentMatchIndex;
//   return {
//     pieces: state.gameSpecs['gameSpecIdToGameSpec'][selectedGameId]['pieces']
//   };
// };

// const mapDispatchToProps = () => ({});

// const BoardContainer = connect(mapStateToProps, mapDispatchToProps)(Board);

class PlayingScreen extends React.Component<{}, {}> {
  render() {
    return (
      <div>
        <Board />
        <VideoArea />
      </div>
    );
  }
}

export default PlayingScreen;
