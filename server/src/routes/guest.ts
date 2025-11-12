import { FastifyInstance } from 'fastify';

// Guest mode endpoints - these don't persist to DB, just return success
// The frontend handles all storage in localStorage/IndexedDB

export default async function guestRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/guest/health', async (request, reply) => {
    return reply.send({ 
      status: 'ok',
      mode: 'guest',
      timestamp: new Date().toISOString()
    });
  });

  // Mock sync endpoint for guest mode
  // In guest mode, this just validates the data structure
  fastify.post('/guest/sync', async (request, reply) => {
    const data = request.body as any;

    // Validate data structure
    const requiredFields = ['playlists', 'liked', 'queue', 'version'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        return reply.code(400).send({
          error: `Missing required field: ${field}`
        });
      }
    }

    return reply.send({
      success: true,
      message: 'Guest data validated successfully',
      synced: false, // Guest mode doesn't sync to server
    });
  });

  // Export guest data (for migration to logged-in mode later)
  fastify.get('/guest/export', async (request, reply) => {
    // This endpoint helps users export their guest data
    // The frontend will send their localStorage data here for validation
    return reply.send({
      message: 'Send your localStorage data via POST to validate before migration',
      format: {
        playlists: [],
        liked: [],
        queue: [],
        lastPlayed: {},
        version: 1
      }
    });
  });
}
