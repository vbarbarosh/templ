#!/usr/bin/env mocha

const assert = require('assert');

const tests = [
    ["''", ''],
    ['1', '1'],
    ['a', 'a'],
    ['A', 'A'],
    ['@', '@'],
    ["%", '%'],
    ['_', '_'],
    ['+', '+'],
    ["'#'", '#'],
    ["'$'", '$'],
    ["'~'", '~'],
    ["'!'", '!'],
    ["'^'", '^'],
    ["'&'", '&'],
    ["'*'", '*'],
    ["'('", '('],
    ["')'", ')'],
    ['abc', 'abc'],
    ['123', '123'],
    ['abc123', 'abc123'],
    ["hello_abc", 'hello_abc'],
    ["hello-abc", 'hello-abc'],
    ["hello+abc", 'hello+abc'],
    ["hello%abc", 'hello%abc'],
    ["'hello abc'", 'hello abc'],
    ["'hello $abc'", 'hello $abc'],
    ["'hello \"abc'", 'hello "abc'],
    ["'hello '\\'abc'", 'hello \'abc'],
];

describe('escape_shell_arg', function () {
    tests.forEach(function ([expected, ...args]) {
        it(`${args} → ${expected}`, function () {
            assert.equal(expected, escape_shell_arg(...args));
        });
    });
});

function escape_shell_arg(s)
{
    if (s.match(/^[0-9a-z@_+%-]+$/i)) {
        return s;
    }
    return `'${s.replace(/'/g, "'\\'")}'`;
}
