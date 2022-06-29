let pdfPrint = require("pdf-to-printer");

pdfPrint.getPrinters().then(console.log);


const options = {
    printer: "Generic / Text Only",
};
  
pdfPrint.print('sample.pdf', options).then(console.log);