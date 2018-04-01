/**
 *  config/bin/svg-gen.js
 *
 *  Script to output the raw svg data for a given scenario.  Easiest way to use this is
 *  to require the module and then pass it a game of that scenario as its only argument,
 *  and to pass its output to views/svg/svg-gen.ejs as `data`.
 *
 *  NB: This does not output any game-specific data, such as resource type, roll, or owners.
 *
 */

// SVG helper functions
function tileAnchorToPointsStr( coords ) {
  const translations = [ [0,0], [1,-1], [2,0], [2,1], [1,2], [0,1] ];
  let str = '';
  for (let i=0; i<translations.length; i++) {
    const transformedCoords = anchorToPoints([ coords[0] + translations[i][0], coords[1] + translations[i][1] ]);
    str += transformedCoords[0] + ' ' + transformedCoords[1] + ' ';
  }
  return str;
}
function roadAnchorToPathStr( coords, dir ) {
  var [x1,y1] = anchorToPoints( coords );
  switch (dir) {
    case 2:
		 [dx,dy] = [1,-1]; break;
    case 4:
		 [dx,dy] = [1,1];  break;
    case 6:
		 [dx,dy] = [0,1];  break;
    case 8:
		 [dx,dy] = [-1,1]; break;
    case 10:
		 [dx,dy] = [-1,-1];break;
    case 12:
		 [dx,dy] = [0,-1]; break;
  }
  var [x2,y2] = anchorToPoints([ coords[0]+dx, coords[1]+dy ])
  return 'M '+x1+' '+y1+' L '+x2+' '+y2;
}
function portAnchorToPathStr( key ) {
  let [x1,y1] = key; // note: key has len 3
  let x2, y2, x3, y3;
  let d1 = 1/Math.sqrt(12);
  let d2 = 1-1/Math.sqrt(3);
  switch (key[2]) {
    case 0:
		 [x2,y2] = [ x1+d1,  y1-1.0 ];
		 [x3,y3] = [ x1+1.0, y1-1.0 ];
		 break;
    case 1:
		 [x2,y2] = [ x1-d1,  y1-1.0 ];
		 [x3,y3] = [ x1-1.0, y1-1.0 ];
		 break;
    case 2:
		 [x2,y2] = [ x1+d2,  y1-0.5 ];
		 [x3,y3] = [ x1,		 y1-1.0 ];
		 break;
    case 3:
		 [x2,y2] = [ x1-d2,  y1-0.5 ];
		 [x3,y3] = [ x1,		 y1-1.0 ];
		 break;
    case 4:
		 [x2,y2] = [ x1+d1,  y1+1.0 ];
		 [x3,y3] = [ x1+1.0, y1+1.0 ];
		 break;
    case 5:
		 [x2,y2] = [ x1-d1,  y1+1.0 ];
		 [x3,y3] = [ x1-1.0, y1+1.0 ];
		 break;
  }
  [x1,y1] = anchorToPoints([ x1,y1 ]);
  [x2,y2] = anchorToPoints([ x2,y2 ]);
  [x3,y3] = anchorToPoints([ x3,y3 ]);
  return 'M '+x1+' '+y1+' L '+x2+' '+y2+' L '+x3+' '+y3+' L '+x1+' '+y1;
}
function anchorToPoints( coords, scale=1.5 ) {
  const x = coords[0]*Math.sqrt(3)/2*scale;
  const y = (coords[1]-0.5*Math.floor(coords[1]/2))*scale;

  if (x<minX) minX = x;
  if (x>maxX) maxX = x;
  if (y<minY) minY = y;
  if (y>maxY) maxY = y;

  return [x,y];
}

var minX=0, maxX=0, minY=0, maxY=0;

module.exports = function(game) {

  // get the svg data
  const svg = require('../guis.js').svg[ game.meta.settings.scenario ];

  data = {
    tiles: [],
    roads: [],
    ports: [],
    spots: [],
    viewport: ''
  };

  // data for tiles
  for (let i=0; i<svg.tiles.length; i++) {
    const textCoords = anchorToPoints([ svg.tiles[i][0]+1, svg.tiles[i][1]+0.5 ]);
    data.tiles.push({
      points  : tileAnchorToPointsStr( svg.tiles[i] ),
      x       : textCoords[0],
      y       : textCoords[1],
      //resource: game.board.hexes[i].resource,
      juncs   : game.board.hexes[i].juncs.join(' '),
    });
  }

  // data for roads
  let r = 0; // keep track of our road-indexer
  for (let i=0; i<svg.spots.length; i++) {
    switch (svg.roadkeys[i]) {
      case 0: // 0-> draw legs at 8:00, 4:00  /\
        data.roads.push({
          path : roadAnchorToPathStr( svg.spots[i], 8 ),
          juncs: game.board.roads[r].juncs.join(' ')
        });
        data.roads.push({
          path : roadAnchorToPathStr( svg.spots[i], 4 ),
          juncs: game.board.roads[r+1].juncs.join(' ')
        });
        r += 2;
        break;
      case 1: // 1-> draw leg at 6:00 |
        data.roads.push({
          path : roadAnchorToPathStr( svg.spots[i], 6 ),
          juncs: game.board.roads[r].juncs.join(' ')
        });
        r += 1;
        break;
      case 2: // 2-> draw legs at 10:00, 2:00  /\
        data.roads.push({
          path : roadAnchorToPathStr( svg.spots[i], 10 ),
          juncs: game.board.roads[r].juncs.join(' ')
        });
        data.roads.push({
          path : roadAnchorToPathStr( svg.spots[i], 2 ),
          juncs: game.board.roads[r+1].juncs.join(' ')
        });
        r += 2;
        break;
      case 3: // 3-> draw leg at 12:00
        data.roads.push({
          path : roadAnchorToPathStr( svg.spots[i], 12 ),
          juncs: game.board.roads[r].juncs.join(' ')
        });
        r += 1;
        break; // ignore 4
    }
  }

  // build port skeleton
  for (let i=0; i<svg.ports.length; i++) {
    data.ports.push({
      path : portAnchorToPathStr( svg.ports[i] ),
      juncs: ''
    });
  }

  // data for spots
  for (let i=0; i<svg.spots.length; i++) {
    const junc = game.board.juncs[i];
    const coords = anchorToPoints( svg.spots[i] );

    data.spots.push({
      //'owner': junc.owner ? data.publ.players[ junc.owner ].hashcode : 'none',
      x     : coords[0],
      y     : coords[1],
      //'isCity': junc.isCity,
      roads : junc.roads.join(' '),
      hexes : junc.hexes.join(' ')
    });

    if ( junc.port !== null ) {
      data.ports[ junc.port.num ].juncs += (i + ' ');
    }
  }

  data.viewport = (minX-0.5)+' '+(minY-0.5)+' '+(maxX-minX+1)+' '+(maxY-minY+1);

  return data;

}
