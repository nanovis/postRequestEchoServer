import express from 'express';
import { argv } from 'process';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express(express.json());
const port = argv[2] || 8080;

var newRequest = false;
var latestRequest = {};

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json())
app.use(cors());


app.use(express.static('static'));

app.get('/events', async (req, res) => {
    console.log('Got /events');
    res.set({
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();

    // Tell the client to retry every 10 seconds if connectivity is lost
    res.write('retry: 10000\n\n');
    let count = 0;

    while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Send a SSE with new commands only when there are new commands for client
        if (newRequest) {
            console.log(latestRequest);
            res.write(`data: ${JSON.stringify(latestRequest)}\n\n`);
            newRequest = false;
        }
    }
});

app.post('/', function (req, res) {
  console.log(req.body);
  res = res.status(200);
  if (req.get('Content-Type')) {
    console.log("Content-Type: " + req.get('Content-Type'));
    res = res.type(req.get('Content-Type'));
  }
  latestRequest = req.body;
  newRequest = true;
  res.send(req.body);
});

app.listen(port, () => {
    console.log('listening on port ' + port);
})