"use strict";
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
        updateInterval: 3000,
        wattConversionOptions: {
            enabled: true,
            threshold: 1200,
            numDecimalDigits: 2,
        },
        offlineDetectionOptions: {
            numRequests: 5, // Converter is considered offline after this num of failed requests
            offlineInterval: 1800000, // 30 Minutes
        },
        requestTimeout: 1000,
        broadcastSolarPower: false,
        broadcastGridPower: false,
        broadcastBatteryPower: false,
        dummyData: false,
    },

    requiresVersion: "2.17.0", // Required version of MagicMirror

    start: function () {
        this.data.header = this.config.header;
        this.currentData = null;
        this.ecIsOffline = false;
        this.offlineDetectionCounter = 0;
        this.fetchTimeoutError = false;
        this.loaded = false;

        this.sendSocketNotification("MMM-Fronius2_INIT", this.config);

        Log.info("MMM-Fronius2 started.");
    },

    scheduleUpdate: function () {
        console.log("scheduleUpdate called");

        const updateInterval = this.ecIsOffline
            ? this.config.offlineDetectionOptions.offlineInterval
            : this.config.updateInterval;
        console.log(`Update interval: ${updateInterval}ms`);

        this.fetchInterval = setInterval(() => {
            if (this.loaded) {
                this.sendSocketNotification("MMM-Fronius2_FETCH_DATA");
            }
        }, updateInterval);
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

        if (this.currentData === null) {
            wrapper.className = "small light dimmed";
            wrapper.innerHTML = this.translate("NO_DATA");
            if (this.fetchTimeoutError) {
                wrapper.innerHTML += `<br> (${this.translate("CONVERTER_OFFLINE_HINT")})`;
            }
        } else {
            // Table for displaying Values
            const tableWrapper = document.createElement("div");
            tableWrapper.id = "table-wrapper";
            const table = this.generateDataTable();
            tableWrapper.appendChild(table);

            wrapper.appendChild(tableWrapper);

            if (this.fetchTimeoutError) {
                const hintDiv = document.createElement("div");
                hintDiv.className = "xsmall light dimmed italic";
                hintDiv.textContent = `${this.translate("SHOWING_CACHED_DATA")}`;
                wrapper.appendChild(hintDiv);
            }
        }

        return wrapper;
    },

    // TODO: Generate all available data here and make the data excludable
    // This will need the usage of the default API keys so the user can exclude these
    generateDataTable: function () {
        const table = document.createElement("table");

        const energyNowDescription = `${this.translate("ENERGY_NOW")}:`;
        if (this.fetchTimeoutError) {
            const energyNowValue = this.translate("CONVERTER_OFFLINE_ENERGY_STATE");
            this.appendTableRow(energyNowDescription, energyNowValue, table, "font-red");
        } else {
            const energyNowValue = this.getWattString(this.currentData.energyNow);
            const valueColor = this.currentData.energyNow > 0 ? "font-green" : null;
            this.appendTableRow(energyNowDescription, energyNowValue, table, valueColor);
        }

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

    appendTableRow: function (description, value, table, cssClassValue = null) {
        const row = document.createElement("tr");

        const descriptionColumn = document.createElement("td");
        descriptionColumn.textContent = description;
        row.appendChild(descriptionColumn);

        const valueColumn = document.createElement("td");
        valueColumn.textContent = value;
        if (cssClassValue) {
            valueColumn.className = cssClassValue;
        }
        row.appendChild(valueColumn);

        table.appendChild(row);
    },

    getWattString: function (value) {
        const wattConversionOptions = this.config.wattConversionOptions;
        const threshold = wattConversionOptions.threshold;
        let wattString = "W";
        let displayValue = value;

        if (wattConversionOptions.enabled) {
            switch (true) {
                // gigaWatt
                case value > threshold * Math.pow(1000, 2):
                    displayValue = (value / Math.pow(1000, 3)).toFixed(wattConversionOptions.numDecimalDigits);
                    wattString = "gW";
                    break;
                // megaWatt
                case value > threshold * 1000:
                    displayValue = (value / Math.pow(1000, 2)).toFixed(wattConversionOptions.numDecimalDigits);
                    wattString = "mW";
                    break;
                // kiloWatt
                case value > threshold:
                    displayValue = (value / 1000).toFixed(wattConversionOptions.numDecimalDigits);
                    wattString = "kW";
                    break;
                default:
                    displayValue = Math.round(value);
                    wattString = "W";
            }
        } else {
            displayValue = Math.round(value);
        }

        return `${displayValue} ${wattString}`;
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
            console.log("INIT received");
            this.loaded = true;
            this.scheduleUpdate();
        }

        if (notification === "MMM-Fronius2_DATA") {
            if(this.config.broadcastSolarPower) {
                this.sendNotification("MMM-EnergyMonitor_SOLAR_POWER_UPDATE", payload.energyNow);
            }

            // From docs: this value is null if no meter is enabled ( + from grid, - to grid )
            // MMM-EnergyMonitor expects negative: consume from grid | positive: feed to grid
            if(this.config.broadcastGridPower) {
                this.sendNotification("MMM-EnergyMonitor_GRID_POWER_UPDATE", (payload.powerGrid * -1));
            }

            // From docs: this value is null if no battery is active ( - charge, + discharge )
            //  MMM-EnergyMonitor expects negative: discharge | positive: charge
            if(this.config.broadcastBatteryPower) {
                this.sendNotification("MMM-EnergyMonitor_ENERGY_STORAGE_POWER_UPDATE", (payload.powerAkku * -1));
            }

            this.fetchTimeoutError = false;
            this.currentData = payload;
            this.updateDom();

            if (this.ecIsOffline) {
                this.ecIsOffline = false;
                this.offlineDetectionCounter = 0;
                clearInterval(this.fetchInterval);
                this.scheduleUpdate();
            }
        }

        if (notification === "MMM-Fronius2_ERROR_FETCH_TIMEOUT") {
            this.fetchTimeoutError = true;

            if (this.offlineDetectionCounter < this.config.offlineDetectionOptions.numRequests) {
                this.offlineDetectionCounter += 1;
                Log.info(`Fronius data fetch timed out. Failed request #${this.offlineDetectionCounter}`);
            } else if (!this.ecIsOffline) {
                this.ecIsOffline = true;
                clearInterval(this.fetchInterval);
                this.scheduleUpdate();
                Log.info(`Fronius Converter is offline. Changing fetch interval.`);
            }

            this.updateDom();
        }
    },
});
