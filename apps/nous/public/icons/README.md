# Branded Tool Icons

Place your custom branded SVG or PNG icon files here.

## Folder Structure

```
icons/
├── norx/           # NorX axis tool icons (Blue #007FFF)
│   ├── dashboard.svg
│   └── norlead.svg
├── norv/           # NorV axis tool icons (Cyan #00A6FB)
│   ├── call-workspace.svg
│   ├── email-workspace.svg
│   ├── norcrm.svg
│   ├── email-writer.svg
│   ├── letter-writer.svg
│   ├── sms-writer.svg
│   └── templates.svg
├── norw/           # NorW axis tool icons (Green #009E60)
│   ├── practice-room.svg
│   ├── agent-lab.svg
│   ├── call-analyzer.svg
│   ├── script-library.svg
│   └── scenario-bank.svg
└── system/         # System icons (Gray #8E9AAF)
    ├── ai-agents.svg
    ├── users.svg
    ├── logs.svg
    ├── settings.svg
    └── analytics.svg
```

## Naming Convention

- File names should match the navigation `key` field in `src/config/navigation.ts`
- Use SVG for best quality, PNG as fallback
- Recommended size: 24x24px viewBox for SVG, 48x48px for PNG
- Icons should be monochrome (single color) — the axis color is applied via CSS

## How It Works

When a matching icon file is found at `/icons/{section}/{key}.svg` (or `.png`),
it will be displayed next to the tool name in the sidebar, replacing the default Lucide icon.
The icon inherits the axis color automatically.
