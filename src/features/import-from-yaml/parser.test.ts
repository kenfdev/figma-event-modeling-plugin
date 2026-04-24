import { describe, it, expect } from 'vitest'
import { parseImportYaml } from './parser'

describe('parseImportYaml', () => {
  describe('screen validation', () => {
    it('returns error when screen is missing', () => {
      const yaml = `
slice: Test Slice
commands:
  - name: SomeCommand
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('screen')
    })

    it('returns error when screen.type is missing', () => {
      const yaml = `
slice: Test Slice
screen:
  name: Test Screen
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('screen.type')
    })

    it('returns error when screen.type is invalid value', () => {
      const yaml = `
slice: Test Slice
screen:
  type: agent
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain("agent")
    })

    it('returns error when screen is an array', () => {
      const yaml = `
slice: Test Slice
screen:
  - type: user
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('screen')
    })
  })

  describe('legacy events key', () => {
    it('returns error when top-level events key is present', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
events:
  - name: SomeEvent
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('events')
      expect(result.error).toContain('no longer supported')
    })
  })

  describe('external key on commands and queries', () => {
    it('returns error when command has external key', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
commands:
  - name: SomeCommand
    external: true
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('external')
    })

    it('returns error when query has external key', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
queries:
  - name: SomeQuery
    external: true
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('external')
    })
  })

  describe('screen.reads and screen.executes validation', () => {
    it('returns error when screen.reads contains unknown query name', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
  reads:
    - NonExistentQuery
commands:
  - name: SomeCommand
queries:
  - name: ExistingQuery
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('screen.reads')
      expect(result.error).toContain('NonExistentQuery')
    })

    it('returns error when screen.executes contains unknown command name', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
  executes:
    - NonExistentCommand
commands:
  - name: ExistingCommand
queries:
  - name: SomeQuery
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('screen.executes')
      expect(result.error).toContain('NonExistentCommand')
    })
  })

  describe('duplicate detection', () => {
    it('returns error for duplicate command names', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
commands:
  - name: RegisterUser
  - name: registeruser
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('Duplicate')
      expect(result.error).toContain('command')
      expect(result.error).toContain('RegisterUser')
    })

    it('returns error for duplicate query names', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
queries:
  - name: GetUser
  - name: getuser
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('Duplicate')
      expect(result.error).toContain('query')
      expect(result.error).toContain('GetUser')
    })

    it('returns error for duplicate names in produces array', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
  executes:
    - RegisterUser
commands:
  - name: RegisterUser
    produces:
      - UserRegistered
      - userregistered
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('Duplicate')
      expect(result.error).toContain('produces')
      expect(result.error).toContain('UserRegistered')
    })

    it('returns error for duplicate names in from_events array', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
  reads:
    - GetUserByEmail
commands:
  - name: RegisterUser
queries:
  - name: GetUserByEmail
    from_events:
      - UserRegistered
      - userregistered
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('Duplicate')
      expect(result.error).toContain('from_events')
      expect(result.error).toContain('UserRegistered')
    })

    it('returns error for duplicate names in screen.reads', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
  reads:
    - GetUserByEmail
    - getuserbyemail
commands:
  - name: SomeCommand
queries:
  - name: GetUserByEmail
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('Duplicate')
      expect(result.error).toContain('screen.reads')
    })

    it('returns error for duplicate names in screen.executes', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
  executes:
    - RegisterUser
    - registeruser
commands:
  - name: RegisterUser
queries:
  - name: SomeQuery
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('Duplicate')
      expect(result.error).toContain('screen.executes')
    })
  })

  describe('normalized matching across cases/whitespace', () => {
    it('matches screen.executes to command by normalized name', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
  executes:
    - registeruser
commands:
  - name: RegisterUser
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.screen.executes).toContain('registeruser')
    })
  })

  describe('unknown top-level key warning', () => {
    it('returns success with warning for unknown top-level key', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
unknownKey: some value
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('unknownKey')
    })
  })

  describe('happy path - new schema', () => {
    it('parses YAML with screen, commands with produces, queries with from_events', () => {
      const yaml = `
slice: Register User
screen:
  type: user
  reads:
    - ExistingUserByEmail
  executes:
    - RegisterUser
commands:
  - name: RegisterUser
    fields: |
      email: string
      password: string
    produces:
      - UserRegistered
queries:
  - name: ExistingUserByEmail
    fields: |
      email: string
    from_events:
      - UserRegistered
gwt:
  - name: Happy Path
    given:
      - name: ExistingUserByEmail
        type: query
    when:
      - name: RegisterUser
        type: command
    then:
      - name: UserRegistered
        type: event
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.data.screen.type).toBe('user')
      expect(result.data.screen.reads).toContain('ExistingUserByEmail')
      expect(result.data.screen.executes).toContain('RegisterUser')

      const cmd = result.data.commands![0]
      expect(cmd.name).toBe('RegisterUser')
      expect(cmd.produces).toContain('UserRegistered')

      const qry = result.data.queries![0]
      expect(qry.name).toBe('ExistingUserByEmail')
      expect(qry.from_events).toContain('UserRegistered')

      expect(result.warnings).toEqual([])
    })
  })

  describe('basic validation (non-new-schema)', () => {
    it('returns error when input is empty', () => {
      const result = parseImportYaml('')
      expect(result.success).toBe(false)
    })

    it('returns error when YAML is invalid syntax', () => {
      const yaml = 'slice: [invalid: yaml: content'
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
    })

    it('returns error when YAML is not an object', () => {
      const yaml = '42'
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
    })

    it('returns error when slice field is missing', () => {
      const yaml = `
screen:
  type: user
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('slice')
    })

    it('returns error when commands is not an array', () => {
      const yaml = `
slice: Test Slice
screen:
  type: user
commands: not-an-array
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('commands')
    })
  })

  describe('malformed array entries', () => {
    it('returns error for null entry in commands', () => {
      const yaml = `
slice: Test
screen:
  type: user
commands:
  - null
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('commands[0]')
        expect(result.error).toContain('name')
      }
    })

    it('returns error for scalar entry in queries', () => {
      const yaml = `
slice: Test
screen:
  type: user
queries:
  - 42
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('queries[0]')
        expect(result.error).toContain('name')
      }
    })

    it('returns error for null entry in gwt', () => {
      const yaml = `
slice: Test
screen:
  type: user
gwt:
  - null
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('gwt[0]')
        expect(result.error).toContain('name')
      }
    })

    it('returns error for non-string entry in screen.reads', () => {
      const yaml = `
slice: Test
screen:
  type: user
  reads:
    - 42
queries:
  - name: SomeQuery
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('screen.reads')
        expect(result.error).toContain('string')
      }
    })

    it('returns error for non-string entry in screen.executes', () => {
      const yaml = `
slice: Test
screen:
  type: user
  executes:
    - 42
commands:
  - name: SomeCommand
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('screen.executes')
        expect(result.error).toContain('string')
      }
    })

    it('returns error for null entry in produces', () => {
      const yaml = `
slice: Test
screen:
  type: user
  executes:
    - SomeCommand
commands:
  - name: SomeCommand
    produces:
      - null
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('produces')
        expect(result.error).toContain('string')
      }
    })

    it('returns error for non-string entry in from_events', () => {
      const yaml = `
slice: Test
screen:
  type: user
  reads:
    - SomeQuery
queries:
  - name: SomeQuery
    from_events:
      - 42
`
      const result = parseImportYaml(yaml)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('from_events')
        expect(result.error).toContain('string')
      }
    })
  })
})