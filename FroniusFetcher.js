"use strict";

const fetch = require("node-fetch");
// Once MagicMirror uses an electron version that uses Node 16, we can get this from globalThis
const AbortController = require("node-abort-controller").AbortController;

class FroniusFetcher {
  constructor(config) {
    this.requestTimeout = config.requestTimeout;
    this.url = `http://${config.ip}/solar_api/v1/GetPowerFlowRealtimeData.fcgi`;
    this.controller = new AbortController();
    this.timeout = setTimeout(() => {
      this.controller.abort();
    }, 1000);
  }

  async fetch() {
    try {
      const response = await fetch(this.url, { signal: this.controller.signal });
      const rawData = await response.json();
      const convertedData = this.convertSiteData(rawData);
      return convertedData;
    } catch (error) {
      if (error.type === "aborted") {
        throw new Error("RequestTimeout");
      }

      console.error(error);
    } finally {
      clearTimeout(this.timeout);
    }
  }

  convertSiteData(rawData) {
    const targetData = rawData.Body.Data.Site;
    const convertedData = {
      energyDay: targetData.E_Day,
      energyTotal: targetData.E_Total,
      energyYear: targetData.E_Year,
      energyNow: targetData.P_PV,
    };

    return convertedData;
  }

  fetchDummyData() {
    // const currentEnergy = Math.floor(Math.random() * 10000) + 1;
    console.log(currentEnergy);
    const convertedData = {
      energyDay: 2000.7000732421875,
      energyTotal: 15107.0009765625,
      energyYear: 15107.5,
      currentEnergy: 123475,
    };

    return convertedData;
  }
}

module.exports = FroniusFetcher;
