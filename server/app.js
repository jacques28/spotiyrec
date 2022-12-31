import express from 'express';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';

const app = express();


app.get("/", (req, res) => {
    res.send("hello");
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.listen(3000);