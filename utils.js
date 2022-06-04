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
    history: [],
  }));
}

function wasLastNCorrect(history, n) {
  return getNumberOfLastCorrectAnswers(history) >= n;
}

function getNumberOfLastCorrectAnswers(history) {
  return history.length - 1 - history.lastIndexOf(false);
}

function getNumberOfCorrectAnswers(history) {
  return history.filter((h) => h === true).length;
}

function getLeastCorrectRepeated(packArray) {
  const historyLengths = packArray.map((pack) =>
    getNumberOfCorrectAnswers(pack.history)
  );
  const minHistoryLength = Math.min(...historyLengths);

  return packArray.filter(
    (pack) => getNumberOfCorrectAnswers(pack.history) === minHistoryLength
  );
}

function getLatestWordExcluded(packArray, latestPack) {
  return packArray.length > 1 && latestPack
    ? packArray.filter(
        (pack) =>
          pack.word !== latestPack.word &&
          pack.definition !== latestPack.definition
      )
    : packArray;
}

function getLimit(pack, correctLimit, mistakeLimit) {
  mistakeLimit = mistakeLimit ? mistakeLimit : correctLimit + 1;
  return pack.history.includes(false)
    ? Math.min(
        mistakeLimit + pack.history.filter((v) => v === false).length,
        mistakeLimit
      )
    : correctLimit;
}
