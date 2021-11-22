"use strict";

const fetch = require("node-fetch");
// Once MagicMirror uses an electron version that uses Node 16, we can get this from globalThis
const AbortController = require("node-abort-controller").AbortController;

class FroniusFetcher {
  constructor(config) {
    this.requestTimeout = config.requestTimeout;
    this.url = `http://${config.ip}/solar_api/v1/GetPowerFlowRealtimeData.fcgi`;
  }

  async fetch() {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.requestTimeout);

    try {
      const response = await fetch(this.url, { signal: controller.signal });
      const rawData = await response.json();
      const convertedData = this.convertSiteData(rawData);
      return convertedData;
    } catch (error) {
      if (error.type === "aborted") {
        throw new Error("RequestTimeout");
      }

      console.error(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  convertSiteData(rawData) {
    const targetData = rawData.Body.Data.Site;
    const convertedData = {
      energyDay: targetData.E_Day,
      energyTotal: targetData.E_Total,
      energyYear: targetData.E_Year,
      energyNow: targetData.P_PV,
      meterLocation: targetData.Meter_Location,
      mode: targetData.Mode,
      powerAkku: targetData.P_Akku,
      powerGrid: targetData.P_Grid,
      powerLoad: targetData.P_Load,
      autonomy: targetData.rel_Autonomy,
      selfConsumption: targetData.rel_SelfConsumption,
    };

    return convertedData;
  }

  fetchDummyData() {
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
