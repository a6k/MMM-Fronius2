"use strict";
/* Magic Mirror
 * Node Helper: MMM-Fronius2
 *
 * By Beh (hello@beh.wtf)
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const FroniusFetcher = require("./FroniusFetcher");

module.exports = NodeHelper.create({
  initialize: async function (config) {
    if (typeof this.fetcher === "undefined") {
      this.fetcher = new FroniusFetcher(config);
      this.sendSocketNotification("MMM-Fronius2_INITIALIZED");
    }
  },

  fetchData: async function () {
    if(typeof this.fetcher === "undefined")
        return;

    try {
        const data = await this.fetcher.fetch();
        this.sendSocketNotification("MMM-Fronius2_DATA", data);    
    } catch (error) {
        console.log(error);
        if(error.msg === "RequestAborted") {
            this.sendSocketNotification("MMM-Fronius2_ERROR_FETCH_TIMEOUT")
        }
    }
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "MMM-Fronius2_INIT") {
      this.initialize(payload);
    }

    if (notification === "MMM-Fronius2_FETCH_DATA") {
      this.fetchData();
    }
  },
});
