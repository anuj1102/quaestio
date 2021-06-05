import { Methods, Context, Result } from "./.rtag/methods";
import {
  UserData,
  PlayerInfo,
  PlayerState,
  ICreateGameRequest,
  IJoinGameRequest,
  IAnswerQuestionRequest,
} from "./.rtag/types";
import axios from 'axios';

interface InternalState {
  players: PlayerInfo[];
  question_timeout: number;
}


var tick = 0;
var secs = 0;

const DEFAULT_TIMEOUT = 10;

export class Impl implements Methods<InternalState> {
  createGame(user: UserData, ctx: Context, request: ICreateGameRequest): InternalState {
    return {
      players: [],
      question_timeout: DEFAULT_TIMEOUT,
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
      question_timeout: state.question_timeout,
    };
  }
  loadQuestions(state: InternalState) {
    axios.get('https://opentdb.com/api.php?amount=50&category=23&difficulty=easy&type=multiple')
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
    // always executed
    });
  }
  onSec(state: InternalState) {
    console.log(`here: ${state.question_timeout}`)
    state.question_timeout -= 1;
    if(state.question_timeout == 0 ) {
      this.loadQuestions(state);
      state.question_timeout = DEFAULT_TIMEOUT;
    }

  }
  onTick(state: InternalState, ctx: Context, timeDelta: number): Result {
    tick += timeDelta;
    if (tick >= 1) {
      tick = 0;
      secs += 1;
      this.onSec(state);
    }
    return Result.modified();
  }
}
