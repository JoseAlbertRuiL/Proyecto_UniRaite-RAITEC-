import { describe, it, expect, afterAll } from 'vitest'
import request from 'supertest'
import path from 'path'
import fs from 'fs'
import app from '../../src/app'

const fakeImage = Buffer.from(
  'ffd8ffe000104a46494600010101004800480000ffe100584578696600004d4d002a000000080002011200030000000100010000876900040000000100000026000000000003a00100030000000100010000a00200040000000100000000a0030004000000010000000000000000ffed002c50686f746f73686f7020332e30003842494d040400000000000000000000000000000000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b080001000101011100ffc4001100010002010301050000000000000000000000010203041112131421314151f0ffda0008010100000000f300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffff00ffd9',
  'hex',
)

const cleanupDirs = ['perfiles', 'credentials', 'licencias', 'circulaciones']

afterAll(() => {
  for (const dir of cleanupDirs) {
    const dirPath = path.resolve(__dirname, '../../uploads', dir)
    if (fs.existsSync(dirPath)) {
      for (const file of fs.readdirSync(dirPath)) {
        fs.unlinkSync(path.join(dirPath, file))
      }
    }
  }
})

describe('POST /upload/perfil', () => {
  it('uploads a profile picture and returns filename', async () => {
    const res = await request(app)
      .post('/upload/perfil')
      .attach('foto_perfil', fakeImage, {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('foto_perfil')
    expect(typeof res.body.foto_perfil).toBe('string')
    expect(res.body.foto_perfil).toMatch(/\.jpg$/)
  })

  it('returns null when no file is sent', async () => {
    const res = await request(app)
      .post('/upload/perfil')

    expect(res.status).toBe(200)
    expect(res.body.foto_perfil).toBeNull()
  })
})

describe('POST /upload/credentials', () => {
  it('uploads a credential photo and returns filename', async () => {
    const res = await request(app)
      .post('/upload/credentials')
      .attach('foto_credencial', fakeImage, {
        filename: 'credencial.jpg',
        contentType: 'image/jpeg',
      })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('foto_credencial')
    expect(typeof res.body.foto_credencial).toBe('string')
  })
})

describe('POST /upload/registro', () => {
  it('uploads multiple files for registration', async () => {
    const res = await request(app)
      .post('/upload/registro')
      .attach('foto_credencial', fakeImage, {
        filename: 'credencial.jpg',
        contentType: 'image/jpeg',
      })
      .attach('foto_perfil', fakeImage, {
        filename: 'perfil.jpg',
        contentType: 'image/jpeg',
      })

    expect(res.status).toBe(200)
    expect(typeof res.body.foto_credencial).toBe('string')
    expect(typeof res.body.foto_perfil).toBe('string')
  })
})

describe('POST /upload/conductor', () => {
  it('uploads license and circulation photos', async () => {
    const res = await request(app)
      .post('/upload/conductor')
      .attach('foto_licencia', fakeImage, {
        filename: 'licencia.jpg',
        contentType: 'image/jpeg',
      })
      .attach('foto_circulacion', fakeImage, {
        filename: 'circulacion.jpg',
        contentType: 'image/jpeg',
      })

    expect(res.status).toBe(200)
    expect(typeof res.body.foto_licencia).toBe('string')
    expect(typeof res.body.foto_circulacion).toBe('string')
  })
})

describe('POST /upload/circulacion', () => {
  it('uploads a circulation photo', async () => {
    const res = await request(app)
      .post('/upload/circulacion')
      .attach('foto_circulacion', fakeImage, {
        filename: 'circulacion.jpg',
        contentType: 'image/jpeg',
      })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('foto_circulacion')
    expect(typeof res.body.foto_circulacion).toBe('string')
  })
})

describe('multer file filter', () => {
  it('rejects non-image files', async () => {
    const res = await request(app)
      .post('/upload/perfil')
      .attach('foto_perfil', Buffer.from('text content'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })

    expect(res.status).toBe(500)
  })
})
