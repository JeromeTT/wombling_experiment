/**
 * Scales the data provided to between values of 0 and 1.
 * @param {*} data TODO
 * @param {*} headers headers containing which attributes need to be normalised
 */
export async function scaleDataColumns(data, headers) {
  for (let colName of headers) {
    // Find maximum of column
    const colMax = data.reduce((acc, row) => {
      if (row.raw[colName] > acc) {
        acc = row.raw[colName];
      }
      return acc;
    }, 0);
    // Divide each element by maximum of column
    data.forEach((row) => {
      if (row["scaled"] == undefined) {
        row["scaled"] = {};
      }
      row["scaled"][colName] = row.raw[colName] / colMax;
    });
  }
}
/**
 * Normalised the data provided to between values of 0 and 1.
 * @param {*} data TODO
 * @param {*} headers headers containing which attributes need to be normalised
 */
export async function normaliseDataColumns(data, headers) {
  // Fit each column to a distribution?
  // EXPONENTIAL: requires the mean
  for (let colName of headers) {
    // Find maximum of column
    let colMean = data.reduce(
      (acc, row) => {
        if (!row.scaled[colName]) {
          return acc;
        }
        acc[0]++;
        acc[1] = acc[1] + (+row.scaled[colName] - +acc[1]) / +acc[0];
        return acc;
      },
      [0, 0]
    );
    // Fit CDF to all values of the column
    const CDF = exponentialCDF(1 / colMean[1]);

    for (let row of data) {
      if (row.normalised == undefined) {
        row.normalised = {};
      }
      row.normalised[colName] = CDF(row.scaled[colName]);
    }
  }
}
/**
 * TODO
 * @param {*} data TODO
 * @param {*} headers headers containg which attributes need to be ranked.
 */
export async function rankDataColumns(data, headers) {
  let dataCopy = data;
  let len = data.length;
  for (let colName of headers) {
    // sort
    dataCopy.sort((a, b) => b.raw[colName] - a.raw[colName]);
    let effectiveRank = 0;
    for (let i in dataCopy) {
      let row = dataCopy[i];
      if (row.rank == undefined) {
        row.rank = {};
      }
      if (
        effectiveRank == 0 ||
        row.raw[colName] != dataCopy[effectiveRank].raw[colName]
      ) {
        effectiveRank = i;
      }
      // row.rank[colName] = (effectiveRank + 1) / dataCopy.length;
      row.rank[colName] = 1 - effectiveRank / len;
    }
  }
}
/**
 * Exponential CDF function.
 * @param {*} lambda lambda parameter in exponential function
 * @returns corresponding CDF function given lambda
 */
export function exponentialCDF(lambda) {
  return function (x) {
    return 1 - Math.E ** (-1 * lambda * x);
  };
}

/**
 * Exponential PDF function.
 * @param {*} lambda lambda parameter in exponential function
 * @returns corresponding CDF function given lambda
 */
export function exponentialPDF(lambda) {
  function PDF(x) {
    return lambda * Math.E ** (-lambda * x);
  }
  return PDF;
}
