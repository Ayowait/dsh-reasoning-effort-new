window.__ModuleLoader__.load({
	id: "dsh-reasoning-effort-new",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/ReasoningBar.tsx
		function groupLabel(group) {
			const namedGroup = group;
			return namedGroup.name ?? namedGroup.label ?? namedGroup.title ?? group.id;
		}
		function modelFor(state) {
			const current = state.current;
			if (current === null) return void 0;
			for (const group of state.groups) {
				if (group.id !== current.provider) continue;
				const model = group.models.find((candidate) => candidate.id === current.model);
				if (model !== void 0) return {
					current,
					group,
					model
				};
			}
		}
		function clamp(value, min, max) {
			return Math.max(min, Math.min(max, value));
		}
		/** A Codex-style thick, pointer-draggable discrete slider. */
		function EffortSlider({ efforts, index, disabled, onChange, onCommit }) {
			const trackRef = (0, react.useRef)(null);
			const draggingRef = (0, react.useRef)(false);
			const [dragging, setDragging] = (0, react.useState)(false);
			const lastIndex = Math.max(1, efforts.length - 1);
			const shownIndex = clamp(Math.round(index), 0, lastIndex);
			const positionForIndex = (value) => {
				const ratio = efforts.length <= 1 ? 0 : clamp(value / lastIndex, 0, 1);
				const percent = ratio * 100;
				const offset = 15 - 30 * ratio;
				const sign = offset < 0 ? "- " : "+ ";
				return "calc(" + percent + "% " + sign + Math.abs(offset) + "px)";
			};
			const positionFor = (clientX) => {
				const track = trackRef.current;
				if (track === null || efforts.length <= 1) return 0;
				const rect = track.getBoundingClientRect();
				return clamp((clientX - rect.left - 30) / Math.max(1, rect.width - 60) * lastIndex, 0, lastIndex);
			};
			const snap = (position) => clamp(Math.round(position), 0, lastIndex);
			const onPointerDown = (event) => {
				if (disabled) return;
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				draggingRef.current = true;
				setDragging(true);
				onChange(snap(positionFor(event.clientX)));
			};
			const onPointerMove = (event) => {
				if (!draggingRef.current) return;
				onChange(snap(positionFor(event.clientX)));
			};
			const finishPointer = (event) => {
				if (!draggingRef.current) return;
				const next = snap(positionFor(event.clientX));
				draggingRef.current = false;
				setDragging(false);
				onChange(next);
				onCommit(next);
				if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
			};
			const onKeyDown = (event) => {
				if (disabled) return;
				const direction = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
				if (direction === 0) return;
				event.preventDefault();
				const next = clamp(shownIndex + direction, 0, lastIndex);
				onChange(next);
				onCommit(next);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: trackRef,
				className: "dsh-reasoning-effort__slider",
				"data-dragging": dragging,
				role: "slider",
				tabIndex: disabled ? -1 : 0,
				"aria-label": "推理等级",
				"aria-valuemin": 0,
				"aria-valuemax": lastIndex,
				"aria-valuenow": shownIndex,
				"aria-valuetext": efforts[shownIndex]?.name ?? "",
				onPointerDown,
				onPointerMove,
				onPointerUp: finishPointer,
				onPointerCancel: finishPointer,
				onKeyDown,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-reasoning-effort__range",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsh-reasoning-effort__rail" }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-reasoning-effort__fill",
							style: { width: positionForIndex(shownIndex) }
						}),
						efforts.map((effort, effortIndex) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-reasoning-effort__tick",
							"data-active": effortIndex <= shownIndex,
							"data-major": effortIndex === shownIndex,
							style: { left: positionForIndex(effortIndex) },
							title: effort.description
						}, effort.id)),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-reasoning-effort__thumb",
							style: { left: positionForIndex(shownIndex) }
						})
					]
				})
			});
		}
		function BoltIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "dsh-reasoning-model__bolt",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M13.2 2.7 5.5 13h5.1l-.8 8.3L18.5 11h-5.1l-.2-8.3Z",
					fill: "currentColor"
				})
			});
		}
		function ChevronIcon({ open }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "dsh-reasoning-model__chevron",
				"data-open": open,
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "m7 9 5 5 5-5",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "2.2",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			});
		}
		/** Model seat replacement: model name, Chinese effort label, and the thick Codex-style slider. */
		function ReasoningBar({ locked, directory, load, select, t }) {
			const state = (0, react.useSyncExternalStore)((listener) => directory.subscribe(listener), () => directory.getSnapshot());
			const [open, setOpen] = (0, react.useState)(false);
			const [pendingEffort, setPendingEffort] = (0, react.useState)(null);
			const [pendingModel, setPendingModel] = (0, react.useState)(null);
			const [committing, setCommitting] = (0, react.useState)(false);
			const [modelsScrolling, setModelsScrolling] = (0, react.useState)(false);
			const [expandedProviders, setExpandedProviders] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [pickerOpen, setPickerOpen] = (0, react.useState)(false);
			const [query, setQuery] = (0, react.useState)("");
   const popoverNode = (0, react.useRef)(null);
   const [popoverHeight, setPopoverHeight] = (0, react.useState)(0);
   (0, react.useEffect)(() => {
    if (!open) {
     setPopoverHeight(0);
     return void 0;
    }
    const node = popoverNode.current;
    if (!node) return void 0;
    const measure = () => setPopoverHeight(node.offsetHeight);
    measure();
    if (typeof ResizeObserver !== "function") return void 0;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
   }, [open]);
			const searchRef = (0, react.useRef)(null);
			const rootRef = (0, react.useRef)(null);
			const modelScrollTimerRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			(0, react.useEffect)(() => () => {
				if (modelScrollTimerRef.current !== null) window.clearTimeout(modelScrollTimerRef.current);
			}, []);
			const currentModel = (0, react.useMemo)(() => modelFor(state), [state]);
			const visibleGroup = pendingModel?.group ?? currentModel?.group;
			const visibleModel = pendingModel?.model ?? currentModel?.model;
			const reasoning = visibleModel?.reasoning;
			const EFFORT_FIVE = [{ id: "off", name: "Off", description: "" }, { id: "low", name: "Low", description: "" }, { id: "medium", name: "Medium", description: "" }, { id: "xhigh", name: "XHigh", description: "" }, { id: "max", name: "Max", description: "" }]; const efforts = reasoning ? EFFORT_FIVE : [];
			const fallbackEffort = reasoning?.defaultEffort ?? efforts[Math.floor(efforts.length / 2)]?.id;
			const selectedId = pendingModel === null ? state.current?.reasoningEffort ?? fallbackEffort : pendingModel.effortId ?? fallbackEffort;
			const selectedIndex = Math.max(0, efforts.findIndex((effort) => effort.id === selectedId));
			const selected = efforts[selectedIndex];
			const visibleModelKey = visibleModel === void 0 || visibleGroup === void 0 ? void 0 : visibleGroup.id + ":" + visibleModel.id + ":" + efforts.map((effort) => effort.id).join(",");
			const displayIndex = pendingEffort !== null && pendingEffort.modelKey === visibleModelKey && pendingEffort.effortId !== selected?.id && state.error === null ? clamp(pendingEffort.index, 0, Math.max(0, efforts.length - 1)) : selectedIndex;
			const displaySelected = efforts[displayIndex];
			const isMax = efforts.length > 1 && displayIndex === efforts.length - 1;
			const busy = locked === true || committing || state.status === "selecting";
			const modelLabel = visibleModel?.name ?? state.current?.model ?? t("chooseModel");
			const activeProvider = pendingModel?.group.id ?? state.current?.provider;
			const activeModelId = pendingModel?.model.id ?? state.current?.model;
			const closePicker = (0, react.useCallback)(() => {
				if (!open || committing) return;
				const staged = pendingModel;
				setOpen(false);
				setPickerOpen(false);
				setQuery("");
				setPendingEffort(null);
				if (staged === null || state.current === null) {
					setPendingModel(null);
					return;
				}
				const selection = {
					provider: staged.group.id,
					model: staged.model.id
				};
				if (staged.effortId !== void 0) selection.reasoningEffort = staged.effortId;
				setCommitting(true);
				select(selection).catch(() => {}).finally(() => {
					setCommitting(false);
					setPendingModel(null);
				});
			}, [
				committing,
				open,
				pendingModel,
				select,
				state.current
			]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const closeOutside = (event) => {
					const target = event.target;
					if (target instanceof Node && rootRef.current?.contains(target)) return;
					if (pickerOpen) {
					setPickerOpen(false);
					return;
				}
				closePicker();
				};
				document.addEventListener("mousedown", closeOutside);
				return () => document.removeEventListener("mousedown", closeOutside);
			}, [closePicker, open]);
			(0, react.useEffect)(() => {
				if (pendingEffort === null) return;
				if (pendingEffort.modelKey !== visibleModelKey || pendingEffort.effortId === selected?.id || state.error !== null) setPendingEffort(null);
			}, [
				pendingEffort,
				selected?.id,
				state.error,
				visibleModelKey
			]);
			const chooseModel = (provider, modelId) => {
				const targetGroup = state.groups.find((group) => group.id === provider);
				const target = targetGroup?.models.find((model) => model.id === modelId);
				if (target === void 0 || targetGroup === void 0 || state.current === null) return;
				if (pendingModel?.group.id === provider && pendingModel.model.id === modelId) return;
				if (pendingModel === null && state.current.provider === provider && state.current.model === modelId) return;
				const targetEfforts = target.reasoning?.efforts ?? [];
				const currentEffort = pendingModel?.effortId ?? state.current.reasoningEffort;
				const effort = currentEffort !== void 0 && targetEfforts.some((item) => item.id === currentEffort) ? currentEffort : target.reasoning?.defaultEffort ?? targetEfforts[Math.floor(targetEfforts.length / 2)]?.id;
				setPendingEffort(null);
				setPendingModel({
					group: targetGroup,
					model: target,
					effortId: effort
				});
			};
			const toggleProvider = (provider) => {
				setExpandedProviders((previous) => {
					const next = new Set(previous);
					if (next.has(provider)) next.delete(provider);
					else next.add(provider);
					return next;
				});
			};
			const normalizedQuery = query.trim().toLowerCase();
			const pickerGroups = (0, react.useMemo)(() => {
				if (normalizedQuery === "") return state.groups;
				return state.groups.map((group) => {
					const label = groupLabel(group).toLowerCase();
					const models = label.includes(normalizedQuery) ? group.models : group.models.filter((model) => (model.name + " " + model.id + " " + (model.description ?? "")).toLowerCase().includes(normalizedQuery));
					return {
						...group,
						models
					};
				}).filter((group) => group.models.length > 0);
			}, [normalizedQuery, state.groups]);
			const [pickedProvider, setPickedProvider] = (0, react.useState)(null);
			const [paneOpen, setPaneOpen] = (0, react.useState)(false);
			const selectedProvider = (0, react.useMemo)(() => {
				if (pickerGroups.length === 0) return void 0;
				if (pickedProvider !== null) {
					const found = pickerGroups.find((group) => group.id === pickedProvider);
					if (found !== void 0) return found;
				}
				const currentProvider = state.current === null ? void 0 : state.current.provider;
				if (currentProvider !== void 0) {
					const found = pickerGroups.find((group) => group.id === currentProvider);
					if (found !== void 0) return found;
				}
				return pickerGroups[0];
			}, [pickerGroups, pickedProvider, state.current]);
			const paneGroups = (0, react.useMemo)(() => {
				if (normalizedQuery !== "") return pickerGroups;
				return selectedProvider === void 0 ? [] : [selectedProvider];
			}, [normalizedQuery, pickerGroups, selectedProvider]);
			const showPane = paneOpen || normalizedQuery !== "";
			(0, react.useEffect)(() => {
				if (!pickerOpen) setPaneOpen(false);
			}, [pickerOpen]);
			const openPicker = () => {
				if (busy) return;
			if (pickerOpen) {
			  setPickerOpen(false);
			  setQuery("");
			  return;
			}
				load();
				setQuery("");
				const active = pendingModel?.group.id ?? state.current?.provider;
				if (active !== void 0) setExpandedProviders((previous) => previous.has(active) ? previous : new Set(previous).add(active));
				setPaneOpen(false);
				setPickerOpen(true);
			};
			(0, react.useEffect)(() => {
				if (!pickerOpen) return;
				const timer = window.setTimeout(() => {
					searchRef.current?.focus();
				}, 30);
				return () => window.clearTimeout(timer);
			}, [pickerOpen]);
			const commitEffort = (index) => {
				const effort = efforts[index];
				if (effort === void 0 || effort.id === selected?.id) return;
				if (pendingModel !== null) {
					setPendingModel((previous) => previous === null ? previous : {
						...previous,
						effortId: effort.id
					});
					setPendingEffort(null);
					return;
				}
				if (state.current === null) return;
				select({
					provider: state.current.provider,
					model: state.current.model,
					reasoningEffort: effort.id
				}).catch(() => {});
			};
			const previewEffort = (index) => {
				const effort = efforts[index];
				if (effort === void 0 || visibleModelKey === void 0) return;
				if (pendingModel !== null) {
					setPendingModel((previous) => previous === null ? previous : {
						...previous,
						effortId: effort.id
					});
					setPendingEffort(null);
					return;
				}
				setPendingEffort({
					modelKey: visibleModelKey,
					effortId: effort.id,
					index
				});
			};
			const markModelsScrolling = () => {
				setModelsScrolling(true);
				if (modelScrollTimerRef.current !== null) window.clearTimeout(modelScrollTimerRef.current);
				modelScrollTimerRef.current = window.setTimeout(() => {
					modelScrollTimerRef.current = null;
					setModelsScrolling(false);
				}, 100);
			};
			const toggle = () => {
				if (busy) return;
				if (open) {
					closePicker();
					return;
				}
				load();
				setOpen(true);
			};
			const onKeyDown = (event) => {
				if (event.key !== "Escape" || !open) return;
				event.preventDefault();
				closePicker();
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: rootRef,
				className: "dsh-reasoning-model",
				"data-busy": busy,
				"data-max": isMax,
				"data-open": open,
				onKeyDown,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					className: "dsh-reasoning-model__trigger",
					type: "button",
					"aria-haspopup": "dialog",
					"aria-expanded": open,
					"aria-label": reasoning === void 0 ? modelLabel : modelLabel + "，" + t("label") + " " + (displaySelected?.name ?? t("unsupported")),
					disabled: busy,
					onClick: toggle,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BoltIcon, {}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-reasoning-model__model",
							title: modelLabel,
							children: modelLabel
						}),
						reasoning !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dsh-reasoning-model__effort",
							title: t("label") + " " + (displaySelected?.name ?? t("unsupported")),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-reasoning-model__effort-label",
								children: t("label")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: displaySelected?.name ?? t("unsupported") })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChevronIcon, { open })
					]
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-reasoning-model__popover",
					ref: popoverNode,
					"data-picker": pickerOpen ? "true" : "false",
     role: "dialog",
					"aria-label": t("menu"),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							className: "dsh-reasoning-model__model-head",
							type: "button",
							"aria-haspopup": "dialog",
							"aria-expanded": pickerOpen,
							disabled: busy,
							title: t("chooseModel"),
							onClick: openPicker,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-reasoning-model__section-label",
								children: t("model")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-reasoning-model__model-head-value",
								title: modelLabel,
								children: modelLabel
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-reasoning-model__model-head-chevron",
								"aria-hidden": "true",
								children: "▾"
							})]
						}),
						reasoning !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: "dsh-reasoning-effort",
							"data-max": isMax,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-reasoning-effort__header",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("label") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: displaySelected?.name ?? t("unsupported") })]
							}), efforts.length > 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-reasoning-effort__scale",
								"aria-hidden": "true",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("efficient") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("capable") })]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EffortSlider, {
								efforts,
								index: displayIndex,
								disabled: busy,
								onChange: previewEffort,
								onCommit: commitEffort
							})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-reasoning-effort__single",
								children: [
									t("supported"),
									": ",
									displaySelected?.name ?? t("unsupported")
								]
							})]
						}),
						state.error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-reasoning-model__error",
							role: "status",
							children: t("error", { message: state.error })
						})
					]
				}), open && pickerOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-reasoning-model__picker",
					"data-open": showPane ? "true" : "false",
style: {
       bottom: "calc(100% + " + (popoverHeight > 0 ? popoverHeight + 9 : 9) + "px)",
       maxHeight: popoverHeight > 0 ? "min(640px, calc(100vh - " + (popoverHeight + 130) + "px))" : void 0
      },
      					role: "dialog",
					"aria-label": t("chooseModel"),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-reasoning-model__picker-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-reasoning-model__picker-title",
							children: t("chooseModel")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						ref: searchRef,
						className: "dsh-reasoning-model__search",
						type: "search",
						value: query,
						placeholder: t("search"),
						"aria-label": t("search"),
						onChange: (event) => {
							const value = event.target.value;
							setQuery(value);
							if (value.trim() !== "") setPaneOpen(true);
						}
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-reasoning-model__split",
							"data-open": showPane ? "true" : "false",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsh-reasoning-model__sources",
								role: "tablist",
								"aria-label": t("model"),
								children: pickerGroups.map((group) => {
									const name = groupLabel(group);
									const active = selectedProvider !== void 0 && selectedProvider.id === group.id;
									const inUse = state.current !== null && state.current.provider === group.id;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										className: "dsh-reasoning-model__source",
										type: "button",
										role: "tab",
										"aria-selected": active,
										"data-active": active ? "true" : "false",
										disabled: busy,
										title: name,
										onClick: () => {
										if (active && showPane) {
										  setPaneOpen(false);
										  return;
										}
										setPickedProvider(group.id);
										setPaneOpen(true);
									},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsh-reasoning-model__source-name",
											children: name
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsh-reasoning-model__source-meta",
											children: inUse ? t("current") : t("providerCount", { count: group.models.length })
										})]
									}, group.id);
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-reasoning-model__models",
								"data-scrolling": modelsScrolling,
								"aria-label": t("chooseModel"),
								onWheel: markModelsScrolling,
								onScroll: markModelsScrolling,
								children: [
									state.status === "loading" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsh-reasoning-model__status",
										children: t("loading")
									}),
									state.status !== "loading" && paneGroups.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsh-reasoning-model__status",
										children: t("noMatch")
									}),
									paneGroups.map((group) => {
										const name = groupLabel(group);
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
											className: "dsh-reasoning-model__pane-group",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: "dsh-reasoning-model__pane-group-head",
												children: name
											}), group.models.map((model) => {
												const active = activeProvider === group.id && activeModelId === model.id;
												return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
													className: "dsh-reasoning-model__option",
													type: "button",
													role: "option",
													"aria-selected": active,
													disabled: busy,
													onClick: () => {
														chooseModel(group.id, model.id);
														setPickerOpen(false);
														setQuery("");
													},
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: "dsh-reasoning-model__option-copy",
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsh-reasoning-model__option-name",
															children: model.name
														}), model.description === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsh-reasoning-model__option-description",
															children: model.description
														})]
													}), active && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "dsh-reasoning-model__option-check",
														"aria-hidden": "true",
														children: "✓"
													})]
												}, group.id + ":" + model.id);
											})]
										}, group.id);
									})
								]
							})]
						})]
				})]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** Localized copy for the model-seat reasoning control. */
		const zh = {
			label: "推理强度",
			model: "模型",
			chooseModel: "选择模型",
			search: "搜索模型…",
			back: "返回",
			current: "当前使用",
			noMatch: "没有匹配的模型",
			providerCount: "{count} 个模型",
			menu: "模型与推理强度",
			efficient: "更高效",
			capable: "更智能",
			loading: "正在刷新模型列表…",
			empty: "没有可用的模型。",
			supported: "支持档位",
			unsupported: "不可用",
			aria: "推理强度：{effort}",
			hint: "打开模型菜单调整推理强度",
			error: "设置失败：{message}"
		};
		const en = {
			label: "Reasoning",
			model: "Model",
			chooseModel: "Choose a model",
			search: "Search models…",
			back: "Back",
			current: "In use",
			noMatch: "No matching models",
			providerCount: "{count} models",
			menu: "Model and reasoning effort",
			efficient: "More efficient",
			capable: "More capable",
			loading: "Refreshing models…",
			empty: "No models available.",
			supported: "Supported effort",
			unsupported: "Unavailable",
			aria: "Reasoning effort: {effort}",
			hint: "Open the model menu to adjust reasoning effort",
			error: "Unable to update effort: {message}"
		};
		//#endregion
		//#region src/client/styles.ts
		/** Self-contained Codex-style model-seat and reasoning-effort styles. */
		const STYLE_ID = "dsh-reasoning-effort-styles";
		const PLUGIN_ID = "dsh-reasoning-effort";
		const CSS = `
.dsh-reasoning-model{position:relative;z-index:4;display:flex;min-width:0;max-width:min(100%,420px);align-items:center}
.dsh-reasoning-model__trigger{box-sizing:border-box;display:flex;min-width:0;max-width:100%;height:32px;align-items:center;gap:6px;padding:0 7px 0 9px;border:1px solid transparent;border-radius:999px;background:var(--dsw-alias-interactive-bg-hover,#f1f2f4);color:var(--dsw-alias-label-secondary,#4f5867);font:inherit;font-size:13px;font-weight:500;line-height:19px;cursor:pointer;transition:background-color .14s ease,border-color .14s ease,box-shadow .14s ease}
.dsh-reasoning-model__trigger:hover:not(:disabled){border-color:var(--dsw-alias-border-l2,#d8dce3);background:var(--dsw-alias-interactive-bg-hover,#eceef1)}
.dsh-reasoning-model__trigger:focus-visible{outline:0;border-color:var(--dsw-alias-state-business-primary,#3b82f6);box-shadow:0 0 0 3px rgb(59 130 246 / 18%)}
.dsh-reasoning-model__trigger:disabled{color:var(--dsw-alias-label-dimmed,#a1a7b1);cursor:default;opacity:.72}
.dsh-reasoning-model[data-busy='true'] .dsh-reasoning-model__trigger:disabled{color:var(--dsw-alias-label-secondary,#4f5867);opacity:1}
.dsh-reasoning-model__bolt{width:16px;height:16px;flex:none;color:var(--dsw-alias-label-primary,#17191d)}
.dsh-reasoning-model__model{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-reasoning-model__effort{display:inline-flex;min-width:0;align-items:center;gap:4px;color:var(--dsw-alias-state-business-primary,#3b82f6);font-weight:600;white-space:nowrap}
.dsh-reasoning-model__effort-label{color:var(--dsw-alias-label-tertiary,#7d8592);font-weight:500}
.dsh-reasoning-model[data-max='true'] .dsh-reasoning-model__effort{color:#9751e8}
.dsh-reasoning-model__chevron{width:15px;height:15px;flex:none;color:var(--dsw-alias-label-tertiary,#838b98);transition:transform .14s ease}
.dsh-reasoning-model__chevron[data-open='true']{transform:rotate(180deg)}
.dsh-reasoning-model__popover{position:absolute;right:0;bottom:calc(100% + 9px);box-sizing:border-box;width:min(400px,calc(100vw - 24px));max-height:min(600px,calc(100vh - 96px));overflow:auto;padding:12px;border:1px solid var(--dsw-alias-border-l2,#d9dde4);border-radius:16px;background:var(--dsw-specific-menu,#fff);box-shadow:0 12px 30px rgb(20 28 42 / 14%),0 3px 10px rgb(20 28 42 / 8%);color:var(--dsw-alias-label-primary,#17191d)}
.dsh-reasoning-model__model-head{display:flex;min-width:0;align-items:baseline;justify-content:space-between;gap:14px;padding:0 4px 10px}
.dsh-reasoning-model__section-label{color:var(--dsw-alias-label-primary,#17191d);font-size:13px;font-weight:600;white-space:nowrap}
.dsh-reasoning-model__model-head-value{min-width:0;overflow:hidden;color:var(--dsw-alias-label-secondary,#5b6472);font-size:13px;text-overflow:ellipsis;white-space:nowrap}
.dsh-reasoning-model__models{display:flex;max-height:260px;flex-direction:column;gap:1px;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;padding:2px 0 4px}
.dsh-reasoning-model__models[data-scrolling='true'] .dsh-reasoning-model__provider-toggle,.dsh-reasoning-model__models[data-scrolling='true'] .dsh-reasoning-model__option{transition:none}
.dsh-reasoning-model__models[data-scrolling='true'] .dsh-reasoning-model__provider:not([data-expanded='true']) .dsh-reasoning-model__provider-toggle:hover:not(:disabled){background:transparent}
.dsh-reasoning-model__models[data-scrolling='true'] .dsh-reasoning-model__option:hover:not(:disabled):not([aria-selected='true']){background:transparent}
.dsh-reasoning-model__provider{min-width:0}
.dsh-reasoning-model__provider-toggle{display:flex;width:100%;min-height:34px;align-items:center;justify-content:space-between;gap:9px;padding:5px 8px;border:0;border-radius:9px;background:transparent;color:inherit;text-align:left;font:inherit;font-size:13px;line-height:18px;cursor:pointer;transition:background-color .14s ease}
.dsh-reasoning-model__provider-toggle:hover:not(:disabled),.dsh-reasoning-model__provider[data-expanded='true'] .dsh-reasoning-model__provider-toggle{background:var(--dsw-alias-interactive-bg-hover,#f2f3f5)}
.dsh-reasoning-model__provider-toggle:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#3b82f6);outline-offset:-2px}
.dsh-reasoning-model__provider-toggle:disabled{color:var(--dsw-alias-label-dimmed,#a1a7b1);cursor:wait}
.dsh-reasoning-model[data-busy='true'] .dsh-reasoning-model__provider-toggle:disabled{color:inherit}
.dsh-reasoning-model__provider-copy{display:flex;min-width:0;flex:1;align-items:baseline;justify-content:space-between;gap:10px}
.dsh-reasoning-model__provider-name{overflow:hidden;font-weight:600;text-overflow:ellipsis;white-space:nowrap}
.dsh-reasoning-model__provider-meta{max-width:55%;overflow:hidden;color:var(--dsw-alias-label-tertiary,#858d99);font-size:11px;font-weight:500;text-overflow:ellipsis;white-space:nowrap}
.dsh-reasoning-model__provider-models{display:flex;flex-direction:column;gap:1px;padding:1px 0 3px 8px}
.dsh-reasoning-model__option{display:flex;width:100%;min-height:32px;align-items:center;gap:9px;padding:4px 8px;border:0;border-radius:9px;background:transparent;color:inherit;text-align:left;font:inherit;cursor:pointer}
.dsh-reasoning-model__option:hover:not(:disabled),.dsh-reasoning-model__option[aria-selected='true']{background:var(--dsw-alias-interactive-bg-hover,#f2f3f5)}
.dsh-reasoning-model__option:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#3b82f6);outline-offset:-2px}
.dsh-reasoning-model__option:disabled{color:var(--dsw-alias-label-dimmed,#a1a7b1);cursor:wait}
.dsh-reasoning-model[data-busy='true'] .dsh-reasoning-model__option:disabled{color:inherit}
.dsh-reasoning-model__option-copy{display:flex;min-width:0;flex:1;flex-direction:column}
.dsh-reasoning-model__option-name{overflow:hidden;font-size:13px;font-weight:550;line-height:18px;text-overflow:ellipsis;white-space:nowrap}
.dsh-reasoning-model__option-description{overflow:hidden;color:var(--dsw-alias-label-tertiary,#858d99);font-size:11px;line-height:14px;text-overflow:ellipsis;white-space:nowrap}
.dsh-reasoning-model__check{flex:none;color:var(--dsw-alias-state-business-primary,#3b82f6);font-size:14px;font-weight:700}
.dsh-reasoning-model__status{padding:10px 8px;color:var(--dsw-alias-label-tertiary,#858d99);font-size:12px;line-height:17px}
.dsh-reasoning-effort{margin-top:6px;padding:12px 4px 2px;border-top:1px solid var(--dsw-alias-border-l1,#eceef1)}
.dsh-reasoning-effort__header{display:flex;align-items:baseline;justify-content:space-between;gap:10px;color:var(--dsw-alias-label-secondary,#616a78);font-size:12px;line-height:18px}
.dsh-reasoning-effort__header strong{color:var(--dsw-alias-state-business-primary,#3b82f6);font-size:13px;font-weight:650}
.dsh-reasoning-effort[data-max='true'] .dsh-reasoning-effort__header strong{color:#9751e8}
.dsh-reasoning-effort__scale{display:flex;align-items:center;justify-content:space-between;margin:7px 2px 0;color:var(--dsw-alias-label-tertiary,#858d99);font-size:11px;line-height:15px}
.dsh-reasoning-effort__slider{height:40px;margin:1px 0 2px;touch-action:none;cursor:grab;outline:0}
.dsh-reasoning-effort__slider:active,.dsh-reasoning-effort__slider[data-dragging='true']{cursor:grabbing}
.dsh-reasoning-effort__slider:focus-visible{border-radius:12px;box-shadow:0 0 0 3px rgb(59 130 246 / 18%)}
.dsh-reasoning-effort__range{position:relative;height:40px;margin:0 15px}
.dsh-reasoning-effort__rail{position:absolute;top:50%;right:0;left:0;height:24px;transform:translateY(-50%);border-radius:12px;background:#e7e7e9;box-shadow:inset 0 1px 2px rgb(25 30 40 / 7%)}
.dsh-reasoning-effort__fill{position:absolute;z-index:1;top:50%;left:0;height:24px;min-width:0;transform:translateY(-50%);border-radius:12px;background:linear-gradient(90deg,#339cff 0%,#3d8df7 100%);box-shadow:inset 0 1px 1px rgb(255 255 255 / 14%);transition:width .2s cubic-bezier(.2,.8,.3,1)}
.dsh-reasoning-effort__fill::after{position:absolute;top:0;right:auto;bottom:0;left:-40%;width:35%;border-radius:999px;background:linear-gradient(105deg,transparent 0%,rgb(255 255 255 / 0%) 20%,rgb(255 255 255 / 84%) 50%,rgb(221 200 255 / 32%) 80%,transparent 100%);content:'';filter:blur(2px);opacity:0}
.dsh-reasoning-effort[data-max='true'] .dsh-reasoning-effort__fill{background:linear-gradient(90deg,#326fff 0%,#7057e9 56%,#a855f7 100%);overflow:hidden;animation:dsh-reasoning-max-flash 1.05s ease-in-out infinite}
.dsh-reasoning-effort[data-max='true'] .dsh-reasoning-effort__fill::after{opacity:1;animation:dsh-reasoning-max-sweep .95s linear infinite}
.dsh-reasoning-effort[data-max='true'] .dsh-reasoning-effort__fill::before{position:absolute;top:-10px;right:-12px;bottom:-10px;width:32px;border-radius:50%;background:rgb(224 201 255 / 76%);content:'';filter:blur(8px);opacity:.9;animation:dsh-reasoning-max-tail .82s ease-in-out infinite}
.dsh-reasoning-effort__tick{position:absolute;z-index:2;top:50%;width:5px;height:5px;border-radius:50%;transform:translate(-50%,-50%);background:#b8b9bd;transition:background-color .16s ease,transform .16s ease}
.dsh-reasoning-effort__tick[data-active='true']{background:#7bbdff}
.dsh-reasoning-effort[data-max='true'] .dsh-reasoning-effort__tick[data-active='true']{background:#c29af6}
.dsh-reasoning-effort__tick[data-major='true']{width:8px;height:8px;transform:translate(-50%,-50%);background:#fff;box-shadow:0 0 0 1px rgb(59 130 246 / 28%)}
.dsh-reasoning-effort[data-max='true'] .dsh-reasoning-effort__tick[data-major='true']{box-shadow:0 0 0 1px rgb(168 85 247 / 40%)}
.dsh-reasoning-effort__thumb{position:absolute;z-index:3;top:50%;width:30px;height:30px;margin-left:0;transform:translate(-50%,-50%);border:1px solid #dadadd;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgb(20 30 50 / 12%),0 3px 8px rgb(20 30 50 / 8%);transition:left .18s cubic-bezier(.2,.9,.25,1),box-shadow .18s ease,transform .18s ease}
.dsh-reasoning-effort__slider:hover .dsh-reasoning-effort__thumb{box-shadow:0 1px 2px rgb(20 30 50 / 14%),0 4px 10px rgb(20 30 50 / 10%);transform:translate(-50%,-50%) scale(1.04)}
.dsh-reasoning-effort[data-max='true'] .dsh-reasoning-effort__thumb{border-color:#cdb2ef;box-shadow:0 0 0 3px rgb(168 85 247 / 14%),0 0 16px rgb(168 85 247 / 58%),0 2px 6px rgb(20 30 50 / 12%);animation:dsh-reasoning-max-pulse 1.35s ease-in-out infinite}
.dsh-reasoning-effort__single{padding:9px 0 2px;color:var(--dsw-alias-label-tertiary,#858d99);font-size:12px}
.dsh-reasoning-model__error{margin:8px 4px 2px;padding:7px 8px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover-danger,#fff1f2);color:var(--dsw-alias-state-error-primary,#d92d48);font-size:11px;line-height:16px}
@keyframes dsh-reasoning-max-flash{0%,100%{filter:saturate(1) brightness(1);box-shadow:inset 0 1px 1px rgb(255 255 255 / 14%),0 0 6px rgb(168 85 247 / 20%)}50%{filter:saturate(1.45) brightness(1.16);box-shadow:inset 0 1px 1px rgb(255 255 255 / 24%),0 0 16px rgb(168 85 247 / 72%),0 0 30px rgb(192 132 252 / 28%)}}
@keyframes dsh-reasoning-max-tail{0%,100%{opacity:.35;transform:scale(.78)}50%{opacity:1;transform:scale(1.15)}}
@keyframes dsh-reasoning-max-sweep{0%{transform:translateX(-130%);opacity:0}25%{opacity:.85}75%{opacity:.85}100%{transform:translateX(520%);opacity:0}}
@keyframes dsh-reasoning-max-pulse{0%,100%{filter:saturate(1);transform:translate(-50%,-50%) scale(1)}50%{filter:saturate(1.35) brightness(1.12);transform:translate(-50%,-50%) scale(1.1)}}
@media (max-width:760px){.dsh-reasoning-model__trigger{max-width:calc(100vw - 90px)}.dsh-reasoning-model__effort-label{display:none}.dsh-reasoning-model__popover{right:-6px;width:min(340px,calc(100vw - 20px))}}
@media (prefers-reduced-motion:reduce){.dsh-reasoning-model__chevron,.dsh-reasoning-effort__fill,.dsh-reasoning-effort__thumb{transition:none}.dsh-reasoning-effort[data-max='true'] .dsh-reasoning-effort__fill,.dsh-reasoning-effort[data-max='true'] .dsh-reasoning-effort__fill::after,.dsh-reasoning-effort[data-max='true'] .dsh-reasoning-effort__fill::before,.dsh-reasoning-effort[data-max='true'] .dsh-reasoning-effort__thumb{animation:none}}
/* local override: make the model/reasoning popover far less transparent (was 58% var(--dsw-specific-menu)) */
.dsh-reasoning-model__popover{background-color:color-mix(in srgb, var(--dsw-alias-bg-layer-1,#fff) 96%, transparent);-webkit-backdrop-filter:blur(40px) saturate(150%);backdrop-filter:blur(40px) saturate(150%)}

/* second-level model picker + clickable model row */
.dsh-reasoning-model__model-head{width:100%;box-sizing:border-box;align-items:center;padding:6px 8px;border:0;border-radius:10px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background-color .14s ease}
.dsh-reasoning-model__model-head:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#f2f3f5)}
.dsh-reasoning-model__model-head:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#3b82f6);outline-offset:-2px}
.dsh-reasoning-model__model-head:disabled{cursor:default}
.dsh-reasoning-model__model-head .dsh-reasoning-model__model-head-value{flex:1;text-align:right}
.dsh-reasoning-model__model-head-chevron{flex:none;color:var(--dsw-alias-label-tertiary,#858d99);font-size:11px}
.dsh-reasoning-model__picker{position:absolute;right:-6px;bottom:calc(100% + 9px);z-index:3;box-sizing:border-box;display:flex;width:min(460px,calc(100vw - 20px));max-height:min(640px,calc(100vh - 96px));flex-direction:column;padding:12px;border:1px solid var(--dsw-alias-border-l2,#d9dde4);border-radius:16px;background-color:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 18px 44px rgb(20 28 42 / 18%),0 4px 12px rgb(20 28 42 / 10%);color:var(--dsw-alias-label-primary,#17191d)}
.dsh-reasoning-model__picker-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
.dsh-reasoning-model__picker-title{font-size:14px;font-weight:600}
.dsh-reasoning-model__picker-back{padding:4px 10px;border:1px solid var(--dsw-alias-border-l2,#d9dde4);border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary,#5b6472);font:inherit;font-size:12px;cursor:pointer}
.dsh-reasoning-model__picker-back:hover{background:var(--dsw-alias-interactive-bg-hover,#f2f3f5)}
.dsh-reasoning-model__search{box-sizing:border-box;width:100%;margin:0 0 8px;padding:8px 11px;border:1px solid var(--dsw-alias-border-l2,#d9dde4);border-radius:10px;background:var(--dsw-alias-interactive-bg-hover,#f2f3f5);color:inherit;font:inherit;font-size:13px;outline:0}
.dsh-reasoning-model__search:focus{border-color:var(--dsw-alias-state-business-primary,#3b82f6);box-shadow:0 0 0 3px rgb(59 130 246 / 16%)}
.dsh-reasoning-model__picker .dsh-reasoning-model__models{max-height:min(430px,54vh);padding:0}

/* two-pane model picker */
.dsh-reasoning-model__picker{width:min(560px,calc(100vw - 24px));box-sizing:border-box;display:flex;flex-direction:column;gap:8px}
.dsh-reasoning-model__split{display:flex;align-items:stretch;gap:8px;height:min(430px,58vh);padding:0 10px 10px;box-sizing:border-box}
.dsh-reasoning-model__sources{display:flex;flex:0 0 162px;flex-direction:column;gap:2px;overflow-y:auto;padding-right:6px;border-right:1px solid var(--dsw-alias-border-l2,#e6e8ec)}
.dsh-reasoning-model__source{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:7px 9px;border:0;border-radius:9px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dsh-reasoning-model__source:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#f2f3f5)}
.dsh-reasoning-model__source[data-active='true']{background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#3b82f6) 13%, transparent)}
.dsh-reasoning-model__source:disabled{cursor:default}
.dsh-reasoning-model__source-name{max-width:100%;overflow:hidden;font-size:13px;font-weight:600;text-overflow:ellipsis;white-space:nowrap}
.dsh-reasoning-model__source-meta{font-size:11px;color:var(--dsw-alias-label-tertiary,#858d99)}
.dsh-reasoning-model__models{flex:1;min-width:0;max-height:none;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
.dsh-reasoning-model__pane-group{display:flex;flex-direction:column;gap:2px}
.dsh-reasoning-model__pane-group-head{padding:5px 9px 3px;font-size:11px;color:var(--dsw-alias-label-tertiary,#858d99)}
.dsh-reasoning-model__option-check{flex:none;font-size:13px;font-weight:700;color:var(--dsw-alias-state-business-primary,#3b82f6)}

/* slide-out model column */
.dsh-reasoning-model__picker{width:min(324px,calc(100vw - 24px));border-width:2px;border-color:var(--dsw-alias-border-l3,var(--dsw-alias-border-l2,#c9d0da));box-shadow:0 20px 48px rgb(20 28 42 / 22%),0 5px 14px rgb(20 28 42 / 12%);transition:width .2s ease}
.dsh-reasoning-model__picker[data-open='true']{width:min(600px,calc(100vw - 24px))}
.dsh-reasoning-model__split[data-open='false'] .dsh-reasoning-model__sources{flex:1;border-right:0}
.dsh-reasoning-model__split[data-open='false'] .dsh-reasoning-model__models{max-width:0;flex:0 0 0;padding:0;visibility:hidden;opacity:0;transform:translateX(14px);pointer-events:none}
.dsh-reasoning-model__models{max-width:520px;opacity:1;transform:none;transition:opacity .18s ease,transform .18s ease}

/* scrollable source column */
.dsh-reasoning-model__sources{overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;padding-right:8px}
.dsh-reasoning-model__sources::-webkit-scrollbar{width:8px}
.dsh-reasoning-model__sources::-webkit-scrollbar-track{background:transparent}
.dsh-reasoning-model__sources::-webkit-scrollbar-thumb{border-radius:99px;background:rgb(138 148 164 / 42%)}
.dsh-reasoning-model__sources::-webkit-scrollbar-thumb:hover{background:rgb(138 148 164 / 68%)}
.dsh-reasoning-model__source{padding:8px 10px}
.dsh-reasoning-model__source-name{font-size:13.5px}
.dsh-reasoning-model__source-meta{font-size:11.5px}

/* compact single-line rows (chip height) + shorter panel */
.dsh-reasoning-model__source{flex-direction:row;align-items:center;justify-content:space-between;gap:8px;min-height:30px;padding:5px 9px}
.dsh-reasoning-model__source-name{flex:0 1 auto;min-width:0;font-weight:550}
.dsh-reasoning-model__source-meta{flex:0 0 auto;white-space:nowrap}
.dsh-reasoning-model__option{min-height:30px;padding:4px 8px}
.dsh-reasoning-model__option-copy{flex-direction:row;align-items:baseline;gap:8px}
.dsh-reasoning-model__option-name{flex:0 0 auto}
.dsh-reasoning-model__option-description{flex:1 1 auto;min-width:0}
.dsh-reasoning-model__pane-group-head{padding:4px 9px 2px}
.dsh-reasoning-model__sources{flex:0 0 196px;gap:1px}
.dsh-reasoning-model__models{gap:1px}
.dsh-reasoning-model__split{height:min(300px,44vh)}
.dsh-reasoning-model__picker .dsh-reasoning-model__models{max-height:min(300px,44vh)}
.dsh-reasoning-model__picker{padding:11px}
.dsh-reasoning-model__picker-head{margin-bottom:6px}
.dsh-reasoning-model__search{margin-bottom:7px;padding:6px 10px}

/* attached card: picker and popover share one width and one frame */
.dsh-reasoning-model__picker{right:0;width:min(400px,calc(100vw - 24px));background-color:var(--dsw-specific-menu,#fff);box-shadow:0 -10px 28px rgb(20 28 42 / 14%)}
.dsh-reasoning-model__picker[data-open='true']{width:min(400px,calc(100vw - 24px))}
.dsh-reasoning-model__picker{border-bottom-left-radius:0;border-bottom-right-radius:0;border-bottom-color:transparent}
.dsh-reasoning-model__popover[data-picker='true']{border-top-left-radius:0;border-top-right-radius:0}
.dsh-reasoning-model__sources{flex:0 0 136px}
.dsh-reasoning-model__models{flex:1 1 auto;min-width:0}

/* expanded pane: give the source names the room the model count was using */
.dsh-reasoning-model__picker[data-open='true'] .dsh-reasoning-model__source-meta{display:none}
.dsh-reasoning-model__picker[data-open='true'] .dsh-reasoning-model__sources{flex:0 0 134px}

/* tighter card: less padding, content-sized list, frosted like the popover */
.dsh-reasoning-model__picker{padding:9px;background-color:color-mix(in srgb, var(--dsw-alias-bg-layer-1,#fff) 94%, transparent);-webkit-backdrop-filter:blur(40px) saturate(150%);backdrop-filter:blur(40px) saturate(150%)}
.dsh-reasoning-model__picker-head{margin-bottom:5px}
.dsh-reasoning-model__search{margin-bottom:6px;padding:5px 9px}
.dsh-reasoning-model__split{height:auto;max-height:min(300px,44vh)}
.dsh-reasoning-model__sources{min-height:0}
.dsh-reasoning-model__models{min-height:0}
.dsh-reasoning-model__source{min-height:28px;padding:4px 9px}
.dsh-reasoning-model__option{min-height:28px;padding:3px 8px}
.dsh-reasoning-model__popover{padding:10px}
.dsh-reasoning-model__model-head{padding:4px 8px}
.dsh-reasoning-effort__header{margin-bottom:1px}
.dsh-reasoning-effort__scale{margin:5px 2px 0}

.dsh-reasoning-model__split[data-open='false'] .dsh-reasoning-model__models{height:0;max-height:0;overflow:hidden}

/* one colour, no seam, fixed body height */
.dsh-reasoning-model__picker{background-color:color-mix(in srgb, var(--dsw-alias-bg-layer-1,#fff) 96%, transparent)}
.dsh-reasoning-model__popover[data-picker='true']{border-top-color:transparent}
.dsh-reasoning-model__picker-head{margin-bottom:4px}
.dsh-reasoning-model__search{margin-bottom:6px;padding:3px 8px;border-radius:8px;font-size:12px;line-height:16px}
.dsh-reasoning-model__split{height:176px;max-height:176px}
.dsh-reasoning-model__models{min-height:0;max-height:100%;overflow-y:auto}

/* identical solid surface, thin left scrollbar, roomier rows, narrower search */
.dsh-reasoning-model__picker{background-color:var(--dsw-specific-menu,#fff);-webkit-backdrop-filter:none;backdrop-filter:none}
.dsh-reasoning-model__popover{background-color:var(--dsw-specific-menu,#fff);-webkit-backdrop-filter:none;backdrop-filter:none}
.dsh-reasoning-model__sources{gap:4px}
.dsh-reasoning-model__sources::-webkit-scrollbar{width:4px}
.dsh-reasoning-model__sources::-webkit-scrollbar-thumb{background:rgb(138 148 164 / 30%)}
.dsh-reasoning-model__split{height:156px;max-height:156px}
.dsh-reasoning-model__search{box-sizing:border-box;width:calc(100% - 14px);margin:0 7px 6px}

/* opaque surface: the theme's menu token is translucent, bg-layer-1 is solid */
.dsh-reasoning-model__picker{background-color:var(--dsw-alias-bg-layer-1,#fff)}
.dsh-reasoning-model__popover{background-color:var(--dsw-alias-bg-layer-1,#fff)}

/* exactly five rows tall: row 28 + gap 4 */
.dsh-reasoning-model__split{height:auto;max-height:none}
.dsh-reasoning-model__sources{height:calc(5 * 32px);max-height:calc(5 * 32px);overflow-y:auto}
.dsh-reasoning-model__models{height:calc(5 * 32px);max-height:calc(5 * 32px);overflow-y:auto}

/* no upward shadow bleed across the seam */
.dsh-reasoning-model__picker{box-shadow:0 -8px 24px rgb(20 28 42 / 12%)}
.dsh-reasoning-model__popover[data-picker='true']{box-shadow:0 14px 26px rgb(20 28 42 / 10%)}

/* strip the shared edge: no border, no downward shadow between the two halves */
.dsh-reasoning-model__picker{border-bottom-width:0;box-shadow:0 -6px 20px rgb(20 28 42 / 12%)}
.dsh-reasoning-model__popover[data-picker='true']{border-top-width:0;box-shadow:0 16px 24px rgb(20 28 42 / 8%)}

/* shadow that cannot bleed across the seam: up-only, no downward spread */
.dsh-reasoning-model__picker{box-shadow:0 -14px 18px rgb(20 28 42 / 10%)}

/* same hairline as the 模型/推理强度 divider, now between the two lists */
.dsh-reasoning-model__split[data-open='true'] .dsh-reasoning-model__sources{border-right:1px solid var(--dsw-alias-border-l1,#eceef1)}

/* 1px outline everywhere; the seam gets one light hairline like the 模型/推理强度 divider */
.dsh-reasoning-model__picker{border-width:1px;border-color:var(--dsw-alias-border-l2,#d9dde4);border-bottom-width:0}
.dsh-reasoning-model__popover[data-picker='true']{border-top-width:1px;border-top-color:var(--dsw-alias-border-l1,#eceef1)}
.dsh-reasoning-model__split[data-open='true'] .dsh-reasoning-model__sources{border-right:0}

/* seam hairline inset the same way as the 模型/推理强度 divider */
.dsh-reasoning-model__popover[data-picker='true']{border-top-width:0}
.dsh-reasoning-model__popover[data-picker='true']::before{content:"";position:absolute;top:0;left:10px;right:10px;height:1px;background:var(--dsw-alias-border-l1,#eceef1);pointer-events:none}

/* narrower card: 400px -> 360px, both halves stay identical */
.dsh-reasoning-model__picker{width:min(360px,calc(100vw - 24px))}
.dsh-reasoning-model__popover{width:min(360px,calc(100vw - 24px))}
.dsh-reasoning-model__picker[data-open='true']{width:min(360px,calc(100vw - 24px))}

/* source rows inset from the card edges */
.dsh-reasoning-model__sources{padding-left:7px;padding-right:12px}

/* no title row; narrower card 360 -> 330 */
.dsh-reasoning-model__picker-head{display:none}
.dsh-reasoning-model__picker{width:min(330px,calc(100vw - 24px))}
.dsh-reasoning-model__picker[data-open='true']{width:min(330px,calc(100vw - 24px))}
.dsh-reasoning-model__popover{width:min(330px,calc(100vw - 24px))}

/* 350 wide, roomier top padding, 8px row gap, list exactly five rows tall (no leftover white) */
.dsh-reasoning-model__picker{width:min(350px,calc(100vw - 24px));padding-top:14px}
.dsh-reasoning-model__picker[data-open='true']{width:min(350px,calc(100vw - 24px))}
.dsh-reasoning-model__popover{width:min(350px,calc(100vw - 24px))}
.dsh-reasoning-model__sources{gap:8px;height:calc(5 * 28px + 4 * 8px);max-height:calc(5 * 28px + 4 * 8px)}
.dsh-reasoning-model__models{gap:8px;height:calc(5 * 28px + 4 * 8px);max-height:calc(5 * 28px + 4 * 8px)}

/* top padding 16, bottom padding 2, list keeps the freed height (same card height, 6th row peeks) */
.dsh-reasoning-model__picker{padding-top:16px;padding-bottom:2px}
.dsh-reasoning-model__sources,.dsh-reasoning-model__models{height:calc(5 * 28px + 4 * 8px + 7px);max-height:calc(5 * 28px + 4 * 8px + 7px)}

/* seal the seam: opaque skirt under the panel with the inset hairline drawn on it */
.dsh-reasoning-model__popover[data-picker='true']::before{display:none}
.dsh-reasoning-model__picker::after{content:"";position:absolute;left:0;right:0;bottom:-5px;height:8px;pointer-events:none;background:linear-gradient(to right,transparent 10px,var(--dsw-alias-border-l1,#eceef1) 10px,var(--dsw-alias-border-l1) calc(100% - 10px),transparent calc(100% - 10px)) top left/100% 1px no-repeat,var(--dsw-alias-bg-layer-1,#fff)}

/* more air above the search field: 16px -> 24px */
.dsh-reasoning-model__picker{padding-top:24px}

/* keep the search field looking the same when focused (no blue ring) */
.dsh-reasoning-model__search:focus,.dsh-reasoning-model__search:focus-visible,.dsh-reasoning-model__search:focus-within{outline:0;border-color:var(--dsw-alias-border-l2,#d9dde4);box-shadow:none;background:var(--dsw-alias-interactive-bg-hover,#f2f3f5)}

/* lighter, shorter shadow above the panel */
.dsh-reasoning-model__picker{box-shadow:0 -6px 12px rgb(20 28 42 / 6%)}

/* card needs shadow on all four sides once the picker is attached */
.dsh-reasoning-model__picker{box-shadow:0 -8px 22px rgb(20 28 42 / 9%)}
.dsh-reasoning-model__popover[data-picker='true']{box-shadow:0 8px 22px rgb(20 28 42 / 13%)}

/* use the panel's own shadow depth; the picker mirrors it upwards */
.dsh-reasoning-model__picker{box-shadow:0 -12px 30px rgb(20 28 42 / 14%)}
.dsh-reasoning-model__popover[data-picker='true']{box-shadow:0 12px 30px rgb(20 28 42 / 14%),0 3px 10px rgb(20 28 42 / 8%)}

/* mirror BOTH shadow layers upwards, so the top matches the bottom exactly */
.dsh-reasoning-model__picker{box-shadow:0 -12px 30px rgb(20 28 42 / 14%),0 -3px 10px rgb(20 28 42 / 8%)}

/* drop the 更高效/更智能 hint row, and the 推理强度 label on the composer chip */
.dsh-reasoning-effort__scale-labels{display:none}
.dsh-reasoning-model__trigger-label{display:none}

/* hide the 更高效/更智能 hint row */
.dsh-reasoning-effort__scale{display:none}

/* chip: drop the 推理强度 word, keep the value */
.dsh-reasoning-model__effort-label{display:none}
`;
		/** Mount the stylesheet for the owning plugin lifetime. */
		function installReasoningStyles() {
			if (typeof document === "undefined") return () => {};
			if (document.getElementById(STYLE_ID) !== null) return () => {};
			const style = document.createElement("style");
			style.id = STYLE_ID;
			style.dataset.plugin = PLUGIN_ID;
			style.dataset.pluginCss = PLUGIN_ID + "/reasoning-model.css";
			style.textContent = CSS;
			document.head.appendChild(style);
			return () => {
				style.remove();
			};
		}
		//#endregion
		//#region src/client/index.tsx
		const NS = "reasoning-effort";
		const inject = [
			"slots",
			"locale",
			"modelDirectories",
			"sessions",
			"remote",
			"remote.session"
		];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-reasoning-effort: dictionaries");
			ctx.effect(() => installReasoningStyles(), "dsh-reasoning-effort: styles");
			const t = ctx.locale.bind(NS);
			ctx.inject(["slots", "modelDirectories"], (scope) => {
				const models = scope.modelDirectories;
				scope.slots.inject("conversation.input.model", () => scope.slots.register({
					name: "conversation.input.model",
					priority: -1,
					label: () => t("label"),
					locale: NS,
					inject: (sessionId) => {
						const directory = models.directoryFor(sessionId);
						return {
							directory: directory.store,
							load: () => {
								directory.load().catch(() => {});
							},
							select: (selection) => directory.select(selection)
						};
					}
				}, ReasoningBar));
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map