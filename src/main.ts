import { AffineSchemas } from '@blocksuite/blocks';
import { AffineEditorContainer } from '@blocksuite/presets';
import '@blocksuite/presets/themes/affine.css';
import { nanoid, Schema } from '@blocksuite/store';
import { DocCollection, Text } from '@blocksuite/store';
import { CollaborationServerProvider } from './provider';

const schema = new Schema().register(AffineSchemas);
const collection = new DocCollection({
  schema,
  awarenessSources: [{ connect: () => {}, disconnect: () => {} } as any],
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

  await provider.whenReady;
  doc.load();

  const editor = new AffineEditorContainer();
  editor.doc = doc;
  document.body.append(editor);

  console.log(
    '🚀 ~ doc.awarenessStore.slots.update.on ~ doc.awarenessStore.slots.update:',
    doc.awarenessStore.slots.update
  );
  doc.awarenessStore.slots.update.on(() => {
    console.log('Awareness updated', doc.awarenessStore.awareness);
  });
  editor.host!.selection.slots.remoteChanged.on(() => {
    console.log(
      'Remote selection changed',
      editor.host?.selection.remoteSelections
    );
  });
}

const createBtn = document.getElementById('connect') as HTMLButtonElement;
createBtn.onclick = () => connect();
