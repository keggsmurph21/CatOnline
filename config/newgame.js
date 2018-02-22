module.exports = {
  strings : {
    scenario : {
      label  : "Choose a scenario",
      default: "standard",
      options: null
    },
    portStyle : {
      label  : "Port placement style",
      default: "fixed",
      options: [
        "fixed",
        "random"
      ]
    },
    tileStyle : {
      label  : "Tile placement style",
      default: "random",
      options: [
        "fixed",
        "random"
      ]
    }
  },
  ints : {
    numHumans : {
      label  : "Number of humans",
      default: 4,
      min    : 0,
      max    : 5
    },
    victoryPointsGoal : {
      label  : "Victory points",
      default: 10,
      min    : 8,
      max    : 12
    },
    numCPUs : {
      label  : "Number of CPUs",
      default: 0,
      min    : 0,
      max    : 0
    }
  },
  bools : {
    isPublic : {
      label  : "Public",
      default: true
    }
  }
}
