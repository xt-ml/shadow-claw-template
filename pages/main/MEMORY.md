---
title: "Agent Memory"
created: "1970-01-01T00:00:00Z"
updated: "1970-01-01T00:00:00Z"
slug: "agent-memory"
---

## Memory

### Workspace Layout & Skills Conventions

- **Skills**: `.agents/skills/main/<skill-name>/SKILL.md`
- **Declarative Tools**: `.agents/tools/main/<tool-name>.json`
- **Portable Scripts**: `.agents/scripts/main/<script-name>.js` (Decoupled ESM modules with zero DOM dependencies)
- **HTTP Discovery Index**: `/.well-known/agent-skills/index.json` (Conforming to Agent Skills Discovery RFC v0.2.0)
- **Skill Format**: Markdown file with YAML frontmatter AND a Markdown body (frontmatter is metadata only; always include a `# <Skill Title>` heading and human-readable description in the Markdown body so it renders in document previews):

  ```yaml
  ---
  name: <skill-name>
  description: <clear summary for model and slash command>
  user-invocable: true
  metadata:
    allowed-tools: <tool1> <tool2>
    execution:
      type: tools
      tools:
        - name: <tool1>
          input: { ... }
        - name: <tool2>
          input: { "$pipe": "prev" }
  ---
  # <Skill Title>

  <Overview and description of what the skill does, parameters, and usage instructions.>
  ```

- **Declarative Tool Format**: JSON with `"name"`, `"description"`, `"execution"`, and `"input_schema"`.
- **Portable Script Format**: Standard ES module exporting computational functions, parameter parsers, and tool execution handlers.
- **Authoring**: Use `create_directory` before writing new directories, then `write_file`.

---

⬅️️ [Previous Page](/main/about)
