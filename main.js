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

  const tableHeadRowInfo = rows[0].c;
  const tableDataRows = rows.slice(1);

  const lvlColIndex = tableHeadRowInfo.findIndex((el) => el?.v === TAG_LEVEL);
  const wordColIndex = tableHeadRowInfo.findIndex((el) => el?.v === TAG_WORD);
  const defColIndex = tableHeadRowInfo.findIndex(
    (el) => el?.v === TAG_DEFINITION
  );
  const exColIndex = tableHeadRowInfo.findIndex((el) => el?.v === TAG_EXAMPLE);

  const unzippedDataRows = tableDataRows.map((cEl) =>
    cEl.c.map((vEl) => vEl?.v)
  );

  return unzippedDataRows.map((row) => ({
    level: row[lvlColIndex],
    word: row[wordColIndex],
    definition: row[defColIndex],
    example: row[exColIndex],
  }));
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

  return isCorrect;
}

function askRandomQuestion(packArray) {
  const wordIndex = Math.floor(Math.random() * packArray.length);
  let pack = packArray[wordIndex];

  askQuestion(pack);

  return pack;
}

function askQuestion(pack) {
  console.log("\n");
  console.log(pack.definition, pack.level ? `(${pack.level})` : "");
}

function runInOut(handler) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", handler);
}

function randomTrainer(packArray) {
  console.log("HELLO, I AM RANDOM TRAINER\n");
  console.log("I say the definition and you type the corresponding word");
  console.log("Let's go!\n");

  let question = askRandomQuestion(packArray);

  runInOut((answer) => {
    checkAnswer(answer, question.word, question.example);
    question = askRandomQuestion(packArray);
  });
}

function wasLastNCorrect(history, n) {
  return getNumberOfLastCorrectAnswers(history) >= n;
}

function getNumberOfLastCorrectAnswers(history) {
  return history.length - 1 - history.lastIndexOf(false);
}

function getLeastCorrectRepeated(packArray) {
  const historyLengths = packArray.map((pack) =>
    getNumberOfLastCorrectAnswers(pack.history)
  );
  const minHistoryLength = Math.min(...historyLengths);

  return packArray.filter(
    (pack) => getNumberOfLastCorrectAnswers(pack.history) === minHistoryLength
  );
}

function getLatestWordExcluded(packArray, latestPack) {
  return packArray.length > 1
    ? packArray.filter(
        (pack) =>
          pack.word !== latestPack.word &&
          pack.definition !== latestPack.definition
      )
    : packArray;
}

function getLimit(pack, correctLimit, mistakeLimit = 5) {
  return pack.history.includes(false)
    ? Math.min(
        mistakeLimit + pack.history.filter((v) => v === false).length,
        mistakeLimit
      )
    : correctLimit;
}

function courseTrainer(packArray, eachWordShouldBeRepeatedTimes = 2) {
  console.log("HELLO, I AM COURSE TRAINER\n");
  console.log("I say the definition and you type the corresponding word");
  console.log("Let's go!\n");

  let wordsToTest = packArray.map((el) => ({ ...el, history: [] }));

  let question = askRandomQuestion(wordsToTest);

  runInOut((answer) => {
    const isCorrect = checkAnswer(answer, question.word, question.example);
    question.history.push(isCorrect);

    wordsToTest = wordsToTest.filter(
      (pack) =>
        !wasLastNCorrect(
          pack.history,
          getLimit(pack, eachWordShouldBeRepeatedTimes)
        )
    );

    if (!wordsToTest.length) {
      console.log("\nCongratulations!\n");
      process.exit();
    }

    question = askRandomQuestion(
      getLatestWordExcluded(getLeastCorrectRepeated(wordsToTest), question)
    );
  });
}

async function go(trainer, range) {
  const response = await fetch(DOWNLOAD_URL);
  const data = await response.text();

  const parsed = getParsedData(data);

  trainer(parsed.slice(...range));
}

const map = new Map([
  ["default", courseTrainer],
  ["random", randomTrainer],
  ["course", courseTrainer],
]);

const enteredStrategy = argv[4] || "default";
const range = [Number(argv[2]) || 0, Number(argv[3]) || Infinity];

const concreteTrainer = map.get(enteredStrategy);

go(concreteTrainer, range);
