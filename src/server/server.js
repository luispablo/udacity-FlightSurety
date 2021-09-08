import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const oracles = [];

// - [ ] Oracle Initialization - Upon startup, 20+ oracles are registered and their assigned indexes are persisted in memory
const registrationFee = Web3.utils.toWei("1", "ether");
const gas = Web3.utils.toWei("0.0001", "ether");
web3.eth.getAccounts().then(function (accounts) {
    web3.eth.defaultAccount = accounts[0];
    for (let i = 0; i < 20; i++) {
      flightSuretyApp.methods.registerOracle().send({ from: accounts[i], value: registrationFee, gas: 5000000 }, (err, res) => {
          if (err) console.error(err);
          else console.log("Registration sent", accounts[i]);
      });
    }
});

const STATUSES = [0, 10, 20, 30, 40, 50];

flightSuretyApp.events.OracleRegistered({ fromBlock: 0 }, (err, { returnValues }) => {
    const { owner, indexes } = returnValues;
    console.log("Oracle registered", owner, indexes);
    oracles.push({ account: owner, indexes });
});

flightSuretyApp.events.OracleRequest({ fromBlock: 0 }, function (error, { returnValues }) {
    const { index, airline, flight, timestamp } = returnValues;
    const invokedOracles = oracles.filter(i => i.indexes[2] === index);
    console.log("index", index);
    console.log("oracles", invokedOracles);

    invokedOracles.forEach(function ({ account, indexes }) {
        const statusCode = Math.floor(Math.random() * 6);
        console.log("replying", index, account);
        flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode).call({ from: account }, (err2, res2) => {
            if (err2) console.error(err2);
            if (res2) console.log(res2);
        });
    });
    // function submitOracleResponse (uint8 index, address airline, string flight, uint256 timestamp, uint8 statusCode) external {

});

const app = express();
const apiRouter = express.Router({ mergeParams: true });

apiRouter.get("/oracles", (req, res) => {
    oracles.forEach(function (oracle) {
        console.log("checking", oracle.account, oracle.indexes)
        flightSuretyApp.methods.getOracles(oracle.account).call({ from: oracle.account}, (err, res) => {
            console.log(res);
        })
    })
    res.json(oracles);
});

app.use("/api", apiRouter);

export default app;
