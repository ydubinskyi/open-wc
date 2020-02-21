/* eslint-disable no-template-curly-in-string */

const unified = require('unified');
const markdown = require('remark-parse');
const remark2rehype = require('remark-rehype');
const htmlStringify = require('rehype-stringify');
const htmlSlug = require('rehype-slug');
const htmlHeading = require('rehype-autolink-headings');
const raw = require('rehype-raw');

const mdSlug = require('remark-slug');
const mdHeadings = require('remark-autolink-headings');
const mdStringify = require('remark-html');

const chai = require('chai');
const { mdjsParse } = require('../src/mdjsParse.js');
const { mdjsStoryParse } = require('../src/mdjsStoryParse.js');

const { expect } = chai;

describe('Integration', () => {
  it('supports rehype slug, link, html', async () => {
    const input = [
      '## Intro',
      '## Intro',
      '```js',
      'const foo = 1;',
      '```',
      '```js script',
      'const bar = 22;',
      '```',
      '```js story',
      'export const fooStory = () => {}',
      '```',
      '```js preview-story',
      'export const fooPreviewStory = () => {}',
      '```',
    ].join('\n');

    const expected = [
      '<h2 id="intro"><a aria-hidden="true" href="#intro"><span class="icon icon-link"></span></a>Intro</h2>',
      '<h2 id="intro-1"><a aria-hidden="true" href="#intro-1"><span class="icon icon-link"></span></a>Intro</h2>',
      '<pre><code class="language-js">const foo = 1;',
      '</code></pre>',
      '<mdjs-story name="fooStory" id="mdjs-story-0"></mdjs-story>',
      '<mdjs-preview name="fooPreviewStory" id="mdjs-story-1"></mdjs-preview>',
    ];

    const parser = unified()
      .use(markdown)
      .use(mdjsParse)
      .use(mdjsStoryParse)
      .use(remark2rehype, { allowDangerousHTML: true })
      .use(raw)
      .use(htmlSlug)
      .use(htmlHeading)
      .use(htmlStringify);
    const result = await parser.process(input);
    expect(result.contents.split('\n')).to.deep.equal(expected);
    expect(result.data.jsCode).to.equal('const bar = 22;');
  });

  it('supports JSX Code in markdown', async () => {
    const input = [
      '## Intro',
      '## Intro',
      '```js',
      'const foo = 1;',
      '```',
      '```js story',
      'export const fooStory = () => {}',
      '```',
      '```js preview-story',
      'export const fooPreviewStory = () => {}',
      '```',
    ].join('\n');

    const expected = [
      '<h2 id="intro"><a href="#intro" aria-hidden="true"><span class="icon icon-link"></span></a>Intro</h2>',
      '<h2 id="intro-1"><a href="#intro-1" aria-hidden="true"><span class="icon icon-link"></span></a>Intro</h2>',
      '<pre><code class="language-js">const foo = 1;',
      '</code></pre>',
      '<Story name="fooStory"></Story>',
      '<Preview><Story name="fooPreviewStory"></Story></Preview>',
      '',
    ].join('\n');

    const parser = unified()
      .use(markdown)
      .use(mdjsParse)
      .use(mdjsStoryParse, {
        storyTag: name => `<Story name="${name}"></Story>`,
        previewStoryTag: name => `<Preview><Story name="${name}"></Story></Preview>`,
      })
      .use(mdSlug)
      .use(mdHeadings)
      .use(mdStringify);
    const result = await parser.process(input);
    expect(result.contents).to.equal(expected);
    expect(result.data.stories).to.deep.equal([
      {
        key: 'fooStory',
        name: 'fooStory',
        code: 'export const fooStory = () => {}',
      },
      {
        key: 'fooPreviewStory',
        name: 'fooPreviewStory',
        code: 'export const fooPreviewStory = () => {}',
      },
    ]);
  });
});