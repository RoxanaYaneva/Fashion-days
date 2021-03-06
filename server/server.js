 // Constants
const express = require('express');
const bodyParser = require('body-parser');
const db_module = require('mysql');
const cors = require('cors');
const util = require('util');
const sha1 = require('sha1');
const dotenv = require('dotenv');

const PORT = 8080;

const errors = {
    NO_ERROR: 0,
    DB_ERROR: 1,
    SERVER_ERROR: 2,
    NOT_FOUND: 3
};

dotenv.config();
//Database 
var pool = db_module.createPool({
    host     : "localhost",
    user     : "fashiondbuser",
    password : "fashiondbpass",
    database : "fashiondb",
    charset  : "utf8_general_ci"
});
//used for ascynchronous requests
pool.query = util.promisify(pool.query);
const getConnectionAsync = util.promisify(pool.getConnection).bind(pool);

//App requests
const app = express();
//enable cross-origin reosurce sharing
app.use(cors({origin: '*'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const server = app.listen(PORT);

const io = require('socket.io')(server);
var chatNamespace = io
    .of('/chat')
    .on('connection', function (socket) {
        console.log('New user connected to chatroom')
        const heyRegex = /^Hey.*/;
        const byeRegex = /.*[b|B]ye.*/;

        //default username
        socket.username = "Anonymous"

        //listen on change_username
        socket.on('change_username', (data) => {
            socket.username = data.username;
        })

        //listen on new_message
        socket.on('new_message', (data) => {
            console.log(data);
            //broadcast the new message
            var bot = "Fashion Days Bot";
            socket.emit('new_message', {message : data.message, username : socket.username});
            if (data.message.match(heyRegex)) {
                socket.emit('new_message', {message : "Hello there!", username : bot});
            }
            else if (data.message.match(byeRegex)) {
               // io.sockets.emit('new_message', {message : "See you soon!", username : bot});
               socket.emit('new_message', {message : "See you soon!", username : bot});
            }
            else {
                socket.emit('new_message', {message : "I don't understand...", username : bot});
            }
        })

        //listen on typing
        socket.on('typing', (data) => {
            socket.broadcast.emit('typing', {username : socket.username})
        })
    })

//create new customer
app.post('/register', async (req, res) => {
    var username = req.body.username;
    var pass = req.body.pass;
    var name = req.body.name;
    try {
        var connection = await getConnectionAsync();
        const queryAsync = util.promisify(connection.query).bind(connection);
        await queryAsync("START TRANSACTION");    
        const resultExistCustomer = await queryAsync(`SELECT EXISTS (SELECT * FROM customers WHERE username = '${username}' FOR UPDATE) AS exist`);
        if (resultExistCustomer[0].exist != 0) {
            await queryAsync("ROLLBACK");
            connection.release();
            return res.send([errors.NO_ERROR, resultExistCustomer[0]]);
        }     
        pass=sha1(pass);
        await queryAsync(`INSERT INTO customers (username, customer_password, customer_name) VALUES ('${username}', '${pass}', '${name}')`);
        await queryAsync("COMMIT");
        connection.release();
        console.log("customer added");
        res.send([errors.NO_ERROR, resultExistCustomer[0]]);
    }
    catch (err){    
        res.send([errors.DB_ERROR, err]);}   
});


//get all products for the requested gender
app.get('/products/sex/:sex',  async (req, res) =>{
    try {
        const  products =  await pool.query(`SELECT * FROM products WHERE sex='${req.params.sex}'`);
        res.send([errors.NO_ERROR, products]);
    }
    catch (err) {
        res.send([errors.DB_ERROR, err]);
    }
});

//get all products in a category for the requested gender
app.get('/products/category/:category/:sex',  async (req, res) =>{
    try {
        const products =  await pool.query(`SELECT * FROM products WHERE sex='${req.params.sex}' AND category='${req.params.category}'`);
        res.send([errors.NO_ERROR, products]);
    }
    catch (err) {
        res.send([errors.DB_ERROR, err]);
    }
});

// send a comment on product page
app.post('/products/id/:id/comments', async (req, res) => {
    var productId = req.body.productId; 
    const user = req.body.user;
    const text = req.body.text;
    try {
        var connection = await getConnectionAsync();
        const queryAsync = util.promisify(connection.query).bind(connection);
        await queryAsync(`INSERT INTO comments (text, product_id, username) VALUES ( '${text}', '${productId}', '${user}')`);
        
        res.send([errors.NO_ERROR, true]);
    } catch (err) {
        console.log(err);
        res.send([errors.DB_ERROR, err]);
    }
});

// get all comments for certain product
app.get('/products/id/:id/comments', async (req, res) => {
    try {  
        const resultComments =  await pool.query(`SELECT * FROM comments WHERE product_id=${req.params.id}`);
        res.send([errors.NO_ERROR, resultComments]);
    }
    catch (err) {   
       res.send([errors.DB_ERROR, err]);
    }   
});

//search for product by id
app.get('/products/id/:id', async (req, res) => {
    try {  
        const resultProduct =  await pool.query(`SELECT * FROM products WHERE product_id='${req.params.id}'`);
        res.send([errors.NO_ERROR, resultProduct[0]]);
    }
    catch (err) {    
       res.send([errors.DB_ERROR, err]);
    }   
});

// login
app.post('/login', async (req, res) => {
    const user = req.body.user;
    var pass = req.body.pass;
    pass=sha1(pass);
    try {
        const result = await pool.query(`SELECT customer_id FROM customers WHERE username = '${user}'  AND customer_password = '${pass}'`);
        if (result.length > 0) {
            res.send([errors.NO_ERROR, result[0]]);
        } else {
            res.send([errors.NOT_FOUND, 'Invalid username or password.']);
        }
    } 
    catch (err) {
        res.send([errors.DB_ERROR, err]);
    }
});

//order product
app.put('/order', async (req, res) => {
    const handleProduct = (product) => new Promise(async (resolve) => {
        if (product.count_available > product.quantity) {
            const newCount = product.count_available - product.quantity;
            await pool.query(`UPDATE products SET count_available=${newCount} WHERE product_id='${product.product_id}'`);
            resolve({ success : true, msg: `Order was successful. You ordered ${product.quantity} of ${product.product_name} product`}); 
        } else if (product.count_available === product.quantity){
            await pool.query(`DELETE FROM products WHERE product_id='${product.product_id}'`);
            resolve({ success: true, msg: `Order was successful. You ordered all of ${product.product_name}`});
        } else {
            resolve({ success: false, msg:`Order was not successful. There are not so many ${product.product_name}s available`});
        }
    })
    
    Promise.all(req.body.products.map(pr => handleProduct(pr))).then((results) => {
        if (results.every(res => res.success === true)) {
            res.send([errors.NO_ERROR, 'Your order was successful']);
        } else {
            res.send([errors.SERVER_ERROR, results.map(res => res.msg)]);
        }
    });
});

//get count of products
app.get('/count', async (req, res) =>{
    const product_name = req.query.product_name;
    var quantity=req.query.quantity;
    try{ 
        const result =  await pool.query(`SELECT count_available,product_name FROM products WHERE product_name='${product_name}'`);
        if(result>=quantity){
            result[0].quantity=quantity;
            return res.send([errors.NO_ERROR, result]);
        }    
    }
    catch (err){
        res.send([errors.DB_ERROR, err]);
    }
});

function mysqlEscape(stringToEscape){
    if(stringToEscape == '') {
        return stringToEscape;
    }
    return stringToEscape.replace(/\\/g, "\\\\").replace(/\'/g, "\\\'").replace(/\"/g, "\\\"");
} 
 
//const server = app.listen(PORT);
console.log(`Running on port ${PORT}`);
