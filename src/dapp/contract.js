import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

let config;
export default class Contract {
    constructor(network, callback) {

        config = Config[network];
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace("http", "ws")));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });

        this.flightSuretyApp.events.FlightStatusInfo({ fromBlock: 0 }, function (error, { returnValues }) {
            const { airline, flight, status, timestamp } = returnValues;
            console.log("flight status update", airline, flight, status, timestamp);
        });
    }

    buy (customer, flight, value, cb) {
        const weiValue = Web3.utils.toWei(value, "ether");
        this.flightSuretyApp.methods.buy(flight).call({ from: customer, value: weiValue }, cb);
    }

    getAirlines (callback) {
        let self = this;
        self.flightSuretyApp.methods
             .getAirlines()
             .call({ from: self.owner}, callback);
     }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
}