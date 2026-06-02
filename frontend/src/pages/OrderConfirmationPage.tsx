import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteOrder, getOrder } from '../api/client';
import '../styles/OrderConfirmationPage.css';

type OrderDish = {
  id: string;
  title: string;
  description?: string | null;
  dishType: string;
  weightGrams: number;
  priceCents: number;
};

type OrderMenuDay = {
  id: string;
  dayDate: string;
  dayOfWeek: string;
  sortOrder: number;
};

type OrderMeal = {
  id: string;
  title: string;
  mealType: string;
  sortOrder: number;
  menuDay?: OrderMenuDay;
};

type OrderMenuDish = {
  id: string;
  dish: OrderDish;
  meal?: OrderMeal;
};

type OrderItem = {
  id: string;
  orderId?: string;
  menuDishId?: string;
  quantity: number;
  priceCents: number;
  menuDish: OrderMenuDish;
};

type OrderStudent = {
  id: string;
  fullName: string;
  grade: string;
};

type OrderMenu = {
  id: string;
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  settings?: {
    orderingEndsAt?: string | null;
  } | null;
};

type OrderUser = {
  id: string;
  fullName: string;
  email: string;
};

type Order = {
  id: string;
  userId: string;
  studentId: string;
  menuId: string;
  status: string;
  totalCents: number;
  createdAt: string;
  updatedAt?: string;
  student: OrderStudent;
  user?: OrderUser;
  menu: OrderMenu;
  items?: OrderItem[];
  orderItems?: OrderItem[];
};

type DayGroup = {
  key: string;
  dayLabel: string;
  dateLabel: string;
  items: OrderItem[];
  totalCents: number;
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not configured';
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatMenuDates(menu: OrderMenu) {
  return `${formatDate(menu.weekStartDate)} – ${formatDate(menu.weekEndDate)}`;
}

function formatOrderNumber(orderId: string) {
  return `#ORD-${orderId.slice(0, 8).toUpperCase()}`;
}

function getItemDayKey(item: OrderItem) {
  return item.menuDish.meal?.menuDay?.dayDate ?? 'unknown';
}

function getItemDayLabel(item: OrderItem) {
  return item.menuDish.meal?.menuDay?.dayOfWeek ?? 'Other';
}

function getItemDateLabel(item: OrderItem) {
  const value = item.menuDish.meal?.menuDay?.dayDate;

  if (!value) {
    return '';
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  });
}

function getOrderingDeadline(order: Order) {
  const orderingEndsAt = order.menu.settings?.orderingEndsAt;

  if (!orderingEndsAt) {
    return 'Order availability deadline is not configured.';
  }

  return `Order available until ${new Date(orderingEndsAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}. Unpaid orders are automatically deleted after the ordering period ends.`;
}

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const orderItems = useMemo(() => {
    if (!order) {
      return [];
    }

    return order.items ?? order.orderItems ?? [];
  }, [order]);

  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups = new Map<string, DayGroup>();

    for (const item of orderItems) {
      const key = getItemDayKey(item);
      const itemTotal = item.quantity * item.priceCents;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          dayLabel: getItemDayLabel(item),
          dateLabel: getItemDateLabel(item),
          items: [],
          totalCents: 0
        });
      }

      const group = groups.get(key);

      if (group) {
        group.items.push(item);
        group.totalCents += itemTotal;
      }
    }

    return Array.from(groups.values()).sort((first, second) => {
      if (first.key === 'unknown') return 1;
      if (second.key === 'unknown') return -1;
      return new Date(first.key).getTime() - new Date(second.key).getTime();
    });
  }, [orderItems]);

  async function loadOrder() {
    if (!orderId) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await getOrder(orderId);
      setOrder(response.data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function handleDeleteOrder() {
    if (!order) {
      return;
    }

    const confirmed = window.confirm('Delete this order? This action cannot be undone.');

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteOrder(order.id);
      navigate('/parent');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handlePayNow() {
    if (!order) {
      return;
    }

    setIsPaying(true);

    try {
      window.alert('Payment flow triggered. Mock payment will be implemented in the next step.');
    } finally {
      setIsPaying(false);
    }
  }

  function handleReturnToCart() {
    navigate('/cart');
  }

  if (isLoading) {
    return (
      <main className="order-confirmation-page">
        <div className="order-loading-card">Loading order...</div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="order-confirmation-page">
        <div className="order-loading-card">
          <h1>Order not found</h1>
          <button type="button" onClick={() => navigate('/parent')}>
            Back to meal selection
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="order-confirmation-page">
      <section className="order-window">
        <header className="order-topbar">
          <div className="order-brand">
            <span>🍽️</span>
            <strong>MenuManager</strong>
          </div>

          <div className="order-userbar">
            <span>🔔</span>
            <span>⚙️</span>
            <div className="order-avatar">
              {order.user?.fullName
                ?.split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2) ?? 'U'}
            </div>
            <strong>{order.user?.fullName ?? 'Parent'}</strong>
          </div>
        </header>

        <div className="order-layout">
          <aside className="order-sidebar">
            <button type="button" onClick={() => navigate('/parent')}>
              Meal Selection
            </button>
            <button type="button" onClick={() => navigate('/cart')}>
              My Cart
            </button>
            <button type="button" className="active">
              Order History
            </button>
            <button type="button">
              Account
            </button>

            <div className="order-sidebar-bottom">
              <button type="button">Help Center</button>
              <button type="button">Log Out</button>
            </div>
          </aside>

          <section className="order-content">
            <div className="order-main">
              <header className="order-page-header">
                <div>
                  <h1>Order Confirmation</h1>
                  <p>Order {formatOrderNumber(order.id)}</p>
                </div>

                <span className="order-status-pill">{order.status}</span>
              </header>

              <div className="order-readonly-banner">
                <span>ℹ️</span>
                <p>
                  This order is read-only. To make changes,{' '}
                  <button type="button" onClick={handleReturnToCart}>
                    return to your cart
                  </button>{' '}
                  and confirm again. A new order will be created.
                </p>
              </div>

              <section className="order-info-card">
                <div className="student-avatar">
                  {order.student.fullName
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)}
                </div>

                <div className="student-main">
                  <strong>{order.student.fullName}</strong>
                  <span>{order.student.grade}</span>
                </div>

                <div>
                  <span>Menu Title</span>
                  <strong>{order.menu.title}</strong>
                </div>

                <div>
                  <span>Menu Dates</span>
                  <strong>{formatMenuDates(order.menu)}</strong>
                </div>

                <div>
                  <span>Menu Type</span>
                  <strong>Standard Menu</strong>
                </div>
              </section>

              <section className="order-days-card">
                {dayGroups.length === 0 && (
                  <div className="empty-order-state">
                    This order does not contain any dishes.
                  </div>
                )}

                {dayGroups.map((group, index) => (
                  <details key={group.key} className="order-day-group" open={index === 0}>
                    <summary>
                      <div>
                        <span className="order-chevron">⌄</span>
                        <strong>
                          {group.dayLabel}
                          {group.dateLabel ? ` – ${group.dateLabel}` : ''}
                        </strong>
                      </div>

                      <span>
                        {group.items.length} {group.items.length === 1 ? 'item' : 'items'} ·{' '}
                        {formatMoney(group.totalCents)}
                      </span>
                    </summary>

                    <div className="order-item-list">
                      {group.items.map((item: OrderItem) => (
                        <article className="order-item-row" key={item.id}>
                          <div className="dish-thumb">
                            {item.menuDish.dish.title.slice(0, 1)}
                          </div>

                          <div className="order-item-main">
                            <strong>{item.menuDish.dish.title}</strong>
                            <span>
                              {item.menuDish.dish.weightGrams} g · Qty {item.quantity}
                            </span>
                          </div>

                          <strong>{formatMoney(item.quantity * item.priceCents)}</strong>
                        </article>
                      ))}
                    </div>
                  </details>
                ))}
              </section>
            </div>

            <aside className="order-summary-card">
              <h2>Order Summary</h2>

              <div className="summary-student">
                <div className="student-avatar small">
                  {order.student.fullName
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)}
                </div>

                <div>
                  <strong>{order.student.fullName}</strong>
                  <span>{order.student.grade}</span>
                </div>
              </div>

              <div className="summary-days">
                {dayGroups.map((group) => (
                  <div key={group.key} className="summary-day-row">
                    <span>
                      {group.dayLabel} ({group.items.length}{' '}
                      {group.items.length === 1 ? 'item' : 'items'})
                    </span>
                    <strong>{formatMoney(group.totalCents)}</strong>
                  </div>
                ))}
              </div>

              <div className="summary-total">
                <span>Total</span>
                <strong>{formatMoney(order.totalCents)}</strong>
              </div>

              <button
                className="pay-now-button"
                type="button"
                disabled={isPaying || isDeleting}
                onClick={handlePayNow}
              >
                Pay Now →
              </button>

              <button
                className="delete-order-button"
                type="button"
                disabled={isDeleting || isPaying}
                onClick={handleDeleteOrder}
              >
                🗑 Delete Order
              </button>

              <div className="order-deadline-note">
                <span>ⓘ</span>
                <p>{getOrderingDeadline(order)}</p>
              </div>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}