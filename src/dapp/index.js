
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

const FLIGHT_NUMBERS = [
    "AA1",
    "AB1",
    "AC2",
    "AD3",
    "AF4"
];
const DEPARTURES = [
    "2021-09-20",
    "2021-09-21",
    "2021-09-22"
];

const flightsSelect = document.querySelector("#flights");
const departuresSelect = document.querySelector("#departures");
// const airlinesSelect = document.querySelector("#airlines");

FLIGHT_NUMBERS.forEach(n => flightsSelect.appendChild(new Option(n)));
DEPARTURES.forEach(d => departuresSelect.appendChild(new Option(d)));

(async() => {

    let airlines;
    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    
        contract.getAirlines((error, result) => {
            if (error) console.error(error);
            else {
                airlines = result;
                // airlines.forEach(a => airlinesSelect.appendChild(new Option(a)));
            }
        });

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
    console.log(contract)
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







