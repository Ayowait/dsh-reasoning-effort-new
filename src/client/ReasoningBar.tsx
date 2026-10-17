import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client'

export interface ReasoningBarInjected {
  /** Shared model directory store owned by the official model selector. */
  directory: SnapshotStore<ModelDirectoryState>
  /** Refresh the model catalog and current selection. */
  load: () => void
  /** Submit the complete route plus the newly selected effort. */
  select: (selection: ModelSelection) => Promise<void>
}

export type ReasoningBarProps = PropsRuntime<'conversation.input.model'>
  & InjectFace<ReasoningBarInjected>
  & PropsLocale<'reasoning-effort'>

type CatalogModel = ModelDirectoryState['groups'][number]['models'][number]
type CatalogGroup = ModelDirectoryState['groups'][number]
type Effort = NonNullable<CatalogModel['reasoning']>['efforts'][number]

function groupLabel(group: CatalogGroup): string {
  const namedGroup = group as CatalogGroup & { label?: string; name?: string; title?: string }
  return namedGroup.name ?? namedGroup.label ?? namedGroup.title ?? group.id
}

function modelFor(state: ModelDirectoryState) {
  const current = state.current
  if (current === null) return undefined
  for (const group of state.groups) {
    if (group.id !== current.provider) continue
    const model = group.models.find(candidate => candidate.id === current.model)
    if (model !== undefined) return { current, group, model }
  }
  return undefined
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

interface EffortSliderProps {
  efforts: readonly Effort[]
  index: number
  disabled: boolean
  onChange: (index: number) => void
  onCommit: (index: number) => void
}

interface PendingEffort {
  modelKey: string
  effortId: string
  index: number
}

interface PendingModel {
  group: CatalogGroup
  model: CatalogModel
  effortId: string | undefined
}

/** A Codex-style thick, pointer-draggable discrete slider. */
function EffortSlider({ efforts, index, disabled, onChange, onCommit }: EffortSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [dragging, setDragging] = useState(false)
  const lastIndex = Math.max(1, efforts.length - 1)
  const shownIndex = clamp(Math.round(index), 0, lastIndex)
  const positionForIndex = (value: number): string => {
    const ratio = efforts.length <= 1 ? 0 : clamp(value / lastIndex, 0, 1)
    const percent = ratio * 100
    const offset = 15 - 30 * ratio
    const sign = offset < 0 ? '- ' : '+ '
    return 'calc(' + percent + '% ' + sign + Math.abs(offset) + 'px)'
  }

  const positionFor = (clientX: number): number => {
    const track = trackRef.current
    if (track === null || efforts.length <= 1) return 0
    const rect = track.getBoundingClientRect()
    const inset = 30
    const ratio = (clientX - rect.left - inset) / Math.max(1, rect.width - inset * 2)
    return clamp(ratio * lastIndex, 0, lastIndex)
  }

  const snap = (position: number): number => clamp(Math.round(position), 0, lastIndex)

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (disabled) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    draggingRef.current = true
    setDragging(true)
    onChange(snap(positionFor(event.clientX)))
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!draggingRef.current) return
    onChange(snap(positionFor(event.clientX)))
  }

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!draggingRef.current) return
    const next = snap(positionFor(event.clientX))
    draggingRef.current = false
    setDragging(false)
    onChange(next)
    onCommit(next)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (disabled) return
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp'
      ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? -1
        : 0
    if (direction === 0) return
    event.preventDefault()
    const next = clamp(shownIndex + direction, 0, lastIndex)
    onChange(next)
    onCommit(next)
  }

  return (
    <div
      ref={trackRef}
      className="dsh-reasoning-effort__slider"
      data-dragging={dragging}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="推理等级"
      aria-valuemin={0}
      aria-valuemax={lastIndex}
      aria-valuenow={shownIndex}
      aria-valuetext={efforts[shownIndex]?.name ?? ''}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      onKeyDown={onKeyDown}
    >
      <div className="dsh-reasoning-effort__range">
        <span className="dsh-reasoning-effort__rail" />
        <span
          className="dsh-reasoning-effort__fill"
          style={{ width: positionForIndex(shownIndex) }}
        />
        {efforts.map((effort, effortIndex) => (
          <span
            key={effort.id}
            className="dsh-reasoning-effort__tick"
            data-active={effortIndex <= shownIndex}
            data-major={effortIndex === shownIndex}
            style={{ left: positionForIndex(effortIndex) }}
            title={effort.description}
          />
        ))}
        <span
          className="dsh-reasoning-effort__thumb"
          style={{ left: positionForIndex(shownIndex) }}
        />
      </div>
    </div>
  )
}

function BoltIcon() {
  return (
    <svg className="dsh-reasoning-model__bolt" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.2 2.7 5.5 13h5.1l-.8 8.3L18.5 11h-5.1l-.2-8.3Z" fill="currentColor" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className="dsh-reasoning-model__chevron" data-open={open} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 9 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Model seat replacement: model name, Chinese effort label, and the thick Codex-style slider. */
export function ReasoningBar({ locked, directory, load, select, t }: ReasoningBarProps) {
  const state = useSyncExternalStore(
    listener => directory.subscribe(listener),
    () => directory.getSnapshot(),
  )
  const [open, setOpen] = useState(false)
  const [pendingEffort, setPendingEffort] = useState<PendingEffort | null>(null)
  const [pendingModel, setPendingModel] = useState<PendingModel | null>(null)
  const [committing, setCommitting] = useState(false)
  const [modelsScrolling, setModelsScrolling] = useState(false)
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(() => new Set())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const modelScrollTimerRef = useRef<number | null>(null)
  const [popoverHeight, setPopoverHeight] = useState(0)

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => () => {
    if (modelScrollTimerRef.current !== null) window.clearTimeout(modelScrollTimerRef.current)
  }, [])

  // Measure the popover so the model panel can sit above it instead of covering it.
  useEffect(() => {
    if (!open) {
      setPopoverHeight(0)
      return
    }
    const node = popoverRef.current
    if (node === null) return
    const measure = () => setPopoverHeight(node.offsetHeight)
    measure()
    if (typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [open])

  const currentModel = useMemo(() => modelFor(state), [state])
  const visibleGroup = pendingModel?.group ?? currentModel?.group
  const visibleModel = pendingModel?.model ?? currentModel?.model
  const reasoning = visibleModel?.reasoning
  const efforts = reasoning?.efforts ?? []
  const fallbackEffort = reasoning?.defaultEffort ?? efforts[Math.floor(efforts.length / 2)]?.id
  const selectedId = pendingModel === null
    ? state.current?.reasoningEffort ?? fallbackEffort
    : pendingModel.effortId ?? fallbackEffort
  const selectedIndex = Math.max(0, efforts.findIndex(effort => effort.id === selectedId))
  const selected = efforts[selectedIndex]
  const visibleModelKey = visibleModel === undefined || visibleGroup === undefined
    ? undefined
    : visibleGroup.id + ':' + visibleModel.id + ':' + efforts.map(effort => effort.id).join(',')
  const hasPendingEffort = pendingEffort !== null
    && pendingEffort.modelKey === visibleModelKey
    && pendingEffort.effortId !== selected?.id
    && state.error === null
  const displayIndex = hasPendingEffort
    ? clamp(pendingEffort.index, 0, Math.max(0, efforts.length - 1))
    : selectedIndex
  const displaySelected = efforts[displayIndex]
  const isMax = efforts.length > 1 && displayIndex === efforts.length - 1
  const busy = locked === true || committing || state.status === 'selecting'
  const modelLabel = visibleModel?.name ?? state.current?.model ?? t('chooseModel')

  const activeProvider = pendingModel?.group.id ?? state.current?.provider
  const activeModelId = pendingModel?.model.id ?? state.current?.model

  const closePicker = useCallback((): void => {
    if (!open || committing) return
    const staged = pendingModel
    setOpen(false)
    setPickerOpen(false)
    setQuery('')
    setPendingEffort(null)

    if (staged === null || state.current === null) {
      setPendingModel(null)
      return
    }

    const selection: ModelSelection = {
      provider: staged.group.id,
      model: staged.model.id,
    }
    if (staged.effortId !== undefined) selection.reasoningEffort = staged.effortId

    setCommitting(true)
    void select(selection)
      .catch(() => { /* shared store owns the error */ })
      .finally(() => {
        setCommitting(false)
        setPendingModel(null)
      })
  }, [committing, open, pendingModel, select, state.current])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: globalThis.MouseEvent): void => {
      const target = event.target
      if (target instanceof Node && rootRef.current?.contains(target)) return
      if (pickerOpen) {
        setPickerOpen(false)
        return
      }
      closePicker()
    }
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [closePicker, open])

  useEffect(() => {
    if (pendingEffort === null) return
    if (
      pendingEffort.modelKey !== visibleModelKey
      || pendingEffort.effortId === selected?.id
      || state.error !== null
    ) {
      setPendingEffort(null)
    }
  }, [pendingEffort, selected?.id, state.error, visibleModelKey])

  const chooseModel = (provider: string, modelId: string): void => {
    const targetGroup = state.groups.find(group => group.id === provider)
    const target = targetGroup?.models.find(model => model.id === modelId)
    if (target === undefined || targetGroup === undefined || state.current === null) return
    if (pendingModel?.group.id === provider && pendingModel.model.id === modelId) return
    if (pendingModel === null && state.current.provider === provider && state.current.model === modelId) return

    const targetEfforts = target.reasoning?.efforts ?? []
    const currentEffort = pendingModel?.effortId ?? state.current.reasoningEffort
    const effort = currentEffort !== undefined && targetEfforts.some(item => item.id === currentEffort)
      ? currentEffort
      : target.reasoning?.defaultEffort ?? targetEfforts[Math.floor(targetEfforts.length / 2)]?.id
    setPendingEffort(null)
    setPendingModel({ group: targetGroup, model: target, effortId: effort })
  }

  const toggleProvider = (provider: string): void => {
    setExpandedProviders(previous => {
      const next = new Set(previous)
      if (next.has(provider)) next.delete(provider)
      else next.add(provider)
      return next
    })
  }

  const normalizedQuery = query.trim().toLowerCase()
  const pickerGroups = useMemo(() => {
    if (normalizedQuery === '') return state.groups
    return state.groups
      .map(group => {
        const label = groupLabel(group).toLowerCase()
        const models = label.includes(normalizedQuery)
          ? group.models
          : group.models.filter(model => (model.name + ' ' + model.id + ' ' + (model.description ?? '')).toLowerCase().includes(normalizedQuery))
        return { ...group, models }
      })
      .filter(group => group.models.length > 0)
  }, [normalizedQuery, state.groups])
  const [pickedProvider, setPickedProvider] = useState<string | null>(null)
  const [paneOpen, setPaneOpen] = useState(false)
  const selectedProvider = useMemo(() => {
    if (pickerGroups.length === 0) return undefined
    if (pickedProvider !== null) {
      const found = pickerGroups.find(group => group.id === pickedProvider)
      if (found !== undefined) return found
    }
    const currentProvider = state.current === null ? undefined : state.current.provider
    if (currentProvider !== undefined) {
      const found = pickerGroups.find(group => group.id === currentProvider)
      if (found !== undefined) return found
    }
    return pickerGroups[0]
  }, [pickerGroups, pickedProvider, state.current])
  const paneGroups = useMemo(() => {
    if (normalizedQuery !== '') return pickerGroups
    return selectedProvider === undefined ? [] : [selectedProvider]
  }, [normalizedQuery, pickerGroups, selectedProvider])
  const showPane = paneOpen || normalizedQuery !== ''

  useEffect(() => {
    if (!pickerOpen) setPaneOpen(false)
  }, [pickerOpen])

  const openPicker = (): void => {
    if (busy) return
    if (pickerOpen) {
      setPickerOpen(false)
      setQuery('')
      return
    }
    load()
    setQuery('')
    const active = pendingModel?.group.id ?? state.current?.provider
    if (active !== undefined) {
      setExpandedProviders(previous => (previous.has(active) ? previous : new Set(previous).add(active)))
    }
    setPaneOpen(false)
    setPickerOpen(true)
  }

  useEffect(() => {
    if (!pickerOpen) return
    const timer = window.setTimeout(() => { searchRef.current?.focus() }, 30)
    return () => window.clearTimeout(timer)
  }, [pickerOpen])

  const commitEffort = (index: number): void => {
    const effort = efforts[index]
    if (effort === undefined || effort.id === selected?.id) return
    if (pendingModel !== null) {
      setPendingModel(previous => previous === null ? previous : { ...previous, effortId: effort.id })
      setPendingEffort(null)
      return
    }
    if (state.current === null) return
    void select({
      provider: state.current.provider,
      model: state.current.model,
      reasoningEffort: effort.id,
    }).catch(() => { /* shared store owns the error */ })
  }

  const previewEffort = (index: number): void => {
    const effort = efforts[index]
    if (effort === undefined || visibleModelKey === undefined) return
    if (pendingModel !== null) {
      setPendingModel(previous => previous === null ? previous : { ...previous, effortId: effort.id })
      setPendingEffort(null)
      return
    }
    setPendingEffort({ modelKey: visibleModelKey, effortId: effort.id, index })
  }

  const markModelsScrolling = (): void => {
    setModelsScrolling(true)
    if (modelScrollTimerRef.current !== null) window.clearTimeout(modelScrollTimerRef.current)
    modelScrollTimerRef.current = window.setTimeout(() => {
      modelScrollTimerRef.current = null
      setModelsScrolling(false)
    }, 100)
  }

  const toggle = (): void => {
    if (busy) return
    if (open) {
      closePicker()
      return
    }
    load()
    setOpen(true)
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    closePicker()
  }

  return (
    <div
      ref={rootRef}
      className="dsh-reasoning-model"
      data-busy={busy}
      data-max={isMax}
      data-open={open}
      onKeyDown={onKeyDown}
    >
      <button
        className="dsh-reasoning-model__trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={reasoning === undefined ? modelLabel : modelLabel + '，' + t('label') + ' ' + (displaySelected?.name ?? t('unsupported'))}
        disabled={busy}
        onClick={toggle}
      >
        <BoltIcon />
        <span className="dsh-reasoning-model__model" title={modelLabel}>{modelLabel}</span>
        {reasoning !== undefined && (
          <span className="dsh-reasoning-model__effort" title={t('label') + ' ' + (displaySelected?.name ?? t('unsupported'))}>
            <span className="dsh-reasoning-model__effort-label">{t('label')}</span>
            <span>{displaySelected?.name ?? t('unsupported')}</span>
          </span>
        )}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="dsh-reasoning-model__popover"
          data-picker={pickerOpen ? 'true' : 'false'}
          role="dialog"
          aria-label={t('menu')}
        >
          <button
            className="dsh-reasoning-model__model-head"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            disabled={busy}
            title={t('chooseModel')}
            onClick={openPicker}
          >
            <span className="dsh-reasoning-model__section-label">{t('model')}</span>
            <span className="dsh-reasoning-model__model-head-value" title={modelLabel}>{modelLabel}</span>
            <span className="dsh-reasoning-model__model-head-chevron" aria-hidden="true">▾</span>
          </button>

          {reasoning !== undefined && (
            <section className="dsh-reasoning-effort" data-max={isMax}>
              <div className="dsh-reasoning-effort__header">
                <span>{t('label')}</span>
                <strong>{displaySelected?.name ?? t('unsupported')}</strong>
              </div>
              {efforts.length > 1 ? (
                <>
                  <div className="dsh-reasoning-effort__scale" aria-hidden="true">
                    <span>{t('efficient')}</span>
                    <span>{t('capable')}</span>
                  </div>
                  <EffortSlider
                    efforts={efforts}
                    index={displayIndex}
                    disabled={busy}
                    onChange={previewEffort}
                    onCommit={commitEffort}
                  />
                </>
              ) : (
                <div className="dsh-reasoning-effort__single">{t('supported')}: {displaySelected?.name ?? t('unsupported')}</div>
              )}
            </section>
          )}

          {state.error !== null && (
            <div className="dsh-reasoning-model__error" role="status">{t('error', { message: state.error })}</div>
          )}
        </div>
      )}

      {open && pickerOpen && (
        <div
          className="dsh-reasoning-model__picker"
          data-open={showPane ? 'true' : 'false'}
          role="dialog"
          aria-label={t('chooseModel')}
          style={{
            bottom: `calc(100% + ${popoverHeight > 0 ? popoverHeight + 9 : 9}px)`,
            maxHeight: popoverHeight > 0 ? `min(640px, calc(100vh - ${popoverHeight + 130}px))` : undefined,
          }}
        >
          <div className="dsh-reasoning-model__picker-head">
            <span className="dsh-reasoning-model__picker-title">{t('chooseModel')}</span>
          </div>

          <input
            ref={searchRef}
            className="dsh-reasoning-model__search"
            type="search"
            value={query}
            placeholder={t('search')}
            aria-label={t('search')}
            onChange={event => {
              const value = event.target.value
              setQuery(value)
              if (value.trim() !== '') setPaneOpen(true)
            }}
          />

          <div className="dsh-reasoning-model__split" data-open={showPane ? 'true' : 'false'}>
            <div className="dsh-reasoning-model__sources" role="tablist" aria-label={t('model')}>
              {pickerGroups.map(group => {
                const name = groupLabel(group)
                const active = selectedProvider !== undefined && selectedProvider.id === group.id
                const inUse = state.current !== null && state.current.provider === group.id
                return (
                  <button
                    key={group.id}
                    className="dsh-reasoning-model__source"
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-active={active ? 'true' : 'false'}
                    disabled={busy}
                    title={name}
                    onClick={() => {
                      if (active && showPane) {
                        setPaneOpen(false)
                        return
                      }
                      setPickedProvider(group.id)
                      setPaneOpen(true)
                    }}
                  >
                    <span className="dsh-reasoning-model__source-name">{name}</span>
                    <span className="dsh-reasoning-model__source-meta">
                      {inUse ? t('current') : t('providerCount', { count: group.models.length })}
                    </span>
                  </button>
                )
              })}
            </div>

            <div
              className="dsh-reasoning-model__models"
              data-scrolling={modelsScrolling}
              aria-label={t('chooseModel')}
              onWheel={markModelsScrolling}
              onScroll={markModelsScrolling}
            >
              {state.status === 'loading' && <div className="dsh-reasoning-model__status">{t('loading')}</div>}
              {state.status !== 'loading' && paneGroups.length === 0 && (
                <div className="dsh-reasoning-model__status">{t('noMatch')}</div>
              )}
              {paneGroups.map(group => {
                const name = groupLabel(group)
                return (
                  <section key={group.id} className="dsh-reasoning-model__pane-group">
                    <div className="dsh-reasoning-model__pane-group-head">{name}</div>
                    {group.models.map(model => {
                      const active = activeProvider === group.id && activeModelId === model.id
                      return (
                        <button
                          key={group.id + ':' + model.id}
                          className="dsh-reasoning-model__option"
                          type="button"
                          role="option"
                          aria-selected={active}
                          disabled={busy}
                          onClick={() => {
                            chooseModel(group.id, model.id)
                            setPickerOpen(false)
                            setQuery('')
                          }}
                        >
                          <span className="dsh-reasoning-model__option-copy">
                            <span className="dsh-reasoning-model__option-name">{model.name}</span>
                            {model.description !== undefined && (
                              <span className="dsh-reasoning-model__option-description">{model.description}</span>
                            )}
                          </span>
                          {active && <span className="dsh-reasoning-model__option-check" aria-hidden="true">✓</span>}
                        </button>
                      )
                    })}
                  </section>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
