import * as React from 'react';
import { Piece } from '../types';
import { Layer, Stage } from 'react-konva';

interface Props {
  pieces: Piece[];
}

/**
 * A reusable board class, that given a board image and pieces in props
 * can draw the board and piece on top of it using konva.
 * Should also add drag and drop functionality later on.
 */
class Board extends React.Component<Props, {}> {
  render() {
    // TODO: Complete layer for board
    // TODO: Complete layer for pieces
    return (
      <Stage>
        <Layer/>
        <Layer>
          {this.props.pieces.length ?
            this.props.pieces.map((piece: Piece, key: number) => {
              return (
                <div key={key}>
                  {piece}
                </div>
              );
            })
            : ''
          };
        </Layer>
      </Stage>
    );
  }
}

export default Board;
