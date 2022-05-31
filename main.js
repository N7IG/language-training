import fetch from "node-fetch";
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

  return { levels, words, definitions, examples };
}

function trainer({ levels, words, definitions, examples }) {
  console.log("I say the definition and you type the corresponding word");
  console.log("Let's go!\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  let wordIndex = Math.floor(Math.random() * words.length);
  let word = words[wordIndex];
  let level = levels[wordIndex];
  let definition = definitions[wordIndex];
  let example = examples[wordIndex];

  console.log(definition, level ? `(${level})` : "");

  rl.on("line", function (line) {
    const isCorrect = line?.toLocaleLowerCase() === word?.toLocaleLowerCase();

    if (isCorrect) {
      console.log("\x1b[32m%s\x1b[0m", "CORRECT");
    } else {
      console.log("\x1b[31m%s\x1b[0m", "WRONG");
      console.log("It was");
      console.log(word);
    }

    if (example) {
      console.log("Examples:");
      console.log(example);
    }

    wordIndex = Math.floor(Math.random() * words.length);
    word = words[wordIndex];
    level = levels[wordIndex];
    definition = definitions[wordIndex];
    example = examples[wordIndex];

    console.log("\n");
    console.log(definition, level ? `(${level})` : "");
  });
}

async function go(trainer) {
  const response = await fetch(DOWNLOAD_URL);
  const data = await response.text();

  const parsed = getParsedData(data);

  trainer(parsed);
}

go(trainer);
