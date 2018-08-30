'use strict';

const _ = require('underscore'),
  expect = require('chai').expect,
  sinon = require('sinon'),
  catan = require('../core');

describe('Board', () => {

  it(`scenario "standard" should initialize`, () => {

    function len(obj) {
      return Object.keys(_.filter(obj, value => !!value || Number.isInteger(value))).length;
    }

    function check(origin, type, list) {
      expect(len(origin[type])).to.equal(len(list));
      _.each(list, (id, orientation) => {
        expect(origin[type][orientation].id).to.equal(id);
      });
    }

    const board = catan.boards.standard;

    // correct number of things
    expect(len(board.hexes)).to.equal(37);
    expect(len(board.juncs)).to.equal(96);
    expect(len(board.ports)).to.equal(9);
    expect(len(board.roads)).to.equal(132);

    // enforce some upper limits on lengths of neighbors, hexes, juncs, roads
    _.each(board.hexes, hex => {
      if (hex.isOcean) {
        expect(len(hex.neighbors)).to.be.gte(3);
        expect(len(hex.neighbors)).to.be.lte(4);
      } else {
        expect(len(hex.neighbors)).to.equal(6);
      }
      expect(len(hex.juncs)).to.equal(6);
      expect(len(hex.roads)).to.equal(6);
    });
    _.each(board.juncs, junc => {
      if (junc.isOcean) {
        expect(len(junc.neighbors)).to.be.gte(2);
        expect(len(junc.neighbors)).to.be.lte(3);
        expect(len(junc.hexes)).to.be.gte(1);
        expect(len(junc.hexes)).to.be.lte(2);
        expect(len(junc.roads)).to.be.gte(2);
        expect(len(junc.roads)).to.be.lte(3);
      } else {
        expect(len(junc.neighbors)).to.equal(3);
        expect(len(junc.hexes)).to.equal(3);
        expect(len(junc.roads)).to.equal(3);
      }
    });
    _.each(board.ports, port => {
      expect(len(port.hexes)).to.equal(2);
      expect(port.hex.name).to.equal('Hex');
      expect(len(port.juncs)).to.equal(2);
      expect(port.road.name).to.equal('Road');
    });
    _.each(board.roads, road => {
      if (road.isOcean) {
        expect(len(road.neighbors)).to.be.gte(2);
        expect(len(road.neighbors)).to.be.lte(4);
        expect(len(road.hexes)).to.be.gte(1);
        expect(len(road.hexes)).to.be.lte(2);
      } else {
        expect(len(road.neighbors)).to.equal(4);
        expect(len(road.hexes)).to.equal(2);
      }
      expect(len(road.juncs)).to.equal(2);
    });

    // hardcode some example hexes to check
    _.each({
      0: {
        neighbors: {
          3: 1,
          5: 5,
          7: 4,
        },
        juncs: {
          2: 0,
          4: 1,
          6: 2,
          8: 3,
          10: 4,
          12: 5,
        },
        roads: {
          1: 0,
          3: 1,
          5: 2,
          7: 3,
          9: 4,
          11: 5,
        }
      },
      7: {
        neighbors: {
          1: 3,
          3: 8,
          5: 13,
          7: 12,
          9: 6,
          11: 2,
        },
        juncs: {
          2: 16,
          4: 26,
          6: 27,
          8: 24,
          10: 12,
          12: 11,
        },
        roads: {
          1: 19,
          3: 32,
          5: 33,
          7: 34,
          9: 29,
          11: 13,
        }
      },
      32: {
        neighbors: {
          1: 27,
          7: 36,
          9: 31,
          11: 26,
        },
        juncs: {
          2: 75,
          4: 85,
          6: 86,
          8: 83,
          10: 73,
          12: 72,
        },
        roads: {
          1: 102,
          3: 116,
          5: 117,
          7: 118,
          9: 113,
          11: 98,
        }
      }
    }, (lists, hexId) => {
      _.each(lists, (list, name) => {
        check(board.hexes[hexId], name, list);
      });
    });

    // hardcode some example juncs to check
    _.each({
      5: {
        neighbors: {
          4: 0,
          8: 4,
        },
        hexes: {
          6: 0,
        },
        roads: {
          4: 0,
          8: 5,
        }
      },
      12: {
        neighbors: {
          2: 11,
          6: 24,
          10: 7,
        },
        hexes: {
          4: 7,
          8: 6,
          12: 2,
        },
        roads: {
          2: 13,
          6: 29,
          10: 14,
        }
      },
      65: {
        neighbors: {
          4: 64,
          12: 47,
        },
        hexes: {
          2: 22,
        },
        roads: {
          4: 86,
          12: 87,
        }
      },
      84: {
        neighbors: {
          2: 83,
          6: 92,
          10: 81,
        },
        hexes: {
          4: 36,
          8: 35,
          12: 31,
        },
        roads: {
          2: 114,
          6: 126,
          10: 115,
        }
      }
    }, (lists, juncId) => {
      _.each(lists, (list, name) => {
        check(board.juncs[juncId], name, list);
      });
    });

    // hardcode some example port to check
    _.each({
      1: {
        hexes: {
          3: 14,
          9: 13,
        },
        juncs: {
          6: 41,
          12: 30,
        },
      },
      3: {
        hexes: {
          5: 36,
          11: 31,
        },
        juncs: {
          2: 83,
          8: 84,
        },
      },
    }, (lists, portId) => {
      _.each(lists, (list, name) => {
        check(board.ports[portId], name, list);
      });
    });

    // hardcode some example roads to check
    _.each({
      10: {
        neighbors: {
          3: 6,
          7: 1,
          9: 0,
        },
        hexes: {
          5: 1,
        },
        juncs: {
          2: 9,
          8: 0,
        }
      },
      31: {
        neighbors: {
          3: 30,
          5: 47,
          9: 27,
          11: 26,
        },
        hexes: {
          1: 6,
          7: 11,
        },
        juncs: {
          4: 25,
          10: 22,
        }
      },
      116: {
        neighbors: {
          1: 101,
          7: 117,
          11: 102,
        },
        hexes: {
          9: 32,
        },
        juncs: {
          6: 85,
          12: 75,
        }
      },
    }, (lists, roadId) => {
      _.each(lists, (list, name) => {
        check(board.roads[roadId], name, list);
      });
    });

    process.stderr.write(board.toSVG());
  });
});
