'use strict';

const parse5 = require('parse5');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Queue = require('p-queue');

const base = 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/';

const getLinks = () => {
  return new Promise((resolve) => {
    https.get(`${base}aws-template-resource-type-ref.html`, (res) => {
      const parser = new parse5.ParserStream();

      parser.once('finish', () => {
        const links = parser.document.childNodes[1] // html
          .childNodes[1]                          // body
          .childNodes[2]                          // content-container
          .childNodes[1]                          // main-column
          .childNodes[0]                          // main
          .childNodes[0]                          // main-content
          .childNodes[1]                          // main-col-body
          .childNodes[1]                          // section
          .childNodes[4]                          // highlights
          .childNodes[1]                          // ul
          .childNodes.reduce((links, li) => {
            const a = li.childNodes[0];
            links[a.childNodes[0].value] = `${base}${a.attrs.find((attr) => attr.name === 'href').value}`;
            return links;
          }, {});

        resolve(links);
      });

      res.pipe(parser);
    });
  });
};

const parseOneType = (url) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const parser = new parse5.ParserStream();

      parser.once('finish', () => {
        let h2;

        const findReturnValues = (document) => {
          if (!document.childNodes) return;
          document.childNodes.forEach((child) => {
            if (child.tagName === 'h2' &&
                child.childNodes[0].nodeName === '#text' &&
                /Return Value/.test(child.childNodes[0].value)) h2 = child;

            findReturnValues(child);
          });
        };

        const findAllText = (document) => {
          return new Promise((resolve) => {
            let text = '';
            const parser = new parse5.SAXParser();
            parser.on('text', (t) => text += `${t.trim()}\n`);
            parser.on('end', () => resolve(text.split('\n')));
            parser.write(parse5.serialize(document));
            parser.end();
          });
        };

        findReturnValues(parser.document);
        if (!h2) return resolve({ notFound: true });

        const sections = h2.parentNode.parentNode.parentNode.parentNode.childNodes;

        Promise.all(sections.map((section) => findAllText(section)))
          .then((results) => resolve({ texts: results }));
      });

      res.pipe(parser);
    });
  });
};

const queue = new Queue({ concurrency: 10 });

getLinks()
  .then((links) => {
    var promises = Object.keys(links).map((name) => {
      var p = queue.add(() => parseOneType(links[name])
        .then((data) => Object.assign({ name }, data))
        .then((data) => { console.log(data); return data; })
      );
      return p;
    });

    return Promise.all(promises);
  }).then((results) => fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(results, null, 2)));


parseOneType('https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html');
