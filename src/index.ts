process.nextTick(console.log, 'nextTick 1');
Promise.resolve().then(() => console.log('Promise 2'));
setTimeout(console.log, 0, 'setTimeout 3');
setImmediate(console.log, 'setImmediate 4');
setTimeout(console.log, 10, 'setTimeout with ms 5');
