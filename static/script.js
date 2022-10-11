

const source = new EventSource('/events');
source.addEventListener('open', message => {
    console.log("Connection to server opened with message: " + message + "!");
}, false);
source.addEventListener('error', message => {
    console.log("Connection to server closed with message: " + message + "!");
}, false);

source.addEventListener('message', message => {
    let pre = document.getElementById('request');
    let data = JSON.parse(message.data);
    pre.innerHTML = JSON.stringify(data, null, 4);
});