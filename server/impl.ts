import { Methods, Context, Result } from "./.rtag/methods";
import {
  UserData,
  PlayerState,
  ICreateGameRequest,
  IJoinGameRequest,
  IAnswerQuestionRequest,
} from "./.rtag/types";

interface InternalState {}

export class Impl implements Methods<InternalState> {
  createGame(user: UserData, ctx: Context, request: ICreateGameRequest): InternalState {
    return {};
  }
  joinGame(state: InternalState, user: UserData, ctx: Context, request: IJoinGameRequest): Result {
    return Result.unmodified("Not implemented");
  }
  answerQuestion(state: InternalState, user: UserData, ctx: Context, request: IAnswerQuestionRequest): Result {
    return Result.unmodified("Not implemented");
  }
  getUserState(state: InternalState, user: UserData): PlayerState {
    return {
      currentPlayer: "",
      players: [],
    };
  }
  onTick(state: InternalState, ctx: Context, timeDelta: number): Result {
    return Result.unmodified();
  }
}
