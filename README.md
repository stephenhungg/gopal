# gopal

goblin opal: realtime voice companion for apple vision pro.

## file structure

```text
gopal/
  apps/
    landing-page/
      .gitkeep
    visionos/
      Gopal/
        GopalApp.swift
        ContentView.swift
        GopalAvatarView.swift
        GopalState.swift
    web-demo/
      public/
        index.html
        styles.css
        app.js
      server/
        index.ts
  packages/
    prompts/
      gopal-system.md
    shared/
      avatar-state.schema.json
  docs/
    demo-script.md
    architecture.md
  assets/
    avatar/
    audio/
```

## build order

1. realtime web voice loop
2. animated gopal avatar state
3. vision pro safari test
4. native visionos shell if there is time
