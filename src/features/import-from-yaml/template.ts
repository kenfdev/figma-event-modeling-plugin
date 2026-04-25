export const YAML_TEMPLATE = `slice: Register User

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
  - name: Duplicate Email
    description: Users with the same email cannot register twice.
    given:
      - name: UserRegistered
        type: event
    when:
      - name: RegisterUser
        type: command
    then:
      - name: DuplicateEmailError
        type: error
`