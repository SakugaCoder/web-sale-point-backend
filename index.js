let express = require('express');
let app = express();
let sqlite3 = require('sqlite3');

let port = 3002;

function getDBConnection(){
    let db = new sqlite3.Database('./db/main.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          console.error(err.message);
        }
        console.log('Connected to the main database.');
    });
    
    return db;
}

function returnError(msg){
    return { error: true, msg };
}

app.get('/', (req, res) => {
    res.send('Sale Point API');
});

app.get('/usuarios', (req, res) => {
    let db = getDBConnection();
    
    db.all('SELECT * FROM Usuarios', (err, rows) => {
        
        if(err){
            res.json(returnError('Error in DB query'));
            db.close();
            throw(err);            
        }

        res.json(rows);
    });
    db.close();
});

app.get('/productos', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Productos', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        res.json(rows);
    });

    db.close();
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});