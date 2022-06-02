import fetch from "node-fetch";
import { argv } from "process";
import readline from "readline";

const TAG_LEVEL = "Lvl";
const TAG_WORD = "Word";
const TAG_DEFINITION = "Definition";
const TAG_EXAMPLE = "Example";

const DOWNLOAD_URL =
  "https://docs.google.com/spreadsheets/d/1yHtibm1jeJAnNdhCarsdy-CyVIc4kbijpjVKpL5KduQ/gviz/tq?";

function getParsedData(responseText) {
  const jsonData = JSON.parse(responseText.substring(47).slice(0, -2));
  const table = jsonData.table;
  const rows = table.rows;

  const lvlColIndex = rows[0].c.findIndex((el) => el?.v == TAG_LEVEL);
  const levels = rows.slice(1).map((row) => row.c[lvlColIndex]?.v);

  const wordColIndex = rows[0].c.findIndex((el) => el?.v == TAG_WORD);
  const words = rows.slice(1).map((row) => row.c[wordColIndex]?.v);

  const defColIndex = rows[0].c.findIndex((el) => el?.v == TAG_DEFINITION);
  const definitions = rows.slice(1).map((row) => row.c[defColIndex]?.v);

  const exColIndex = rows[0].c.findIndex((el) => el?.v == TAG_EXAMPLE);
  const examples = rows.slice(1).map((row) => row.c[exColIndex]?.v);

  // return pack
  return { levels, words, definitions, examples };
}

function getLineObject({ levels, words, definitions, examples }, wordIndex) {
  let word = words[wordIndex];
  let level = levels[wordIndex];
  let definition = definitions[wordIndex];
  let example = examples[wordIndex];

  return { word, level, definition, example };
}

function checkAnswer(answer, expectedWord, example) {
  const isCorrect =
    answer?.toLocaleLowerCase() === expectedWord?.toLocaleLowerCase();

  if (isCorrect) {
    console.log("\x1b[32m%s\x1b[0m", "CORRECT");
  } else {
    console.log("\x1b[31m%s\x1b[0m", "WRONG");
    console.log("It was");
    console.log(expectedWord);
  }

  if (example) {
    console.log("Examples:");
    console.log(example);
  }
}

function askQuestion(pack) {
  const wordIndex = Math.floor(Math.random() * pack.words.length);
  let question = getLineObject(pack, wordIndex);

  console.log("\n");
  console.log(question.definition, question.level ? `(${question.level})` : "");

  return question;
}

function runInOut(handler) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", handler);
}

function randomTrainer(pack) {
  console.log("HELLO, I AM RANDOM TRAINER\n");
  console.log("I say the definition and you type the corresponding word");
  console.log("Let's go!\n");

  let question = askQuestion(pack);

  runInOut((answer) => {
    checkAnswer(answer, question.word, question.example);
    question = askQuestion(pack);
  });
}

function courseTrainer(pack) {
  console.log("HELLO, I AM COURSE TRAINER\n");
  console.log("I say the definition and you type the corresponding word");
  console.log("Let's go!\n");

  let question = askQuestion(pack);

  runInOut((answer) => {
    checkAnswer(answer, question.word, question.example);
    question = askQuestion(pack);
  });
}

async function go(trainer) {
  const response = await fetch(DOWNLOAD_URL);
  const data = await response.text();

  const parsed = getParsedData(data);

  trainer(parsed);
}

const map = new Map([
  ["default", courseTrainer],
  ["random", randomTrainer],
  ["course", courseTrainer],
]);

const enteredStrategy = argv[2] || "default";
const concreteTrainer = map.get(enteredStrategy);

go(concreteTrainer);
