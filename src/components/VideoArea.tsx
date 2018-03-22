import * as React from 'react';
import { MyUser } from '../types';

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

export default VideoArea;
