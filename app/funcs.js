// public/resources/js/funcs.js
// keep functions here that are not necessarily strictly game logic

// setup logs
const dateformat = require('dateformat');
const fs = require('fs');

module.exports = {

  canAfford(player, cost) {
    for (let res in cost) {
      //console.log('need '+cost[res]+' '+res+' have '+player.resources[res]);
      if (player.resources[res] < cost[res])
        return false;
    }
    return true;
  },
  getRandomInt : function(min=0, max=1) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  getRandomChoice : function(list) {
    let i = module.exports.getRandomInt(min=0, max=(list.length-1));
    return list[i];
  },
  shuffle : function(arr) {
    for (let i =arr.length-1; i>0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr
  },
  isValidID : function(id) {
    // mongo IDs are always 24 alphanumeric chars
    return (id.length===24 && id.match(/^[a-z0-9]+$/i));
  },
  saveAndCatch : function(Model, next) {
    try {
      Model.save( function(err) {
        next(err);
      });
    } catch(err) {
      next(err);
    }
  },
  checkIfUserInGame : function( user, game ) {
    for (let p=0; p<game.state.players.length; p++) {
      if ( module.exports.usersCheckEqual(game.state.players[p].lobbyData, user) ) {
        return true;
      }
    }

    return false;
  },
  usersCheckEqual : function( u, v ) {
    return ( u.id.toString()===v.id.toString() );
  },
  iteratePlayers : function(game, next) {
    for (let p=0; p<game.state.players.length; p++) {
      module.exports.requireUserById( game.state.players[p].lobbyData.id, function(err,player) {
        next(err, player);
      });
    }
  },
  requireUserById : function(id, next) {
    // success: next( null, user )
    // failure: next( err|message )
    // note: fails on database error AND null result
    if ( module.exports.isValidID(id) ) {
      module.exports.User.findById(id, function(err,user) {
        if (err) return next('require: '+err);
        if (!user) return next('require: Unable to find user '+id);
        return next(null, user); // Success
      });
    } else {
      return next('require: Invalid user id '+id);
    }
  },
  requireGameById : function(id, next) {
    // success: next( null, user )
    // failure: next( err|message )
    // note: fails on database error AND null result
    if ( module.exports.isValidID(id) ) {
      module.exports.Game.findById(id, function(err,game) {
        if (err) return next('require: '+err);
        if (!game) return next('require: Unable to find game '+id);
        return next(null, game); // Success
      });
    } else {
      return next('require: Invalid game id '+id);
    }
  },
  isLoggedIn : function(req,res,next) {
    // route middleware to make sure user is logged in

    if (req.isAuthenticated()) {
      req.user = req.user.getLobbyData();
      return next();
    }

    // 403
    req.flash('loginMessage', 'You must be logged in to view this page!');
    res.redirect('/login');

  },
  notLoggedIn : function(req,res,next) {
    // route middleware to disallow login page to those already logged in

    if (!req.isAuthenticated()) {
      return next();
    }

    req.flash('lobbyMessage', "You're already logged in!");
    res.redirect('/lobby');
  },
  isAdmin : function(req,res,next) {

    if (req.user) {
      if (req.user.isAdmin) {
        return next();
      }
    }

    // 403
    req.flash( 'lobbyMessage', 'Unable to access admin pages: forbidden.' );
    res.redirect( '/lobby' );

  },
  isSuperAdmin : function(req,res,next) {

    if (req.user) {
      if (req.user.isSuperAdmin) {
        return next();
      }
    }

    // 403
    req.flash( 'adminMessage', 'Unable to access superadmin pages: forbidden.' );
    res.redirect( '/admin' );

  },
  log : function(...args) { console.log('DON\'T CALL THIS WAY!!!', ...args); },
  hexGetAdjHexes : function(board, h) {
    let adjs = new Set();
    for (let i=0; i<board.hexes[h].juncs.length; i++) {
      for (let j=0; j<board.juncs[ board.hexes[h].juncs[i] ].hexes.length; j++) {
        let hex = board.juncs[ board.hexes[h].juncs[i] ].hexes[j];
        if (hex !== h)
          adjs.add( hex );
      }
    }
    return Array.from(adjs);
  },
  juncGetAdjJuncs : function(board, j) {
    let adjs = new Set();
    for (let r=0; r<board.juncs[j].roads.length; r++) {
      for (let k=0; k<board.roads[ board.juncs[j].roads[r] ].juncs.length; k++) {
        let junc = board.roads[ board.juncs[j].roads[r] ].juncs[k];
        if (junc !== j)
          adjs.add( junc );
      }
    }
    return Array.from(adjs);
  },
  roadGetAdjRoads : function(board, r) {
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

  },
  /*roadGetAdjAvailableRoads : function(board, r) {
    let adjs = new Set(), road = board.roads[r];
    for (let j=0; j<road.juncs.length; j++) {
      let junc = board.juncs[ road.juncs[j] ];
      if (junc.owner === road.owner || junc.owner === -1) {
        for (let s=0; s<junc.roads.length; s++) {
          adjs.add(s);
        }
      }
    }
    adjs.delete(r);
    return Array.from(adjs);
  },
  roadsGetDistance : function(board, player, r1, r2) {
    let path = module.exports.roadsShortestPath(board, player, r1, r2);
    return ( path === null
      ? Infinity
      : path.length );
  },
  roadsGetJunc : function(board, r1, r2) {
    for (let j=0; j<board.roads[r1].juncs.length; j++) {
      let junc = board.roads[r1].juncs[j];
      if (board.roads[r2].juncs.indexOf(j) > -1)
        return board.juncs[j];
    }
    return null;
  },
  roadsShortestPath : function(board, player, s, t) {
    let visited = new Set(),
      previous = {}, queue = [];

    visited.add(s);
    queue.push(s);

    while (queue.length) {
      let current = queue.pop();

      let neighbors = module.exports.roadGetAdjRoads(board, current);
      for (let i=0; i<neighbors.length; i++) {
        let n = neighbors[i];
        if (board.roads[n].owner === player.playerID) {

          if (!visited.has(n)) {
            visited.add(n);
            previous[n] = current;
            queue.unshift(n);
          }

          if (n === t) {

            // reconstruct path
            current = n;
            let path = [ current ];
            while (previous[current] !== undefined) {
              current = previous[current];
              path.unshift(current);
            }
            return path;

          }
        }
      }
    }

    // if we can't find a path between the nodes
    return null;
  },*/
  toInt : function(str) {
    let i = parseInt(str);
    if (isNaN(i))
      throw new CatonlineError('Unable to parse int: '+str);
    return i;
  },
  parse : {
    trade(game, args) {
      args = args.split(' ');
      if (!args.length)
        throw new EdgeArgumentError('trade',[],'Nothing to trade.');
      let trade = { in:{}, out:{}, with:new Set() },
        parsing = trade.out,
        expecting ='int';
      for (let a=0; a<args.length; a++) {
        if (args[a]==='=') {
          parsing = trade.in;
        } else {
          if (args[a][0] === '@') {
            trade.with.add( module.exports.toInt(args[a].slice(1)) );
            console.log(JSON.stringify(args[a].slice(1)), JSON.stringify(Array.from(trade.with)));
          } else {
            let res = module.exports.parse.resource(game, args[a+1]),
              num = module.exports.toInt(args[a]);
            parsing[res] = (parsing[res] ? parsing[res]+num : num);
            a += 1;
          }
        }
      }

      trade.with = Array.from(trade.with);
      if (!Object.keys(trade.out).length)
        throw new EdgeArgumentError('trade',trade,'You must specify at least one resource to give away.');
      if (!Object.keys(trade.in).length)
        throw new EdgeArgumentError('trade',trade,'You must specify at least one resource to receive.');
      return trade;
    },
    hex(game, h) {
      let hex = parseInt(h);
      if (isNaN(hex))
        throw new EdgeArgumentError('hex',h,h+' is not a number.');
      if (hex<0 || game.board.hexes.length<=hex)
        throw new EdgeArgumentError('hex',h,'Value must be between 0 and '
          + (game.board.hexes.length-1) + '.');
      return game.board.hexes[hex];
    },
    junc(game, j) {
      let junc = parseInt(j);
      if (isNaN(junc))
        throw new EdgeArgumentError('junc',j,j+' is not a number.');
      if (junc<0 || game.board.juncs.length<=junc)
        throw new EdgeArgumentError('junc',j,'Value must be between 0 and '
          + (game.board.juncs.length-1) + '.');
      return game.board.juncs[junc];
    },
    player(game, p) {
      let player = parseInt(p);
      if (isNaN(p))
        throw new GetPlayerError(p, p+' is not a number.');
      if (player<0 || game.state.players.length<=player)
        throw new GetPlayerError(p, 'Value must be between 0 and '
          + (game.state.players.length-1) + '.');
      return game.state.players[player];
    },
    resource(game, res) {
      if (require('./logic/init').validateResource(game, res))
        return res;
      throw new EdgeArgumentError('res',res,res+' is not a resource.');
    },
    road(game, r) {
      let road = parseInt(r);
      if (isNaN(road))
        throw new EdgeArgumentError('road',r,''+r+' is not a number.');
      if (road<0 || game.board.roads.length<=road)
        throw new EdgeArgumentError('road',r,'Value must be between 0 and '
          + (game.board.roads.length-1) + '.');
      return game.board.roads[road];
    }
  },
  sumObject(obj) {
    let acc = 0;
    for (let key in obj) {
      acc += obj[key];
    }
    return acc;
  },


  User : require('./models/user'),
  Game : require('./models/game')

}
