pragma solidity >=0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => bool) private authorizedContracts;
    mapping(address => uint256) private airlines;
    mapping(address => uint256) private funds;
    mapping(address => uint256) private credits;
    address[] airlinesKeys;
    uint8 registeredAirlines = 0;

    address[] passengers;

    mapping(address => mapping(string => uint256)) private insurances;

    mapping(address => mapping(address => uint8)) private authorizations;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor (address airline) public {
        contractOwner = msg.sender;
        airlines[airline] = 4;
        registeredAirlines = 1;
        airlinesKeys.push(airline);
        funds[airline] = 10 ether;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    modifier requireAuthorizedCaller () {
        require(authorizedContracts[msg.sender], "Caller is not authorized");
        _;
    }

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/
    function isAuthorizedCaller (address caller) public view returns (bool) {
        return authorizedContracts[caller];
    }
    function getAirlines () public view returns (address[] memory) {
        return airlinesKeys;
    }

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() public view returns(bool) {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus (bool mode) external requireContractOwner {
        operational = mode;
    }

    function authorizeCaller (address caller) external requireIsOperational requireContractOwner {
        authorizedContracts[caller] = true;
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function getCredit (address passenger) external view returns (uint256) {
        return credits[passenger];
    }

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline (address newAirline, address existingAirline) external requireAuthorizedCaller {
        require(authorizations[newAirline][existingAirline] == 0, "This airline already authorized this other one");
        if (registeredAirlines < 4) {
            airlines[newAirline] = 4;
            registeredAirlines++;
            airlinesKeys.push(newAirline);
        } else if (airlines[newAirline] > 0) {
            airlines[newAirline] += 1;
        } else {
            airlines[newAirline] = 1;
        }
        authorizations[newAirline][existingAirline] = 1;
    }

    function isAirline (address airline) external view returns (bool) {
        return airlines[airline] > 3;
    }

    function getRegisteredAirlines () external view returns (uint8) {
        return registeredAirlines;
    }

    // @dev Buy insurance for a flight
    function buy (address passenger, string flight, uint256 value) external payable {
        insurances[passenger][flight] = value;
        passengers.push(passenger);
    }

    function hasInsurance (address passenger, string flight) view returns (bool) {
        return insurances[passenger][flight] > 0;
    }

    function getPassengers () view returns (address[]) {
        return passengers;
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay (address passenger, string flight) external view {
        uint256 value = insurances[passenger][flight];
        insurances[passenger][flight] = 0;
        credits[passenger] = value.mul(150).div(100);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund (address airline, uint256 value) public payable {
        funds[airline] = funds[airline].add(value);
    }
    function isFunded (address airline) public view returns (bool) {
        return funds[airline] >= 1 ether;
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        // fund();
    }


}

