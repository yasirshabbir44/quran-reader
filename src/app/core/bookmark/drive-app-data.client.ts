import { Injectable, inject } from '@angular/core';
import { GoogleAuthService } from '../auth/google-auth.service';

const FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';

export interface RemoteBookmarkPayload {
  readonly surah: number;
  readonly ayah: number;
  /** Last write time on the device that produced this value (epoch ms). */
  readonly updatedAt: number;
}

export interface RemoteBookmarkRead {
  readonly payload: RemoteBookmarkPayload | null;
  readonly fileId: string | null;
}

/**
 * Thin client for the user's Google Drive AppData folder. We keep a single
 * JSON document named `bookmark.json` there. The AppData folder is invisible
 * to the user, isolated per-app, and only writable with the drive.appdata
 * scope, so there's no risk of clobbering the user's regular Drive files.
 */
@Injectable({ providedIn: 'root' })
export class DriveAppDataClient {
  private readonly auth = inject(GoogleAuthService);

  private static readonly FILE_NAME = 'bookmark.json';

  async read(): Promise<RemoteBookmarkRead | null> {
    const token = await this.auth.getAccessToken();
    if (!token) {
      return null;
    }
    const listUrl = new URL(FILES_ENDPOINT);
    listUrl.searchParams.set('spaces', 'appDataFolder');
    listUrl.searchParams.set('fields', 'files(id,name,modifiedTime)');
    listUrl.searchParams.set('q', `name='${DriveAppDataClient.FILE_NAME}' and trashed=false`);
    listUrl.searchParams.set('pageSize', '5');

    const listRes = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!listRes.ok) {
      return null;
    }
    const listData = (await listRes.json()) as { files?: Array<{ id: string; name: string }> };
    const file = listData.files?.find((f) => f.name === DriveAppDataClient.FILE_NAME);
    if (!file?.id) {
      return { payload: null, fileId: null };
    }

    const getUrl = `${FILES_ENDPOINT}/${encodeURIComponent(file.id)}?alt=media`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!getRes.ok) {
      return { payload: null, fileId: file.id };
    }
    try {
      const raw = (await getRes.json()) as Partial<RemoteBookmarkPayload>;
      const surah = Number(raw.surah);
      const ayah = Number(raw.ayah);
      const updatedAt = Number(raw.updatedAt);
      if (!Number.isFinite(surah) || !Number.isFinite(ayah)) {
        return { payload: null, fileId: file.id };
      }
      const s = Math.floor(surah);
      const a = Math.floor(ayah);
      if (s < 1 || s > 114 || a < 1) {
        return { payload: null, fileId: file.id };
      }
      return {
        payload: { surah: s, ayah: a, updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0 },
        fileId: file.id,
      };
    } catch {
      return { payload: null, fileId: file.id };
    }
  }

  /** Creates or updates `bookmark.json`. Returns the new file id on success. */
  async write(payload: RemoteBookmarkPayload, existingFileId: string | null): Promise<string | null> {
    const token = await this.auth.getAccessToken();
    if (!token) {
      return null;
    }
    const body = JSON.stringify(payload);

    if (existingFileId) {
      const url = `${UPLOAD_ENDPOINT}/${encodeURIComponent(existingFileId)}?uploadType=media`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      if (res.ok) {
        return existingFileId;
      }
      if (res.status === 404) {
        // File was deleted between read and write; fall through to create.
      } else {
        return null;
      }
    }

    const boundary = `surah-bookmark-${Math.random().toString(36).slice(2)}`;
    const metadata = {
      name: DriveAppDataClient.FILE_NAME,
      parents: ['appDataFolder'],
      mimeType: 'application/json',
    };
    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${body}\r\n` +
      `--${boundary}--`;

    const createRes = await fetch(`${UPLOAD_ENDPOINT}?uploadType=multipart&fields=id`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });
    if (!createRes.ok) {
      return null;
    }
    const created = (await createRes.json()) as { id?: string };
    return created.id ?? null;
  }
}
