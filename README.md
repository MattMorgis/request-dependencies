# Request Dependecies

What packages depend on [`request`](https://github.com/request/request)?

## Motivation

- https://twitter.com/mikeal/status/1065296443148165121
- https://github.com/request/request/issues/3068

I've used `request` for as long as I've used Node.js. I am attempting to jump in and help maintain it, time permitting.

One of the first things I was intersted in was "Who's using request?"

This will at least partly answer the question.

## 10 Second Tutorial

Needs Node.js version 10+

`$ npm i`

`$ node run.js`

_go get a cup of coffee or tea_

`$ ./sort-results.sh`

## Results

Results can be viewed in [`results-sorted.csv`](https://github.com/MattMorgis/request-dependencies/blob/master/results-sorted.csv)

## How it works

This is mainly a rebuild of [`npm-get-top-dependents`](https://github.com/addaleax/npm-get-top-dependents#readme) and [`npm-get-dependents`](https://github.com/chrisdickinson/npm-get-dependents), which I couldn't quite get working myself.

Dependent packages are pulled from `http://skimdb.npmjs.com` in batches of 100 at a time, which I can only find docs for [here](https://github.com/npm/registry/blob/master/docs/REPLICATE-API.md#overview).

It then hits npm's [point values API](https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values) to get the download count for each package for the past 30 days.

It then writes the results to a `.csv`. It excludes packages with download counts less than 100 to avoid noise.

I only include packages that have more than 100 downloads.

_Note:_ I [tried](https://github.com/MattMorgis/request-dependencies/commit/e439fcfad3ea0ad98299a18295e91e7339428872#r31440019) to use `request` for this script but it kept killing the process with an handled error :( .. to be continued
