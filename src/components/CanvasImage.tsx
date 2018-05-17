import { Image, KonvaNodeProps } from 'react-konva';
import * as React from 'react';
import * as Konva from 'konva';

// try drag& drop rectangle
interface CanvasImageProps extends KonvaNodeProps {
  src: string;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
  onClick?: (e: React.MouseEvent<{}>) => void;
  onTouchStart?: (e: React.TouchEvent<{}>) => void;
  onTouchEnd?: (e: React.TouchEvent<{}>) => void;
  x?: number;
  y?: number;
  rotation?: number;
  draggable?: boolean;
  onDragStart?: (e: React.SyntheticEvent<{}>) => void;
  onDragEnd?: (e: React.SyntheticEvent<{}>) => void;
  stroke?: string;
  strokeWidth?: number;
}

interface CanvasImageState {
  image: any;
}

// Drag distance property. If you start to drag a node you may want to wait
// until pointer is moved to some distance from start point,
// only then start dragging. Default is 3px.
// I'm increasing it from 3 to 5 because I saw cases where a tap on card dragged it.
(Konva as any).dragDistance = 5;

// May increase performance (but reduce quality on retina displays).
// (Konva as any).pixelRatio = 1

// Two goals:
// 1) I want to drag a bit above the finger (so you can see where to drop it),
// 2) Make sure the piece aren't dragged completely outside the board.
// While still supporting both drag and click (e.g. on cards), therefore, I
// can only modify pos if we're inside a drag
// (otherwise a click will immediately move the img).
let isCurrentlyDragging = false;
export function setCurrentlyDragging(_isCurrentlyDragging: boolean) {
  isCurrentlyDragging = _isCurrentlyDragging;
}
function dragBoundFunc(this: Konva.Image, pos: Konva.Vector2d): Konva.Vector2d {
  if (!isCurrentlyDragging) {
    return pos;
  }
  // const imgPos = this.getAbsolutePosition();
  const imgSize = this.getSize();
  const boardSize = this.getParent().getSize();
  let { x, y } = pos;

  // Goal 1:
  // I'm dragging 30 pixels above my finger.
  // Note that I can't determine exactly where my finger is:
  // pos is not the place your finger is, but the top-left part of the node, i.e.,
  // the default behavior is to set getAbsolutePosition to be pos.
  // There is a second argument which is the TouchEvent, but it's not passed the first time
  // when touch starts (only when dragging starts).
  y = y - 30;

  // Goal 2:
  // Ensure the piece is 50% within the board.
  const marginX = imgSize.width * 0.5;
  const marginY = imgSize.height * 0.5;
  x = Math.max(-marginX, x);
  y = Math.max(-marginY, y);
  x = Math.min(boardSize.width + marginX - imgSize.width, x);
  y = Math.min(boardSize.height + marginY - imgSize.height, y);
  return { x, y };
}

class CanvasImage extends React.Component<CanvasImageProps, CanvasImageState> {
  imageNode: Konva.Image = null as any;

  constructor(props: CanvasImageProps) {
    super(props);
    this.state = {
      image: null
    };
  }

  componentDidMount() {
    this.setImage(this.props.src);
  }

  componentWillReceiveProps(nextProps: CanvasImageProps) {
    this.setImage(nextProps.src);
  }

  setImage = (srcUrl: string) => {
    const image = new window.Image();
    image.crossOrigin = 'Anonymous';
    image.src = srcUrl;
    image.onload = () => {
      this.setState({
        image: image
      });
      this.imageNode.cache();
      this.imageNode.drawHitFromCache(0);
    };
  };

  render() {
    return (
      <Image
        ref={(node: any) => {
          if (node !== null && this.imageNode !== node) {
            this.imageNode = node;
            this.imageNode.dragBoundFunc(dragBoundFunc);
          }
          return 'image';
        }}
        {...this.props}
        image={this.state.image}
      />
    );
  }
}

export default CanvasImage;
