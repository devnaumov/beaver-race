import {
  siClickhouse,
  siDbeaver,
  siMariadb,
  siMongodb,
  siMysql,
  siPostgresql,
  siRedis,
  siSqlite,
  type SimpleIcon,
} from "simple-icons"

export type DriverIconId = "postgresql" | "mysql" | "sqlite" | "oracle" | "mongodb" | "redis" | "clickhouse" | "mariadb"
export type BrandIconId = "dbeaver" | "cloudbeaver"

const simpleIcons: Record<Exclude<DriverIconId, "oracle"> | "dbeaver", SimpleIcon> = {
  postgresql: siPostgresql,
  mysql: siMysql,
  sqlite: siSqlite,
  mongodb: siMongodb,
  redis: siRedis,
  clickhouse: siClickhouse,
  mariadb: siMariadb,
  dbeaver: siDbeaver,
}

const encodeSvg = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

const simpleIconSvg = (icon: SimpleIcon, background = "#fff8e8"): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="${background}"/><path fill="#${icon.hex}" d="${icon.path}"/></svg>`

const oracleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 64 64"><rect width="64" height="64" rx="11" fill="#fff8e8"/><path fill="#e30613" d="M20.2 52.2C8.93 52.2 0 43.056 0 32c0-11.27 9.143-20.2 20.2-20.2h23.6C55.07 11.8 64 20.944 64 32c0 11.27-9.143 20.2-20.2 20.2zm23.176-7.23c7.23 0 13.183-5.953 13.183-13.183s-5.953-13.183-13.183-13.183H20.837c-7.23 0-13.183 5.953-13.183 13.183S13.608 44.97 20.837 44.97z"/></svg>`

export const cloudBeaverLogoUrl = "https://raw.githubusercontent.com/dbeaver/cloudbeaver/devel/webapp/packages/core-app/public/icons/product-logo_light.svg"

export const driverIconUrl = (id: DriverIconId): string =>
  id === "oracle" ? encodeSvg(oracleSvg) : encodeSvg(simpleIconSvg(simpleIcons[id]))

export const brandIconUrl = (id: BrandIconId): string =>
  id === "cloudbeaver" ? cloudBeaverLogoUrl : encodeSvg(simpleIconSvg(simpleIcons.dbeaver, "#f7ead0"))

export const brandFlagUrl = (id: BrandIconId): string => {
  if (id === "cloudbeaver") return cloudBeaverLogoUrl
  const icon = simpleIcons.dbeaver
  return encodeSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150"><rect width="320" height="150" rx="12" fill="#f7ead0"/><path transform="translate(22 21) scale(4.5)" fill="#${icon.hex}" d="${icon.path}"/><text x="145" y="88" fill="#382923" font-family="Arial Black,Arial" font-size="35" font-weight="900">DBEAVER</text></svg>`)
}
