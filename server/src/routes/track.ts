import { FastifyInstance } from 'fastify';
import { getAudioStream, getMetadata } from '../lib/youtube.js';
import axios from 'axios';

export default async function trackRoutes(fastify: FastifyInstance) {
  // Get track metadata
  fastify.get('/track/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const metadata = await getMetadata(id);
      return reply.send(metadata);
    } catch (error) {
      console.error('Metadata error:', error);
      return reply.code(500).send({ 
        error: 'Failed to get track metadata',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Proxy stream - streams audio directly through our server
  fastify.get('/track/:id/proxy', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      console.log('🎵 Proxying stream for:', id);
      const stream = await getAudioStream(id);
      
      // If it's iframe source, return error - can't proxy iframe
      if (stream.source === 'iframe') {
        return reply.code(503).send({
          error: 'Direct streaming not available',
          message: 'This video requires iframe playback',
          useIframe: true,
          videoId: id,
        });
      }

      // Fetch the actual audio stream from YouTube
      const response = await axios.get(stream.url, {
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': request.headers.range || 'bytes=0-',
        },
      });

      // Set appropriate headers
      reply.raw.writeHead(response.status, {
        'Content-Type': response.headers['content-type'] || 'audio/webm',
        'Content-Length': response.headers['content-length'],
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      });

      // Pipe the stream
      response.data.pipe(reply.raw);
    } catch (error) {
      console.error('Proxy stream error:', error);
      return reply.code(500).send({ 
        error: 'Failed to proxy audio stream',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get audio stream URL (returns metadata about stream)
  fastify.get('/track/:id/stream', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const stream = await getAudioStream(id);
      
      // If not iframe, return proxied URL instead of direct YouTube URL
      if (stream.source !== 'iframe') {
        const protocol = request.protocol;
        const host = request.headers.host;
        return reply.send({
          url: `${protocol}://${host}/api/track/${id}/proxy`,
          source: stream.source,
          bitrate: stream.bitrate,
          proxied: true,
        });
      }
      
      // For iframe, return as-is
      return reply.send(stream);
    } catch (error) {
      console.error('Stream error:', error);
      return reply.code(500).send({ 
        error: 'Failed to get audio stream',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Combined endpoint: get metadata + stream in one request
  fastify.get('/track/:id/full', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const [metadata, stream] = await Promise.all([
        getMetadata(id),
        getAudioStream(id),
      ]);

      return reply.send({
        ...metadata,
        stream,
      });
    } catch (error) {
      console.error('Full track error:', error);
      return reply.code(500).send({ 
        error: 'Failed to get track information',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
