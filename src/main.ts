import { AffineSchemas } from '@blocksuite/blocks';
import { AffineEditorContainer } from '@blocksuite/presets';
import '@blocksuite/presets/themes/affine.css';
import { nanoid, Schema } from '@blocksuite/store';
import { DocCollection } from '@blocksuite/store';
import { CollaborationServerProvider } from './provider';

const schema = new Schema().register(AffineSchemas);
const collection = new DocCollection({
  schema,
});
collection.start();
collection.meta.initialize();
const doc = collection.createDoc({ id: '11' });

async function connect() {
  const nameInput = (document.querySelector('#name') as HTMLInputElement)!;
  if (!nameInput.value) {
    nameInput.value = nanoid();
  }

  const provider = new CollaborationServerProvider(
    doc.id,
    doc.spaceDoc,
    doc.awarenessStore.awareness,
    'token',
    {
      id: nanoid(),
      name:
        (document.querySelector('#name') as HTMLInputElement)!.value ||
        nanoid(),
    }
  );

  doc.load();

  const editor = new AffineEditorContainer();
  editor.doc = doc;
  document.body.append(editor);
}

const createBtn = document.getElementById('connect') as HTMLButtonElement;
createBtn.onclick = () => connect();
