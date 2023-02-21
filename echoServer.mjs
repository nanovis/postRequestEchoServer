import express from 'express';
import { argv } from 'process';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs'

const app = express(express.json());
const port = argv[2] || 8081;

var newRequest = false;
var latestRequest = {};

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json())
app.use(cors());

function getDate()
{
    let d = new Date();

    let day = d.getDate();    
    let month = d.getMonth() + 1;        
    let year = d.getFullYear();
    let hours = d.getHours();
    let minutes = d.getMinutes();
    let seconds = d.getSeconds();
    let mseconds = d.getMilliseconds();
    
    return "" + 
    year + 
    "-" + 
    month.toString().padStart(2, '0') + 
    "-" + 
    day.toString().padStart(2, '0') + 
    "-" +
    hours.toString().padStart(2, '0') + 
    "-" + 
    minutes.toString().padStart(2, '0') + 
    "-" + 
    seconds.toString().padStart(2, '0') + 
    "-" + 
    mseconds.toString().padStart(3, '0');
}

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
    res.write('retry: 100\n\n');
    let count = 0;

    while (true) {
        await new Promise(resolve => setTimeout(resolve, 100));

        // Send a SSE with new commands only when there are new commands for client
        if (newRequest) {
            console.log(latestRequest);
            res.write(`data: ${JSON.stringify(latestRequest)}\n\n`);
            newRequest = false;
        }
    }
});

app.get('/posts', async (req, res) => {    
    fs.readdir("posts", (err, files) => {
        var obj = {};
        obj.count = files.length;
        obj.filenames = [];
        obj.files = [];
        
        files.forEach(file => {
          obj.filenames.push(file);
          
          const content = fs.readFileSync("posts/" + file, {encoding:'utf8', flag:'r'});
          obj.files.push(content);

        });

        var strres = JSON.stringify(obj);

        res.set({
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',        
            'Content-Length': strres.length
        });
        res.flushHeaders();

        res.write(strres);
      });
});

app.post('/', function (req, res) {
  console.log(req.body);
  res = res.status(200);
  if (req.get('Content-Type')) {
    console.log("Content-Type: " + req.get('Content-Type'));
    res = res.type(req.get('Content-Type'));
  }
  latestRequest = req.body;

  fs.writeFile("posts/post_" + getDate() + ".json", JSON.stringify(req.body), function(err) {
    if(err) {
        return console.log(err);
    }    
    }); 

  newRequest = true;
  res.send(req.body);
});

app.post('/command', function (req, res) {
  console.log(req.body);
  res = res.status(200);
  if (req.get('Content-Type')) {
    console.log("Content-Type: " + req.get('Content-Type'));
    res = res.type(req.get('Content-Type'));
  }
  latestRequest = req.body;

  fs.writeFile("commands/command_" + getDate() + ".json", JSON.stringify(req.body), function(err) {
    if(err) {
        return console.log(err);
    }    
    }); 

  res.send(req.body);
});

app.get('/response', function (req, res) {
  
  res = res.status(200);
  if (req.get('Content-Type')) {
    console.log("Content-Type: " + req.get('Content-Type'));
    res = res.type(req.get('Content-Type'));
  }
  
  var found = false;
  fs.readdirSync("commands").forEach(file => {
    if(!found && file.includes("_response.json")) {
      found = true;
      console.log(file);
       var data = fs.readFileSync("commands/" + file);

       res.write(data);  
       
       fs.rename("commands/" + file, "commands/" + file.replace("_response.json", "_response_processed.json"), function (err) {
          if (err) throw err;          
      });
    }
  });

  if(!found) {
    res.write(JSON.stringify({ "type": "empty" }));
  }

  res.send();
});

app.listen(port, () => {
    console.log('listening on port ' + port);
})