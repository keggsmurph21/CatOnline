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

function roadGetAdjRoads(board, r) {
  let adjs = new Set(), road = board.roads[r];
  for (let j=0; j<road.juncs.length; j++) {
    let junc = board.juncs[ road.juncs[j] ];
    if ( junc.owner === road.owner
      || junc.owner === -1
      || road.owner === -1 ) {
      for (let s=0; s<junc.roads.length; s++) {
        adjs.add(junc.roads[s]);
      }
    }
  }
  adjs.delete(r);
  return Array.from(adjs);

}
