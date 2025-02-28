> [!WARNING]
> `node-pty@1.0.0` requires `c++20`, but `electron-rebuild@3.2.9` hardcoded `c++17`.<br>
> Replace `c++17` by `c++20` before calling `node_modules/.bin/electron-rebuild` as shown below:

```sh
$ cd node_modules/electron-rebuild
$ grep -i -F cxxflags -R .
./lib/src/module-type/node-gyp.js:            process.env.CXXFLAGS = '-std=c++17';
./lib/src/clang-fetcher.js:    const cxxflags = [];
./lib/src/clang-fetcher.js:        cxxflags.push('-std=c++17');
./lib/src/clang-fetcher.js:            CFLAGS: `${cxxflags.join(' ')}`,
./lib/src/clang-fetcher.js:            CXXFLAGS: `${cxxflags.join(' ')}`
```
