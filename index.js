const TAG_LEVEL = "Lvl";
const TAG_WORD = "Word";
const TAG_DEFINITION = "Definition";
const TAG_EXAMPLE = "Example";

const DOWNLOAD_URL =
  "https://docs.google.com/spreadsheets/d/1yHtibm1jeJAnNdhCarsdy-CyVIc4kbijpjVKpL5KduQ/gviz/tq?";

const BODY = document.querySelector("body");
const ANSWER_INPUT = document.querySelector(".answer-input");
const QUESTION = document.querySelector(".question");
const RESULTS = document.querySelector(".results");
const PAGE_1 = document.querySelector(".page1");
const PAGE_2 = document.querySelector(".page2");
const RANGE_MIN = document.querySelector(".range-min");
const RANGE_MAX = document.querySelector(".range-max");
const EACH_WORDS = document.querySelector(".each-words");

const MIN_LABEL = document.querySelector(".min-label");
const MAX_LABEL = document.querySelector(".max-label");

let TABLE = [];
let EACH_WORDS_REP = 2;
let CURRENT_QUESTION = {};
let RANGE = [0, 0];
let ask = askCourseQuestion;
let COURSE_TABLE = [];
let isRepeatRound = false;
let MISTAKEN = [];

async function fetchTable() {
  const response = await fetch(DOWNLOAD_URL);
  const data = await response.text();

  TABLE = getParsedData(data);
  COURSE_TABLE = TABLE;
  intRangeControls();
}
fetchTable();

function intRangeControls() {
  RANGE_MIN.min = 0;
  RANGE_MIN.max = TABLE.length;
  RANGE_MIN.value = 0;
  RANGE_MAX.min = 0;
  RANGE_MAX.max = TABLE.length;
  RANGE_MAX.value = TABLE.length;
}

function clickHandler() {
  checkAndShowResults(ANSWER_INPUT.value, CURRENT_QUESTION);
  ask();
  clearInput();
}

function minChange() {
  RANGE[0] = RANGE_MIN.value;
  MIN_LABEL.innerText = `Min: ${RANGE[0]}`;
}

function maxChange() {
  RANGE[1] = RANGE_MAX.value;
  MAX_LABEL.innerText = `Max: ${RANGE[1]}`;
}

function setupRange() {
  minChange();
  maxChange();
}

function settingsPicked() {
  PAGE_1.style.display = "none";
  PAGE_2.style.display = "block";
  EACH_WORDS_REP = EACH_WORDS.value;

  setupRange();

  TABLE = TABLE.slice(...RANGE);
  COURSE_TABLE = TABLE;

  ask();
}

ANSWER_INPUT.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    clickHandler();
  }
});

function randomPicked() {
  ask = askRandomQuestion();
}

function coursePicked() {
  ask = askCourseQuestion();
}

function clearInput() {
  ANSWER_INPUT.value = "";
}

function showQuestion(question) {
  QUESTION.innerHTML = `<div class="history">${question.history
    .map((a) => (a ? "+" : "-"))
    .join(" ")}</div> <div class="def">${question.definition}</div>`;
}

function showResults(isCorrect, question) {
  RESULTS.innerHTML = isCorrect
    ? '<div class="status" style="color: green">CORRECT</div>'
    : `<div class="status"style="color: red">INCORRECT</div><div>It was <b>${question.word}</b></div>`;

  RESULTS.innerHTML += question.example
    ? `Examples:
       <div>${question.example}</div>`
    : "";
}

function checkResults(answer, question) {
  return (
    answer?.toLocaleLowerCase().trim() ===
    question.word?.toLocaleLowerCase().trim()
  );
}

function askRandomQuestion(table = TABLE) {
  const wordIndex = Math.floor(Math.random() * table.length);
  let pack = table[wordIndex];
  CURRENT_QUESTION = pack;

  showQuestion(pack);
}

function askCourseQuestion() {
  COURSE_TABLE = COURSE_TABLE.filter(
    (pack) => !wasLastNCorrect(pack.history, getLimit(pack, EACH_WORDS_REP))
  );

  if (COURSE_TABLE.length) {
    askRandomQuestion(
      getLeastCorrectRepeated(
        getLatestWordExcluded(COURSE_TABLE),
        CURRENT_QUESTION
      )
    );
  } else {
    if (false) {
      // if (!isRepeatRound && MISTAKEN.length) {
      repeatedRound = true;
      COURSE_TABLE = MISTAKEN;
      askRandomQuestion(
        getLeastCorrectRepeated(
          getLatestWordExcluded(COURSE_TABLE),
          CURRENT_QUESTION
        )
      );
    } else {
      showCongrats();
    }
  }
}

function showCongrats() {
  BODY.innerHTML = `<div class="congrats"><div>Congratulations!<br> Reload page to try again</div></div>`;
}

function checkAndShowResults(answer, question) {
  const isCorrect = checkResults(answer, question);
  question.history.push(isCorrect);
  showResults(isCorrect, question);
}
