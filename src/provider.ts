import { Slot } from '@blocksuite/store';
import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from '@hocuspocus/provider';
import type { Awareness } from 'y-protocols/awareness';
import * as Y from 'yjs';

const CollaborationUrl = `ws://localhost:4333`;

export class CollaborationServerProvider {
  private _websocket: HocuspocusProviderWebsocket;

  public provider: HocuspocusProvider;
  public whenReady: Promise<void>;

  public slots = {
    authenticated: new Slot<'readonly' | 'read-write'>(),
    authenticateFailed: new Slot<void>(),
    serverError: new Slot<void>(),
    synced: new Slot<void>(),
    statelessMessage: new Slot<string>(),
  };

  constructor(
    documentId: string,
    doc: Y.Doc,
    public readonly awareness: Awareness,
    public readonly token: string,
    public readonly user: { id: string; name: string }
  ) {
    this._websocket = new HocuspocusProviderWebsocket({
      url: CollaborationUrl,
    });
    this.provider = new HocuspocusProvider({
      websocketProvider: this._websocket,
      name: documentId,
      document: doc,
      token,
      awareness,
      onAuthenticationFailed: (e) => {
        if (e.reason === 'Server Error') {
          this.slots.serverError.emit();
        } else {
          this.slots.authenticateFailed.emit();
        }
      },
      onAuthenticated: () => {
        this.slots.authenticated.emit(
          (this.provider.authorizedScope || 'readonly') as
            | 'readonly'
            | 'read-write'
        );
      },
    });

    this.provider.on('stateless', ({ payload }: { payload: string }) => {
      this.slots.statelessMessage.emit(payload);
    });

    this.provider.setAwarenessField('user', {
      name: this.user.name,
      id: this.user.id,
    });

    if (this.provider.isSynced) {
      this.whenReady = Promise.resolve();
    } else {
      this.whenReady = new Promise((resolve) => {
        const fn = () => {
          this.provider.off('synced', fn);
          resolve();
        };
        this.provider.on('synced', fn);
      });
    }
  }

  cleanup() {
    this.provider.destroy();
    this._websocket.destroy();
  }
}
