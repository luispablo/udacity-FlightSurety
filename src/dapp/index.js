
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
const flights2Select = document.querySelector("#flights2");
const departuresSelect = document.querySelector("#departures");
const paymentInput = document.querySelector("#payment");
const purchaseBtn = document.querySelector("#purchase");
const passengersSelect = document.querySelector("#passengers");
const passengers2Select = document.querySelector("#passengers2");
const creditLabel = document.querySelector("#credit");
const withdrawBtn = document.querySelector("#withdraw");

FLIGHT_NUMBERS.forEach(n => {
    flightsSelect.appendChild(new Option(n))
    flights2Select.appendChild(new Option(n))
});
DEPARTURES.forEach(d => departuresSelect.appendChild(new Option(d)));

(async() => {

    let airlines;
    let result = null;

    let contract = new Contract('localhost', () => {
        contract.passengers.forEach(p => {
            passengersSelect.appendChild(new Option(p))
            passengers2Select.appendChild(new Option(p))
        });

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
            let flight = DOM.elid('flights2').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
    });
    
    withdrawBtn.disabled = true;
    withdrawBtn.addEventListener("click", function (event) {
        contract.creditInsurees(passengers2Select.value, function (error, result) {
            if (error) console.error(error);
            else console.log("ok", result);
        });
    });
    purchaseBtn.addEventListener("click", function (event) {
        contract.buy(passengersSelect.value, flightsSelect.value, paymentInput.value, function (error, result) {
            console.log(error, result);
        });
    });
    passengers2Select.addEventListener("change", function (event) {
        contract.getCredit(event.target.value, function (err, result) {
            withdrawBtn.disabled = !(parseInt(result) > 0);
            creditLabel.innerHTML = result;
        });
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







