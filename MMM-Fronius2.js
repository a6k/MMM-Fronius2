"use strict";
/* global Module */

/* Magic Mirror
 * Module: MMM-Fronius2
 *
 * By Beh (hello@beh.wtf)
 * MIT Licensed.
 */

Module.register("MMM-Fronius2", {
  defaults: {
    name: "MMM-Fronius2",
    header: "PV Anlage",
    hidden: false,
    ip: "192.168.200.173",
    requestTimeout: 1500,
    kwConversionOptions: {
      enabled: true,
      threshold: 1200,
      numDecimalDigits: 2,
    },
    updateInterval: 3000
  },

  requiresVersion: "2.17.0", // Required version of MagicMirror

  start: function () {
    this.data.header = this.config.header;
    this.currentData = null;
    this.loaded = false;

    this.sendSocketNotification("MMM-Fronius2_INIT", this.config);

    Log.info("MMM-Fronius2 started.");
  },

  scheduleUpdate: function () {
    setInterval(() => {
      this.sendSocketNotification("MMM-Fronius2_FETCH_DATA");
    }, this.config.updateInterval);
  },

  getDom: function () {
    // create element wrapper for show into the module
    const wrapper = document.createElement("div");
    wrapper.id = "fronius2-wrapper";
    wrapper.style.width = `${this.config.width}px`;

    if (this.currentData === null && !this.loaded) {
      wrapper.className = "small light dimmed";
      wrapper.innerHTML = `${this.translate("LOADING")}...`;
      return wrapper;
    }

    // Table for displaying Values
    const tableWrapper = document.createElement("div");
    tableWrapper.id = "table-wrapper";
    const table = this.generateDataTable();
    tableWrapper.appendChild(table);

    wrapper.appendChild(tableWrapper);

    return wrapper;
  },

  generateDataTable: function () {
    const table = document.createElement("table");

    const energyNowDescription = `${this.translate("ENERGY_NOW")}:`;
    const energyNowValue = this.getWattString(this.currentData.energyNow);
    this.appendTableRow(energyNowDescription, energyNowValue, table);

    const energyDayDescription = `${this.translate("ENERGY_DAY")}:`;
    const energyDayValue = this.getWattString(this.currentData.energyDay);
    this.appendTableRow(energyDayDescription, energyDayValue, table);

    const energyYearDescription = `${this.translate("ENERGY_YEAR")}:`;
    const energyYearValue = this.getWattString(this.currentData.energyYear);
    this.appendTableRow(energyYearDescription, energyYearValue, table);

    const energyTotalDescription = `${this.translate("ENERGY_TOTAL")}:`;
    const energyTotalValue = this.getWattString(this.currentData.energyTotal);
    this.appendTableRow(energyTotalDescription, energyTotalValue, table);

    return table;
  },

  appendTableRow: function (description, value, table) {
    const row = document.createElement("tr");

    const descriptionColumn = document.createElement("td");
    descriptionColumn.textContent = description;
    row.appendChild(descriptionColumn);

    const valueColumn = document.createElement("td");
    valueColumn.textContent = value;
    row.appendChild(valueColumn);

    table.appendChild(row);
  },

  getWattString: function (value) {
    const roundedValue = Math.round(value);
    const kwConversionOptions = this.config.kwConversionOptions;
    if (kwConversionOptions.enabled && roundedValue > kwConversionOptions.threshold) {
      return `${(roundedValue / 1000).toFixed(kwConversionOptions.numDecimalDigits)} kW`;
    }

    return `${roundedValue} W`;
  },

  getScripts: function () {
    return [];
  },

  getStyles: function () {
    return ["MMM-Fronius2.css"];
  },

  // Load translations files
  getTranslations: function () {
    return {
      en: "translations/en.json",
      de: "translations/de.json",
    };
  },

  // socketNotificationReceived from helper
  socketNotificationReceived: function (notification, payload) {
    if (notification === "MMM-Fronius2_INITIALIZED") {
      this.loaded = true;
      this.scheduleUpdate();
    }

    if (notification === "MMM-Fronius2_DATA") {
      this.currentData = payload;
      this.updateDom();
    }
  },
});
