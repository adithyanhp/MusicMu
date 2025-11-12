import { FastifyInstance } from 'fastify';
import { getAudioStream, getMetadata } from '../lib/youtube.js';

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

  // Get audio stream URL
  fastify.get('/track/:id/stream', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const stream = await getAudioStream(id);
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
