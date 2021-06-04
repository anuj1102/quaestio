import { Methods, Context, Result } from "./.rtag/methods";
import {
  UserData,
  PlayerInfo,
  PlayerState,
  ICreateGameRequest,
  IJoinGameRequest,
  IAnswerQuestionRequest,
} from "./.rtag/types";

interface InternalState {
  players: PlayerInfo[];
}

export class Impl implements Methods<InternalState> {
  createGame(user: UserData, ctx: Context, request: ICreateGameRequest): InternalState {
    return {
      players: []
    };
  }
  joinGame(state: InternalState, user: UserData, ctx: Context, request: IJoinGameRequest): Result {
    if (state.players.find((player) => player.name === user.name)) {
      return Result.unmodified("Already joined");
    }
    state.players.push({name: user.name, score: 0});
    return Result.modified();
  }
  answerQuestion(state: InternalState, user: UserData, ctx: Context, request: IAnswerQuestionRequest): Result {
    var player = state.players.find((p) => p.name === user.name);
    if (player === undefined) {
      return Result.unmodified("Invalid player");
    }

    player.score += 1

    return Result.modified();
  }
  getUserState(state: InternalState, user: UserData): PlayerState {
    return {
      currentPlayer: user.name,
      players: state.players,
    };
  }
  onTick(state: InternalState, ctx: Context, timeDelta: number): Result {
    console.log("Asdf");
    return Result.unmodified();
  }
}
