
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
const toBN = web3.utils.toBN;
const toWei = web3.utils.toWei;

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
      // console.error(e);
    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });
 
  it("Only existing airline may register a new airline until there are at least four airlines registered", async () => {
    const airline1 = accounts[1];
    const airline2 = accounts[2];
    const airline3 = accounts[3];
    const airline4 = accounts[4];

    try {
      await config.flightSuretyApp.registerAirline(airline2, { from: airline1, value: toBN(1E19) });
      const result1 = await config.flightSuretyData.isAirline.call(airline2);
      assert.equal(result1, true, "Registered by registered airline");
      await config.flightSuretyApp.registerAirline(airline3, { from: airline4, value: toBN(1E19) });
    } catch (err) {
      assert(err.message.indexOf("Caller is not registered airline") > 0);
    }
  });

  it("Is funded", async () => {
    const airline2 = accounts[2];
    const isFunded1 = await config.flightSuretyApp.isFunded.call(airline2);
    assert.isNotOk(isFunded1, "Not funded yet");
    await config.flightSuretyApp.fund({ from: airline2, value: toWei('10', 'ether') });
    const isFunded2 = await config.flightSuretyApp.isFunded.call(airline2);
    assert.ok(isFunded2, "Now it's funded");
  });

  it("Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines", async () => {
    const airline1 = accounts[1];
    const airline2 = accounts[2];
    const airline3 = accounts[3];
    const airline4 = accounts[4];
    const airline5 = accounts[5];

    try {
      await config.flightSuretyApp.registerAirline(airline3, { from: airline1, value: toBN(1E19) });
      await config.flightSuretyApp.registerAirline(airline4, { from: airline1, value: toBN(1E19) });
      const result4 = await config.flightSuretyData.isAirline.call(airline4);
      assert(result4, "Registered by registered airline");
      await config.flightSuretyApp.registerAirline(airline5, { from: airline1, value: toBN(1E19) });
      const result5 = await config.flightSuretyData.isAirline.call(airline5);
      assert.isNotOk(result5, "Not enough consensus yet");
      await config.flightSuretyApp.registerAirline(airline5, { from: airline1, value: toBN(1E19) });
    } catch (err) {
      assert(err.message.indexOf("This airline already authorized this other one") > 0);
    }
    await config.flightSuretyApp.registerAirline(airline5, { from: airline3, value: toBN(1E19) });
    // const finalResult5 = await config.flightSuretyApp.isAirline.call(airline5);
    // assert(finalResult5, "Now it's registered!");
  });
});
