import { useContext } from 'react'
import { match, matchPath, useLocation } from 'react-router'
import { PATHS } from '../application-paths'
import { ResponsivePersonalSettings } from '../context'

export const useSnPath = () => {
  const settings = useContext(ResponsivePersonalSettings)
  const location = useLocation()
  let matchedPath: match<any> | undefined
  const snPath = (Object.values(PATHS).find((pathConfig) => {
    const currentMatch = matchPath(location.pathname, { path: pathConfig.appPath })
    if (currentMatch?.isExact) {
      matchedPath = currentMatch
    }
    return currentMatch?.isExact
  }) as any)?.snPath

  if (matchedPath?.path === PATHS.custom.appPath) {
    const customDrawer = settings.drawer.items.find((item) => item.settings?.appPath === matchedPath?.params.path)
    return customDrawer?.settings.root || settings.content.root
  }

  return snPath
}
