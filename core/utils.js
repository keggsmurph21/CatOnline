'use strict';

function cubeToCartesian(coords) {
  return {
    x: coords.x - coords.y,
    y: coords.z
  };
}

function cartesianToCube(coords) {

}

function cartesianToRendered(coords) {
  return {
    x: coords.x * Math.cos(Math.PI/6),
    y: coords.y * 1.5,
  };
}

module.exports = {

  cubeToCartesian,
  cartesianToCube,
  cartesianToRendered,
  cubeToRendered: coords => {
    return cartesianToRendered(cubeToCartesian(coords));
  },

  pointsArrayToPath: arr => {
    return arr.map((item, i) => {
      return (i ? 'L ' : 'M ') + item.x + ',' + item.y;
    }).join(' ');
  },

  pointsArrayToString: arr => {
    return arr.map(item => item.x + ',' + item.y).join(' ');
  },

  round: (num, places=0) => {
    const e = 10 ** places;
    return Math.round(num * e) / e;
  },

  thin: arg => !!arg ? arg : undefined,

};
