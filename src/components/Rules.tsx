import * as React from 'react';
interface Props {
  url: string;
  width: string;
  height: string;
}

class Rules extends React.Component<Props, {}> {
  render() {
    return (
      <div>
        <iframe
          src={this.props.url}
          width={this.props.width}
          height={this.props.height}
        />
      </div>
    );
  }
}

export default Rules;
