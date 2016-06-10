const test = require('ava');
const path = require('path');
const Transformer = require('../lib/Transformer');
const createPage = require('../lib/createPage.js');
const { createTempFixtures, removeTempFixtures } = require('./util.js');

test.beforeEach(createTempFixtures);
test.afterEach(removeTempFixtures);

test('perform a basic sync transformation', t => {
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.transform('**/*', function (page) {
    page.foo = 'foo';
    return page;
  });

  const page = createPage('index.html');

  return transformer.transformPages([page]).then(pages => {
    t.is(pages[0].foo, 'foo');
  });
});

test('reject with an error from a sync transformation', t => {
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.transform('**/*', function () {
    throw new Error('D\'oh');
  });

  const page = createPage('index.html');

  return t.throws(transformer.transformPages([page])).then(error => {
    t.is(error.message, 'D\'oh');
  });
});

test('perform a basic async transformation', t => {
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.transformAsync('**/*', function (page, callback) {
    page.foo = 'foo';
    callback(null, page);
  });

  const page = createPage('index.html');

  return transformer.transformPages([page]).then(pages => {
    t.is(pages[0].foo, 'foo');
  });
});

test('reject with an error from a async transformation', t => {
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.transformAsync('**/*', function (page, callback) {
    callback('D\'oh');
  });

  const page = createPage('index.html');

  return t.throws(transformer.transformPages([page])).then(error => {
    t.is(error, 'D\'oh');
  });
});

test('should transform all pages', (t) => {
  const page1 = createPage('index.html');
  const page2 = createPage('about.html');
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.transformAll(function (pages) {
    pages.forEach((page) => {
      page.foo = 'bar';
    });

    return pages;
  });

  return transformer.transformPages([page1, page2]).then((pages) => {
    t.is(pages[0].foo, 'bar');
    t.is(pages[1].foo, 'bar');
  });
});

test('reject with an error from a sync transformation on all pages', t => {
  const page1 = createPage('index.html');
  const page2 = createPage('about.html');
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.transformAll(function (pages) {
    pages.forEach(() => {
      throw 'D\'oh'; // eslint-disable-line no-throw-literal
    });

    return pages;
  });

  return t.throws(transformer.transformPages([page1, page2])).then((error) => {
    t.is(error, 'D\'oh');
  });
});

test('should transform all pages async', (t) => {
  const page1 = createPage('index.html');
  const page2 = createPage('about.html');
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.transformAllAsync(function (pages, done) {
    pages.forEach((page) => {
      page.foo = 'bar';
    });

    process.nextTick(function () {
      done(null, pages);
    });
  });

  return transformer.transformPages([page1, page2]).then((pages) => {
    t.is(pages[0].foo, 'bar');
    t.is(pages[1].foo, 'bar');
  });
});

test('reject with an error from a async transformation on all pages', t => {
  const page1 = createPage('index.html');
  const page2 = createPage('about.html');
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.transformAllAsync(function (pages, done) {
    process.nextTick(function () {
      done('D\'oh');
    });
  });

  return t.throws(transformer.transformPages([page1, page2])).then((error) => {
    t.is(error, 'D\'oh');
  });
});

test('apply JSON data to a page', t => {
  const transformer = new Transformer({
    sourceDir: path.join(t.context.temp, 'transformer-json-data'),
    logLevel: 'silent'
  });

  transformer.data('json', 'data.json');

  const page = createPage('index.html');

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].data.json.foo, 'bar');
  });
});

test('apply YAML data to a page', t => {
  const transformer = new Transformer({
    sourceDir: path.join(t.context.temp, 'transformer-yaml-data'),
    logLevel: 'silent'
  });

  transformer.data('yaml', 'data.yaml');

  const page = createPage('index.html');

  transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].data.yaml.foo, 'bar');
  });
});

test('apply data from a function to a page', t => {
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.data('async', function (done) {
    process.nextTick(function () {
      done(null, {
        foo: 'bar'
      });
    });
  });

  const page = createPage('index.html');

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].data.async.foo, 'bar');
  });
});

test('ignore a page', t => {
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.ignore('index.html');

  const page = createPage('index.html');

  return transformer.transformPages([page]).then((pages) => {
    t.true(pages[0].ignore);
  });
});

test('merge metadata', t => {
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.metadata('index.html', {
    foo: 'bar'
  });

  const page = createPage('index.html');

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].foo, 'bar');
  });
});

test('merge metadata should not overwrite local metadata', t => {
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.metadata('index.html', {
    foo: 'bar'
  });

  const page = createPage('index.html', '', {
    foo: 'baz'
  });

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].foo, 'baz');
  });
});

test('update layout', t => {
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.layout('index.html', '_layout.html:main');

  const page = createPage('index.html');

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].layout, '_layout.html:main');
  });
});

test('should query an array of all pages by default', t => {
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  transformer.query('allPages');

  const page1 = createPage('page1.html');
  const page2 = createPage('page2.html');
  const page3 = createPage('page3.html');

  return transformer.transformPages([page1, page2, page3]).then((pages) => {
    t.is(pages[0].queries.allPages.length, 3);
    t.is(pages[0].queries.allPages[0].src, 'page1.html');
    t.is(pages[0].queries.allPages[1].src, 'page2.html');
    t.is(pages[0].queries.allPages[2].src, 'page3.html');
  });
});

test('should generate new pages while transforming', t => {
  const transformer = new Transformer({
    logLevel: 'silent'
  });

  const page = createPage('index.html');

  transformer.generate((pages, createPage, done) => {
    t.is(pages[0], page);

    process.nextTick(function () {
      done(null, [createPage('generated.html')]);
    });
  });

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages.length, 2);
    t.is(pages[0].src, 'index.html');
    t.is(pages[1].src, 'generated.html');
  });
});
