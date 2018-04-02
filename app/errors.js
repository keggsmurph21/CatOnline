
function findShortfalls(have, need) {
  let shortfall = {};
  for (let res in need) {
    if (have[res] < need[res])
      shortfall[res] = need[res] - have[res];
  }
  return shortfall;
}

class CatonlineError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CatonlineError';
  }
}
global.CatonlineError = CatonlineError;


class NotImplementedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotImplementedError';
  }
}
global.NotImplementedError = NotImplementedError;



class GameLogicError extends CatonlineError {
  constructor(message) {
    super(message);
    this.name = 'GameLogicError';
  }
}
global.GameLogicError = GameLogicError;



class UserInputError extends CatonlineError {
  constructor(message) {
    super(message);
    this.name = 'UserInputError';
  }
}
global.UserInputError = UserInputError;

class GetPlayerError extends UserInputError {
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
    let shortfall = findShortfalls(player.resources, cost),
      message = 'Insufficient funds: (need ', sf = [];
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
