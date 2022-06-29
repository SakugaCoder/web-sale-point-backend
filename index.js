let express = require('express');
let app = express();
let sqlite3 = require('sqlite3');
var cors = require('cors')

var bodyParser = require('body-parser')

const multer  = require('multer')
const upload = multer({ dest: 'uploads/' });

// create application/json parser
var jsonParser = bodyParser.json()

let port = 3002;

app.use(cors());
app.use(express.static('uploads'));



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

function insertItem(query, values){
    let db = getDBConnection();
    let err = false;

    // insert one row into the langs table
    db.run(query, values, function(err) {
    if (err) {
        err = true;
        return console.log(err.message);
    }
    // get the last insert id
    console.log(`A row has been inserted with rowid ${this.lastID}`);
    });

    // close the database connection
    db.close();
    return err;
}

function updateItem(query, values){
    let db = getDBConnection();

    let err = false;
    // insert one row into the langs table
    db.run(query, values, function(err) {
        if (err) {
            console.log(err.message);
            err = true
        }
        // get the last insert id
        console.log(`Row(s) updated: ${this.changes}`);
    });
    
    // close the database connection
    db.close();
    return err;
}

function deleteItem(query, values){
    let db = getDBConnection();

    let err = false;
    // insert one row into the langs table
    db.run(query, values, function(err) {
        if (err) {
            console.log(err.message);
            err = true
        }
        // get the last insert id
        console.log(`Row(s) updated: ${this.changes}`);
    });
    
    // close the database connection
    db.close();
    return err;
}

app.get('/', (req, res) => {
    res.send('Sale Point API');
});

// Usuarios
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

app.post('/nuevo-usuario', jsonParser, (req, res) => {
    let query = `INSERT INTO Usuarios VALUES(null, ?, ?, ?)`;
    let values = [req.body.nombre, req.body.rol, req.body.pswd];
    let err = insertItem(query, values);
    res.json({err});
});

app.post('/editar-usuario', jsonParser, (req, res) => {
    let query = `UPDATE Usuarios set nombre=?, rol=? WHERE id=?`;
    let params = [req.body.nombre, req.body.rol, req.body.user_id];
    let err = updateItem(query, params);
    res.json({err});
});

app.delete('/eliminar-usuario/:user_id', (req, res) => {
    let query = `DELETE FROM Usuarios WHERE id=?`;
    let params = [req.params.user_id];
    let err = deleteItem(query, params);
    res.json({err});
});

app.get('/deuda-usuario/:id_client', (req, res) => {
    let db = getDBConnection();
    db.all('SELECT SUM(adeudo) as deuda_cliente FROM Pedidos WHERE id_cliente = ?', [req.params.id_client] , (err, rows) => {
        
        if(err){
            res.json(returnError('Error in DB query'));
            db.close();
            throw(err);            
        }
        res.json(rows);
    });
    db.close();
});

// Productos 
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


app.post('/nuevo-producto', upload.single('foto'), (req, res) => {
    // console.log(req.body);
    // console.log(req.file);
    let query = `INSERT INTO Productos VALUES(null, ?, ?, ?)`;
    let values = [req.body.nombre, req.body.precio, 'http://localhost:3002/' + req.file.filename ];
    insertItem(query, values);
    res.redirect('http://localhost:3000/productos');
});

app.post('/editar-producto', jsonParser, (req, res) => {
    let query = `UPDATE Productos set name=?, price=? WHERE id=?`;
    let params = [req.body.name, req.body.price, req.body.product_id];
    console.log(params);
    let err = updateItem(query, params);
    console.log(err);
    res.json({err});
});

app.delete('/eliminar-producto/:product_id', jsonParser, (req, res) => {
    let query = `DELETE FROM Productos WHERE id=?`;
    let params = [req.params.product_id];
    let err = deleteItem(query, params);
    console.log(err);
    res.json({err});
});

// Clientes
app.get('/clientes', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM clientes', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        console.log(rows);
        res.json(rows);
    });

    db.close();
});


app.post('/nuevo-cliente', upload.single('foto'), (req, res) => {
    let query = `INSERT INTO Clientes VALUES(null, ?, ?, ?)`;
    let values = [req.body.nombre, req.body.telefono, req.file ?  'http://localhost:3002/' + req.file.filename : ''];
    console.log(values);
    let err = insertItem(query, values);
    console.log(err);
    // res.json({err});   
    res.redirect('http://localhost:3000/clientes');
});

app.post('/editar-cliente', jsonParser, (req, res) => {
    let query = `UPDATE Clientes set nombre=?, telefono=? WHERE id=?`;
    let params = [req.body.nombre, req.body.telefono, req.body.client_id];
    let err = updateItem(query, params);
    res.json({err});
});

app.delete('/eliminar-cliente/:client_id', (req, res) => {
    let query = `DELETE FROM Clientes WHERE id=?`;
    let params = [req.params.client_id];
    let err = deleteItem(query, params);
    res.json({err});
});

// Chalanes
app.get('/chalanes', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Chalanes', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        res.json(rows);
    });

    db.close();
});

app.post('/nuevo-chalan', jsonParser, (req, res) => {
    let query = `INSERT INTO Chalanes VALUES(null, ?, ?)`;
    let values = [req.body.nombre, req.body.telefono];
    let err = insertItem(query, values);
    res.json({err});
});

app.post('/editar-chalan', jsonParser, (req, res) => {
    let query = `UPDATE Chalanes set nombre=?, telefono=? WHERE id=?`;
    let params = [req.body.nombre, req.body.telefono, req.body.chalan_id];
    let err = updateItem(query, params);
    res.json({err});
});

app.delete('/eliminar-chalan/:chalan_id', (req, res) => {
    let query = `DELETE FROM Chalanes WHERE id=?`;
    let params = [req.params.chalan_id];
    let err = deleteItem(query, params);
    res.json({err});
});

// Proveedor
app.get('/proveedores', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Proveedores', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        res.json(rows);
    });

    db.close();
});

app.post('/nuevo-proveedor', jsonParser, (req, res) => {
    let query = `INSERT INTO Proveedores VALUES(null, ?)`;
    let values = [req.body.nombre];
    let err = insertItem(query, values);
    res.json({err});
});

app.post('/editar-proveedor', jsonParser, (req, res) => {
    let query = `UPDATE Proveedores set nombre=? WHERE id=?`;
    let params = [req.body.nombre, req.body.supplier_id];
    let err = updateItem(query, params);
    res.json({err});
});

app.delete('/eliminar-proveedor/:supplier_id', (req, res) => {
    let query = `DELETE FROM Proveedores WHERE id=?`;
    let params = [req.params.supplier_id];
    let err = deleteItem(query, params);
    res.json({err});
});


// Compras
app.get('/compras', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Compras ORDER BY fecha', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        res.json(rows);
    });

    db.close();
});

app.post('/nuevo-compra', jsonParser, (req, res) => {
    let query = `INSERT INTO Compras VALUES(null, ?, ?, ?, ?)`;
    let date = req.body.date;
    if(req.body.supplier_id === 4){
        date = getCurrentDatetime();
    }
    let values = [req.body.product_id, req.body.kg, date, req.body.supplier_id];
    let err = insertItem(query, values);
    res.json({err});
});

/*
app.post('/editar-compra', jsonParser, (req, res) => {
    let query = `UPDATE Compras set nombre=?, telefono=? WHERE id=?`;
    let params = [req.body.nombre, req.body.telefono, req.body.chalan_id];
    let err = updateItem(query, params);
    res.json({err});
});
*/

app.delete('/eliminar-compra/:shopping_id', (req, res) => {
    let query = `DELETE FROM Compras WHERE id=?`;
    let params = [req.params.shopping_id];
    let err = deleteItem(query, params);
    res.json({err});
});


// Pedidos

// Proveedor
app.get('/pedidos', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Pedidos ORDER BY fecha DESC', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        console.log(rows);
        res.json(rows);
    });

    db.close();
});

// Nuevo pedido

// Estados de pedidos
// 1 = Pagado
// 2 = Con adeudo/Fiado
// 3 = Enviado
// 4 = Pago Contra entrega

function getCurrentDatetime(){
    let date_ob = new Date();
    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    // current hours
    let hours = date_ob.getHours();

    // current minutes
    let minutes = date_ob.getMinutes();

    // current seconds
    let seconds = date_ob.getSeconds();

    let datetime = year + "-" + month + "-" + date; // + " " + hours + ":" + minutes + ":" + seconds;
    return datetime;
}

app.post('/nuevo-pedido', jsonParser, (req, res) => {
    let query = `INSERT INTO Pedidos VALUES(null, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`;
    const getItemsList = items => {
        return items.map( item => item.name + ' x ' + item.kg + ' kg').join(', ');
    }
    let fecha_pago = req.body.estado === 1 ? getCurrentDatetime() : null;
    let values = [req.body.client.id, req.body.client.name, req.body.total, req.body.payment, req.body.total - req.body.payment, getCurrentDatetime(), req.body.estado ,getItemsList(req.body.items), req.body.chalan, fecha_pago];

    let db = getDBConnection();
    let err = false;

    db.run(query, values, function(err) {
        if (err) {
            err = true;
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);

        let order_id = this.lastID;
        req.body.items.forEach( item => {
            let detail_query = `INSERT INTO Pedidos_detalle VALUES(null, ?, ?, ?, ?, ?)`;
            let detail_params = [order_id, item.id, item.name, item.kg, item.price];
            db.run(detail_query, detail_params, function(error){
                if (error) {
                    err = true;
                    return console.log(err.message);
                }
            });
        });

    });

    // close the database connection
    db.close();
    res.json({err});
});


app.post('/pagar-pedido', jsonParser, (req, res) => {  
    console.log('pagando pedido');
    let query = `UPDATE Pedidos set estado = 1, enviado = 0, adeudo=0, abono=?, fecha_pago=? WHERE id = ?`;
    let values = [req.body.total, getCurrentDatetime(), req.body.order_id];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }

        db.close();
        res.json({error});
    });
    // close the database connection
});

app.post('/pce-pedido', jsonParser, (req, res) => {  
    console.log('pagando pedido');
    let query = `UPDATE Pedidos set estado = 4, enviado = 0, abono=0, chalan=? WHERE id = ?`;
    let values = [req.body.chalan, req.body.order_id];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }

        db.close();
        res.json({error});
    });
    // close the database connection
});

app.post('/fiar-pedido', jsonParser, (req, res) => { 
    console.log('pagando pedido');
    let query = `UPDATE Pedidos set estado = 2, enviado = 0, abono=0 WHERE id = ?`;
    let values = [req.body.order_id];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }

        db.close();
        res.json({error});
    });
    // close the database connection
});

// Login
app.post('/login', jsonParser, (req, res) => {
    let db = getDBConnection();

    db.all('SELECT rol FROM Usuarios WHERE nombre=? AND pswd=?', [req.body.name, req.body.pswd], (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        if(rows.length > 0){
            res.json({rol: rows[0].rol, err: false});
        }
        else{
            res.json({err: true});
        }
    });

    db.close(); 
});


// Caja
app.post('/abrir-caja', jsonParser, (req, res) => { 
    let query = `INSERT INTO Caja VALUES (?, "abierta", ?, ?, 0, 0)`;
    let current_date = getCurrentDatetime()
    let values = [current_date, req.body.fondo, req.body.fondo];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }
        db.close();
        res.json({error});
    });
    // close the database connection
});

//Cierres de caja

app.get('/cierres-caja', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Caja WHERE estado = "cerrada" ORDER BY fecha DESC', [], (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        
            res.json({cierres_caja: rows, err: false});
    });

    db.close(); 
});

// Cerrar caja
app.post('/cerrar-caja', jsonParser, (req, res) => { 
    let query = `UPDATE Caja SET estado="cerrada", total=?, ingresos=?, retiros=? WHERE fecha=?`;
    let current_date = getCurrentDatetime()
    let values = [req.body.total, req.body.ingresos, req.body.retiros, current_date];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }
        db.close();
        res.json({error});
    });
    // close the database connection
});

// Estado caja
app.get('/estado-caja', jsonParser, async (req, res) => { 
    let current_date = getCurrentDatetime();
    let db = getDBConnection();
    db.all('SELECT * FROM Caja WHERE fecha=?', [current_date], (err, rows) => {
        if(err){
            console.log(err);
            res.json(returnError('Error in DB Query'));
        }
        else if(rows){
            let caja = rows[0];
            
            db.all('SELECT SUM(total_pagar) as total_ingresos FROM Pedidos WHERE fecha = ? AND estado=1;', [current_date], (err, rows_ti) => {
                if(err){
                    console.log(err);
                    return null;
                }
                else if(rows_ti){
                    console.log(rows_ti);
                    let ingresos = rows_ti[0].total_ingresos;
                    return db.all('SELECT SUM(monto) as total_retiros FROM Retiros WHERE fecha_retiro = ?', [current_date], (err, rows_tr) => {
                        if(err){
                            console.log(err);
                            return null;
                        }
                        else if(rows_tr){
                            console.log(rows_tr);
                            let retiros = rows_tr[0].total_retiros;
                            return res.json({caja, ingresos, retiros, err: false});
                            // return rows[0];
                        }
                        else{
                            return null;
                        }
                    });
                    //return rows[0];
                }
                else{
                    return null;
                }
            });
            // let ingresos = getTotalIncome(current_date);
            // let retiros = getTotalOutcome(current_date);
            // console.log(ingresos);
            // res.json({caja: rows[0], ingresos,retiros, err: false});
        }
        else{
            res.json({err: true});
        }
    });
    // close the database connection
});

// Retirar dinero
app.post('/retirar-dinero', jsonParser, (req, res) => { 
    let query = `INSERT INTO Retiros VALUES (null, ?, ?)`;
    let current_date = getCurrentDatetime()
    let values = [current_date, req.body.monto];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err.message);
            // return console.log(err.message);
        }
        db.close();
        res.json({error});
    });
    // close the database connection
});

app.post('/merma', jsonParser, (req, res) => {
    console.log('merma');
    let merma = req.body.merma;
    let producto = req.body.producto;
    let error = false;

    let db = getDBConnection();
    db.run('INSERT INTO Merma VALUES (null, ?, ?)', [producto, merma], (err) => {
        console.log(err);
        if(err){
            console.log(err.message);
            error = true;
        }
        db.close();
        res.json({error});
    });
});

app.get('/stock', (req, res) => {
    let db = getDBConnection();
    getAllProducts(db, function(err, products){
        console.log(products);
        if(err)
            res.json(returnError('Error'));
        
        let stock = []
        let total_items = products.length;
        let counter = 0;

        products.forEach( product => {
            getShoppingTotal(db, product.id, function(err_2, total_compras){
                getOrderTotal(db, product.id, function(err_2, total_pedidos){
                    getMermaTotal(db, product.id, function(err_3, total_merma){
                        stock.push({id: product.id, nombre: product.name, total_compras, total_pedidos, total_merma});
                        console.log(stock);
                        counter++;
                        if(counter >= total_items)
                            endResponse();
                    });
                });
            });
        });
        function endResponse(){
            res.json(stock);
        }
        // res.json({ok: true});
    });
});

// Stock functions
function getAllProducts(db, callback){
    db.all('SELECT * FROM Productos', [], (err, rows) => {
        if(err){
            console.log(err);
            callback(err, null);
        }
        else if(rows){
            callback(null, rows);
        }
    });
}

function getShoppingTotal(db, product_id, callback){
        db.all('SELECT sum(kg) as total_compras FROM Compras WHERE id_producto = ?;', [product_id], (err, rows) => {
        if(err){
            console.log(err);
            callback(err, null);
        }

        else if(rows){
            callback(null, rows[0].total_compras);
        }
    });
}

function getOrderTotal(db, product_id, callback){
    db.all('SELECT sum(cantidad_kg) as total_pedidos FROM Pedidos_detalle WHERE id_producto = ?;', [product_id], (err, rows) => {
        if(err){
            console.log(err);
            callback(err, null);
        }

        else if(rows){
            callback(null, rows[0].total_pedidos);
        }
    });
}

function getMermaTotal(db, product_id, callback){
    db.all('SELECT sum(cantidad_merma) as total_merma FROM Merma WHERE id_producto = ?;', [product_id], (err, rows) => {
        if(err){
            console.log(err);
            callback(err, null);
        }

        else if(rows){
            callback(null, rows[0].total_merma);
        }
    });
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

function calculateDaysBetweenDates(begin, end){}