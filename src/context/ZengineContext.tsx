import React, { createContext, useEffect, useState, useCallback, useMemo, FunctionComponent, Context } from 'react'
import { znContext } from '@zenginehq/zengine-sdk'
import { ZengineContextData, ZengineField, ZengineForm } from '@zenginehq/zengine-sdk/lib/zengine.types'

type ZengineContext = {
  context?: ZengineContextData
  helpers?: {
    getFieldLabel: (id: any) => string
    getFormName: (id: any) => string
  }
  /**
   * Triggers a refetching of context, which, when fulfilled,
   * will cause the ZnContextProvider and children to re-render
   * with the updated context data and helpers
   */
  triggerContextRefresh?: () => Promise<void>
}

export const ZengineContext: Context<ZengineContext> = createContext({})

type ZnContextProviderProps = {
  loader: boolean,
  LoadingStateComponent: React.Component | string
}

export const ZnContextProvider: FunctionComponent<ZnContextProviderProps> = ({ children, loader, LoadingStateComponent }) => {
  const [context, setContext] = useState<ZengineContextData>()

  const fieldMap: { [key: string]: ZengineField } = useMemo(() => {
    if (!context || !context.workspace || !Array.isArray(context.workspace.forms)) return {}

    return context.workspace.forms.reduce((map, form) => ({
      ...map,
      ...form.fields.reduce((fMap, field) => ({ ...fMap, [field.id]: field }))
    }), {})
  }, [context])

  /**
   * @type {{ [key: string]: import('@zenginehq/zengine-sdk/lib/zengine.types').ZengineForm }}
   */
  const formMap: { [key: string]: ZengineForm } = useMemo(() => {
    if (!context || !context.workspace || !Array.isArray(context.workspace.forms)) return {}

    return context.workspace.forms.reduce((map, form) => ({ ...map, [form.id]: form }), {})
  }, [context])

  const getFieldLabel = useCallback(id => fieldMap[id] ? fieldMap[id].label : '', [context])
  const getFormName = useCallback(id => formMap[id] ? formMap[id].name : '', [context])

  const helpers = {
    getFieldLabel,
    getFormName
  }

  const triggerContextRefresh = async () => {
    const freshContext = await znContext()
      .catch(err => {
        console.error('Unable to load context: ', err)

        return undefined // thanks TypeScript...
      })

    setContext(freshContext)
  }

  useEffect(() => {
    triggerContextRefresh()
  }, [])

  return <ZengineContext.Provider value={{ context, helpers, triggerContextRefresh }}>
    {loader
      ? context
        ? children
        : LoadingStateComponent || <h3 className='text-blue-500 text-center'>Loading Zengine Context...</h3>
      : children}
  </ZengineContext.Provider>
}
