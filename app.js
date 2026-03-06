import express from 'express';
import mysql2 from 'mysql2';
import dotenv from 'dotenv';
const app = express();

dotenv.config();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'));

const PORT = 3004;
const orders = [];

//Create a databse connection pool with multiple connections
const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
}).promise();

// main route ('/')
app.get('/', (req, res) => {
    // sends home.html file to client
    res.render('home');
});

// Database test route (for debugging)
app.get('/db-test', async (req,res) => {
    
    try {
        const orders = await pool.query('SELECT * FROM orders');
        res.send(orders[0]);
    } catch (err){

        console.error('Database error:',err);
        res.status(500).send('Database error: ' + err.message);
    }
});



app.post('/submit-order', async (req, res) => {
    try {
        const order = req.body;

        console.log('New order submitted:', order);

        order.toppings = Array.isArray(order.toppings) ? order.toppings.join(", ") : " ";

        const sql = `INSERT INTO orders(customer, email, flavor, cone, toppings) VALUES (?, ?, ?, ?, ?);`;

        const params = [
            order.name,
            order.email,
            order.flavor,
            order.method,
            order.toppings
        ];

        const result = await pool.execute(sql, params);
        console.log('Order saved with ID:', result[0].insertId);

        res.render('confirm', { order });

    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).send('Sorry, there was an error processing your order. Please try again.');
    }
});

app.get('/admin', async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders ORDER BY timestamp DESC');
        res.render('admin', { orders });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Error loading orders: ' + err.message);
    }
});

// start server, listen on PORT
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);

});

