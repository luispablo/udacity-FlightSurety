import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const oraclesIndexes = [];

// - [ ] Oracle Initialization - Upon startup, 20+ oracles are registered and their assigned indexes are persisted in memory
const registrationFee = Web3.utils.toWei("1", "ether");
web3.eth.getAccounts().then(function (accounts) {
    for (let i = 0; i < 20; i++) {
      flightSuretyApp.methods.registerOracle().call({ from: accounts[i], value: registrationFee }, (err, indexes) => {
          oraclesIndexes.push(indexes);
      });
    }
});

flightSuretyApp.events.OracleRequest({ fromBlock: 0 }, function (error, event) {
    if (error) console.log(error)
    console.log(event)
});

const app = express();
const apiRouter = express.Router({ mergeParams: true });

apiRouter.get("/oracles", (req, res) => {
    res.json(oraclesIndexes);
});

app.use("/api", apiRouter);

export default app;
