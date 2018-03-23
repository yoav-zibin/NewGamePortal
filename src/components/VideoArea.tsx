import * as React from 'react';
import { MyUser } from '../types';
import { connect } from 'react-redux';
import { StoreState } from '../types/index';

interface Props {
  participantsUserIds: string[];
  myUser: MyUser;
}

const VideoArea = (props: Props) => {
  return (
    <div>
      <div>{props.myUser.myUserId}</div>
      {props.participantsUserIds.map((e, i) => {
        return <div key={'user' + i}>{e}</div>;
      })}
    </div>
  );
};

const mapStateToProps = (state: StoreState) => ({
  participantsUserIds:
    state.matchesList[state.currentMatchIndex].participantsUserIds,
  myUser: state.myUser
});

// Later this will take dispatch: any as argument
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(VideoArea);
