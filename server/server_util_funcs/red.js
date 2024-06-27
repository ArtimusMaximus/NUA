function red(text, color) { // specific console color logger
    if (color === 'red') {
        console.log('\x1b[31m\x1b[5m', text);
    } else if (color === 'cyan') {
        console.log('\x1b[36m\x1b[1m', text);
    }
}

module.exports = { red };