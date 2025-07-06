const {createId} = require('@paralleldrive/cuid2');

function cuid2()
{
    return createId();
}

module.exports = cuid2;
