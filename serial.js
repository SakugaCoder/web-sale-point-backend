const { SerialPort } = require('serialport')
const port = new SerialPort({ path: 'COM5', baudRate: 9600 });

let current_kg = 0;

port.on('error', function(err) {
    console.log('Error: ', err.message)
});

setInterval( () => {
    port.write('P');
}, 800);


port.on('data', function (data) {
    let kg_str = data.toString();
    console.log('Data:', kg_str);
    console.log(kg_str.length);

    if(kg_str.length ===  10){
        console.log('FINDED');
        current_kg = kg_str.replace(/\s/g, '');
        current_kg = Number(kg_str.split('kg')[0]);
        console.log(current_kg)
    }
});