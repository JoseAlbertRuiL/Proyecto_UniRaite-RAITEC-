import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import winston from 'winston'

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  process.env.NODE_ENV = 'test'
})

describe('Logger', () => {
  it('exporta los metodos debug, info, warn, error', async () => {
    const { default: logger } = await import('../../src/utils/logger')

    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('usa nivel "debug" en entorno development', async () => {
    process.env.NODE_ENV = 'development'
    const { default: logger } = await import('../../src/utils/logger')

    expect(logger.level).toBe('debug')
  })

  it('usa nivel "warn" en entorno test', async () => {
    process.env.NODE_ENV = 'test'
    const { default: logger } = await import('../../src/utils/logger')

    expect(logger.level).toBe('warn')
  })

  it('usa nivel "info" en entorno production', async () => {
    process.env.NODE_ENV = 'production'
    const { default: logger } = await import('../../src/utils/logger')

    expect(logger.level).toBe('info')
  })

  it('se inicializa sin lanzar errores', async () => {
    process.env.NODE_ENV = 'development'
    const mod = await import('../../src/utils/logger')

    expect(mod.default).toBeDefined()
  })

  it('configura el transporte Console', async () => {
    const { default: logger } = await import('../../src/utils/logger')

    expect(logger.transports).toHaveLength(1)
    expect(logger.transports[0]).toBeInstanceOf(winston.transports.Console)
  })
})
