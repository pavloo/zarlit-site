# zarlit

Матеріали до уроків зарубіжної літератури для 5–11 класів — [zarlit.com.ua](https://zarlit.com.ua)

Architecture, content model, and roadmap live in [SPEC.md](SPEC.md).

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build to dist/
npm run lint
```

## Status

Milestone 1 of 5 — scaffold, routing, layout, pages against hardcoded sample data
(`src/data/lessons.ts`). Milestone 2 replaces that module with a build step that reads
Markdown from `content/lessons/`. See SPEC.md §11.
