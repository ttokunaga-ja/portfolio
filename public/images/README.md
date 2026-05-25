# Content Images

Store Markdown body images under:

```text
public/images/{collection}/{slug}/
```

`collection` matches the content collection: `research`, `projects`, or `experience`.
`slug` matches the Markdown filename without `.md`.

Examples:

```text
content/ja/experience/proseeds.md
public/images/experience/proseeds/office.webp
```

In Markdown, prefer a relative image path. The build rewrites it to the matching public image path:

```markdown
![Office](office.webp)
![Architecture](diagrams/architecture.webp)
```

Absolute paths are also accepted when they already use the generated location:

```markdown
![Office](/images/experience/proseeds/office.webp)
```
