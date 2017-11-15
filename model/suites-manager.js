let curentSuite;

class SuitesManager {
  static currentSuite() {
    return curentSuite;
  }

  static setCurrentSuite(suite) {
    curentSuite = suite;
  }
}

module.exports = SuitesManager;
