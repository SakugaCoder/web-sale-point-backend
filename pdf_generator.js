const jsPDF = require("jspdf");

function roundNumber(num){
    return Math.round((num + Number.EPSILON) * 100) / 100;
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
    doc.text(fecha, 10, 14);
    
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
        doc.text(''+ roundNumber(producto.cantidad_kg), 1, current_y);
        doc.text(producto.nombre, 12, current_y);
        doc.text('$'+ String(producto.precio_kg.toFixed(2)), 28, current_y);
        doc.text('$'+ String( (producto.precio_kg.toFixed(2) * producto.cantidad_kg.toFixed(2)) .toFixed(2)), 40, current_y);
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
    doc.text('$'+efectivo, 18, current_y);
    
    current_y += 3;
    
    doc.setFont("helvetica", "normal");
    doc.text('Cambio:', 1, current_y);
    doc.setFont("helvetica", "bold");
    doc.text('$'+cambio, 18, current_y);
    
    current_y += 4;
    
    doc.setFont("helvetica", "bold");
    doc.text('Gracias por su compra', 8, current_y);
    
    doc.save("ticket_generado.pdf");
}

let fecha = '14/07/2022';
let id_pedido = 32;

let cajero = 'Diego';
let chalan = 1;

let cliente = 2;
let adeudo = 320;

let estado_nota = 'Cobrado';

// Por ahora no utilizar por que no se guarda el efectivo con el que pago el cliente
let efectivo = String(200);

let productos = [
    {
        nombre: 'Mango',
        precio_kg: 18,
        cantidad_kg: 0.78
    },
    {
        nombre: 'Platano',
        precio_kg: 23,
        cantidad_kg: 2.4
    },
    {
        nombre: 'Jitomate',
        precio_kg: 11,
        cantidad_kg: 1.3
    },
    {
        nombre: 'Mango',
        precio_kg: 18,
        cantidad_kg: 0.78
    },
    {
        nombre: 'Platano',
        precio_kg: 23,
        cantidad_kg: 2.4
    },
    {
        nombre: 'Jitomate',
        precio_kg: 11,
        cantidad_kg: 1.3
    }
];


let req = { fecha, id_pedido, cajero, chalan, cliente, adeudo, estado_nota, efectivo, productos  }
// generateTicket(req);


// const doc_test = new jsPDF.jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: [50, 290]
// });
// doc_test.setFontSize(14);
// doc_test.text('Este es un ticket de', 1, 10);
// doc_test.text('PRUEBA', 14, 20);
// doc_test.save("ticket_prueba.pdf");