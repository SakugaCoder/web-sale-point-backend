const child_process = require("child_process");

const exec = child_process.exec;

exec('PDFtoPrinter.exe ticket.pdf', (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});