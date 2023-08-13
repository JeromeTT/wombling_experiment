export function scaleDataColumns(data, headers) {
  let dataCopy = JSON.parse(JSON.stringify(data));
  for (let colName of headers) {
    // Find maximum of column
    const colMax = dataCopy.reduce((acc, row) => {
      if (row[colName] > acc) {
        acc = row[colName];
      }
      return acc;
    }, 0);
    // Divide each element by maximum of column
    dataCopy.forEach((element) => {
      element[colName] /= colMax;
    });
  }

  return dataCopy;
}

export function normaliseDataColumns(data, headers) {
  let dataCopy = JSON.parse(JSON.stringify(data));
  // Fit each column to a distribution?
  // EXPONENTIAL: requires the mean
  for (let colName of headers) {
    // Find maximum of column
    let colMean = dataCopy.reduce(
      (acc, row) => {
        if (!row[colName]) {
          return acc;
        }
        acc[0]++;
        acc[1] = acc[1] + (+row[colName] - +acc[1]) / +acc[0];
        return acc;
      },
      [0, 0]
    );
    // Fit CDF to all values of the column
    const CDF = exponentialCDF(1 / colMean[1]);
    for (let row of dataCopy) {
      row[colName] = CDF(row[colName]);
    }
  }
  return dataCopy;
}

export function exponentialCDF(lambda) {
  return function (x) {
    return 1 - Math.E ** (-1 * lambda * x);
  };
}

export function exponentialPDF(lambda) {
  function PDF(x) {
    return lambda * Math.E ** (-lambda * x);
  }
  return PDF;
}
