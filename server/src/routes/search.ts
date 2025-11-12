import { FastifyInstance } from 'fastify';
import { search } from '../lib/youtube.js';

export default async function searchRoutes(fastify: FastifyInstance) {
  // Search for videos
  fastify.get('/search', async (request, reply) => {
    const { q, limit } = request.query as { q?: string; limit?: string };

    if (!q) {
      return reply.code(400).send({ error: 'Query parameter "q" is required' });
    }

    try {
      const results = await search(q, limit ? parseInt(limit) : 10);
      
      // Return empty results instead of error if search fails
      if (!results || results.length === 0) {
        return reply.send({ 
          results: [],
          message: 'No results found. YouTube search may be temporarily unavailable.'
        });
      }
      
      return reply.send({ results });
    } catch (error) {
      console.error('Search error:', error);
      // Return empty results with message instead of 500
      return reply.send({ 
        results: [],
        error: 'Search temporarily unavailable',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
