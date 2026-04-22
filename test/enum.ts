import { Enum } from 'enum-plus'

export interface i18nCfg {
  path: string
  args?: object
}
export function $td (path: string, args?: object): i18nCfg {
  return { path, args }
}

export function parseI18N (cfg: i18nCfg): string {
  return cfg.path
}

Enum.localize = (cfg: any) => {
  return parseI18N(cfg)
}

declare module 'enum-plus/extension' {
  interface EnumLocaleExtends {
    EnumItemLabel: string | i18nCfg;
  }
}
