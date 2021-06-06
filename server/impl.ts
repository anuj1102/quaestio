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

var tick = 0;
const DEFAULT_TIMEOUT = 10;

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
  choices: string[];
  start_countdown: boolean;
}

export class Impl implements Methods<InternalState> {
  createGame(user: UserData, ctx: Context, request: ICreateGameRequest): InternalState {
    return {
      players: [],
      question_timeout: DEFAULT_TIMEOUT,
      current_question: "Press joinGame to begin",
      all_questions: [],
      choices: [],
      start_countdown: false,
    };
  }
  joinGame(state: InternalState, user: UserData, ctx: Context, request: IJoinGameRequest): Result {
    this.loadQuestions(state);
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

    if (request.answer !== state.all_questions[0].correct_answer) {
      return Result.unmodified();
    }

    player.score += 1
    this.nextQuestion(state, true);

    return Result.modified();
  }
  getUserState(state: InternalState, user: UserData): PlayerState {
    return {
      currentPlayer: user.name,
      players: state.players,
      question_timeout: state.question_timeout,
      current_question: state.current_question,
      choices: state.choices,
    };
  }
  loadQuestions(state: InternalState): void {
    if (state.all_questions.length != 0) {
      return;
    }

    axios.get('https://opentdb.com/api.php', { params: {
      amount: 10,
      category: 23,
      difficulty: 'easy',
      type: 'multiple',
    }})
    .then(response => {
      state.all_questions = response.data.results.map ((q: any) => new Question(
        q['category'],
        q['type'],
        q['difficulty'],
        q['question'],
        q['correct_answer'],
        q['incorrect_answers']
      ));
      this.nextQuestion(state, false);
      state.start_countdown = true;
    })
    .catch(error => {
      console.log(error);
    });
  }
  nextQuestion(state: InternalState, shift: boolean): void {
    if (shift) {
      state.all_questions.shift();
    }

    if (state.all_questions.length === 0) {
      state.current_question = "GAME OVER";
      state.choices = [];
      return;
    }

    const q_info = state.all_questions[0];
    state.current_question = q_info.question;
    state.choices = q_info.incorrect_answers;
    state.choices.push(q_info.correct_answer);
    state.choices.sort();
    state.question_timeout = DEFAULT_TIMEOUT;
  }
  onSec(state: InternalState) {
    state.question_timeout -= 1;
    if (state.question_timeout == 0 ) {
      state.question_timeout = DEFAULT_TIMEOUT;
      this.nextQuestion(state, true);
    }
  }
  onTick(state: InternalState, ctx: Context, timeDelta: number): Result {
    if (!state.start_countdown) {
      return Result.unmodified();
    }

    tick += timeDelta;
    if (tick >= 1) {
      tick = 0;
      this.onSec(state);
    }

    return Result.modified();
  }
}
