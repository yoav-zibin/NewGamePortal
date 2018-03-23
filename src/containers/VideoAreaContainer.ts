import { connect } from 'react-redux';
import { StoreState } from '../types/index';
import VideoArea from '../components/VideoArea';

const mapStateToProps = (state: StoreState) => ({
  participantsUserIds:
    state.matchesList[state.currentMatchIndex].participantsUserIds,
  myUser: state.myUser
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

const VideoAreaContainer = connect(mapStateToProps, mapDispatchToProps)(
  VideoArea
);

export default VideoAreaContainer;
