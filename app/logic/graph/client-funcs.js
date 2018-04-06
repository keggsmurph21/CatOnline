/* DATA STRUCTURE
private
  - adjacents
  - flags
  -​ playerID
  - privateScore
  - resources
  - unplayedDCs
  - vertex
public
  - dice
  - hexes
  - juncs
  - meta
  - players
    - cities
    - color
    - devCardsInHand
    - hasLargestArmy
    - hasLongestRoad
    - isHuman
    - lobbyData
    - longestRoad
    - numKnights
    - playerID
    - publicScore
    - resourcesInHand
    - roads
    - settlements
  - roads
  - trade */

const TESTING = {

  sumObject(obj) {
    let acc = 0;
    for (res in obj) {
      acc += obj[res];
    }
    return acc;
  },

  update : {
    dice(values) {

    },
    longestRoads(hasLongestRoad, longestRoads) {
      console.log('update longest roads', hasLongestRoad, longestRoads)

      for (let p=0; p<game.public.players.length; p++) {
        game.public.players[p].longestRoad = longestRoads[p];
        $(`#${p}-longest-road`).html( getLRString(p) );
      }

      if (hasLongestRoad !== game.public.hasLongestRoad) {

        _.update.vps(game.public.hasLongestRoad, -2);
        _.update.vps(hasLongestRoad, 2);

        game.public.hasLongestRoad = hasLongestRoad;
      }
    },
    resources(p, cost, multiplier=1) {
      if (cost !== undefined) {
        game.public.players[p].resourcesInHand += sumObject(cost) * multiplier;
        $(`#${p}-resources`).html(game.public.players[p].resourcesInHand);
        if (p === game.private.playerID) {
          for (let res in cost) {
            game.private.resources[res] += cost[res] * multiplier;
            $(`#num-${res}`).html(game.private.resources[res]);
          }
        }
      }
    },
    vps(p, incr) {
      if (p > -1) {
        if (p===game.private.playerID)
          game.private.privateScore += incr;
        game.public.players[p].publicScore += incr;

        $(`#${p}-score`).html( getVPString(p) );
      }
    }
  },

  add : {
    city(p, args) {
      console.log('add city not implemented', args);

      $(`#spot${args.junc}`).addClass( 'city' );
      game.public.players[p].cities.push(args.junc);

      let settlements = game.public.players[p].settlements;
      settlements.splice(settlements.indexOf(args.junc),1);

      _.update.resources(p, args.cost, -1);
      _.update.vps(p, 1);

    },
    road(p, args) {
      console.log('add road', args);

      $(`#road${args.road}`).addClass( game.public.players[p].color );
      game.public.players[p].roads.push(args.junc);

      _.update.longestRoads(args.hasLongestRoad, args.longestRoads);
      _.update.resources(p, args.cost, -1);

    },
    settlement(p, args) {
      console.log('add settlement', args);

      $(`#spot${args.junc}`).addClass( game.public.players[p].color );
      game.public.players[p].settlements.push(args.junc);

      _.update.longestRoads(args.hasLongestRoad, args.longestRoads);
      _.update.resources(p, args.cost, -1);
      _.update.vps(p, 1);

    }
  }

}
