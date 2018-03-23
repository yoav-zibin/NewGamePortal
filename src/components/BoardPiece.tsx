import * as React from 'react';
import CanvasImage from './CanvasImage';
import { Element } from '../types';
import { IconMenu, MenuItem, IconButton } from 'material-ui';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';

interface Props {
  height: number;
  width: number;
  x: number;
  y: number;
  src: string;
  element: Element;
}

interface State {
  value: string[];
}

class BoardPiece extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      value: []
    };
  }

  handleChange(value: any | any[]) {
    this.setState({ value: value });
  }

  render() {
    return (
      <>
        <IconMenu
          iconButtonElement={
            <IconButton>
              <MoreVertIcon />
            </IconButton>
          }
          onChange={this.handleChange}
          value={this.state.value}
        >
          <MenuItem value="1" primaryText="Show Me" />
          <MenuItem value="2" primaryText="Show Everyone" />
          <MenuItem value="3" primaryText="Hide" />
          {this.props.element.elementKind === 'dice' ? (
            <MenuItem value="4" primaryText="Roll" />
          ) : (
            <MenuItem value="4" primaryText="Shuffle" />
          )}
          <MenuItem value="5" primaryText="Toggle" />
        </IconMenu>
        <CanvasImage
          height={this.props.height}
          width={this.props.width}
          x={this.props.x}
          y={this.props.y}
          src={this.props.src}
        />
      </>
    );
  }
}

export default BoardPiece;
