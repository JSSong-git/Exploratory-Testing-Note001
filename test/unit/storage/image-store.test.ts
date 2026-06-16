import { describe, expect, it, beforeEach } from 'vitest';
import { saveImage, getImage, deleteImage, clearAllImages, resetImageStore } from '@/lib/storage/image-store';

describe('image-store', () => {
  beforeEach(async () => {
    await resetImageStore();
    await clearAllImages();
  });

  it('saves and retrieves image blob', async () => {
    const blob = new Blob(['png-bytes'], { type: 'image/png' });
    const id = await saveImage(blob);
    const loaded = await getImage(id);
    expect(loaded).toBeTruthy();
  });

  it('deletes image by id', async () => {
    const id = await saveImage(new Blob(['x'], { type: 'image/png' }));
    await deleteImage(id);
    expect(await getImage(id)).toBeNull();
  });
});
