const res = await fetch('http://127.0.0.1:8080/api/stats');
console.log('status', res.status);
const text = await res.text();
console.log(text.slice(0,1000));
