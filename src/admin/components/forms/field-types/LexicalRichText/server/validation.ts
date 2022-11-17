/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createHeadlessEditor} from '@lexical/headless';
import {$isMarkNode, $unwrapMarkNode} from '@lexical/mark';
import * as http from 'http';
import {$getRoot, $isElementNode, LexicalNode} from 'lexical';
import * as url from 'url';

import PlaygroundNodes from '../nodes/PlaygroundNodes';

const hostname = 'localhost';
const port = 1235;

let stringifiedEditorStateJSON = '';

global.__DEV__ = true;

const editor = createHeadlessEditor({
  namespace: 'validation',
  nodes: [...PlaygroundNodes],
  onError: (error) => {
    console.error(error);
  },
});

const getJSONData = (req: http.IncomingMessage): Promise<string> => {
  const body: Array<Uint8Array> = [];
  return new Promise((resolve) => {
    req
      .on('data', (chunk: Uint8Array) => {
        body.push(chunk);
      })
      .on('end', () => {
        resolve(Buffer.concat(body).toString());
      })
      .on('error', (error: Error) => {
        // eslint-disable-next-line no-console
        console.log(error);
      });
  });
};

const sanitizeNode = (node: LexicalNode): void => {
  if ($isMarkNode(node)) {
    $unwrapMarkNode(node);
    return;
  }
  if ($isElementNode(node)) {
    const children = node.getChildren();
    for (const child of children) {
      sanitizeNode(child);
    }
  }
};

const validateEditorState = async (
  stringifiedJSON: string,
): Promise<boolean> => {
  if (stringifiedEditorStateJSON === stringifiedJSON) {
    return true;
  }
  const prevEditorState = editor.getEditorState();
  const nextEditorState = editor.parseEditorState(stringifiedJSON);
  editor.setEditorState(nextEditorState);
  editor.update(() => {
    const root = $getRoot();
    sanitizeNode(root);
  });
  await Promise.resolve().then();

  const assertion = JSON.stringify(editor.getEditorState().toJSON());
  const success = assertion === stringifiedEditorStateJSON;
  if (success) {
    // eslint-disable-next-line no-console
    console.log('Editor state updated successfully.');
    editor.setEditorState(nextEditorState);
    stringifiedEditorStateJSON = assertion;
  } else {
    // eslint-disable-next-line no-console
    console.log('Editor state was rejected!');
    editor.setEditorState(prevEditorState);
  }
  return success;
};

const server = http.createServer(async (req, res) => {
  // @ts-ignore
  const pathname = url.parse(req.url).pathname;
  const {method} = req;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (method === 'OPTIONS') {
    res.end();
    return;
  }

  if (method === 'POST' && pathname === '/setEditorState') {
    const stringifiedJSON = await getJSONData(req);
    const editorState = editor.parseEditorState(stringifiedJSON);
    editor.setEditorState(editorState);
    stringifiedEditorStateJSON = stringifiedJSON;
    res.statusCode = 200;
    res.end();
  } else if (method === 'POST' && pathname === '/validateEditorState') {
    const stringifiedJSON = await getJSONData(req);
    if (await validateEditorState(stringifiedJSON)) {
      res.statusCode = 200;
    } else {
      res.statusCode = 403;
    }
    res.end();
  } else {
    res.statusCode = 404;
    res.end();
  }
});

server.listen(port, hostname, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Read-only validation server running at http://${hostname}:${port}/`,
  );
});
