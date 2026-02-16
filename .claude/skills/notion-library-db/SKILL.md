---
name: notion-library-db
description: Add entries to the user's Notion Library DB for tracking books, articles, software, podcasts, films, TV series, and games. Use this skill when the user wants to save, add, or bookmark a resource/link to their library, or when they mention adding something to their reading/watching list. Triggers on phrases like "add to library", "save this", "bookmark", "add to my list", "save to Notion".
---

# Notion Library DB Entry Creator

Add entries to the Library DB using the Notion MCP (if no available, request it to the user).

## Database Configuration

- **Database ID**: `32c2957bebf4494ba9b5c002a5d201d1`

## Required Properties

When adding an entry, always set these properties:

### Name (title)
The title/name of the resource being added.

### Type (select)
Valid options (exact match required):
- `Software`
- `Book`
- `Article`
- `TV Series`
- `Film`
- `Podcast`
- `Game`

### Area (select)
Valid options (exact match required):
- `Career`
- `Health`
- `Finance`
- `Learning`
- `Home`
- `Side Projects`
- `Hobbies`

### Link (url)
The source URL of the resource.

### Author (rich_text)
The author/creator name. Only include if known or provided.

## MCP Tool Usage

Use the Notion MCP `notion_create_page` tool with this structure:

```json
{
  "parent_id": "32c2957bebf4494ba9b5c002a5d201d1",
  "parent_type": "database_id",
  "properties": {
    "Name": {
      "title": [{ "text": { "content": "<entry name>" } }]
    },
    "Type": {
      "select": { "name": "<type value>" }
    },
    "Area": {
      "select": { "name": "<area value>" }
    },
    "Link": {
      "url": "<resource url>"
    },
    "Author": {
      "rich_text": [{ "text": { "content": "<author name>" } }]
    }
  }
}
```

## Workflow

1. Extract from user input: name, link, type, area, and author (if available)
2. If type or area is ambiguous, infer from context or ask the user
3. Call `notion_create_page` with the properties above
4. Confirm the entry was added successfully

## Adding Multiple Entries

When adding multiple entries, call `notion_create_page` for each entry separately.

## Type Inference Guidelines

When type is not specified, infer from context:
- URLs containing github.com, npm, documentation → `Software`
- URLs containing medium.com, dev.to, blog posts → `Article`
- YouTube tutorials, educational content → `Article` or `Film` based on format
- Netflix, streaming services → `TV Series` or `Film`
- Spotify, Apple Podcasts → `Podcast`
- Steam, gaming platforms → `Game`

## Area Inference Guidelines

When area is not specified, infer from content:
- Programming, coding, interviews, work → `Career`
- Fitness, nutrition, medical → `Health`
- Investing, budgeting, money → `Finance`
- Courses, tutorials, skills → `Learning`
- Household, organization → `Home`
- Personal projects, building things → `Side Projects`
- Entertainment, games, fun → `Hobbies`