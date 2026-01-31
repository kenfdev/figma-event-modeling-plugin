export const YAML_TEMPLATE = `slice: Create Roadmap

commands:
  - name: CreateRoadmap
    fields: |
      title: string
      items: array
    notes: Customer checkout flow

events:
  - name: RoadmapCreated
    external: false
    fields: |
      title
      description
  - name: ExternalNotification
    external: true

queries:
  - name: GetRoadmapStatus
    fields: |
      roadmapId: string

gwt:
  - name: Happy Path
    given:
      - name: GetRoadmapStatus
        type: query
    when:
      - name: CreateRoadmap
        type: command
    then:
      - name: RoadmapCreated
        type: event
        fields: |
          title
          description
  - name: Duplicate Title
    description: Roadmaps with exact same title are not allowed. Case-sensitive.
    given:
      - name: RoadmapCreated
        type: event
        fields: |
          title
          description
    when:
      - name: CreateRoadmap
        type: command
    then:
      - name: DuplicateTitleError
        type: error
`
