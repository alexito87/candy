import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Meal, Menu, MenuDay, MenuDish } from '../types';

type AddDishState = {
  isOpen: boolean;
  mealId: string | null;
  mealTitle: string | null;
};

type EditDishState = {
  isOpen: boolean;
  mealId: string | null;
  menuDishId: string | null;
  dishId: string | null;
  title: string;
  dishType: string;
  description: string;
  weightGrams: number;
  priceCents: number;
  isEnabled: boolean;
};

type ConfigureMenuDayState = {
  id: string;
  dayOfWeek: string;
  dayDate: string;
  isEnabled: boolean;
};

type ConfigureMenuState = {
  isOpen: boolean;
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  editingStartsAt: string;
  editingEndsAt: string;
  orderingStartsAt: string;
  orderingEndsAt: string;
  processingStartsAt: string;
  parentReminderAt: string;
  visibleForParents: boolean;
  editableForAdmin: boolean;
  kitchenExportReady: boolean;
  days: ConfigureMenuDayState[];
};

const emptyAddDishState: AddDishState = {
  isOpen: false,
  mealId: null,
  mealTitle: null
};

const emptyEditDishState: EditDishState = {
  isOpen: false,
  mealId: null,
  menuDishId: null,
  dishId: null,
  title: '',
  dishType: 'Main dish',
  description: '',
  weightGrams: 180,
  priceCents: 250,
  isEnabled: true
};

const emptyConfigureMenuState: ConfigureMenuState = {
  isOpen: false,
  title: '',
  weekStartDate: '',
  weekEndDate: '',
  editingStartsAt: '',
  editingEndsAt: '',
  orderingStartsAt: '',
  orderingEndsAt: '',
  processingStartsAt: '',
  parentReminderAt: '',
  visibleForParents: false,
  editableForAdmin: true,
  kitchenExportReady: false,
  days: []
};

function formatDate(value?: string | null) {
  if (!value) return 'Not configured';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not configured';

  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatShortDate(value?: string | null) {
  if (!value) return '';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  });
}

function formatMenuWeek(menu: Menu) {
  return `${formatShortDate(menu.weekStartDate)} – ${formatDate(menu.weekEndDate)}`;
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function getVisibleStatus(value?: boolean) {
  return value ? 'Yes' : 'No';
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toDateTimeInputValue(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function dateInputToIso(value: string) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`).toISOString();
}

function dateTimeInputToIso(value: string) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function getMenuPrimaryActionLabel(menu: Menu) {
  if (menu.status === 'DRAFT') {
    return '✏ Save Menu';
  }

  return '✏ Update Menu';
}

export function AdminMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [addDishState, setAddDishState] = useState<AddDishState>(emptyAddDishState);
  const [editDishState, setEditDishState] = useState<EditDishState>(emptyEditDishState);
  const [configureMenuState, setConfigureMenuState] = useState<ConfigureMenuState>(emptyConfigureMenuState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dishTitle, setDishTitle] = useState('');
  const [dishType, setDishType] = useState('Main dish');
  const [dishDescription, setDishDescription] = useState('');
  const [dishWeight, setDishWeight] = useState(180);
  const [dishPrice, setDishPrice] = useState(250);

  const selectedMenu = useMemo(() => {
    return menus.find((menu) => menu.id === selectedMenuId) ?? menus[0] ?? null;
  }, [menus, selectedMenuId]);

  async function loadMenus() {
    setIsLoading(true);

    try {
      const response = await api.get<Menu[]>('/menus');
      setMenus(response.data);

      if (response.data.length > 0) {
        setSelectedMenuId((currentId) => {
          const exists = response.data.some((menu) => menu.id === currentId);
          return exists ? currentId : response.data[0].id;
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMenus();
  }, []);

  function openAddDishModal(meal: Meal) {
    setAddDishState({
      isOpen: true,
      mealId: meal.id,
      mealTitle: meal.title
    });
  }

  function closeAddDishModal() {
    setAddDishState(emptyAddDishState);
    setDishTitle('');
    setDishType('Main dish');
    setDishDescription('');
    setDishWeight(180);
    setDishPrice(250);
  }

  function openEditDishModal(meal: Meal, menuDish: MenuDish) {
    setEditDishState({
      isOpen: true,
      mealId: meal.id,
      menuDishId: menuDish.id,
      dishId: menuDish.dish.id,
      title: menuDish.dish.title,
      dishType: menuDish.dish.dishType,
      description: menuDish.dish.description ?? '',
      weightGrams: menuDish.dish.weightGrams,
      priceCents: menuDish.dish.priceCents,
      isEnabled: menuDish.isEnabled
    });
  }

  function closeEditDishModal() {
    setEditDishState(emptyEditDishState);
  }

  function openConfigureMenuModal() {
    if (!selectedMenu) return;

    setConfigureMenuState({
      isOpen: true,
      title: selectedMenu.title,
      weekStartDate: toDateInputValue(selectedMenu.weekStartDate),
      weekEndDate: toDateInputValue(selectedMenu.weekEndDate),
      editingStartsAt: toDateTimeInputValue(selectedMenu.settings?.editingStartsAt),
      editingEndsAt: toDateTimeInputValue(selectedMenu.settings?.editingEndsAt),
      orderingStartsAt: toDateTimeInputValue(selectedMenu.settings?.orderingStartsAt),
      orderingEndsAt: toDateTimeInputValue(selectedMenu.settings?.orderingEndsAt),
      processingStartsAt: toDateTimeInputValue(selectedMenu.settings?.processingStartsAt),
      parentReminderAt: toDateTimeInputValue(selectedMenu.settings?.parentReminderAt),
      visibleForParents: Boolean(selectedMenu.settings?.visibleForParents),
      editableForAdmin: selectedMenu.settings?.editableForAdmin ?? true,
      kitchenExportReady: Boolean(selectedMenu.settings?.kitchenExportReady),
      days: selectedMenu.days.map((day) => ({
        id: day.id,
        dayOfWeek: day.dayOfWeek,
        dayDate: toDateInputValue(day.dayDate),
        isEnabled: day.isEnabled
      }))
    });
  }

  function closeConfigureMenuModal() {
    setConfigureMenuState(emptyConfigureMenuState);
  }

  function updateConfigureDay(dayId: string, patch: Partial<ConfigureMenuDayState>) {
    setConfigureMenuState((current) => ({
      ...current,
      days: current.days.map((day) => (day.id === dayId ? { ...day, ...patch } : day))
    }));
  }

  async function saveConfigureMenu(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedMenu) return;

    setIsSaving(true);

    try {
      await api.patch(`/menus/${selectedMenu.id}`, {
        title: configureMenuState.title,
        weekStartDate: dateInputToIso(configureMenuState.weekStartDate),
        weekEndDate: dateInputToIso(configureMenuState.weekEndDate)
      });

      await api.post(`/menus/${selectedMenu.id}/settings`, {
        editingStartsAt: dateTimeInputToIso(configureMenuState.editingStartsAt),
        editingEndsAt: dateTimeInputToIso(configureMenuState.editingEndsAt),
        orderingStartsAt: dateTimeInputToIso(configureMenuState.orderingStartsAt),
        orderingEndsAt: dateTimeInputToIso(configureMenuState.orderingEndsAt),
        processingStartsAt: dateTimeInputToIso(configureMenuState.processingStartsAt),
        parentReminderAt: dateTimeInputToIso(configureMenuState.parentReminderAt),
        visibleForParents: configureMenuState.visibleForParents,
        editableForAdmin: configureMenuState.editableForAdmin,
        kitchenExportReady: configureMenuState.kitchenExportReady
      });

      await Promise.all(
        configureMenuState.days.map((day) =>
          api.patch(`/menus/${selectedMenu.id}/days/${day.id}`, {
            dayOfWeek: day.dayOfWeek,
            dayDate: dateInputToIso(day.dayDate),
            isEnabled: day.isEnabled
          })
        )
      );

      closeConfigureMenuModal();
      await loadMenus();
    } finally {
      setIsSaving(false);
    }
  }

  async function submitMenu() {
    if (!selectedMenu) return;

    setIsSaving(true);
    try {
      await api.patch(`/menus/${selectedMenu.id}/submit`);
      await loadMenus();
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteMenu() {
    if (!selectedMenu) return;

    const confirmed = window.confirm(`Delete menu "${selectedMenu.title}"?`);
    if (!confirmed) return;

    setIsSaving(true);
    try {
      await api.delete(`/menus/${selectedMenu.id}`);
      await loadMenus();
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleDay(day: MenuDay) {
    if (!selectedMenu) return;

    setIsSaving(true);
    try {
      await api.patch(`/menus/${selectedMenu.id}/days/${day.id}`, {
        isEnabled: !day.isEnabled
      });

      await loadMenus();
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleMenuDish(meal: Meal, menuDish: MenuDish) {
    if (!selectedMenu) return;

    setIsSaving(true);
    try {
      await api.patch(`/menus/${selectedMenu.id}/meals/${meal.id}/dishes/${menuDish.id}`, {
        isEnabled: !menuDish.isEnabled
      });

      await loadMenus();
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteMenuDish(meal: Meal, menuDish: MenuDish) {
    if (!selectedMenu) return;

    const confirmed = window.confirm(`Remove "${menuDish.dish.title}" from ${meal.title}?`);
    if (!confirmed) return;

    setIsSaving(true);
    try {
      await api.delete(`/menus/${selectedMenu.id}/meals/${meal.id}/dishes/${menuDish.id}`);
      await loadMenus();
    } finally {
      setIsSaving(false);
    }
  }

  async function createDishAndAttach(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedMenu || !addDishState.mealId) return;

    setIsSaving(true);

    try {
      const dishResponse = await api.post('/dishes', {
        title: dishTitle,
        dishType,
        description: dishDescription || null,
        weightGrams: dishWeight,
        priceCents: dishPrice,
        isActive: true
      });

      await api.post(`/menus/${selectedMenu.id}/meals/${addDishState.mealId}/dishes`, {
        dishId: dishResponse.data.id,
        isEnabled: true,
        comment: null
      });

      closeAddDishModal();
      await loadMenus();
    } finally {
      setIsSaving(false);
    }
  }

  async function updateDishAndMenuDish(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedMenu || !editDishState.mealId || !editDishState.menuDishId || !editDishState.dishId) {
      return;
    }

    setIsSaving(true);

    try {
      await api.patch(`/dishes/${editDishState.dishId}`, {
        title: editDishState.title,
        dishType: editDishState.dishType,
        description: editDishState.description || null,
        weightGrams: editDishState.weightGrams,
        priceCents: editDishState.priceCents
      });

      await api.patch(`/menus/${selectedMenu.id}/meals/${editDishState.mealId}/dishes/${editDishState.menuDishId}`, {
        isEnabled: editDishState.isEnabled
      });

      closeEditDishModal();
      await loadMenus();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="admin-pro-page">
      <header className="admin-topbar">
        <div className="admin-brand">
          <span className="brand-icon">🍽️</span>
          <strong>MenuManager Pro</strong>
        </div>

        <div className="admin-userbar">
          <span className="topbar-icon">🔔</span>
          <span className="topbar-icon">⚙️</span>
          <div className="avatar">SM</div>
          <strong>Sarah Mitchell</strong>
        </div>
      </header>

      <section className="planning-shell">
        <div className="planning-header">
          <div>
            <h1>Weekly Menu Planning</h1>
            {selectedMenu ? (
              <p>Week of {formatMenuWeek(selectedMenu)}</p>
            ) : (
              <p>No menus found. Run seed to create demo menus.</p>
            )}
          </div>

          {selectedMenu && (
            <div className="planning-actions">
              <button className="outline-button danger" disabled={isSaving} onClick={deleteMenu}>
                🗑 Delete Menu
              </button>
              <button className="outline-button warning" disabled={isSaving}>
                {getMenuPrimaryActionLabel(selectedMenu)}
              </button>
              <button className="solid-button" disabled={isSaving} onClick={submitMenu}>
                📨 Submit Menu
              </button>
            </div>
          )}
        </div>

        {menus.length > 1 && (
          <div className="menu-select-row">
            <label>
              Active menu
              <select value={selectedMenu?.id ?? ''} onChange={(event) => setSelectedMenuId(event.target.value)}>
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {isLoading && <div className="empty-state-card">Loading menu data...</div>}

        {!isLoading && !selectedMenu && (
          <div className="empty-state-card">
            <h2>No menus yet</h2>
            <p>Create or seed menus before working with the weekly planning screen.</p>
          </div>
        )}

        {selectedMenu && (
          <>
            <section className="timeline-panel">
              <div className="timeline-track" />

              <article className="timeline-step blue">
                <div className="timeline-circle">✎</div>
                <div>
                  <h3>Editing period</h3>
                  <p>Until</p>
                  <strong>{formatDateTime(selectedMenu.settings?.editingEndsAt)}</strong>
                </div>
              </article>

              <article className="timeline-step green">
                <div className="timeline-circle">👥</div>
                <div>
                  <h3>Ordering period (parents)</h3>
                  <p>
                    {formatDateTime(selectedMenu.settings?.orderingStartsAt)}
                    <br />– {formatDateTime(selectedMenu.settings?.orderingEndsAt)}
                  </p>
                </div>
              </article>

              <article className="timeline-step orange">
                <div className="timeline-circle">🍴</div>
                <div>
                  <h3>Processing starts</h3>
                  <p>{formatDateTime(selectedMenu.settings?.processingStartsAt)}</p>
                </div>
              </article>

              <article className="timeline-step gray">
                <div className="timeline-circle">🗓</div>
                <div>
                  <h3>Menu week</h3>
                  <p>{formatMenuWeek(selectedMenu)}</p>
                </div>
              </article>
            </section>

            <section className="status-strip">
              <div className="status-cell">
                <span>Status:</span>
                <strong>{selectedMenu.status}</strong>
              </div>

              <div className="status-cell">
                <span>Visible to parents:</span>
                <strong>{getVisibleStatus(selectedMenu.settings?.visibleForParents)}</strong>
              </div>

              <div className="status-cell">
                <span>Editable until:</span>
                <strong>{formatDateTime(selectedMenu.settings?.editingEndsAt)}</strong>
              </div>

              <button className="configure-button" disabled={isSaving} onClick={openConfigureMenuModal}>
                ⚙ Configure Menu
              </button>
            </section>

            <section className="weekly-board">
              {selectedMenu.days.map((day, dayIndex) => (
                <details className="day-card" key={day.id} open={dayIndex < 2}>
                  <summary className="day-summary">
                    <div className="summary-left">
                      <span className="chevron">⌄</span>
                      <strong>
                        {day.dayOfWeek} - {formatShortDate(day.dayDate)}
                      </strong>
                    </div>

                    <div className="summary-right">
                      <span>Enabled</span>
                      <button
                        type="button"
                        className={day.isEnabled ? 'switch is-on' : 'switch'}
                        aria-label="Toggle day"
                        disabled={isSaving}
                        onClick={(event) => {
                          event.preventDefault();
                          toggleDay(day);
                        }}
                      >
                        <span />
                      </button>
                    </div>
                  </summary>

                  <div className="meal-list">
                    {day.meals.map((meal, mealIndex) => (
                      <details className="meal-card" key={meal.id} open={mealIndex === 0}>
                        <summary className="meal-summary">
                          <div className="summary-left">
                            <span className="chevron">⌄</span>
                            <strong>{meal.title}</strong>
                          </div>

                          <div className="summary-right muted">
                            <span>{meal.menuDishes.length} dishes</span>
                          </div>
                        </summary>

                        <div className="dish-table">
                          {meal.menuDishes.length === 0 && (
                            <div className="empty-meal-row">No dishes added yet.</div>
                          )}

                          {meal.menuDishes.map((menuDish) => (
                            <article className="dish-line" key={menuDish.id}>
                              <span className="drag-handle">⁝⁝</span>

                              <div className="dish-info">
                                <strong>{menuDish.dish.title}</strong>
                                <p>
                                  {menuDish.dish.dishType} · {menuDish.dish.weightGrams}g ·{' '}
                                  {formatMoney(menuDish.dish.priceCents)}
                                </p>
                              </div>

                              <div className="dish-actions">
                                <button
                                  type="button"
                                  className={menuDish.isEnabled ? 'switch small is-on' : 'switch small'}
                                  aria-label="Toggle dish"
                                  disabled={isSaving}
                                  onClick={() => toggleMenuDish(meal, menuDish)}
                                >
                                  <span />
                                </button>

                                <button
                                  className="icon-action"
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => openEditDishModal(meal, menuDish)}
                                >
                                  ✎
                                </button>

                                <button
                                  className="icon-action danger"
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => deleteMenuDish(meal, menuDish)}
                                >
                                  🗑
                                </button>
                              </div>
                            </article>
                          ))}

                          <button className="add-inline-button" type="button" onClick={() => openAddDishModal(meal)}>
                            + Add Dish
                          </button>
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))}
            </section>
          </>
        )}
      </section>

      {configureMenuState.isOpen && (
        <div className="modal-backdrop">
          <form className="configure-menu-modal" onSubmit={saveConfigureMenu}>
            <div className="modal-title-row">
              <div>
                <h2>Configure Menu</h2>
                <p className="modal-subtitle">
                  Update menu title, menu week, active days and period settings.
                </p>
              </div>
              <button className="close-modal-button" type="button" onClick={closeConfigureMenuModal}>
                ×
              </button>
            </div>

            <section className="modal-section">
              <h3>Menu details</h3>

              <label>
                Title
                <input
                  required
                  value={configureMenuState.title}
                  onChange={(event) =>
                    setConfigureMenuState((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                />
              </label>

              <div className="period-grid">
                <label>
                  Week Start
                  <input
                    type="date"
                    value={configureMenuState.weekStartDate}
                    onChange={(event) =>
                      setConfigureMenuState((current) => ({
                        ...current,
                        weekStartDate: event.target.value
                      }))
                    }
                  />
                </label>

                <label>
                  Week End
                  <input
                    type="date"
                    value={configureMenuState.weekEndDate}
                    onChange={(event) =>
                      setConfigureMenuState((current) => ({
                        ...current,
                        weekEndDate: event.target.value
                      }))
                    }
                  />
                </label>
              </div>
            </section>

            <section className="modal-section">
              <h3>Days</h3>

              <div className="configure-days-list">
                {configureMenuState.days.map((day) => (
                  <div className="configure-day-row" key={day.id}>
                    <label>
                      Day name
                      <input
                        value={day.dayOfWeek}
                        onChange={(event) =>
                          updateConfigureDay(day.id, {
                            dayOfWeek: event.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Date
                      <input
                        type="date"
                        value={day.dayDate}
                        onChange={(event) =>
                          updateConfigureDay(day.id, {
                            dayDate: event.target.value
                          })
                        }
                      />
                    </label>

                    <label className="checkbox-row configure-day-toggle">
                      <input
                        type="checkbox"
                        checked={day.isEnabled}
                        onChange={(event) =>
                          updateConfigureDay(day.id, {
                            isEnabled: event.target.checked
                          })
                        }
                      />
                      <span>Enabled</span>
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <section className="modal-section">
              <h3>Periods</h3>

              <div className="period-grid">
                <label>
                  Editing starts
                  <input
                    type="datetime-local"
                    value={configureMenuState.editingStartsAt}
                    onChange={(event) =>
                      setConfigureMenuState((current) => ({
                        ...current,
                        editingStartsAt: event.target.value
                      }))
                    }
                  />
                </label>

                <label>
                  Editing ends
                  <input
                    type="datetime-local"
                    value={configureMenuState.editingEndsAt}
                    onChange={(event) =>
                      setConfigureMenuState((current) => ({
                        ...current,
                        editingEndsAt: event.target.value
                      }))
                    }
                  />
                </label>

                <label>
                  Ordering starts
                  <input
                    type="datetime-local"
                    value={configureMenuState.orderingStartsAt}
                    onChange={(event) =>
                      setConfigureMenuState((current) => ({
                        ...current,
                        orderingStartsAt: event.target.value
                      }))
                    }
                  />
                </label>

                <label>
                  Ordering ends
                  <input
                    type="datetime-local"
                    value={configureMenuState.orderingEndsAt}
                    onChange={(event) =>
                      setConfigureMenuState((current) => ({
                        ...current,
                        orderingEndsAt: event.target.value
                      }))
                    }
                  />
                </label>

                <label>
                  Processing starts
                  <input
                    type="datetime-local"
                    value={configureMenuState.processingStartsAt}
                    onChange={(event) =>
                      setConfigureMenuState((current) => ({
                        ...current,
                        processingStartsAt: event.target.value
                      }))
                    }
                  />
                </label>

                <label>
                  Parent reminder
                  <input
                    type="datetime-local"
                    value={configureMenuState.parentReminderAt}
                    onChange={(event) =>
                      setConfigureMenuState((current) => ({
                        ...current,
                        parentReminderAt: event.target.value
                      }))
                    }
                  />
                </label>
              </div>
            </section>

            <section className="modal-section">
              <h3>Settings</h3>

              <div className="period-options">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={configureMenuState.visibleForParents}
                    onChange={(event) =>
                      setConfigureMenuState((current) => ({
                        ...current,
                        visibleForParents: event.target.checked
                      }))
                    }
                  />
                  <span>Visible to parents</span>
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={configureMenuState.editableForAdmin}
                    onChange={(event) =>
                      setConfigureMenuState((current) => ({
                        ...current,
                        editableForAdmin: event.target.checked
                      }))
                    }
                  />
                  <span>Editable for admin</span>
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={configureMenuState.kitchenExportReady}
                    onChange={(event) =>
                      setConfigureMenuState((current) => ({
                        ...current,
                        kitchenExportReady: event.target.checked
                      }))
                    }
                  />
                  <span>Kitchen export ready</span>
                </label>
              </div>
            </section>

            <div className="modal-actions">
              <button className="cancel-button" type="button" onClick={closeConfigureMenuModal}>
                Cancel
              </button>
              <button className="save-button" type="submit" disabled={isSaving}>
                Save Menu
              </button>
            </div>
          </form>
        </div>
      )}

      {addDishState.isOpen && (
        <div className="modal-backdrop">
          <form className="dish-modal" onSubmit={createDishAndAttach}>
            <h2>Add New Dish</h2>
            <p className="modal-subtitle">Meal: {addDishState.mealTitle}</p>

            <label>
              Title
              <input
                required
                value={dishTitle}
                onChange={(event) => setDishTitle(event.target.value)}
                placeholder="Scrambled Eggs with Fresh Herbs"
              />
            </label>

            <label>
              Type of Dish
              <select value={dishType} onChange={(event) => setDishType(event.target.value)}>
                <option>Main dish</option>
                <option>Soup</option>
                <option>Dessert</option>
                <option>Drink</option>
                <option>Side dish</option>
                <option>Appetizer</option>
              </select>
            </label>

            <label>
              Description
              <textarea
                value={dishDescription}
                onChange={(event) => setDishDescription(event.target.value)}
                placeholder="Ingredients, serving notes or restrictions"
              />
            </label>

            <label>
              Weight (grams)
              <input
                type="number"
                min="1"
                value={dishWeight}
                onChange={(event) => setDishWeight(Number(event.target.value))}
              />
            </label>

            <label>
              Price
              <input
                type="number"
                min="0"
                value={dishPrice}
                onChange={(event) => setDishPrice(Number(event.target.value))}
              />
            </label>

            <div className="modal-actions">
              <button className="cancel-button" type="button" onClick={closeAddDishModal}>
                Cancel
              </button>
              <button className="save-button" type="submit" disabled={isSaving}>
                Save Dish
              </button>
            </div>
          </form>
        </div>
      )}

      {editDishState.isOpen && (
        <div className="modal-backdrop">
          <form className="dish-modal" onSubmit={updateDishAndMenuDish}>
            <h2>Edit Dish</h2>
            <p className="modal-subtitle">Update dish details for this menu meal.</p>

            <label>
              Title
              <input
                required
                value={editDishState.title}
                onChange={(event) =>
                  setEditDishState((current) => ({
                    ...current,
                    title: event.target.value
                  }))
                }
              />
            </label>

            <label>
              Type of Dish
              <select
                value={editDishState.dishType}
                onChange={(event) =>
                  setEditDishState((current) => ({
                    ...current,
                    dishType: event.target.value
                  }))
                }
              >
                <option>Main dish</option>
                <option>Soup</option>
                <option>Dessert</option>
                <option>Drink</option>
                <option>Side dish</option>
                <option>Appetizer</option>
              </select>
            </label>

            <label>
              Description
              <textarea
                value={editDishState.description}
                onChange={(event) =>
                  setEditDishState((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
              />
            </label>

            <div className="edit-dish-grid">
              <label>
                Weight (grams)
                <input
                  type="number"
                  min="1"
                  value={editDishState.weightGrams}
                  onChange={(event) =>
                    setEditDishState((current) => ({
                      ...current,
                      weightGrams: Number(event.target.value)
                    }))
                  }
                />
              </label>

              <label>
                Price
                <input
                  type="number"
                  min="0"
                  value={editDishState.priceCents}
                  onChange={(event) =>
                    setEditDishState((current) => ({
                      ...current,
                      priceCents: Number(event.target.value)
                    }))
                  }
                />
              </label>
            </div>

            <label className="checkbox-row edit-dish-enabled">
              <input
                type="checkbox"
                checked={editDishState.isEnabled}
                onChange={(event) =>
                  setEditDishState((current) => ({
                    ...current,
                    isEnabled: event.target.checked
                  }))
                }
              />
              <span>Enabled in this menu</span>
            </label>

            <div className="modal-actions">
              <button className="cancel-button" type="button" onClick={closeEditDishModal}>
                Cancel
              </button>
              <button className="save-button" type="submit" disabled={isSaving}>
                Save Dish
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}