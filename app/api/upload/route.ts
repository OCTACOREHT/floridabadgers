import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Directory where uploaded files will be stored (relative to the project root)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Helper to ensure the upload directory exists.
 */
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    // If the directory cannot be created, propagate the error.
    console.error('Failed to create upload directory', err);
    throw err;
  }
}

/**
 * POST /api/upload
 * Accepts a multipart/form-data request with a single file field named "file".
 * Stores the file in the public/uploads directory and returns the public URL.
 */
export async function POST(request: Request) {
  try {
    // Ensure the upload folder exists before handling the request.
    await ensureUploadDir();

    // Parse the incoming FormData.
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate a safe, unique filename.
    const originalName = (file as any).name || 'upload';
    const timestamp = Date.now();
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
    const filename = `${timestamp}-${safeName}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Read the file into an ArrayBuffer and write it to disk.
    const arrayBuffer = await (file as Blob).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    // Construct the public URL – Next.js serves files under /public at the root.
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
