module.exports = {
  standard : {
    buildObjects: {
      road: {
        max: 15,
        cost : {
          brick: 1,
          wood: 1
        }
      },
      settlement: {
        max: 5,
        cost: {
          wheat: 1,
          sheep: 1,
          brick: 1,
          wood: 1
        }
      },
      city: {
        max: 4,
        cost: {
          wheat: 2,
          ore: 3
        }
      }
    },
    buyObjects: {
      dc: {
        max: 25,
        cost: {
          wheat: 1,
          sheep: 1,
          ore: 1
        }
      }
    },
    playObjects: {
      dcs: {
        vp: {
          nameShort: "VP",
          namePlural: "VPs",
          count: 5,
          textColor: "&at",
          nameLong: "Victory Point"
        },
        knight: {
          nameShort: "Knight",
          namePlural: "Knights",
          count: 14,
          textColor: "&p0t",
          nameLong: "Knight"
        },
        monopoly: {
          nameShort: "Monopoly",
          namePlural: "Monopolies",
          count: 2,
          textColor: "&wt",
          nameLong: "Monopoly"
        },
        rb: {
          nameShort: "RB",
          namePlural: "Road Builders",
          count: 2,
          textColor: "&wt",
          nameLong: "Road Building"
        },
        yop: {
          nameShort: "YoP",
          namePlural: "YoPs",
          count: 2,
          textColor: "&wt",
          nameLong: "Year of Plenty"
        }
      }
    },
    resources: {
      sheep: {
        count: 4,
        ignore: false
      },
      wheat: {
        count: 4,
        ignore: false
      },
      wood: {
        count: 4,
        ignore: false
      },
      brick: {
        count: 3,
        ignore: false
      },
      ore: {
        count: 3,
        ignore: false
      },
      desert: {
        count: 1,
        ignore: true
      }
    },
    dice: [
      { roll:9, dots:4 },
      { roll:5, dots:4 },
      { roll:2, dots:1 },
      { roll:6, dots:5 },
      { roll:3, dots:2 },
      { roll:8, dots:5 },
      { roll:10, dots:3 },
      { roll:12, dots:1 },
      { roll:11, dots:2 },
      { roll:4, dots:3 },
      { roll:8, dots:5 },
      { roll:10, dots:3 },
      { roll:9, dots:4 },
      { roll:4, dots:3 },
      { roll:5, dots:4 },
      { roll:6, dots:5 },
      { roll:3, dots:2 },
      { roll:11, dots:2 }
    ],
    gameBoard: {
      vertices: {
        hexes: 19,
        juncs: 54,
        ports: {
          types: [
            "mystery",
            "wheat",
            "ore",
            "wood",
            "mystery",
            "brick",
            "sheep",
            "mystery",
            "mystery"
          ],
          locations : [
            {
              orientation: 11,
              juncs: [1,4]
            },
            {
              orientation: 1,
              juncs: [2,6]
            },
            {
              orientation: 1,
              juncs: [7,11]
            },
            {
              orientation: 9,
              juncs: [15,20]
            },
            {
              orientation: 3,
              juncs: [21,27]
            },
            {
              orientation: 9,
              juncs: [37,42]
            },
            {
              orientation: 5,
              juncs: [38,43]
            },
            {
              orientation: 7,
              juncs: [48,52]
            },
            {
              orientation: 5,
              juncs: [50,53]
            }
          ]
        },
      },
      edges: {
        roads: [
          {
            u: 3,
            v: 0
          },
          {
            u: 0,
            v: 4
          },
          {
            u: 4,
            v: 1
          },
          {
            u: 1,
            v: 5
          },
          {
            u: 5,
            v: 2
          },
          {
            u: 2,
            v: 6
          },
          {
            u: 3,
            v: 7
          },
          {
            u: 4,
            v: 8
          },
          {
            u: 5,
            v: 9
          },
          {
            u: 6,
            v: 10
          },
          {
            u: 11,
            v: 7
          },
          {
            u: 7,
            v: 12
          },
          {
            u: 12,
            v: 8
          },
          {
            u: 8,
            v: 13
          },
          {
            u: 13,
            v: 9
          },
          {
            u: 9,
            v: 14
          },
          {
            u: 14,
            v: 10
          },
          {
            u: 10,
            v: 15
          },
          {
            u: 11,
            v: 16
          },
          {
            u: 12,
            v: 17
          },
          {
            u: 13,
            v: 18
          },
          {
            u: 14,
            v: 19
          },
          {
            u: 15,
            v: 20
          },
          {
            u: 21,
            v: 16
          },
          {
            u: 16,
            v: 22
          },
          {
            u: 22,
            v: 17
          },
          {
            u: 17,
            v: 23
          },
          {
            u: 23,
            v: 18
          },
          {
            u: 18,
            v: 24
          },
          {
            u: 24,
            v: 19
          },
          {
            u: 19,
            v: 25
          },
          {
            u: 25,
            v: 20
          },
          {
            u: 20,
            v: 26
          },
          {
            u: 21,
            v: 27
          },
          {
            u: 22,
            v: 28
          },
          {
            u: 23,
            v: 29
          },
          {
            u: 24,
            v: 30
          },
          {
            u: 25,
            v: 31
          },
          {
            u: 26,
            v: 32
          },
          {
            u: 27,
            v: 33
          },
          {
            u: 33,
            v: 28
          },
          {
            u: 28,
            v: 34
          },
          {
            u: 34,
            v: 29
          },
          {
            u: 29,
            v: 35
          },
          {
            u: 35,
            v: 30
          },
          {
            u: 30,
            v: 36
          },
          {
            u: 36,
            v: 31
          },
          {
            u: 31,
            v: 37
          },
          {
            u: 37,
            v: 32
          },
          {
            u: 33,
            v: 38
          },
          {
            u: 34,
            v: 39
          },
          {
            u: 35,
            v: 40
          },
          {
            u: 36,
            v: 41
          },
          {
            u: 37,
            v: 42
          },
          {
            u: 38,
            v: 43
          },
          {
            u: 43,
            v: 39
          },
          {
            u: 39,
            v: 44
          },
          {
            u: 44,
            v: 40
          },
          {
            u: 40,
            v: 45
          },
          {
            u: 45,
            v: 41
          },
          {
            u: 41,
            v: 46
          },
          {
            u: 46,
            v: 42
          },
          {
            u: 43,
            v: 47
          },
          {
            u: 44,
            v: 48
          },
          {
            u: 45,
            v: 49
          },
          {
            u: 46,
            v: 50
          },
          {
            u: 47,
            v: 51
          },
          {
            u: 51,
            v: 48
          },
          {
            u: 48,
            v: 52
          },
          {
            u: 52,
            v: 49
          },
          {
            u: 49,
            v: 53
          },
          {
            u: 53,
            v: 50
          }
        ],
        conns: [
          {
            u: 0,
            v: 0
          },
          {
            u: 4,
            v: 0
          },
          {
            u: 8,
            v: 0
          },
          {
            u: 12,
            v: 0
          },
          {
            u: 7,
            v: 0
          },
          {
            u: 3,
            v: 0
          },
          {
            u: 1,
            v: 1
          },
          {
            u: 5,
            v: 1
          },
          {
            u: 9,
            v: 1
          },
          {
            u: 13,
            v: 1
          },
          {
            u: 8,
            v: 1
          },
          {
            u: 4,
            v: 1
          },
          {
            u: 2,
            v: 2
          },
          {
            u: 6,
            v: 2
          },
          {
            u: 10,
            v: 2
          },
          {
            u: 14,
            v: 2
          },
          {
            u: 9,
            v: 2
          },
          {
            u: 5,
            v: 2
          },
          {
            u: 7,
            v: 3
          },
          {
            u: 12,
            v: 3
          },
          {
            u: 17,
            v: 3
          },
          {
            u: 22,
            v: 3
          },
          {
            u: 16,
            v: 3
          },
          {
            u: 11,
            v: 3
          },
          {
            u: 8,
            v: 4
          },
          {
            u: 13,
            v: 4
          },
          {
            u: 18,
            v: 4
          },
          {
            u: 23,
            v: 4
          },
          {
            u: 17,
            v: 4
          },
          {
            u: 12,
            v: 4
          },
          {
            u: 9,
            v: 5
          },
          {
            u: 14,
            v: 5
          },
          {
            u: 19,
            v: 5
          },
          {
            u: 24,
            v: 5
          },
          {
            u: 18,
            v: 5
          },
          {
            u: 13,
            v: 5
          },
          {
            u: 10,
            v: 6
          },
          {
            u: 15,
            v: 6
          },
          {
            u: 20,
            v: 6
          },
          {
            u: 25,
            v: 6
          },
          {
            u: 19,
            v: 6
          },
          {
            u: 14,
            v: 6
          },
          {
            u: 16,
            v: 7
          },
          {
            u: 22,
            v: 7
          },
          {
            u: 28,
            v: 7
          },
          {
            u: 33,
            v: 7
          },
          {
            u: 27,
            v: 7
          },
          {
            u: 21,
            v: 7
          },
          {
            u: 17,
            v: 8
          },
          {
            u: 23,
            v: 8
          },
          {
            u: 29,
            v: 8
          },
          {
            u: 34,
            v: 8
          },
          {
            u: 28,
            v: 8
          },
          {
            u: 22,
            v: 8
          },
          {
            u: 18,
            v: 9
          },
          {
            u: 24,
            v: 9
          },
          {
            u: 30,
            v: 9
          },
          {
            u: 35,
            v: 9
          },
          {
            u: 29,
            v: 9
          },
          {
            u: 23,
            v: 9
          },
          {
            u: 19,
            v: 10
          },
          {
            u: 25,
            v: 10
          },
          {
            u: 31,
            v: 10
          },
          {
            u: 36,
            v: 10
          },
          {
            u: 30,
            v: 10
          },
          {
            u: 24,
            v: 10
          },
          {
            u: 20,
            v: 11
          },
          {
            u: 26,
            v: 11
          },
          {
            u: 32,
            v: 11
          },
          {
            u: 37,
            v: 11
          },
          {
            u: 31,
            v: 11
          },
          {
            u: 25,
            v: 11
          },
          {
            u: 28,
            v: 12
          },
          {
            u: 34,
            v: 12
          },
          {
            u: 39,
            v: 12
          },
          {
            u: 43,
            v: 12
          },
          {
            u: 38,
            v: 12
          },
          {
            u: 33,
            v: 12
          },
          {
            u: 29,
            v: 13
          },
          {
            u: 35,
            v: 13
          },
          {
            u: 40,
            v: 13
          },
          {
            u: 44,
            v: 13
          },
          {
            u: 39,
            v: 13
          },
          {
            u: 34,
            v: 13
          },
          {
            u: 30,
            v: 14
          },
          {
            u: 36,
            v: 14
          },
          {
            u: 41,
            v: 14
          },
          {
            u: 45,
            v: 14
          },
          {
            u: 40,
            v: 14
          },
          {
            u: 35,
            v: 14
          },
          {
            u: 31,
            v: 15
          },
          {
            u: 37,
            v: 15
          },
          {
            u: 42,
            v: 15
          },
          {
            u: 46,
            v: 15
          },
          {
            u: 41,
            v: 15
          },
          {
            u: 36,
            v: 15
          },
          {
            u: 39,
            v: 16
          },
          {
            u: 44,
            v: 16
          },
          {
            u: 48,
            v: 16
          },
          {
            u: 51,
            v: 16
          },
          {
            u: 47,
            v: 16
          },
          {
            u: 43,
            v: 16
          },
          {
            u: 40,
            v: 17
          },
          {
            u: 45,
            v: 17
          },
          {
            u: 49,
            v: 17
          },
          {
            u: 52,
            v: 17
          },
          {
            u: 48,
            v: 17
          },
          {
            u: 44,
            v: 17
          },
          {
            u: 41,
            v: 18
          },
          {
            u: 46,
            v: 18
          },
          {
            u: 50,
            v: 18
          },
          {
            u: 53,
            v: 18
          },
          {
            u: 49,
            v: 18
          },
          {
            u: 45,
            v: 18
          }
        ]
      }
    },
    defaultGlobalState: {
      status: null,
      turn: 0,
      history: [],
      isFirstTurn: true,
      isSecondTurn: false,
      isGameOver: false,
      isRollSeven: false,
      waiting: {
        forWho: [],
        forWhat: null
      },
      currentPlayerID: 0,
      initialGameConditions : null,
      players: [],
      hasRolled : false
    },
    defaultPlayerState: {

      lobbyData: null,
      adjacents: [],
      vertex: '_v_end_turn',

      isHuman: null,
      canAcceptTrade : false,
      hasHeavyPurse : false,
      bankTradeRates: 4, // build
      canPlayDC: false,  // build
      canBuild: false,   // build
      canBuy: false,		// build

      unplayedDCs: 0,		// build
      playedDCs: 0,		 // build
      playedKnights: 0,
      hasLargestArmy: false,
      resources: 0,		// build
      settlements: [],
      roads: [],
      hasLongestRoad: false,
      publicScore: 0,
      privateScore: 0,
    },
    colors: {
      4 : [ 'red', 'orange', 'white', 'blue' ],
      6 : [ 'red', 'orange', 'white', 'blue', 'green', 'brown' ],
      10: [ 'red', 'orange', 'white', 'blue', 'green', 'brown', 'pink', 'black', 'cyan', 'purple' ]
    }
  }
}
