import { app, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { CabinAnnouncement } from '@shared/types';

export class CabinService {
  getMediaDirectory() {
    const mediaDir = path.join(app.getPath('userData'), 'cabin-media');
    fs.mkdirSync(mediaDir, { recursive: true });
    return mediaDir;
  }

  getAnnouncementMediaPath(announcement: CabinAnnouncement) {
    if (!announcement.mediaFile) return null;
    return path.join(this.getMediaDirectory(), announcement.mediaFile);
  }

  async playAnnouncement(announcement: CabinAnnouncement) {
    if (announcement.mode === 'wav') {
      const mediaPath = this.getAnnouncementMediaPath(announcement);
      if (!mediaPath || !fs.existsSync(mediaPath)) {
        return {
          ok: false,
          message: `Media file not found: ${announcement.mediaFile ?? 'unknown file'}`,
          mediaDirectory: this.getMediaDirectory()
        };
      }

      await shell.openPath(mediaPath);
      return {
        ok: true,
        message: `Opened media file: ${path.basename(mediaPath)}`,
        mediaDirectory: this.getMediaDirectory()
      };
    }

    return {
      ok: false,
      message: 'TTS engine is not connected yet. Please use WAV/MP3 media first.',
      mediaDirectory: this.getMediaDirectory()
    };
  }
}
