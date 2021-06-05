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

class Question {
  category: string;
  question_type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];

  constructor(category: string,
              question_type: string,
              difficulty: string,
              question: string,
              correct_answer: string,
              incorrect_answers: string[]) {
    this.category = category;
    this.question_type = question_type;
    this.difficulty = difficulty;
    this.question = question;
    this.correct_answer = correct_answer;
    this.incorrect_answers = incorrect_answers;
  }
}

interface InternalState {
  players: PlayerInfo[];
  question_timeout: number;
  current_question: string;
  all_questions: Question[];
}


var tick = 0;
var secs = 0;

const DEFAULT_TIMEOUT = 10;

export class Impl implements Methods<InternalState> {
  createGame(user: UserData, ctx: Context, request: ICreateGameRequest): InternalState {
    return {
      players: [],
      question_timeout: DEFAULT_TIMEOUT,
      current_question: "",
      all_questions: this.loadQuestions(),
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

    if(state.all_questions.length === 0) {
      state.all_questions = this.loadQuestions();
    }

    state.current_question = state.all_questions[0].category

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
  loadQuestions() : Question[] {
    /* axios.get('https://opentdb.com/api.php?amount=10&category=23&difficulty=easy&type=multiple') */
    axios.get('https://opentdb.com/api.php', { params: {
      amount: 10,
      category: 23,
      difficulty: 'easy',
      type: 'multiple',
    }})
    .then(function (response) {
      console.log(response.data.results[0].incorrect_answers); var res = response.data.results.map ((q: any) => new Question(
        q['category'],
        q['type'],
        q['difficulty'],
        q['question'],
        q['correct_answer'],
        q['incorrect_answers']
      ));
      console.log(res);
      return res;
    })
    .catch(function (error) {
      // handle error
      console.log(error);
      return [];
    });
    return [];
  }
  onSec(state: InternalState) {
    console.log(`here: ${state.question_timeout}`)
    console.log(`here: ${state.all_questions}`)
    state.question_timeout -= 1;
    if(state.question_timeout == 0 ) {
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
