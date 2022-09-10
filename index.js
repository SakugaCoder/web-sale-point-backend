let express = require('express');
let app = express();
let sqlite3 = require('sqlite3');
var cors = require('cors');
const jsPDF = require("jspdf");
const child_process = require("child_process");


const frontendPath = 'C:/Users/HP/Desktop/sale-point/web-sale-point-frontend/build';
const exec = child_process.exec;

const { SerialPort } = require('serialport');
const serial_port = new SerialPort({ path: 'COM7', baudRate: 9600 });

let current_kg = 1;
let data_available = false;

var bodyParser = require('body-parser')

const multer  = require('multer')
const upload = multer({ dest: 'uploads/' });

// create application/json parser
var jsonParser = bodyParser.json();

let port = 3002;

let seconds_without_data = 0;
let comunication_lost = false;

app.use(cors());
app.use(express.static('uploads'));


serial_port.on('error', function(err) {
    console.log('Error 2 de lectura de bascula. Por favor cerrar programa, volver a conectar bascula y ejecutar el programa');
    // current_kg = -100;
});

// tare

setInterval( () => {
    serial_port.write('P');
}, 800);


// setInterval( () => {
//     if(!comunication_lost){
//         seconds_without_data++;
//         console.log('Segundos sin comunicacion', seconds_without_data);
//         if(seconds_without_data > 12){
//             console.log('Se perdio la comunicacion');   
//             comunication_lost = true;
//             current_kg = -100;
//         }
//     }
// }, 1000);

// setTimeout( () => {
//     console.log('Comunicacion recuperada');
//     comunication_lost = false;
//     seconds_without_data = 0;
//     current_kg = 10;
// }, 20000);

serial_port.on('data', function (data) {
    let kg_str = data.toString();
    console.log('Data:', kg_str);
    console.log(kg_str.length);

    if(kg_str.length ===  10){
        data_available = true;
        comunication_lost = false;
        seconds_without_data = 0;

        current_kg = 0;
        console.log('DATA AVAILABLE');
        current_kg = kg_str.replace(/\s/g, '');
        current_kg = Number(kg_str.split('kg')[0]);
        console.log(current_kg)
    }
}); 

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

function obtenerAdeudo(callback, id_usuario, id_pedido){
    let db = getDBConnection();
    let query = '';
    let params = null;

    if(id_pedido){
        query = 'SELECT SUM(adeudo) as deuda_cliente FROM Pedidos WHERE id_cliente = ? AND id != ?';
        params = [id_usuario, id_pedido];
    }

    else{
        query = 'SELECT SUM(adeudo) as deuda_cliente FROM Pedidos WHERE id_cliente = ?';
        params = [id_usuario]
    }
    db.all(query, params, (err, rows) => {
        
        if(err){
            // res.json(returnError('Error in DB query'));
            callback(null);
            db.close();
            throw(err);            
            
        }
        if(rows){
            callback(rows[0].deuda_cliente);
        }
        else{
            callback(null);
        }
        
        // res.json(rows);
    });
    db.close();
}

app.get('/', (req, res) => {
    res.send('Sale Point API');
});

app.get('/date', (req,res) => {
    res.json({date: getCurrentDatetime()});
});

// Usuarios
app.get('/usuarios', (req, res) => {
    let db = getDBConnection();
    
    db.all('SELECT * FROM Usuarios ORDER BY nombre ASC', (err, rows) => {
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

app.post('/cambiar-password-usuario', jsonParser, (req, res) => {
    let query = `UPDATE Usuarios set pswd=? WHERE id=?`;
    let params = [req.body.pass, req.body.user_id];
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

    db.all('SELECT * FROM Productos ORDER BY name ASC', (err, rows) => {
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
    let query = `INSERT INTO Productos VALUES(null, ?, ?, ?, ?)`;
    let values =  null;
    if(req.file){
    	values = [req.body.nombre, req.body.precio, 'http://localhost:3002/' + req.file.filename, req.body.venta_por ];	
    }
    else{
		values = [req.body.nombre, req.body.precio, 'http://localhost:3002/default.jpg', req.body.venta_por ];	
    }
    
    insertItem(query, values);
    res.redirect('http://localhost:3000/productos');
});

app.post('/editar-producto', jsonParser, (req, res) => {
    let query = `UPDATE Productos set price=? WHERE id=?`;
    let params = [req.body.price, req.body.product_id];
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

    db.all('SELECT * FROM clientes ORDER BY id ASC', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        console.log(rows);
        res.json(rows);
    });

    db.close();
});

app.post('/nuevo-cliente', (req, res) => {
    let query = `INSERT INTO Clientes VALUES(null, ?, ?, ?)`;
    let values = [req.body.nombre, req.body.telefono ] ;
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

    db.all('SELECT * FROM Chalanes ORDER BY nombre ASC', (err, rows) => {
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

    db.all('SELECT * FROM Proveedores ORDER BY nombre ASC', (err, rows) => {
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

    db.all('SELECT * FROM Compras ORDER BY fecha DESC', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        res.json(rows);
    });

    db.close();
});

app.post('/nuevo-compra', jsonParser, (req, res) => {
    let query = `INSERT INTO Compras VALUES(null, ?, ?, ?, ?, ?)`;
    let date = req.body.date;
    if(req.body.supplier_id === 4){
        date = getCurrentDatetime();
    }
    let values = [req.body.product_id, req.body.kg, date, req.body.supplier_id, req.body.costo];
    let err = insertItem(query, values);

    if(req.body.es_retiro){
        let retiro_query = 'INSERT INTO Retiros VALUES(null, ?, ?, ?)';
        let retiro_values = [date, req.body.costo, `${ req.body.detalle_producto.name } - ${ req.body.detalle_proveedor.nombre}`];
        let retiro_err = insertItem(retiro_query, retiro_values);
        res.json({err, retiro: retiro_err});
    }
    else{
        res.json({err});
    }
    
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
app.get('/pedidos', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Pedidos ORDER BY id DESC', (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        console.log(rows);
        res.json(rows);
    });

    db.close();
});

app.get('/pedidos/:fecha', (req, res) => {
    let db = getDBConnection();
    let error = false;
    db.all('SELECT * FROM Pedidos WHERE fecha=? AND estado=1 ORDER BY id DESC', [req.params.fecha], (err, rows) => {
        if(err){
            error = true;
            res.json(returnError('Error in DB Query'));
        }
        res.json({ error, pedidos: rows });
    });

    db.close();
});

app.get('/pedido/:order_id', (req, res) => {
    let db = getDBConnection();

    db.all('SELECT * FROM Pedidos_detalle WHERE id_pedido = ?',[req.params.order_id] , (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        // console.log(rows);
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

function getOrderStatusText(n){
    switch(n){
        case 1:
            return 'Pagado';
        case 2:
            return 'Adeudo';
        case 3:
            return 'Enviado';
        case 4:
            return 'PCE';
        default:
            return '';
    };
}

app.post('/nuevo-pedido', jsonParser, async (req, res) => {

    let query = `INSERT INTO Pedidos VALUES(null, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`;
    const getItemsList = items => {
        return items.map( item => item.name + ' x ' + item.kg + ' ' +item.venta_por).join(', ');
    }
    let fecha_pago = req.body.estado === 1 ? getCurrentDatetime() : null;
    let values = [req.body.client.id, req.body.client.name, req.body.total, req.body.payment, req.body.total - req.body.payment, getCurrentDatetime(), req.body.estado ,getItemsList(req.body.items), req.body.chalan, fecha_pago, req.body.efectivo, req.body.cajero];

    let db = getDBConnection();
    let err = false;

    console.log("Inserting new order")

    db.run(query, values, function(error) {
        if (error) {
            err = true;
            console.log(err.message);
            console.log(error);
            return null;
        }

        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);

        let order_id = this.lastID;
        req.body.items.forEach( item => {
            let detail_query = `INSERT INTO Pedidos_detalle VALUES(null, ?, ?, ?, ?, ?)`;
            let detail_params = [order_id, item.id, item.name, item.kg, item.price];
            db.run(detail_query, detail_params, function(detail_error){
                if (detail_error) {
                    err = true;
                    return console.log(err.message);
                }
            });
        });

        db.all('SELECT * FROM Pedidos WHERE id = ?', [order_id], function(err, rows){
            // if (err) {
            //     err = true;
            //     return console.log(err.message);
            // }
            obtenerAdeudo(function(adeudo){
                let order_data = rows[0];
                let final_ticket_data = {
                    id_pedido: order_data.id,
                    fecha: order_data.fecha,
                    cajero: req.body.cajero,
                    chalan: order_data.chalan ? order_data.chalan.split(',')[0] : 'NA',
                    cliente: order_data.id_cliente,
                    adeudo: adeudo,
                    estado_nota: getOrderStatusText(order_data.estado),
                    efectivo: order_data.efectivo,
                    productos: req.body.items.map( function(item){ 
                        return {
                            nombre_producto: item.name,
                            precio_kg: item.price,
                            cantidad_kg: item.kg
                        }
                    })
                }
                console.log('******************************** Data del ticket', final_ticket_data);

                // console.log(final_ticket_data);
                generateTicket(final_ticket_data);
            }, req.body.client.id);

          
        });

        // let final_ticket_data = {
        //     id_pedido: ticket_order.id,
        //     fecha: getCurrentDatetime(),
        //     cajero: req.body.cajero,
        //     chalan: req.body.chalan ? req.body.chalan.split(',')[0] : 'NA',
        //     cliente: req.body.client_id,
        //     adeudo: ticket_order.adeudo,
        //     estado_nota: getOrderStatusText(ticket_order.estado),
        //     efectivo: null,
        //     productos: ticket_order.detalle
        // };
        // close the database connection
        db.close();
        res.json({err});
    });


});


app.post('/pagar-pedido', jsonParser, (req, res) => {  
    console.log('pagando pedido');
    let query = `UPDATE Pedidos set estado = 1, enviado = 0, adeudo=0, abono=?, chalan="", fecha_pago=?, cajero=? WHERE id = ?`;
    let values = [req.body.total, getCurrentDatetime(), req.body.cajero, req.body.order_id];

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
    let query = `UPDATE Pedidos set estado = 2, enviado = 0, chalan="", cajero=?, abono=0 WHERE id = ?`;
    let values = [req.body.cajero, req.body.order_id];

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
    let query = `INSERT INTO Caja VALUES (?, "abierta", ?, ?, 0, 0, ?)`;
    let current_date = getCurrentDatetime()
    let values = [current_date, req.body.fondo, req.body.fondo, req.body.cajero];

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

    db.all(`
    select 
    Caja.fecha,
    Caja.estado,
    Caja.fondo,
    Caja.total,
    Caja.ingresos,
    Caja.retiros,
    Caja.cajero,
    (SELECT sum(Pedidos.total_pagar) FROM Pedidos WHERE Pedidos.fecha_pago = Caja.fecha AND Pedidos.estado = 1) as SumaIngresos,
    (SELECT sum(Retiros.monto) FROM Retiros WHERE Retiros.fecha_retiro = Caja.fecha) as SumaRetiros
    FROM Caja ORDER by Caja.fecha DESC;`, [], (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
        }
        
            res.json({cierres_caja: rows, err: false});
    });

    db.close(); 
});

app.post('/cerrar-caja-previa', jsonParser, (req, res) => {
    let db = getDBConnection();
    let error = false;

    console.log(req.body);  

    db.run('UPDATE Caja SET estado="cerrada", retiros=?, ingresos=?, total=?, cajero=? WHERE fecha = ?', [req.body.retiros, req.body.ingresos, req.body.total, req.body.cajero, req.body.date], (err) => {
        if (err) {
            error = true;
            console.log(err.message);
        }
        db.close();
        console.log(error)
        res.json({error});
    });
});

app.get('/retiros', (req, res) => {
    let db = getDBConnection();

    console.log('retiros');

    db.all('SELECT * FROM Retiros WHERE fecha_retiro = ? ORDER BY id DESC', [getCurrentDatetime()], (err, rows) => {
        if(err){
            res.json(returnError('Error in DB Query'));
            return null;
        }
            res.json({retiros: rows, err: false});
    });

    db.close(); 
});

app.get('/retiros/:fecha', (req, res) => {
    let db = getDBConnection();
    let error = false;
    console.log('retiros');

    db.all('SELECT * FROM Retiros WHERE fecha_retiro = ? ORDER BY id DESC', [req.params.fecha], (err, rows) => {
        if(err){
            error = true;
            res.json(returnError('Error in DB Query'));
            return null;
        }
            res.json({retiros: rows, error});
    });

    db.close(); 
});

// Cerrar caja
app.post('/cerrar-caja', jsonParser, (req, res) => { 
    console.log('Cerrando caja');
    let query = `UPDATE Caja SET estado="cerrada", total=?, ingresos=?, retiros=?, cajero=? WHERE fecha=?`;
    let current_date = getCurrentDatetime()
    let values = [req.body.total, req.body.ingresos, req.body.retiros, req.body.cajero, current_date];

    let db = getDBConnection();
    let error = false;

    db.run(query, values, function(err) {
        if (err) {
            error = true;
            console.log(err);
            // return console.log(err.message);
        }
        console.log('Error es:', err);
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
                    // console.log(rows_ti);
                    let ingresos = rows_ti[0].total_ingresos;
                    return db.all('SELECT SUM(monto) as total_retiros FROM Retiros WHERE fecha_retiro = ?', [current_date], (err, rows_tr) => {
                        if(err){
                            console.log(err);
                            return null;
                        }
                        else if(rows_tr){
                            // console.log(rows_tr);
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
    let query = `INSERT INTO Retiros VALUES (null, ?, ?, ?)`;
    let current_date = getCurrentDatetime()
    let values = [current_date, req.body.monto, req.body.concepto];

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
    // console.log('merma');
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
        // console.log(products);
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
                        // console.log(stock);
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

app.get('/bascula', (req, res) => {
    console.log('bascula');
    res.json({kg_bascula: current_kg});
});


app.post('/imprimir-ticket', jsonParser ,(req, res) => {
    generateTicket(req.body);
    res.json({ok: true});
});

function printTicketPrueba(){
    exec('PDFtoPrinter-OldVersion.exe ticket_prueba.pdf', (error, stdout, stderr) => {
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
}

function roundNumber(num){
    return Math.round((num + Number.EPSILON) * 100) / 100
}

function generateTicket(order){
    let nombre_negocio = 'Verduleria Trenado';
    let direccion = 'La sierrita, 76137, Queretaro centro';

    function getTotal(products){
        let total = 0;
        products.forEach( product => total += (product.precio_kg * product.cantidad_kg) );
        return total;
    }
    
    const total = String(roundNumber(getTotal(order.productos)));
    let cambio = String(roundNumber(order.efectivo - total));
    let efectivo = 0;
    if(order.efectivo){
        efectivo = order.efectivo;
    }
    
    if(cambio < 0)
        cambio = 0;
    
    let paper_height = order.productos.length * 4;
    const doc = new jsPDF.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [50, (290 - paper_height) + paper_height]
    });
    
    let current_y = 0;
    
    
    doc.setFontSize(8);
    
    doc.text(nombre_negocio, 13, 2);
    doc.text(direccion, 2, 6);
    
    doc.setFont("helvetica", "normal");
    doc.text('Fecha:', 1, 14);
    doc.setFont("helvetica", "bold");
    doc.text(order.fecha, 10, 14);
    
    doc.setFont("helvetica", "normal");
    doc.text('ID pedido:', 28, 14);
    doc.setFont("helvetica", "bold");
    doc.text(String(order.id_pedido), 42, 14);
    
    current_y = 18;
    
    doc.setFont("helvetica", "normal");
    doc.text('Cajero:', 1, current_y);
    doc.setFont("helvetica", "bold");
    doc.text(String(order.cajero), 10, current_y);
    
    doc.setFont("helvetica", "normal");
    doc.text('Chalan:', 28, current_y);
    doc.setFont("helvetica", "bold");
    doc.text(String(order.chalan), 38, current_y);
    
    current_y = 22;
    
    doc.setFont("helvetica", "normal");
    doc.text('Cliente:', 1, current_y);
    doc.setFont("helvetica", "bold");
    doc.text(String(order.cliente), 11, current_y);
    
    doc.setFont("helvetica", "normal");
    doc.text('Adeudo:', 28, current_y);
    doc.setFont("helvetica", "bold");
    doc.text(String(order.adeudo), 39, current_y);
    
    current_y = 26;
    
    doc.setFont("helvetica", "normal");
    doc.text('Estado nota:', 1, current_y);
    doc.setFont("helvetica", "bold");
    doc.text(order.estado_nota, 18, current_y);
    
    current_y = 32;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text('Cantidad', 1, current_y);
    doc.text('Descripcion', 12, current_y);
    doc.text('Precio', 28, current_y);
    doc.text('Importe', 40, current_y);
    
    current_y = 32;
    doc.setFont("helvetica", "normal");
    order.productos.forEach( function(producto) {
        current_y += 4;
        doc.text(''+ String(producto.cantidad_kg), 1, current_y);
        doc.text(producto.nombre_producto, 12, current_y);
        doc.text('$'+ String(producto.precio_kg.toFixed(2)), 28, current_y);
        doc.text('$'+ String( (producto.precio_kg * producto.cantidad_kg).toFixed(2)), 40, current_y);
    });
    
    
    current_y += 4;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text('--------------------------------------------------', 1, current_y);
    
    current_y += 4;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text('Total:', 1, current_y);
    doc.setFont("helvetica", "bold");
    doc.text('$'+total, 18, current_y);
    
    current_y += 3;
    
    doc.setFont("helvetica", "normal");
    doc.text('Efectivo:', 1, current_y);
    doc.setFont("helvetica", "bold");
    doc.text('$'+String(efectivo), 18, current_y);
    
    current_y += 3;
    
    doc.setFont("helvetica", "normal");
    doc.text('Cambio:', 1, current_y);
    doc.setFont("helvetica", "bold");
    doc.text('$'+cambio, 18, current_y);
    
    current_y += 4;
    
    doc.setFont("helvetica", "bold");
    doc.text('Gracias por su compra', 8, current_y);
    
    doc.save("ticket.pdf");
    console.log('Ticket nuevo generado!');
    

    exec('PDFtoPrinter-OldVersion.exe ticket.pdf', (error, stdout, stderr) => {
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
}
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
    setTimeout( () => {
    if(data_available){
        // Inicia servidor
        exec('serve -s '+ frontendPath, (error, stdout, stderr) => {
            console.log('Servidor iniciado');
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

        setTimeout( () => {
            exec('start chrome http://localhost:5000', (error, stdout, stderr) => {
                console.log('Pagina principal abierta');
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
        }, 12 * 1000);

        printTicketPrueba();
    }

    else{
        console.log('Error de lectura de bascula. Por favor cerrar programa, volver a conectar bascula y ejecutar el programa');
    }
}, 3 * 1000);
});