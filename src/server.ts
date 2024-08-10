import { nanoid } from '@blocksuite/store';
import { Server } from '@hocuspocus/server';
import fs from 'node:fs';
import * as Y from 'yjs';

const server = Server.configure({
  port: 4333,
  yDocOptions: { gc: false, gcFilter: () => false },
  onAuthenticate: async (payload) => {
    if (payload.token) {
      if (payload.token === 'readonly') {
        payload.connection.readOnly = true;
      }

      return {
        user: {},
      };
    } else {
      throw new Error('Authentication failed');
    }
  },
  onLoadDocument: async (payload) => {
    const { documentName } = payload;
    const path = `./data/${documentName}.yjs`;

    if (fs.existsSync(path)) {
      const doc = new Y.Doc();
      const docData = fs.readFileSync(path);
      const uint8Array = new Uint8Array(docData);
      Y.applyUpdate(doc, uint8Array);
      return doc;
    } else {
      return createEmptyDocument();
    }
  },
  onStoreDocument: async (payload) => {
    const { documentName, document } = payload;
    const path = `./data/${documentName}.yjs`;

    const update = Y.encodeStateAsUpdate(document);
    fs.writeFileSync(path, update);
  },
});

server.listen();

const createEmptyDocument = async () => {
  const doc = new Y.Doc();
  const blocks = doc.getMap('blocks');

  const block = (
    flavour: string,
    version: number,
    props: Record<string, any> = {},
    children: string[] = []
  ): [string, Y.Map<unknown>] => {
    const id = nanoid();
    const block = new Y.Map();
    block.set('sys:id', id);
    block.set('sys:flavour', flavour);
    block.set('sys:version', version);
    block.set('sys:children', Y.Array.from(children));

    Object.entries(props).forEach(([key, value]) => {
      block.set('prop:' + key, value);
    });

    blocks.set(id, block);

    return [id, block];
  };

  const [paragraph] = block('affine:paragraph', 1, {
    text: new Y.Text('Hello World!'),
    type: 'text',
  });

  const [note] = block(
    'affine:note',
    1,
    {
      xywh: '[0,0,800,95]',
      background: '--affine-note-background-blue',
      index: 'a0',
      hidden: false,
      displayMode: 'both',
      edgeless: {
        style: {
          borderRadius: 0,
          borderSize: 4,
          borderStyle: 'none',
          shadowType: '--affine-note-shadow-sticker',
        },
      },
    },
    [paragraph]
  );

  const [surface] = block('affine:surface', 5);
  const [page] = block('affine:page', 2, { title: new Y.Text('Test') }, [
    surface,
    note,
  ]);

  return doc;
};
