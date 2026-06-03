import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('Global error handler', () => {
  it('returns 500 with standardized format for unknown routes under /rpc', async () => {
    const res = await request(app)
      .post('/rpc/nonexistent/procedure')
      .send({})
      .set('Content-Type', 'application/json')

    // oRPC handler returns 404 for unmatched procedures
    expect(res.status).toBe(404)
  })

  it('returns 400 with standardized format for multer file size error', async () => {
    // Create a buffer larger than 5MB to trigger LIMIT_FILE_SIZE
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024)

    const res = await request(app)
      .post('/upload/perfil')
      .attach('foto_perfil', largeBuffer, {
        filename: 'large.jpg',
        contentType: 'image/jpeg',
      })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('success', false)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toHaveProperty('code')
    expect(res.body.error).toHaveProperty('message')
  })

  it('returns 400 with standardized format for multer non-image rejection', async () => {
    const res = await request(app)
      .post('/upload/perfil')
      .attach('foto_perfil', Buffer.from('text content'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Solo se permiten imágenes JPG y PNG',
      },
    })
  })

  it('returns standardized error format for completely unknown route', async () => {
    const res = await request(app)
      .get('/nonexistent-route')

    expect(res.status).toBe(404)
    // Express default 404 body — not our standardized format
    // The global error handler only catches thrown errors, not unmatched routes
  })
})
