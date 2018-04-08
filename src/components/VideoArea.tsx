import * as React from 'react';

class VideoArea extends React.Component<{}, {}> {
  render() {
    return (
      <>
        <div class="videoChatContainer">
          <div class="videoChatPeer displayInline">
            <video class="videoChatPeer" id="videoElement0" autoplay="true" />
            <div
              id="videoParticipantName0"
              class="videoChatPeer forVerticalCenteringParent"
            >
              <div class="forVerticalCenteringChild">User display name</div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

import { connect } from 'react-redux';
import { StoreState } from '../types/index';

const mapStateToProps = (state: StoreState) => ({
  gamesList: state.gamesList
});
export default connect(mapStateToProps)(VideoArea);
