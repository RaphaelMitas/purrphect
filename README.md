<img src="assets/icon.svg" width="64" height="64" alt="">

# Purrphect

Small, cute apps, all in one place. Built with Expo, open source under MIT.

| App                         | Platforms             | Site                                             |
| --------------------------- | --------------------- | ------------------------------------------------ |
| [Dart Purrphect](apps/dart) | iPad, iPhone, Android | [dart.purrphect.com](https://dart.purrphect.com) |

## Layout

- `apps/<name>`: an Expo app, `apps/<name>-web` its Next.js site
- `packages/ui`: shared components, theme and the cat
- `tooling`: CI actions, store screenshot rigs, fastlane

## Develop

```bash
pnpm install
pnpm --filter @purrphect/dart ios      # or android; needs a dev build, not Expo Go
pnpm typecheck && pnpm check && pnpm test
```
