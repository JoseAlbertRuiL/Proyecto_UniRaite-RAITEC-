import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('oRPC handler', () => {
  it('handles POST to /rpc/serverTime (public procedure)', async () => {
    const res = await request(app)
      .post('/rpc/serverTime')
      .send({})
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(200)
    expect(res.body?.json?.serverTime).toBeDefined()
    expect(typeof res.body.json.serverTime).toBe('string')
  })

  it('returns error for unauthenticated protected procedure (slash notation)', async () => {
    const res = await request(app)
      .post('/rpc/usuarios/getPerfil')
      .send({})
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(401)
    expect(res.body?.json?.message).toContain('Token requerido')
  })

  it('returns 404 for non-existent procedure path', async () => {
    const res = await request(app)
      .post('/rpc/nonexistent/procedure')
      .send({})
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(404)
  })

  it('returns validation error for missing required input (slash notation)', async () => {
    const res = await request(app)
      .post('/rpc/auth/verificarCorreo')
      .send({})
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(400)
    expect(res.body?.json?.message).toContain('Input validation failed')
  })
})
