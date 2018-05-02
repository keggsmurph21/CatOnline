
class CatonlineError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CatonlineError';
  }
}
global.CatonlineError = CatonlineError;




class NotImplementedError extends CatonlineError {
  constructor(message) {
    super(message);
    this.name = 'NotImplementedError';
  }
}
global.NotImplementedError = NotImplementedError;





class LogicError extends CatonlineError {
  constructor(message) {
    super(message);
    this.name = 'LobbyLogicError';
  }
}
global.LogicError = LogicError




class LobbyLogicError extends LogicError {
  constructor(message) {
    super(message);
    this.name = 'LobbyLogicError';
  }
}
global.LobbyLogicError = LobbyLogicError




class GameLogicError extends LogicError {
  constructor(message) {
    super(message);
    this.name = 'GameLogicError';
  }
}
global.GameLogicError = GameLogicError;

class NewGameLogicError extends GameLogicError {
  constructor(message) {
    super(message);
    this.name = 'NewGameLogicError';
  }
}
global.NewGameLogicError = NewGameLogicError;


class UserInputError extends CatonlineError {
  constructor(message) {
    super(message);
    this.name = 'UserInputError';
  }
}
global.UserInputError = UserInputError;

class GetPlayerError extends GameLogicError {
  constructor(got, message) {
    super(message);
    this.got  = got;
    this.name = 'GetPlayerError';
  }
}
global.GetPlayerError = GetPlayerError;

class EdgeArgumentError extends UserInputError {
  constructor(type, got, message) {
    super(message);
    this.type = type;
    this.got  = got;
    this.name = 'EdgeArgumentError';
  }
}
global.EdgeArgumentError = EdgeArgumentError;

class InvalidChoiceError extends UserInputError {
  constructor(type, obj, message) {
    super(message);
    this.type = type;
    this.obj  = obj;
    this.name = 'InvalidChoiceError';
  }
}
global.InvalidChoiceError = InvalidChoiceError;

class PovertyError extends UserInputError {
  constructor(player, cost) {

    // build an overly complicated message here
    let shortfall = {};
    for (let res in cost) {
      if (player.resources[res] < cost[res])
        shortfall[res] = cost[res] - player.resources[res];
    }
    let message = 'Insufficient funds: (need ', sf = [];
    for (let res in shortfall) {
      let amt = shortfall[res];
      sf.push( amt+' more '+res+(amt>1 ? 's' : ''));
    }
    message += sf.join(', ');
    message += ')';

    super(message);

    this.have = player.resources;
    this.need = cost;

    this.name = 'PovertyError';
  }
}
global.PovertyError = PovertyError;
