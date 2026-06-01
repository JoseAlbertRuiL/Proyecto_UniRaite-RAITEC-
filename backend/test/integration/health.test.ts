import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('GET /health', () => {
  it('returns 200 with OK status', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      status: 'OK',
      message: 'Servidor UNIRAITE funcionando',
    })
  })

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown-route')

    expect(res.status).toBe(404)
  })
})
