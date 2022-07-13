let pdfPrint = require("pdf-to-printer");

pdfPrint.getPrinters().then(console.log);

const options = {
    printer: "Generic / Text Only",
    scale: "fit",
    paperSize: "A6"
};
  
pdfPrint.print('sample.pdf', options).then(console.log);

