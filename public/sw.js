// ForgifyNest Service Worker for streaming chunked downloads
// Enables memory-safe, stream-based downloads of arbitrary sized files

const activeDownloads = new Map();

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  switch (data.type) {
    case 'REGISTER_DOWNLOAD': {
      const { id, filename, size, mimeType } = data;
      
      let controller;
      const stream = new ReadableStream({
        start(c) {
          controller = c;
        },
        cancel() {
          activeDownloads.delete(id);
        }
      });

      activeDownloads.set(id, {
        filename,
        size,
        mimeType,
        stream,
        controller,
        clients: [event.source.id]
      });

      // Acknowledge registration
      event.ports[0].postMessage({ success: true });
      break;
    }

    case 'DOWNLOAD_CHUNK': {
      const { id, chunk } = data;
      const download = activeDownloads.get(id);
      if (download && download.controller) {
        try {
          download.controller.enqueue(new Uint8Array(chunk));
        } catch (err) {
          console.error('Error enqueuing chunk to stream:', err);
        }
      }
      break;
    }

    case 'DOWNLOAD_COMPLETE': {
      const { id } = data;
      const download = activeDownloads.get(id);
      if (download) {
        try {
          if (download.controller) {
            download.controller.close();
          }
        } catch (err) {
          console.error('Error closing stream controller:', err);
        }
        activeDownloads.delete(id);
      }
      break;
    }

    case 'DOWNLOAD_ERROR': {
      const { id, reason } = data;
      const download = activeDownloads.get(id);
      if (download) {
        try {
          if (download.controller) {
            download.controller.error(new Error(reason || 'Download aborted due to error'));
          }
        } catch (err) {
          console.error('Error sending stream error:', err);
        }
        activeDownloads.delete(id);
      }
      break;
    }
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/download-stream') {
    const id = url.searchParams.get('id');
    const download = activeDownloads.get(id);
    
    if (download) {
      // Decode filename to handle special characters properly
      const safeFilename = download.filename;
      
      const headers = new Headers({
        'Content-Type': download.mimeType || 'application/octet-stream',
        // Content-Disposition headers trigger browser file save dialog
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        'Content-Length': download.size.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      event.respondWith(
        new Response(download.stream, {
          status: 200,
          statusText: 'OK',
          headers: headers
        })
      );
    } else {
      event.respondWith(
        new Response('Download link expired or invalid. Please request a new decryption session.', {
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        })
      );
    }
  }
});
