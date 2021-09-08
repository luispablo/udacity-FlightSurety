const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function(deployer, network, accounts) {
    let firstAirline = accounts[0];

    deployer.deploy(FlightSuretyData, firstAirline).then(() => {
        return deployer.deploy(FlightSuretyApp, FlightSuretyData.address).then(async () => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:8545',
                            dataAddress: FlightSuretyData.address,
                            appAddress: FlightSuretyApp.address,
                            firstAirline
                        }
                    }
                    const flightSuretyData = await FlightSuretyData.new(FlightSuretyData.address);
                    await flightSuretyData.authorizeCaller(FlightSuretyApp.address);

                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                });
    });
}