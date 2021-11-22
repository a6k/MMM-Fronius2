const FroniusFetcher = require("./FroniusFetcher");
const config = {
    ip: "192.168.200.173",
    wattConversionOptions: {
        enabled: true,
        threshold: 1200,
        numDecimalDigits: 2,
    },
};

async function fetch() {
    const fetcher = new FroniusFetcher(config);
    // const data = await fetcher.fetch();
    const data = await fetcher.fetchDummyData();
    console.log(data);
    console.log(getWattString(data.energyTotal));
    console.log(getWattString(data.currentEnergy));
}

function getWattString(value) {
    const wattConversionOptions = config.wattConversionOptions;
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
}

setInterval(async () => {
    await fetch();
}, 3000);
