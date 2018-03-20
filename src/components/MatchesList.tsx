import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import AppBar from 'material-ui/AppBar';

// import { StoreState } from '../types/index';
import { GridList, GridTile } from 'material-ui/GridList';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import IconButton from 'material-ui/IconButton';
import Subheader from 'material-ui/Subheader';
import StarBorder from 'material-ui/svg-icons/toggle/star-border';
// import { GameInfo } from '../types/index';

const styles: any = {
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  gridList: {
    width: 500,
    height: 450,
    overflowY: 'auto'
  },
  button: {
    float: 'right',
    marginRight: 500,
    marginTop: 70
  }
};

const tilesData = [
  {
    img: 'images/grid-list/00-52-29-429_640.jpg',
    title: 'Breakfast',
    author: 'jill111'
  },
  {
    img: 'images/grid-list/burger-827309_640.jpg',
    title: 'Tasty burger',
    author: 'pashminu'
  },
  {
    img: 'images/grid-list/camera-813814_640.jpg',
    title: 'Camera',
    author: 'Danson67'
  },
  {
    img: 'images/grid-list/morning-819362_640.jpg',
    title: 'Morning',
    author: 'fancycrave1'
  },
  {
    img: 'images/grid-list/hats-829509_640.jpg',
    title: 'Hats',
    author: 'Hans'
  },
  {
    img: 'images/grid-list/honey-823614_640.jpg',
    title: 'Honey',
    author: 'fancycravel'
  },
  {
    img: 'images/grid-list/vegetables-790022_640.jpg',
    title: 'Vegetables',
    author: 'jill111'
  },
  {
    img: 'images/grid-list/water-plant-821293_640.jpg',
    title: 'Water plant',
    author: 'BkrmadtyaKarki'
  }
];

class MatchesList extends React.Component {
  render() {
    return (
      <div>
        <AppBar
          title="Game Portal"
          iconClassNameRight="muidocs-icon-navigation-expand-more"
        />
        <RaisedButton label="Default" />
        <div style={styles.root}>
          <GridList cellHeight={180} style={styles.gridList}>
            <Subheader>December</Subheader>
            {tilesData.map(tile => (
              <GridTile
                key={tile.img}
                title={tile.title}
                subtitle={''}
                actionIcon={
                  <IconButton>
                    <StarBorder color="white" />
                  </IconButton>
                }
              >
                <img src={tile.img} />
              </GridTile>
            ))}
          </GridList>
        </div>
        <FloatingActionButton style={styles.button} href="/addMatches">
          <ContentAdd />
        </FloatingActionButton>
      </div>
    );
  }
}

export default MatchesList;
